package com.lms.dev.room.service;

import com.lms.dev.user.entity.User;
import com.lms.dev.user.repository.UserRepository;
import com.lms.dev.room.dto.RoomChatEvent;
import com.lms.dev.room.dto.RoomChatRequest;
import com.lms.dev.room.dto.RoomCreateRequest;
import com.lms.dev.room.dto.RoomHintEvent;
import com.lms.dev.room.dto.RoomHintRequest;
import com.lms.dev.room.dto.RoomJoinRequest;
import com.lms.dev.room.dto.RoomJoinResponse;
import com.lms.dev.room.dto.RoomJoinStatus;
import com.lms.dev.room.dto.RoomMediaSignalEvent;
import com.lms.dev.room.dto.RoomMemberResponse;
import com.lms.dev.room.dto.RoomSessionSummaryResponse;
import com.lms.dev.room.dto.RoomWhiteboardEvent;
import com.lms.dev.room.entity.RoomChatMessage;
import com.lms.dev.room.entity.RoomParticipant;
import com.lms.dev.room.entity.RoomSession;
import com.lms.dev.room.enums.RoomChatSenderType;
import com.lms.dev.room.enums.RoomSessionStatus;
import com.lms.dev.room.repository.RoomChatMessageRepository;
import com.lms.dev.room.repository.RoomParticipantRepository;
import com.lms.dev.room.repository.RoomSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private static final String DEFAULT_TOPIC = "general-problem-solving";
    private static final int MAX_CHAT_LENGTH = 2000;

    @Value("${app.rooms.matching.group-size:3}")
    private int defaultGroupSize;

    private final UserRepository userRepository;
    private final RoomSessionRepository roomSessionRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final RoomChatMessageRepository roomChatMessageRepository;
    private final RoomSkillService roomSkillService;
    private final RoomAiModeratorService roomAiModeratorService;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<UUID, UUID> activeRoomByUser = new ConcurrentHashMap<>();
    private final Map<UUID, Set<UUID>> activeMembersByRoom = new ConcurrentHashMap<>();
    private final Map<UUID, Set<UUID>> voiceParticipantsByRoom = new ConcurrentHashMap<>();

    @Transactional
    public synchronized void createRoom(UUID userId, RoomCreateRequest request) {
        User currentUser = mustFindUser(userId);

        // Ensure user leaves any existing room context
        UUID activeRoomId = activeRoomByUser.remove(userId);
        if (activeRoomId != null) {
            Set<UUID> members = activeMembersByRoom.get(activeRoomId);
            if (members != null) {
                members.remove(userId);
            }
        }

        int desiredGroupSize = resolveGroupSize(request == null ? null : request.getPreferredGroupSize());
        String topic = normalizeTopic(request == null ? null : request.getTopic());
        String password = request == null ? null : request.getPassword();

        double skillScore = roomSkillService.computeSkillScore(userId);
        int skillBand = roomSkillService.toSkillBand(skillScore);

        RoomSession session = RoomSession.builder()
                .topic(topic)
                .password(password)
                .skillBand(skillBand)
                .avgSkillScore(skillScore)
                .groupSize(desiredGroupSize)
                .status(RoomSessionStatus.ACTIVE)
                .build();

        session = roomSessionRepository.save(session);

        RoomParticipant creatorParticipant = RoomParticipant.builder()
                .session(session)
                .user(currentUser)
                .skillScore(skillScore)
                .skillBand(skillBand)
                .build();
        roomParticipantRepository.save(creatorParticipant);

        activeRoomByUser.put(userId, session.getId());
        activeMembersByRoom.computeIfAbsent(session.getId(), ignored -> ConcurrentHashMap.newKeySet()).add(userId);

        RoomMemberResponse memberResponse = toMemberResponse(creatorParticipant);

        RoomJoinResponse response = RoomJoinResponse.builder()
                .status(RoomJoinStatus.MATCHED)
                .roomId(session.getId())
                .topic(session.getTopic())
                .skillScore(skillScore)
                .skillBand(skillBand)
                .groupSize(session.getGroupSize())
                .memberCount(1)
                .members(List.of(memberResponse))
                .message("Room created successfully.")
                .matchedAt(LocalDateTime.now())
                .build();

        sendMatchUpdate(currentUser.getEmail(), response);
        publishSystemMessage(session, "Room created: " + session.getTopic());
        broadcastHint(
                session,
                "You have created the room. Share the Room ID and Password with your peers to let them join.",
                "AI Moderator");
    }

    @Transactional
    public synchronized RoomJoinResponse joinRoom(UUID userId, RoomJoinRequest request) {
        User currentUser = mustFindUser(userId);

        if (request == null || request.getRoomId() == null) {
            RoomJoinResponse error = RoomJoinResponse.builder()
                    .status(RoomJoinStatus.FAILED)
                    .message("Room ID is required to join.")
                    .build();
            sendMatchUpdate(currentUser.getEmail(), error);
            return error;
        }

        UUID targetRoomId = request.getRoomId();
        RoomSession session = roomSessionRepository.findById(targetRoomId).orElse(null);

        if (session == null || session.getStatus() != RoomSessionStatus.ACTIVE) {
            RoomJoinResponse error = RoomJoinResponse.builder()
                    .status(RoomJoinStatus.FAILED)
                    .message("Room not found or no longer active.")
                    .build();
            sendMatchUpdate(currentUser.getEmail(), error);
            return error;
        }

        if (session.getPassword() != null && !session.getPassword().isEmpty()
                && !session.getPassword().equals(request.getPassword())) {
            RoomJoinResponse error = RoomJoinResponse.builder()
                    .status(RoomJoinStatus.FAILED)
                    .message("Incorrect room password.")
                    .build();
            sendMatchUpdate(currentUser.getEmail(), error);
            return error;
        }

        int currentMemberCount = activeMembersByRoom.getOrDefault(targetRoomId, Set.of()).size();
        if (currentMemberCount >= session.getGroupSize()) {
            RoomJoinResponse error = RoomJoinResponse.builder()
                    .status(RoomJoinStatus.FAILED)
                    .message("Room is already full.")
                    .build();
            sendMatchUpdate(currentUser.getEmail(), error);
            return error;
        }

        // Leave current active room if any
        UUID activeRoomId = activeRoomByUser.remove(userId);
        if (activeRoomId != null && !activeRoomId.equals(targetRoomId)) {
            leaveRoom(activeRoomId, userId);
        }

        double skillScore = roomSkillService.computeSkillScore(userId);
        int skillBand = roomSkillService.toSkillBand(skillScore);

        boolean isAlreadyParticipant = roomParticipantRepository.existsBySessionIdAndUserId(targetRoomId, userId);
        if (!isAlreadyParticipant) {
            RoomParticipant joinParticipant = RoomParticipant.builder()
                    .session(session)
                    .user(currentUser)
                    .skillScore(skillScore)
                    .skillBand(skillBand)
                    .build();
            roomParticipantRepository.save(joinParticipant);
        }

        activeRoomByUser.put(userId, session.getId());
        activeMembersByRoom.computeIfAbsent(session.getId(), ignored -> ConcurrentHashMap.newKeySet()).add(userId);

        List<RoomMemberResponse> members = roomParticipantRepository.findBySessionIdOrderByJoinedAtAsc(session.getId())
                .stream()
                .map(this::toMemberResponse)
                .toList();

        RoomJoinResponse response = RoomJoinResponse.builder()
                .status(RoomJoinStatus.MATCHED)
                .roomId(session.getId())
                .topic(session.getTopic())
                .skillScore(skillScore)
                .skillBand(skillBand)
                .groupSize(session.getGroupSize())
                .memberCount(members.size())
                .members(members)
                .message("Successfully joined the room.")
                .matchedAt(LocalDateTime.now())
                .build();

        sendMatchUpdate(currentUser.getEmail(), response);
        publishSystemMessage(session, currentUser.getUsername() + " joined the room.");
        broadcastMembers(session.getId());

        return response;
    }

    @Transactional
    public void sendChatMessage(UUID roomId, UUID userId, RoomChatRequest request) {
        ensureMembership(roomId, userId);
        String normalized = normalizeChatMessage(request == null ? null : request.getMessage());
        if (normalized == null) {
            return;
        }

        RoomSession session = mustFindSession(roomId);
        User sender = mustFindUser(userId);

        RoomChatMessage saved = roomChatMessageRepository.save(RoomChatMessage.builder()
                .session(session)
                .senderUser(sender)
                .senderName(sender.getUsername())
                .senderType(RoomChatSenderType.STUDENT)
                .content(normalized)
                .build());

        messagingTemplate.convertAndSend(chatTopic(roomId), toChatEvent(saved));
    }

    public void broadcastWhiteboard(UUID roomId, UUID userId, RoomWhiteboardEvent event) {
        ensureMembership(roomId, userId);
        User sender = mustFindUser(userId);

        RoomWhiteboardEvent normalized = RoomWhiteboardEvent.builder()
                .roomId(roomId)
                .senderId(userId)
                .senderName(sender.getUsername())
                .fromX(event == null ? null : event.getFromX())
                .fromY(event == null ? null : event.getFromY())
                .toX(event == null ? null : event.getToX())
                .toY(event == null ? null : event.getToY())
                .color(event == null ? "#1f2937" : event.getColor())
                .strokeWidth(event == null ? 2.0 : event.getStrokeWidth())
                .eraser(event != null && Boolean.TRUE.equals(event.getEraser()))
                .clearBoard(event != null && Boolean.TRUE.equals(event.getClearBoard()))
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend(whiteboardTopic(roomId), normalized);
    }

    @Transactional
    public void requestHint(UUID roomId, UUID userId, RoomHintRequest request) {
        ensureMembership(roomId, userId);
        RoomSession session = mustFindSession(roomId);
        User requester = mustFindUser(userId);

        List<RoomChatMessage> recent = roomChatMessageRepository.findBySessionIdOrderByCreatedAtDesc(
                roomId,
                PageRequest.of(0, 8));
        List<String> recentMessages = recent.stream()
                .map(msg -> msg.getSenderName() + ": " + msg.getContent())
                .toList();

        String hint = roomAiModeratorService.suggestHint(
                session.getTopic(),
                session.getSkillBand(),
                request == null ? null : request.getProblemStatement(),
                recentMessages);

        RoomChatMessage saved = roomChatMessageRepository.save(RoomChatMessage.builder()
                .session(session)
                .senderName("AI Moderator")
                .senderType(RoomChatSenderType.AI_MODERATOR)
                .content(hint)
                .build());

        messagingTemplate.convertAndSend(hintTopic(roomId), RoomHintEvent.builder()
                .roomId(roomId)
                .hint(hint)
                .requestedBy(requester.getUsername())
                .timestamp(LocalDateTime.now())
                .build());

        messagingTemplate.convertAndSend(chatTopic(roomId), toChatEvent(saved));
    }

    public void relayVoiceSignal(UUID roomId, UUID userId, RoomMediaSignalEvent event) {
        ensureMembership(roomId, userId);
        User sender = mustFindUser(userId);

        event.setRoomId(roomId);
        event.setSenderId(userId);
        event.setSenderName(sender.getUsername());
        event.setTimestamp(LocalDateTime.now());

        String signalType = event.getType();
        if (signalType == null) {
            return;
        }

        switch (signalType) {
            case "join-voice" -> {
                voiceParticipantsByRoom
                        .computeIfAbsent(roomId, ignored -> ConcurrentHashMap.newKeySet())
                        .add(userId);
                messagingTemplate.convertAndSend(voiceTopic(roomId), event);
            }
            case "leave-voice" -> {
                Set<UUID> voiceMembers = voiceParticipantsByRoom.get(roomId);
                if (voiceMembers != null) {
                    voiceMembers.remove(userId);
                    if (voiceMembers.isEmpty()) {
                        voiceParticipantsByRoom.remove(roomId);
                    }
                }
                messagingTemplate.convertAndSend(voiceTopic(roomId), event);
            }
            case "mute-toggle", "force-mute" -> {
                messagingTemplate.convertAndSend(voiceTopic(roomId), event);
            }
            case "offer", "answer", "ice-candidate" -> {
                messagingTemplate.convertAndSend(voiceTopic(roomId), event);
            }
            default -> {
                log.warn("Unknown voice signal type: {}", signalType);
            }
        }
    }

    @Transactional
    public synchronized void leaveRoom(UUID roomId, UUID userId) {
        ensureMembership(roomId, userId);
        RoomParticipant participant = roomParticipantRepository.findBySessionIdAndUserId(roomId, userId)
                .orElse(null);
        if (participant != null && participant.getLeftAt() == null) {
            participant.setLeftAt(LocalDateTime.now());
            roomParticipantRepository.save(participant);
        }

        activeRoomByUser.remove(userId);
        Set<UUID> members = activeMembersByRoom.computeIfAbsent(roomId, ignored -> ConcurrentHashMap.newKeySet());
        members.remove(userId);

        // Clean up voice participation
        Set<UUID> voiceMembers = voiceParticipantsByRoom.get(roomId);
        if (voiceMembers != null) {
            voiceMembers.remove(userId);
            if (voiceMembers.isEmpty()) {
                voiceParticipantsByRoom.remove(roomId);
            }
        }

        if (members.isEmpty()) {
            RoomSession session = mustFindSession(roomId);
            session.setStatus(RoomSessionStatus.CLOSED);
            session.setEndedAt(LocalDateTime.now());
            roomSessionRepository.save(session);
            activeMembersByRoom.remove(roomId);
            voiceParticipantsByRoom.remove(roomId);
            messagingTemplate.convertAndSend(closedTopic(roomId), "Room closed");
            return;
        }

        publishSystemMessage(mustFindSession(roomId), "A member left the room.");
        broadcastMembers(roomId);
    }

    @Transactional(readOnly = true)
    public List<RoomSessionSummaryResponse> getUserRoomHistory(UUID userId) {
        List<RoomParticipant> participations = roomParticipantRepository.findTop20ByUserIdOrderByJoinedAtDesc(userId);
        Map<UUID, RoomSessionSummaryResponse> uniqueSessions = new LinkedHashMap<>();
        for (RoomParticipant participant : participations) {
            RoomSession session = participant.getSession();
            if (uniqueSessions.containsKey(session.getId())) {
                continue;
            }
            int memberCount = roomParticipantRepository.findBySessionIdOrderByJoinedAtAsc(session.getId()).size();
            uniqueSessions.put(session.getId(), RoomSessionSummaryResponse.builder()
                    .roomId(session.getId())
                    .topic(session.getTopic())
                    .skillBand(session.getSkillBand())
                    .groupSize(session.getGroupSize())
                    .memberCount(memberCount)
                    .status(session.getStatus())
                    .startedAt(session.getStartedAt())
                    .endedAt(session.getEndedAt())
                    .build());
        }
        return new ArrayList<>(uniqueSessions.values());
    }

    @Transactional(readOnly = true)
    public List<RoomChatEvent> getRoomMessages(UUID userId, UUID roomId, int limit) {
        if (!roomParticipantRepository.existsBySessionIdAndUserId(roomId, userId)) {
            throw new IllegalArgumentException("Not authorized for this room");
        }

        int safeLimit = Math.max(1, Math.min(limit, 200));
        List<RoomChatMessage> messages = roomChatMessageRepository.findBySessionIdOrderByCreatedAtDesc(
                roomId,
                PageRequest.of(0, safeLimit));
        List<RoomChatEvent> events = messages.stream()
                .map(this::toChatEvent)
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.reverse(events);
        return events;
    }

    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getRoomMembers(UUID userId, UUID roomId) {
        if (!roomParticipantRepository.existsBySessionIdAndUserId(roomId, userId)) {
            throw new IllegalArgumentException("Not authorized for this room");
        }
        return roomParticipantRepository.findBySessionIdOrderByJoinedAtAsc(roomId).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    private void sendMatchUpdate(String email, RoomJoinResponse response) {
        messagingTemplate.convertAndSendToUser(email, "/queue/rooms/match", response);
    }

    private void ensureMembership(UUID roomId, UUID userId) {
        Set<UUID> roomMembers = activeMembersByRoom.getOrDefault(roomId, Set.of());
        if (roomMembers.contains(userId)) {
            return;
        }

        boolean exists = roomParticipantRepository.existsBySessionIdAndUserId(roomId, userId);
        if (!exists) {
            throw new IllegalArgumentException("User is not part of this room");
        }
        activeMembersByRoom.computeIfAbsent(roomId, ignored -> ConcurrentHashMap.newKeySet()).add(userId);
    }

    private void broadcastMembers(UUID roomId) {
        List<RoomMemberResponse> members = roomParticipantRepository.findBySessionIdOrderByJoinedAtAsc(roomId).stream()
                .map(this::toMemberResponse)
                .toList();
        messagingTemplate.convertAndSend(memberTopic(roomId), members);
    }

    private void publishSystemMessage(RoomSession session, String message) {
        RoomChatMessage saved = roomChatMessageRepository.save(RoomChatMessage.builder()
                .session(session)
                .senderName("System")
                .senderType(RoomChatSenderType.SYSTEM)
                .content(message)
                .build());
        messagingTemplate.convertAndSend(chatTopic(session.getId()), toChatEvent(saved));
    }

    private void broadcastHint(RoomSession session, String hint, String requestedBy) {
        messagingTemplate.convertAndSend(hintTopic(session.getId()), RoomHintEvent.builder()
                .roomId(session.getId())
                .hint(hint)
                .requestedBy(requestedBy)
                .timestamp(LocalDateTime.now())
                .build());
    }

    private RoomMemberResponse toMemberResponse(RoomParticipant participant) {
        return RoomMemberResponse.builder()
                .userId(participant.getUser().getId())
                .username(participant.getUser().getUsername())
                .skillScore(participant.getSkillScore())
                .skillBand(participant.getSkillBand())
                .build();
    }

    private RoomChatEvent toChatEvent(RoomChatMessage message) {
        return RoomChatEvent.builder()
                .id(message.getId())
                .roomId(message.getSession().getId())
                .senderId(message.getSenderUser() == null ? null : message.getSenderUser().getId())
                .senderName(message.getSenderName())
                .senderType(message.getSenderType())
                .message(message.getContent())
                .timestamp(message.getCreatedAt())
                .build();
    }

    private User mustFindUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private RoomSession mustFindSession(UUID roomId) {
        return roomSessionRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
    }

    private int resolveGroupSize(Integer requestedSize) {
        if (requestedSize == null) {
            return Math.max(2, defaultGroupSize);
        }
        return Math.max(2, Math.min(requestedSize, 6));
    }

    private String normalizeTopic(String topic) {
        if (topic == null || topic.isBlank()) {
            return DEFAULT_TOPIC;
        }
        String normalized = topic.trim().toLowerCase();
        if (normalized.length() > 160) {
            return normalized.substring(0, 160);
        }
        return normalized;
    }

    private String normalizeChatMessage(String message) {
        if (message == null) {
            return null;
        }
        String normalized = message.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > MAX_CHAT_LENGTH) {
            return normalized.substring(0, MAX_CHAT_LENGTH);
        }
        return normalized;
    }

    private String chatTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/chat";
    }

    private String whiteboardTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/whiteboard";
    }

    private String hintTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/hints";
    }

    private String memberTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/members";
    }

    private String closedTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/closed";
    }

    private String voiceTopic(UUID roomId) {
        return "/topic/rooms/" + roomId + "/voice";
    }

}
