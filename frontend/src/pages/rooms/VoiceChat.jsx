import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

function safeParse(payload) {
    try {
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

function VoiceChat({ stompClient, roomId, currentUserId, members, isSocketReady }) {
    const [isInVoice, setIsInVoice] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceParticipants, setVoiceParticipants] = useState({});

    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const remoteAudioRef = useRef({});
    const voiceSubRef = useRef(null);
    const pendingCandidatesRef = useRef({});
    const isJoiningRef = useRef(false);

    const roomCreatorId = members?.[0]?.userId || null;
    const isCreator = currentUserId && roomCreatorId && currentUserId === roomCreatorId;

    const cleanupPeer = useCallback((peerId) => {
        const pc = peerConnectionsRef.current[peerId];
        if (pc) {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.oniceconnectionstatechange = null;
            pc.close();
            delete peerConnectionsRef.current[peerId];
        }
        const audio = remoteAudioRef.current[peerId];
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            delete remoteAudioRef.current[peerId];
        }
        delete pendingCandidatesRef.current[peerId];
    }, []);

    const cleanupAllPeers = useCallback(() => {
        Object.keys(peerConnectionsRef.current).forEach(cleanupPeer);
        peerConnectionsRef.current = {};
        remoteAudioRef.current = {};
        pendingCandidatesRef.current = {};
    }, [cleanupPeer]);

    const publishVoiceSignal = useCallback((signal) => {
        if (!stompClient?.connected || !roomId) return;
        stompClient.publish({
            destination: `/app/rooms/${roomId}/voice`,
            body: JSON.stringify(signal),
        });
    }, [stompClient, roomId]);

    const createPeerConnection = useCallback((peerId, isInitiator) => {
        if (peerConnectionsRef.current[peerId]) {
            return peerConnectionsRef.current[peerId];
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionsRef.current[peerId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                publishVoiceSignal({
                    type: "ice-candidate",
                    targetUserId: peerId,
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                });
            }
        };

        pc.ontrack = (event) => {
            let audio = remoteAudioRef.current[peerId];
            if (!audio) {
                audio = new Audio();
                audio.autoplay = true;
                remoteAudioRef.current[peerId] = audio;
            }
            audio.srcObject = event.streams[0] || new MediaStream([event.track]);
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
                // Peer disconnected, will be cleaned up on leave-voice signal
            }
        };

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Flush any pending candidates
        if (pendingCandidatesRef.current[peerId]?.length) {
            pendingCandidatesRef.current[peerId].forEach((candidate) => {
                pc.addIceCandidate(candidate).catch(() => { });
            });
            delete pendingCandidatesRef.current[peerId];
        }

        return pc;
    }, [publishVoiceSignal]);

    const handleVoiceSignal = useCallback(async (signal) => {
        if (!signal || signal.senderId === currentUserId) return;

        const peerId = signal.senderId;

        switch (signal.type) {
            case "join-voice": {
                setVoiceParticipants((prev) => ({
                    ...prev,
                    [peerId]: {
                        userId: peerId,
                        username: signal.senderName || "Unknown",
                        muted: false,
                    },
                }));

                // If we're already in voice, create offer for new participant
                if (isJoiningRef.current || localStreamRef.current) {
                    const pc = createPeerConnection(peerId, true);
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        publishVoiceSignal({
                            type: "offer",
                            targetUserId: peerId,
                            descriptionType: "offer",
                            sdp: offer.sdp,
                        });
                    } catch (err) {
                        console.error("Failed to create offer:", err);
                    }
                }
                break;
            }

            case "leave-voice": {
                setVoiceParticipants((prev) => {
                    const next = { ...prev };
                    delete next[peerId];
                    return next;
                });
                cleanupPeer(peerId);
                break;
            }

            case "offer": {
                if (signal.targetUserId && signal.targetUserId !== currentUserId) return;
                const pc = createPeerConnection(peerId, false);
                try {
                    await pc.setRemoteDescription(
                        new RTCSessionDescription({ type: "offer", sdp: signal.sdp })
                    );
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    publishVoiceSignal({
                        type: "answer",
                        targetUserId: peerId,
                        descriptionType: "answer",
                        sdp: answer.sdp,
                    });
                } catch (err) {
                    console.error("Failed to handle offer:", err);
                }
                break;
            }

            case "answer": {
                if (signal.targetUserId && signal.targetUserId !== currentUserId) return;
                const pc = peerConnectionsRef.current[peerId];
                if (pc) {
                    try {
                        await pc.setRemoteDescription(
                            new RTCSessionDescription({ type: "answer", sdp: signal.sdp })
                        );
                    } catch (err) {
                        console.error("Failed to set answer:", err);
                    }
                }
                break;
            }

            case "ice-candidate": {
                if (signal.targetUserId && signal.targetUserId !== currentUserId) return;
                const candidate = new RTCIceCandidate({
                    candidate: signal.candidate,
                    sdpMid: signal.sdpMid,
                    sdpMLineIndex: signal.sdpMLineIndex,
                });
                const pc = peerConnectionsRef.current[peerId];
                if (pc && pc.remoteDescription) {
                    pc.addIceCandidate(candidate).catch(() => { });
                } else {
                    if (!pendingCandidatesRef.current[peerId]) {
                        pendingCandidatesRef.current[peerId] = [];
                    }
                    pendingCandidatesRef.current[peerId].push(candidate);
                }
                break;
            }

            case "mute-toggle": {
                setVoiceParticipants((prev) => ({
                    ...prev,
                    [peerId]: {
                        ...(prev[peerId] || { userId: peerId, username: signal.senderName }),
                        muted: !signal.microphoneEnabled,
                    },
                }));
                break;
            }

            case "force-mute": {
                if (signal.targetUserId === currentUserId) {
                    // We've been force-muted, mute ourselves
                    if (localStreamRef.current) {
                        localStreamRef.current.getAudioTracks().forEach((track) => {
                            track.enabled = false;
                        });
                    }
                    setIsMuted(true);
                    setVoiceParticipants((prev) => ({
                        ...prev,
                        [currentUserId]: {
                            ...(prev[currentUserId] || {}),
                            muted: true,
                        },
                    }));
                } else if (signal.targetUserId) {
                    setVoiceParticipants((prev) => ({
                        ...prev,
                        [signal.targetUserId]: {
                            ...(prev[signal.targetUserId] || {}),
                            muted: true,
                        },
                    }));
                }
                break;
            }

            default:
                break;
        }
    }, [currentUserId, createPeerConnection, publishVoiceSignal, cleanupPeer]);

    // Subscribe to voice topic when in a room
    useEffect(() => {
        if (!stompClient?.connected || !roomId || !isInVoice) return;

        voiceSubRef.current = stompClient.subscribe(
            `/topic/rooms/${roomId}/voice`,
            (frame) => {
                const payload = safeParse(frame.body);
                if (payload) {
                    handleVoiceSignal(payload);
                }
            }
        );

        return () => {
            if (voiceSubRef.current) {
                try { voiceSubRef.current.unsubscribe(); } catch { }
                voiceSubRef.current = null;
            }
        };
    }, [stompClient, roomId, isInVoice, handleVoiceSignal]);

    const joinVoice = useCallback(async () => {
        if (isInVoice || !stompClient?.connected || !roomId) return;
        isJoiningRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const storedName = localStorage.getItem("name") || "Unknown";
            setIsInVoice(true);
            setIsMuted(false);

            setVoiceParticipants((prev) => ({
                ...prev,
                [currentUserId]: {
                    userId: currentUserId,
                    username: storedName,
                    muted: false,
                },
            }));

            publishVoiceSignal({
                type: "join-voice",
                microphoneEnabled: true,
            });
        } catch (err) {
            console.error("Microphone access error:", err);
            alert("Cannot access microphone. Please check your browser permissions.");
        } finally {
            isJoiningRef.current = false;
        }
    }, [isInVoice, stompClient, roomId, currentUserId, publishVoiceSignal]);

    const leaveVoice = useCallback(() => {
        if (!isInVoice) return;

        publishVoiceSignal({ type: "leave-voice", microphoneEnabled: false });
        cleanupAllPeers();

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (voiceSubRef.current) {
            try { voiceSubRef.current.unsubscribe(); } catch { }
            voiceSubRef.current = null;
        }

        setIsInVoice(false);
        setIsMuted(false);
        setVoiceParticipants({});
    }, [isInVoice, publishVoiceSignal, cleanupAllPeers]);

    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        const newMuted = !isMuted;
        localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !newMuted;
        });
        setIsMuted(newMuted);

        setVoiceParticipants((prev) => ({
            ...prev,
            [currentUserId]: {
                ...(prev[currentUserId] || {}),
                muted: newMuted,
            },
        }));

        publishVoiceSignal({
            type: "mute-toggle",
            microphoneEnabled: !newMuted,
        });
    }, [isMuted, currentUserId, publishVoiceSignal]);

    const forceMuteUser = useCallback((targetUserId) => {
        publishVoiceSignal({
            type: "force-mute",
            targetUserId,
            microphoneEnabled: false,
            forceMuted: true,
        });
    }, [publishVoiceSignal]);

    // Cleanup on unmount or room change
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
            cleanupAllPeers();
        };
    }, [roomId, cleanupAllPeers]);

    const participantList = Object.values(voiceParticipants);

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-4">
                <Volume2 size={18} className="text-primary" />
                Voice Chat
                {isInVoice && (
                    <span className="ml-1 inline-flex items-center text-[10px] font-bold bg-red-500 text-white rounded-full px-2 py-0.5 tracking-wide">
                        LIVE
                    </span>
                )}
            </h3>

            {!isInVoice ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                    <p className="text-sm text-slate-500 mb-4">
                        Join the voice channel to talk with your team in real time.
                    </p>
                    <button
                        type="button"
                        onClick={joinVoice}
                        disabled={!isSocketReady || !roomId}
                        className="inline-flex items-center gap-2 bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Phone size={16} />
                        Join Voice
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-2 mb-4">
                        {participantList.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No one in voice yet.</p>
                        )}
                        {participantList.map((p) => (
                            <div key={p.userId} className="flex items-center justify-between gap-3 p-3 rounded-md border border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                            p.muted ? "bg-slate-300" : "bg-emerald-500 animate-pulse"
                                        }`}
                                    />
                                    <span className="text-sm font-medium text-slate-800 truncate">
                                        {p.username || "Unknown"}
                                        {p.userId === currentUserId && " (You)"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.muted ? (
                                        <MicOff size={16} className="text-slate-400" />
                                    ) : (
                                        <Mic size={16} className="text-emerald-500" />
                                    )}
                                    {isCreator &&
                                        p.userId !== currentUserId &&
                                        !p.muted && (
                                            <button
                                                type="button"
                                                className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
                                                title={`Mute ${p.username}`}
                                                onClick={() => forceMuteUser(p.userId)}
                                            >
                                                <VolumeX size={14} />
                                            </button>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={toggleMute}
                            className={`flex-1 inline-flex items-center justify-center gap-2 font-semibold rounded-md px-4 py-2 transition-colors ${
                                isMuted
                                    ? "bg-amber-500 text-white hover:bg-amber-600"
                                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {isMuted ? (
                                <>
                                    <MicOff size={16} /> Unmute
                                </>
                            ) : (
                                <>
                                    <Mic size={16} /> Mute
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={leaveVoice}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-danger text-white font-semibold rounded-md px-4 py-2 hover:opacity-90 transition-opacity"
                        >
                            <PhoneOff size={16} />
                            Leave
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default VoiceChat;
