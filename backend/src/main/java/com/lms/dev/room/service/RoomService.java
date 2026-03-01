package com.lms.dev.room.service;

import com.lms.dev.entity.User;
import com.lms.dev.repository.UserRepository;
import com.lms.dev.room.dto.RoomChatEvent;
import com.lms.dev.room.dto.RoomChatRequest;
import com.lms.dev.room.dto.RoomHintEvent;
import com.lms.dev.room.dto.RoomHintRequest;
import com.lms.dev.room.dto.RoomJoinRequest;
import com.lms.dev.room.dto.RoomJoinResponse;
import com.lms.dev.room.dto.RoomJoinStatus;
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
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

    @Value("${app.rooms.matching.max-band-distance:1}")
    private int maxBandDistance;

    private final UserRepository userRepository;
    private final RoomSessionRepository roomSessionRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final RoomChatMessageRepository roomChatMessageRepository;
    private final RoomSkillService roomSkillService;
    private final RoomAiModeratorService roomAiModeratorService;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<MatchQueueKey, Deque<WaitingCandidate>> waitingQueues = new ConcurrentHashMap<>();
    private final Map<UUID, UUID> activeRoomByUser = new ConcurrentHashMap<>();
    private final Map<UUID, Set<UUID>> activeMembersByRoom = new ConcurrentHashMap<>();

    @Transactional
    public synchronized RoomJoinResponse joinRoom(UUID userId, RoomJoinRequest request) {
        User currentUser = mustFindUser(userId);
        UUID activeRoomId = activeRoomByUser.get(userId);
        if (activeRoomId != null) {
            RoomSession activeSession = roomSessionRepository.findById(activeRoomId).orElse(null);
            if (activeSession != null && activeSession.getStatus() == RoomSessionStatus.ACTIVE) {
                double currentSkillScore = roomSkillService.computeSkillScore(userId);
                RoomJoinResponse existing = buildMatchedResponseForUser(
                        activeSession,
                        currentSkillScore,
                        roomSkillService.toSkillBand(currentSkillScore)
                );
                sendMatchUpdate(currentUser.getEmail(), existing);
                return existing;
            }
            activeRoomByUser.remove(userId);
        }

        removeUserFromAllWaitingQueues(userId);

        int desiredGroupSize = resolveGroupSize(request == null ? null : request.getPreferredGroupSize());
        String topic = normalizeTopic(request == null ? null : request.getTopic());
        double skillScore = roomSkillService.computeSkillScore(userId);
        int skillBand = roomSkillService.toSkillBand(skillScore);

        WaitingCandidate candidate = WaitingCandidate.builder()
                .userId(currentUser.getId())
                .email(currentUser.getEmail())
                .username(currentUser.getUsername())
                .skillScore(skillScore)
                .skillBand(skillBand)
                .topic(topic)
                .queuedAt(LocalDateTime.now())
                .build();

        MatchQueueKey key = new MatchQueueKey(skillBand, topic);
        waitingQueues.computeIfAbsent(key, k -> new ArrayDeque<>()).offerLast(candidate);

        List<PoppedCandidate> popped = popCandidatesForMatch(key, desiredGroupSize);
        if (popped.size() < desiredGroupSize) {
            restoreCandidates(popped);
            int waitingCount = waitingQueues.getOrDefault(key, new ArrayDeque<>()).size();
            RoomJoinResponse waiting = RoomJoinResponse.builder()
                    .status(RoomJoinStatus.WAITING)
                    .topic(topic)
                    .skillScore(skillScore)
                    .skillBand(skillBand)
                    .groupSize(desiredGroupSize)
                    .memberCount(waitingCount)
                    .message("Searching peers with similar skill level...")
                    .build();
            sendMatchUpdate(currentUser.getEmail(), waiting);
            return waiting;
        }

        List<WaitingCandidate> matchedCandidates = popped.stream()
                .map(PoppedCandidate::candidate)
                .toList();
        RoomSession session = createMatchedSession(topic, desiredGroupSize, matchedCandidates);
        Map<UUID, User> usersById = userRepository.findAllById(
                        matchedCandidates.stream().map(WaitingCandidate::userId).toList()
                ).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        List<RoomParticipant> participants = new ArrayList<>();
        for (WaitingCandidate matched : matchedCandidates) {
            User participantUser = usersById.get(matched.userId());
            if (participantUser == null) {
                continue;
            }
            participants.add(RoomParticipant.builder()
                    .session(session)
                    .user(participantUser)
                    .skillScore(matched.skillScore())
                    .skillBand(matched.skillBand())
                    .build());
            activeRoomByUser.put(matched.userId(), session.getId());
        }
        roomParticipantRepository.saveAll(participants);

        Set<UUID> memberIds = participants.stream()
                .map(participant -> participant.getUser().getId())
                .collect(Collectors.toCollection(ConcurrentHashMap::newKeySet));
        activeMembersByRoom.put(session.getId(), memberIds);

        List<RoomMemberResponse> memberResponses = participants.stream()
                .map(this::toMemberResponse)
                .toList();

        for (WaitingCandidate matched : matchedCandidates) {
            RoomJoinResponse response = RoomJoinResponse.builder()
                    .status(RoomJoinStatus.MATCHED)
                    .roomId(session.getId())
                    .topic(session.getTopic())
                    .skillScore(matched.skillScore())
                    .skillBand(matched.skillBand())
                    .groupSize(session.getGroupSize())
                    .memberCount(memberResponses.size())
                    .members(memberResponses)
                    .message("Room matched. Start collaborating.")
                    .matchedAt(LocalDateTime.now())
                    .build();
            sendMatchUpdate(matched.email(), response);
        }

        publishSystemMessage(session, "Room matched: collaborate on " + session.getTopic() + ".");
        broadcastMembers(session.getId());
        broadcastHint(
                session,
                "Start by assigning one sub-problem each, then compare approaches after 5 minutes.",
                "AI Moderator"
        );
        return RoomJoinResponse.builder()
                .status(RoomJoinStatus.MATCHED)
                .roomId(session.getId())
                .topic(session.getTopic())
                .skillScore(skillScore)
                .skillBand(skillBand)
                .groupSize(session.getGroupSize())
                .memberCount(memberResponses.size())
                .members(memberResponses)
                .message("Room matched. Start collaborating.")
                .matchedAt(LocalDateTime.now())
                .build();
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
                PageRequest.of(0, 8)
        );
        List<String> recentMessages = recent.stream()
                .map(msg -> msg.getSenderName() + ": " + msg.getContent())
                .toList();

        String hint = roomAiModeratorService.suggestHint(
                session.getTopic(),
                session.getSkillBand(),
                request == null ? null : request.getProblemStatement(),
                recentMessages
        );

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

        if (members.isEmpty()) {
            RoomSession session = mustFindSession(roomId);
            session.setStatus(RoomSessionStatus.CLOSED);
            session.setEndedAt(LocalDateTime.now());
            roomSessionRepository.save(session);
            activeMembersByRoom.remove(roomId);
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
                PageRequest.of(0, safeLimit)
        );
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

    private RoomSession createMatchedSession(String topic, int desiredGroupSize, List<WaitingCandidate> members) {
        double averageSkill = members.stream().mapToDouble(WaitingCandidate::skillScore).average().orElse(50.0);
        int averageBand = roomSkillService.toSkillBand(averageSkill);
        RoomSession session = RoomSession.builder()
                .topic(topic)
                .skillBand(averageBand)
                .avgSkillScore(averageSkill)
                .groupSize(Math.max(desiredGroupSize, members.size()))
                .status(RoomSessionStatus.ACTIVE)
                .build();
        return roomSessionRepository.save(session);
    }

    private List<PoppedCandidate> popCandidatesForMatch(MatchQueueKey anchorKey, int targetSize) {
        List<PoppedCandidate> popped = new ArrayList<>();
        List<MatchQueueKey> orderedKeys = orderedKeys(anchorKey);

        while (popped.size() < targetSize) {
            boolean progressed = false;
            for (MatchQueueKey key : orderedKeys) {
                Deque<WaitingCandidate> queue = waitingQueues.get(key);
                if (queue == null || queue.isEmpty()) {
                    continue;
                }

                WaitingCandidate next = null;
                while (!queue.isEmpty()) {
                    WaitingCandidate candidate = queue.pollFirst();
                    if (candidate == null) {
                        continue;
                    }
                    if (activeRoomByUser.containsKey(candidate.userId())) {
                        continue;
                    }
                    next = candidate;
                    break;
                }

                if (queue.isEmpty()) {
                    waitingQueues.remove(key);
                }

                if (next != null) {
                    popped.add(new PoppedCandidate(key, next));
                    progressed = true;
                }
                if (popped.size() >= targetSize) {
                    break;
                }
            }
            if (!progressed) {
                break;
            }
        }
        return popped;
    }

    private List<MatchQueueKey> orderedKeys(MatchQueueKey anchorKey) {
        List<MatchQueueKey> keys = new ArrayList<>();
        keys.add(anchorKey);
        for (int distance = 1; distance <= maxBandDistance; distance++) {
            int lower = anchorKey.skillBand() - distance;
            int upper = anchorKey.skillBand() + distance;
            if (lower >= 0) {
                keys.add(new MatchQueueKey(lower, anchorKey.topic()));
            }
            if (upper <= 4) {
                keys.add(new MatchQueueKey(upper, anchorKey.topic()));
            }
        }
        return keys;
    }

    private void restoreCandidates(List<PoppedCandidate> poppedCandidates) {
        for (int i = poppedCandidates.size() - 1; i >= 0; i--) {
            PoppedCandidate popped = poppedCandidates.get(i);
            waitingQueues.computeIfAbsent(popped.key(), ignored -> new ArrayDeque<>())
                    .offerFirst(popped.candidate());
        }
    }

    private void removeUserFromAllWaitingQueues(UUID userId) {
        List<MatchQueueKey> emptyKeys = new ArrayList<>();
        waitingQueues.forEach((key, queue) -> {
            queue.removeIf(candidate -> Objects.equals(candidate.userId(), userId));
            if (queue.isEmpty()) {
                emptyKeys.add(key);
            }
        });
        emptyKeys.forEach(waitingQueues::remove);
    }

    private void ensureMembership(UUID roomId, UUID userId) {
        Set<UUID> members = activeMembersByRoom.get(roomId);
        if (members != null && members.contains(userId)) {
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

    private RoomJoinResponse buildMatchedResponseForUser(RoomSession session, double skillScore, int skillBand) {
        List<RoomMemberResponse> members = roomParticipantRepository.findBySessionIdOrderByJoinedAtAsc(session.getId()).stream()
                .map(this::toMemberResponse)
                .toList();
        return RoomJoinResponse.builder()
                .status(RoomJoinStatus.MATCHED)
                .roomId(session.getId())
                .topic(session.getTopic())
                .skillScore(skillScore)
                .skillBand(skillBand)
                .groupSize(session.getGroupSize())
                .memberCount(members.size())
                .members(members)
                .message("You are already connected to this room.")
                .matchedAt(LocalDateTime.now())
                .build();
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

    private record MatchQueueKey(int skillBand, String topic) {
    }

    @lombok.Builder
    private record WaitingCandidate(
            UUID userId,
            String email,
            String username,
            double skillScore,
            int skillBand,
            String topic,
            LocalDateTime queuedAt
    ) {
    }

    private record PoppedCandidate(MatchQueueKey key, WaitingCandidate candidate) {
    }
}
