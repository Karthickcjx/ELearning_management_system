import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import "./VoiceChat.css";

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
        <div className="vc-panel">
            <h3 className="vc-heading">
                <Volume2 className="vc-heading-icon" />
                Voice Chat
                {isInVoice && (
                    <span className="vc-live-badge">LIVE</span>
                )}
            </h3>

            {!isInVoice ? (
                <div className="vc-join-section">
                    <p className="vc-info-text">
                        Join the voice channel to talk with your team in real time.
                    </p>
                    <button
                        type="button"
                        onClick={joinVoice}
                        disabled={!isSocketReady || !roomId}
                        className="vc-join-btn"
                    >
                        <Phone className="vc-btn-icon" />
                        Join Voice
                    </button>
                </div>
            ) : (
                <>
                    <div className="vc-participants">
                        {participantList.length === 0 && (
                            <p className="vc-empty">No one in voice yet.</p>
                        )}
                        {participantList.map((p) => (
                            <div key={p.userId} className="vc-participant">
                                <div className="vc-participant-info">
                                    <span
                                        className={`vc-indicator ${p.muted ? "muted" : "speaking"}`}
                                    />
                                    <span className="vc-participant-name">
                                        {p.username || "Unknown"}
                                        {p.userId === currentUserId && " (You)"}
                                    </span>
                                </div>
                                <div className="vc-participant-actions">
                                    {p.muted ? (
                                        <MicOff className="vc-mic-icon muted" />
                                    ) : (
                                        <Mic className="vc-mic-icon active" />
                                    )}
                                    {isCreator &&
                                        p.userId !== currentUserId &&
                                        !p.muted && (
                                            <button
                                                type="button"
                                                className="vc-force-mute-btn"
                                                title={`Mute ${p.username}`}
                                                onClick={() => forceMuteUser(p.userId)}
                                            >
                                                <VolumeX className="vc-force-mute-icon" />
                                            </button>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="vc-controls">
                        <button
                            type="button"
                            onClick={toggleMute}
                            className={`vc-control-btn ${isMuted ? "muted" : ""}`}
                        >
                            {isMuted ? (
                                <>
                                    <MicOff className="vc-btn-icon" /> Unmute
                                </>
                            ) : (
                                <>
                                    <Mic className="vc-btn-icon" /> Mute
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={leaveVoice}
                            className="vc-leave-btn"
                        >
                            <PhoneOff className="vc-btn-icon" />
                            Leave
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default VoiceChat;
