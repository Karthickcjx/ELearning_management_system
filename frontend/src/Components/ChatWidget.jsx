import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCcw, Send, X } from "lucide-react";
import { Client } from "@stomp/stompjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../api/api";
import { aiService } from "../api/ai.service";
import { API_BASE_URL } from "../api/constant";

const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");
const WELCOME_MESSAGE =
  "Hi, I am your real-time AI tutor. Ask your learning question and I will stream the answer.";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: WELCOME_MESSAGE, isBot: true, isStreaming: false },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [usage, setUsage] = useState(null);

  const messagesEndRef = useRef(null);
  const clientRef = useRef(null);
  const activeStreamMessageIdRef = useRef(null);
  const messageIdRef = useRef(2);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const ensureSession = useCallback(async () => {
    if (sessionId) {
      return sessionId;
    }
    const response = await aiService.createSession({});
    const createdSessionId = response.data.sessionId;
    setSessionId(createdSessionId);
    return createdSessionId;
  }, [sessionId]);

  const loadRecommendations = useCallback(async () => {
    try {
      const response = await aiService.getRecommendations();
      setRecommendations((response.data || []).slice(0, 3));
    } catch (error) {
      setRecommendations([]);
    }
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      const response = await aiService.getDailyUsage();
      setUsage(response.data);
    } catch (error) {
      setUsage(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    ensureSession()
      .then(() => Promise.all([loadRecommendations(), loadUsage()]))
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            text: "Unable to start an AI session. Please retry.",
            isBot: true,
            isStreaming: false,
          },
        ]);
      });
  }, [isOpen, ensureSession, loadRecommendations, loadUsage]);

  useEffect(() => {
    if (!isOpen || !sessionId) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const client = new Client({
      brokerURL: `${WS_BASE_URL}/ws-ai`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      setIsSocketReady(true);

      client.subscribe(`/topic/ai/session/${sessionId}/stream`, (frame) => {
        const payload = JSON.parse(frame.body);
        const chunk = payload.content || "";
        const targetId = activeStreamMessageIdRef.current;
        if (!targetId) {
          return;
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === targetId
              ? {
                  ...message,
                  text: `${message.text}${chunk}`,
                }
              : message
          )
        );
      });

      client.subscribe(`/topic/ai/session/${sessionId}/done`, () => {
        const targetId = activeStreamMessageIdRef.current;
        if (targetId) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === targetId ? { ...message, isStreaming: false } : message
            )
          );
        }
        activeStreamMessageIdRef.current = null;
        setIsLoading(false);
        loadUsage();
      });

      client.subscribe(`/topic/ai/session/${sessionId}/error`, (frame) => {
        const payload = JSON.parse(frame.body);
        const targetId = activeStreamMessageIdRef.current;

        if (targetId) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === targetId
                ? { ...message, text: payload.content || "AI service error.", isStreaming: false }
                : message
            )
          );
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId(),
              text: payload.content || "AI service error.",
              isBot: true,
              isStreaming: false,
            },
          ]);
        }

        activeStreamMessageIdRef.current = null;
        setIsLoading(false);
      });
    };

    client.onWebSocketClose = () => {
      setIsSocketReady(false);
    };

    client.onStompError = () => {
      setIsSocketReady(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      setIsSocketReady(false);
      if (client.active) {
        client.deactivate();
      }
    };
  }, [isOpen, sessionId, loadUsage]);

  const waitForSocket = async (timeoutMs = 2200) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (clientRef.current?.connected) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  };

  const handleFallbackChat = async (userMessage, targetBotMessageId) => {
    try {
      const response = await api.post(
        "/api/chat",
        { message: userMessage },
        { skipAuthRedirect: true }
      );
      const botResponse = response.data.reply || "No answer returned.";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === targetBotMessageId
            ? { ...message, text: botResponse, isStreaming: false }
            : message
        )
      );
    } catch (error) {
      const backendMessage =
        error?.response?.data?.reply ||
        error?.response?.data?.message ||
        "AI service is unavailable. Configure backend API key and retry.";

      setMessages((prev) =>
        prev.map((message) =>
          message.id === targetBotMessageId
            ? {
                ...message,
                text: backendMessage,
                isStreaming: false,
              }
            : message
        )
      );
    } finally {
      activeStreamMessageIdRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          text: "Please log in to use AI tutor.",
          isBot: true,
          isStreaming: false,
        },
      ]);
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const userMessageId = nextMessageId();
    const botMessageId = nextMessageId();
    activeStreamMessageIdRef.current = botMessageId;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, text: userMessage, isBot: false, isStreaming: false },
      { id: botMessageId, text: "", isBot: true, isStreaming: true },
    ]);

    try {
      const activeSessionId = await ensureSession();
      const socketReady = await waitForSocket();

      if (!socketReady || !clientRef.current?.connected) {
        await handleFallbackChat(userMessage, botMessageId);
        return;
      }

      clientRef.current.publish({
        destination: `/app/ai/session/${activeSessionId}/ask`,
        body: JSON.stringify({ question: userMessage }),
      });
    } catch (error) {
      await handleFallbackChat(userMessage, botMessageId);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 flex flex-col border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out transform origin-bottom-right">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Tutor</h3>
                <p className="text-xs text-indigo-100 flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSocketReady ? "bg-green-400" : "bg-amber-300"
                    }`}
                  />
                  {isSocketReady ? "Realtime connected" : "Connecting"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {recommendations.length > 0 && (
            <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-indigo-700 font-semibold">Adaptive recommendations</p>
                <button
                  type="button"
                  onClick={loadRecommendations}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {recommendations.map((item) => (
                  <div key={item.id} className="text-xs text-gray-700 bg-white rounded px-2 py-1 border">
                    <span className="font-semibold">{item.courseName}</span>
                    <span className="text-gray-500"> - {item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 h-96 overflow-y-auto p-4 bg-gray-50 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded-2xl text-sm ${
                    message.isBot
                      ? "bg-white text-gray-700 rounded-tl-none shadow-sm border border-gray-100"
                      : "bg-indigo-600 text-white rounded-tr-none shadow-md"
                  }`}
                >
                  {message.isBot ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    message.text
                  )}
                  {message.isStreaming && message.text.length === 0 && (
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "120ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "240ms" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            {usage && (
              <p className="text-[11px] text-gray-500 mb-2">
                Today: {usage.requestCount} requests | In {usage.inputTokens} tokens | Out{" "}
                {usage.outputTokens} tokens
              </p>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen ? "bg-gray-700 rotate-90" : "bg-gradient-to-r from-indigo-600 to-purple-600"
        }`}
      >
        {isOpen ? <X size={28} className="text-white" /> : <MessageCircle size={28} className="text-white" />}
      </button>
    </div>
  );
};

export default ChatWidget;
