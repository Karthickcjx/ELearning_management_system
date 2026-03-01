import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { Brush, Eraser, Lightbulb, MessageSquare, Send, Users, XCircle } from "lucide-react";
import Navbar from "../../Components/common/Navbar";
import { API_BASE_URL } from "../../api/constant";
import { roomService } from "../../api/room.service";

const WS_ROOM_URL = API_BASE_URL.replace(/^http/i, "ws") + "/ws-room";

function safeParse(payload) {
  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

function CollaborativeRooms() {
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [topic, setTopic] = useState("data structures");
  const [groupSize, setGroupSize] = useState(3);
  const [roomInfo, setRoomInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hints, setHints] = useState([]);
  const [history, setHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [brushColor, setBrushColor] = useState("#1f2937");
  const [brushSize, setBrushSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [lastProblem, setLastProblem] = useState("");

  const roomId = roomInfo?.roomId || null;
  const currentUserId = localStorage.getItem("id");

  const clientRef = useRef(null);
  const roomSubscriptionsRef = useRef([]);
  const matchSubscriptionRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const snapshot = canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL() : null;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";

    if (snapshot) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, rect.width, rect.height);
      };
      image.src = snapshot;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  const drawStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    if (stroke?.clearBoard) {
      clearCanvas();
      return;
    }

    if (
      stroke?.fromX == null ||
      stroke?.fromY == null ||
      stroke?.toX == null ||
      stroke?.toY == null
    ) {
      return;
    }

    context.save();
    context.globalCompositeOperation = stroke.eraser ? "destination-out" : "source-over";
    context.strokeStyle = stroke.color || "#1f2937";
    context.lineWidth = stroke.strokeWidth || 2;
    context.beginPath();
    context.moveTo(stroke.fromX, stroke.fromY);
    context.lineTo(stroke.toX, stroke.toY);
    context.stroke();
    context.restore();
  }, [clearCanvas]);

  const loadHistory = useCallback(async () => {
    try {
      const sessions = await roomService.getHistory();
      setHistory(sessions);
    } catch (error) {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const unsubscribeRoomTopics = useCallback(() => {
    roomSubscriptionsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (error) {
        // ignore stale subscription cleanup errors
      }
    });
    roomSubscriptionsRef.current = [];
  }, []);

  const subscribeRoomTopics = useCallback((client, targetRoomId) => {
    unsubscribeRoomTopics();

    const chatSub = client.subscribe(`/topic/rooms/${targetRoomId}/chat`, (frame) => {
      const payload = safeParse(frame.body);
      if (!payload) {
        return;
      }
      setMessages((prev) => [...prev, payload].slice(-300));
      if (payload.senderType === "STUDENT" && payload.message) {
        setLastProblem(payload.message);
      }
    });

    const memberSub = client.subscribe(`/topic/rooms/${targetRoomId}/members`, (frame) => {
      const payload = safeParse(frame.body);
      if (Array.isArray(payload)) {
        setMembers(payload);
      }
    });

    const hintSub = client.subscribe(`/topic/rooms/${targetRoomId}/hints`, (frame) => {
      const payload = safeParse(frame.body);
      if (!payload) {
        return;
      }
      setHints((prev) => [payload, ...prev].slice(0, 10));
    });

    const whiteboardSub = client.subscribe(`/topic/rooms/${targetRoomId}/whiteboard`, (frame) => {
      const payload = safeParse(frame.body);
      if (!payload) {
        return;
      }
      if (payload.senderId && currentUserId && payload.senderId === currentUserId) {
        return;
      }
      drawStroke(payload);
    });

    const closedSub = client.subscribe(`/topic/rooms/${targetRoomId}/closed`, () => {
      setRoomInfo(null);
      setMembers([]);
      setMessages([]);
      setHints([]);
      clearCanvas();
      unsubscribeRoomTopics();
      loadHistory();
    });

    roomSubscriptionsRef.current = [chatSub, memberSub, hintSub, whiteboardSub, closedSub];
  }, [clearCanvas, currentUserId, drawStroke, loadHistory, unsubscribeRoomTopics]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return undefined;
    }

    const client = new Client({
      brokerURL: WS_ROOM_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 2500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      setIsSocketReady(true);
      if (!matchSubscriptionRef.current) {
        matchSubscriptionRef.current = client.subscribe("/user/queue/rooms/match", async (frame) => {
          const payload = safeParse(frame.body);
          if (!payload) {
            return;
          }

          setRoomInfo(payload);
          setIsQueueing(payload.status === "WAITING");
          if (payload.status !== "MATCHED" || !payload.roomId) {
            return;
          }

          setMembers(payload.members || []);
          setHints([]);
          setMessages([]);
          clearCanvas();
          subscribeRoomTopics(client, payload.roomId);

          try {
            const [historyMessages, memberList] = await Promise.all([
              roomService.getMessages(payload.roomId, 150),
              roomService.getMembers(payload.roomId),
            ]);
            setMessages(historyMessages);
            setMembers(memberList);
          } catch (error) {
            // keep socket data flow even if REST bootstrap fails
          }
          loadHistory();
        });
      }
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
      unsubscribeRoomTopics();
      if (matchSubscriptionRef.current) {
        try {
          matchSubscriptionRef.current.unsubscribe();
        } catch (error) {
          // ignore
        }
        matchSubscriptionRef.current = null;
      }
      if (client.active) {
        client.deactivate();
      }
      clientRef.current = null;
    };
  }, [clearCanvas, loadHistory, subscribeRoomTopics, unsubscribeRoomTopics]);

  const publishWhiteboard = useCallback((payload) => {
    const client = clientRef.current;
    if (!client?.connected || !roomId) {
      return;
    }
    client.publish({
      destination: `/app/rooms/${roomId}/whiteboard`,
      body: JSON.stringify(payload),
    });
  }, [roomId]);

  const getCanvasPoint = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback((event) => {
    if (!roomId) {
      return;
    }
    event.preventDefault();
    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }
    isDrawingRef.current = true;
    lastPointRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [getCanvasPoint, roomId]);

  const handlePointerMove = useCallback((event) => {
    if (!isDrawingRef.current || !roomId) {
      return;
    }
    event.preventDefault();
    const nextPoint = getCanvasPoint(event);
    const prevPoint = lastPointRef.current;
    if (!nextPoint || !prevPoint) {
      return;
    }

    const stroke = {
      fromX: prevPoint.x,
      fromY: prevPoint.y,
      toX: nextPoint.x,
      toY: nextPoint.y,
      color: isEraser ? "#ffffff" : brushColor,
      strokeWidth: brushSize,
      eraser: isEraser,
      clearBoard: false,
    };

    drawStroke(stroke);
    publishWhiteboard(stroke);
    lastPointRef.current = nextPoint;
  }, [brushColor, brushSize, drawStroke, getCanvasPoint, isEraser, publishWhiteboard, roomId]);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleJoinQueue = useCallback(() => {
    const client = clientRef.current;
    if (!client?.connected) {
      return;
    }
    setIsQueueing(true);
    client.publish({
      destination: "/app/rooms/join",
      body: JSON.stringify({
        topic,
        preferredGroupSize: Number(groupSize),
      }),
    });
  }, [groupSize, topic]);

  const handleSendChat = useCallback((event) => {
    event.preventDefault();
    const client = clientRef.current;
    const message = chatInput.trim();
    if (!client?.connected || !roomId || !message) {
      return;
    }
    client.publish({
      destination: `/app/rooms/${roomId}/chat`,
      body: JSON.stringify({ message }),
    });
    setLastProblem(message);
    setChatInput("");
  }, [chatInput, roomId]);

  const handleAskHint = useCallback(() => {
    const client = clientRef.current;
    if (!client?.connected || !roomId) {
      return;
    }
    client.publish({
      destination: `/app/rooms/${roomId}/hint`,
      body: JSON.stringify({
        problemStatement: lastProblem || topic,
      }),
    });
  }, [lastProblem, roomId, topic]);

  const handleClearBoard = useCallback(() => {
    clearCanvas();
    publishWhiteboard({
      clearBoard: true,
      eraser: false,
      color: brushColor,
      strokeWidth: brushSize,
    });
  }, [brushColor, brushSize, clearCanvas, publishWhiteboard]);

  const handleLeaveRoom = useCallback(async () => {
    if (!roomId) {
      return;
    }
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({
        destination: `/app/rooms/${roomId}/leave`,
        body: "{}",
      });
    }
    try {
      await roomService.leaveRoom(roomId);
    } catch (error) {
      // room may already be closed via websocket
    }
    unsubscribeRoomTopics();
    setRoomInfo(null);
    setMembers([]);
    setMessages([]);
    setHints([]);
    setIsQueueing(false);
    clearCanvas();
    loadHistory();
  }, [clearCanvas, loadHistory, roomId, unsubscribeRoomTopics]);

  const roomTitle = useMemo(() => {
    if (!roomInfo?.topic) {
      return "No active room";
    }
    return roomInfo.topic;
  }, [roomInfo?.topic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100">
      <Navbar page="rooms" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Collaborative Problem-Solving Rooms
              </h1>
              <p className="text-slate-600 mt-1">
                Auto-match peers by skill level and solve together on a live whiteboard.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSocketReady ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span className="text-slate-700">
                {isSocketReady ? "Realtime connected" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Topic (e.g., graph algorithms)"
              className="lg:col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={groupSize}
              onChange={(event) => setGroupSize(Number(event.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 members</option>
              <option value={3}>3 members</option>
              <option value={4}>4 members</option>
            </select>
            <button
              type="button"
              onClick={handleJoinQueue}
              disabled={!isSocketReady || isQueueing}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
            >
              {isQueueing ? "Matching..." : "Find Room"}
            </button>
          </div>

          {roomInfo?.status === "WAITING" && (
            <p className="text-sm text-blue-700 mt-3">{roomInfo.message || "Waiting for teammates..."}</p>
          )}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{roomTitle}</h2>
                  <p className="text-sm text-slate-600">
                    Room: {roomId || "Not matched yet"}
                  </p>
                </div>
                {roomId && (
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    <XCircle className="w-4 h-4" />
                    Leave Room
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setIsEraser(false)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    !isEraser ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"
                  }`}
                >
                  <Brush className="w-4 h-4" />
                  Brush
                </button>
                <button
                  type="button"
                  onClick={() => setIsEraser(true)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isEraser ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  Eraser
                </button>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(event) => setBrushColor(event.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-300"
                />
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={brushSize}
                  onChange={(event) => setBrushSize(Number(event.target.value))}
                />
                <button
                  type="button"
                  onClick={handleClearBoard}
                  className="ml-auto px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Clear Board
                </button>
              </div>

              <div className="border border-slate-300 rounded-xl bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-[380px] touch-none"
                  style={{ touchAction: "none" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  AI Moderator Hints
                </h3>
                <button
                  type="button"
                  onClick={handleAskHint}
                  disabled={!roomId || !isSocketReady}
                  className="px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:bg-slate-400"
                >
                  Suggest Hint
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {hints.length === 0 && (
                  <p className="text-sm text-slate-500">No hints yet. Ask the moderator when your group is blocked.</p>
                )}
                {hints.map((hint, index) => (
                  <div key={`${hint.timestamp}-${index}`} className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                    <p className="text-slate-800 text-sm">{hint.hint}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested by {hint.requestedBy || "room member"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Team Members</h3>
              <div className="space-y-2">
                {members.length === 0 && <p className="text-sm text-slate-500">Match a room to view peers.</p>}
                {members.map((member) => (
                  <div key={member.userId} className="rounded-lg border border-slate-200 p-2">
                    <p className="text-sm font-semibold text-slate-800">{member.username}</p>
                    <p className="text-xs text-slate-500">
                      Skill {member.skillScore} (Band {member.skillBand})
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Group Chat
              </h3>

              <div className="h-72 overflow-y-auto bg-slate-50 rounded-lg p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-500">Messages will appear here.</p>
                )}
                {messages.map((message) => (
                  <div key={`${message.id || "m"}-${message.timestamp}`} className="text-sm">
                    <span className="font-semibold text-slate-800">{message.senderName}: </span>
                    <span className="text-slate-700">{message.message}</span>
                    {message.senderType === "AI_MODERATOR" && (
                      <span className="ml-2 text-[11px] text-amber-600 font-semibold">AI Hint</span>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!roomId || !chatInput.trim()}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Recent Sessions</h3>
              <div className="space-y-2">
                {history.length === 0 && (
                  <p className="text-sm text-slate-500">No room history yet.</p>
                )}
                {history.map((item) => (
                  <div key={item.roomId} className="rounded-lg border border-slate-200 p-2">
                    <p className="text-sm font-semibold text-slate-800">{item.topic}</p>
                    <p className="text-xs text-slate-500">
                      Members {item.memberCount} | Band {item.skillBand} | {item.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CollaborativeRooms;

