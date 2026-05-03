import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/constant";
import "./ChatWidget.css";

const WELCOME_MESSAGE =
  "Hi, I am your real-time AI tutor. Ask your learning question and I will stream the answer.";

const SUBJECTS = ["All", "Math", "Science", "History", "Languages", "Code"];
const QUICK_REPLIES = ["Explain with an example", "Simplify this", "Quiz me"];
const MAX_HISTORY_MESSAGES = 16;
const READY_STATUS = { label: "Ready", tone: "ready" };

const UserIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 12.25C14.21 12.25 16 10.46 16 8.25C16 6.04 14.21 4.25 12 4.25C9.79 4.25 8 6.04 8 8.25C8 10.46 9.79 12.25 12 12.25Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.75 19.75C5.52 16.73 8.14 14.75 12 14.75C15.86 14.75 18.48 16.73 19.25 19.75"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 14.5C13.66 14.5 15 13.16 15 11.5V6.5C15 4.84 13.66 3.5 12 3.5C10.34 3.5 9 4.84 9 6.5V11.5C9 13.16 10.34 14.5 12 14.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.75 10.5V11.5C5.75 14.95 8.55 17.75 12 17.75C15.45 17.75 18.25 14.95 18.25 11.5V10.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17.75V21"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.25 4.5L10.4 14.35"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.25 4.5L14 20.25L10.4 14.35L4.5 10.75L20.25 4.5Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StatIcon = ({ type }) => {
  const path =
    type === "in"
      ? "M7 7.75H17M7 12H14M7 16.25H11"
      : type === "out"
      ? "M5.5 12H18.5M14.5 8L18.5 12L14.5 16"
      : "M8 4.75V7.5M16 4.75V7.5M5.75 10H18.25M7.5 3.75H16.5C17.74 3.75 18.75 4.76 18.75 6V17.5C18.75 18.74 17.74 19.75 16.5 19.75H7.5C6.26 19.75 5.25 18.74 5.25 17.5V6C5.25 4.76 6.26 3.75 7.5 3.75Z";

  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const estimateTokens = (text) => {
  if (!text || !text.trim()) {
    return 0;
  }
  return text.trim().split(/\s+/).length;
};

const parseSseBlock = (block) => {
  const lines = block.split(/\r?\n/);
  let eventName = "message";
  const dataLines = [];

  lines.forEach((line) => {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  });

  return {
    eventName,
    data: dataLines.join("\n"),
  };
};

const parseEventData = (data) => {
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const readErrorResponse = async (response) => {
  const text = await response.text().catch(() => "");
  if (!text) {
    return "";
  }

  try {
    const payload = JSON.parse(text);
    return payload.message || payload.error || payload.data?.message || text;
  } catch (error) {
    return text;
  }
};

const normalizeTutorError = (error) => {
  const message = error?.message || "AI service unavailable. Please retry.";
  if (error?.name === "TypeError" && /fetch|network|failed/i.test(message)) {
    return `Cannot reach backend at ${API_BASE_URL}. Start the backend or check REACT_APP_API_URL.`;
  }
  return message;
};

const statusFromError = (message) => {
  const normalized = message.toLowerCase();
  if (normalized.includes("cannot reach backend")) {
    return { label: "Backend offline", tone: "error" };
  }
  if (normalized.includes("log in")) {
    return { label: "Login required", tone: "warning" };
  }
  if (
    normalized.includes("api key") ||
    normalized.includes("cohere") ||
    normalized.includes("not configured") ||
    normalized.includes("model")
  ) {
    return { label: "Needs AI setup", tone: "warning" };
  }
  return { label: "AI unavailable", tone: "error" };
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "message-1", text: WELCOME_MESSAGE, sender: "bot", isStreaming: false },
  ]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [activeSubject, setActiveSubject] = useState("All");
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState({
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState(READY_STATUS);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIdRef = useRef(1);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `message-${messageIdRef.current}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const updateBotMessage = useCallback((messageId, updater) => {
    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message.id === messageId ? { ...message, ...updater(message) } : message
      )
    );
  }, []);

  const readTutorStream = useCallback(
    async ({ history, botMessageId, signal }) => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in to use AI tutor.");
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: history,
          subject: activeSubject,
        }),
        signal,
      });

      if (!response.ok) {
        const responseMessage = await readErrorResponse(response);
        if (response.status === 401) {
          throw new Error("Please log in to use AI tutor.");
        }
        if (response.status === 403) {
          throw new Error("You do not have permission to use AI tutor.");
        }
        throw new Error(responseMessage || "AI service unavailable. Please retry.");
      }

      if (!response.body) {
        throw new Error("Streaming is not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantReply = "";
      let usage = null;

      const handleBlock = (block) => {
        const { eventName, data } = parseSseBlock(block);
        const payload = parseEventData(data);

        if (eventName === "token") {
          const tokenText = payload.text || "";
          if (!tokenText) {
            return;
          }
          assistantReply += tokenText;
          updateBotMessage(botMessageId, () => ({
            text: assistantReply,
            isStreaming: true,
          }));
        }

        if (eventName === "done") {
          usage = {
            inputTokens: Number(payload.inputTokens) || 0,
            outputTokens: Number(payload.outputTokens) || 0,
          };
        }

        if (eventName === "error") {
          throw new Error(payload.message || "AI service unavailable. Please retry.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || "";
        blocks.filter(Boolean).forEach(handleBlock);
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        handleBlock(buffer);
      }

      return {
        assistantReply,
        usage,
      };
    },
    [activeSubject, updateBotMessage]
  );

  const sendMessage = useCallback(
    async (textOverride) => {
      const text = (textOverride ?? inputValue).trim();
      if (!text || isStreaming) {
        return;
      }

      const userMessageId = nextMessageId();
      const botMessageId = nextMessageId();
      const nextHistory = [
        ...conversationHistory,
        { role: "user", content: text },
      ].slice(-MAX_HISTORY_MESSAGES);

      setInputValue("");
      setIsStreaming(true);
      setConnectionStatus({ label: "Streaming answer", tone: "streaming" });
      setMessages((previousMessages) => [
        ...previousMessages,
        { id: userMessageId, text, sender: "user", isStreaming: false },
        { id: botMessageId, text: "", sender: "bot", isStreaming: true },
      ]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const { assistantReply, usage } = await readTutorStream({
          history: nextHistory,
          botMessageId,
          signal: controller.signal,
        });

        const finalReply =
          assistantReply.trim() || "I could not generate an answer right now. Please try again.";

        updateBotMessage(botMessageId, () => ({
          text: finalReply,
          isStreaming: false,
        }));

        setConversationHistory([
          ...nextHistory,
          { role: "assistant", content: finalReply },
        ].slice(-MAX_HISTORY_MESSAGES));

        setStats((previousStats) => ({
          requests: previousStats.requests + 1,
          inputTokens:
            previousStats.inputTokens + (usage?.inputTokens || estimateTokens(text)),
          outputTokens:
            previousStats.outputTokens + (usage?.outputTokens || estimateTokens(finalReply)),
        }));
        setConnectionStatus(READY_STATUS);
      } catch (error) {
        if (error.name === "AbortError") {
          setConnectionStatus(READY_STATUS);
          return;
        }

        const errorMessage = normalizeTutorError(error);
        setConnectionStatus(statusFromError(errorMessage));
        updateBotMessage(botMessageId, (message) => ({
          text: message.text
            ? `${message.text}\n\nThe stream was interrupted. Please retry if you need the rest.`
            : errorMessage,
          isStreaming: false,
        }));
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationHistory, inputValue, isStreaming, readTutorStream, updateBotMessage]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleQuickReply = (suggestion) => {
    setInputValue(suggestion);
    sendMessage(suggestion);
  };

  return (
    <div className="ai-tutor-widget" aria-live="polite">
      {isOpen && (
        <section className="ai-tutor-panel" aria-label="AI Tutor chat panel">
          <header className="ai-tutor-header">
            <div className="ai-tutor-avatar ai-tutor-avatar-large">
              <UserIcon size={22} />
            </div>

            <div className="ai-tutor-header-copy">
              <h2>AI Tutor</h2>
              <p className={`ai-tutor-status ai-tutor-status-${connectionStatus.tone}`}>
                <span
                  className={`ai-tutor-pulse ai-tutor-pulse-${connectionStatus.tone}`}
                  aria-hidden="true"
                />
                {connectionStatus.label}
              </p>
            </div>

            <button
              type="button"
              className="ai-tutor-close"
              aria-label="Close AI Tutor"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
          </header>

          <div className="ai-tutor-chip-row" aria-label="Subject filters">
            {SUBJECTS.map((subject) => (
              <button
                type="button"
                key={subject}
                className={`ai-tutor-chip ${
                  activeSubject === subject ? "ai-tutor-chip-active" : ""
                }`}
                onClick={() => setActiveSubject(subject)}
              >
                {subject}
              </button>
            ))}
          </div>

          <div className="ai-tutor-chat-area">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-tutor-message-row ai-tutor-message-${message.sender}`}
              >
                {message.sender === "bot" && (
                  <div className="ai-tutor-avatar ai-tutor-avatar-small">
                    <UserIcon size={15} />
                  </div>
                )}

                <div className="ai-tutor-bubble">
                  {message.isStreaming && !message.text ? (
                    <div className="ai-tutor-typing" aria-label="AI Tutor is typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-tutor-quick-replies" aria-label="Quick reply suggestions">
            {QUICK_REPLIES.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => handleQuickReply(suggestion)}
                disabled={isStreaming}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="ai-tutor-stats" aria-label="AI Tutor usage stats">
            <span>
              <StatIcon type="today" />
              Today: <strong>{stats.requests}</strong> requests
            </span>
            <span>
              <StatIcon type="in" />
              In: <strong>{stats.inputTokens}</strong> tokens
            </span>
            <span>
              <StatIcon type="out" />
              Out: <strong>{stats.outputTokens}</strong> tokens
            </span>
          </div>

          <form className="ai-tutor-input-row" onSubmit={handleSubmit}>
            <button type="button" className="ai-tutor-mic" aria-label="Voice input placeholder">
              <MicIcon />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask a question..."
              disabled={isStreaming}
              aria-label="Ask AI Tutor a question"
            />

            <button
              type="submit"
              className="ai-tutor-send"
              aria-label="Send question"
              disabled={!inputValue.trim() || isStreaming}
            >
              <SendIcon />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="ai-tutor-launcher"
        aria-label={isOpen ? "Close AI Tutor" : "Open AI Tutor"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previousValue) => !previousValue)}
      >
        {isOpen ? <span aria-hidden="true">&times;</span> : <UserIcon size={22} />}
      </button>
    </div>
  );
};

export default ChatWidget;
