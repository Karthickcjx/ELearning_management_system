# Collaborative Problem-Solving Rooms

## 1. Feature architecture

```text
React CollaborativeRooms page
  -> STOMP WebSocket /ws-room
  -> REST /api/rooms/history, /messages, /members

Spring Boot Room module
  -> RoomWebSocketController (/app/rooms/*)
  -> RoomController (/api/rooms/*)
  -> RoomService (matching, realtime fan-out, session persistence)
  -> RoomSkillService (auto skill scoring from assessment + progress)
  -> RoomAiModeratorService (AI hints)
  -> MySQL (room_session, room_participant, room_chat_message)
```

## 2. Spring Boot WebSocket config

Implemented in:
- `backend/src/main/java/com/lms/dev/ai/config/AiWebSocketConfig.java`

Key settings:
- Endpoints:
  - `/ws-ai` (existing)
  - `/ws-room` (new)
- App destination prefix: `/app`
- Broker destinations: `/topic`, `/queue`
- User destination prefix: `/user`
- Inbound JWT validation: `JwtChannelInterceptor`

Room destinations used:
- Client send:
  - `/app/rooms/join`
  - `/app/rooms/{roomId}/chat`
  - `/app/rooms/{roomId}/whiteboard`
  - `/app/rooms/{roomId}/hint`
  - `/app/rooms/{roomId}/leave`
- Server publish:
  - `/user/queue/rooms/match`
  - `/topic/rooms/{roomId}/chat`
  - `/topic/rooms/{roomId}/whiteboard`
  - `/topic/rooms/{roomId}/members`
  - `/topic/rooms/{roomId}/hints`
  - `/topic/rooms/{roomId}/closed`

## 3. Auto-matching algorithm logic

Implemented in:
- `backend/src/main/java/com/lms/dev/room/service/RoomSkillService.java`
- `backend/src/main/java/com/lms/dev/room/service/RoomService.java`

### Skill scoring

For each user:
- `assessmentScore` = average assessment marks (0-100)
- `progressScore` = average course completion ratio (played/duration * 100)
- `skillScore`:
  - both present: `0.7 * assessmentScore + 0.3 * progressScore`
  - one missing: use available score
  - both missing: fallback `50`

Skill band:
- `band = floor(skillScore / 20)`, clamped to `[0, 4]`

### Queueing + matching

1. Student publishes `/app/rooms/join`.
2. Server computes `skillScore`, `skillBand`, normalizes topic.
3. Candidate enters in-memory waiting queue keyed by `(topic, skillBand)`.
4. Matching tries to fill target group size:
   - first from exact band
   - then nearest bands up to `max-band-distance`
5. On full group:
   - persist `room_session`
   - persist `room_participant` rows
   - set active membership cache
   - publish match result to each student (`/user/queue/rooms/match`)

This keeps groups mostly same-level while avoiding long wait times.

## 4. Session persistence

Entities:
- `RoomSession` -> `room_session`
- `RoomParticipant` -> `room_participant`
- `RoomChatMessage` -> `room_chat_message`

Manual DDL script:
- `backend/src/main/resources/sql/room_schema.sql`

Stored data:
- topic, skill band, group size, session lifecycle timestamps
- participant joins/leaves and skill score snapshot
- chat transcript (student/system/AI moderator)

## 5. AI moderator hints

Implemented in:
- `backend/src/main/java/com/lms/dev/room/service/RoomAiModeratorService.java`

Flow:
- client requests hint -> `/app/rooms/{roomId}/hint`
- server builds context from recent room chat + topic + band
- AI service returns a concise next-step hint
- hint is persisted as `room_chat_message` with sender `AI_MODERATOR`
- broadcast to:
  - `/topic/rooms/{roomId}/hints`
  - `/topic/rooms/{roomId}/chat`

## 6. Frontend realtime sync

Implemented in:
- `frontend/src/pages/rooms/CollaborativeRooms.jsx`
- `frontend/src/api/room.service.js`

Capabilities:
- join queue with topic + desired group size
- receive match updates in real time
- live group chat
- shared whiteboard (stroke events + clear events)
- AI hint request + live hint feed
- room history + transcript bootstrap via REST

## 7. Redis scaling strategy (multi-instance)

Current implementation uses in-memory queues/caches and Spring simple broker, which is single-instance best effort.

For horizontal scale, use Redis for shared state + event propagation:

1. **Shared match queues in Redis**
   - Key design:
     - `rooms:queue:{topic}:{band}` (Redis sorted set / list)
   - Value: user payload with queued timestamp and skill score
   - Use Lua script for atomic pop of matched group.

2. **Shared active room membership**
   - `rooms:active:user:{userId} -> roomId`
   - `rooms:members:{roomId}` set of user IDs
   - TTL for stale cleanup if node crashes.

3. **Cross-node event fan-out**
   - Publish room events to Redis Pub/Sub:
     - `rooms:events:{roomId}`
   - Each node subscribes and forwards to local STOMP broker clients.

4. **Broker scaling**
   - Replace in-memory simple broker with:
     - Spring broker relay to RabbitMQ, or
     - Redis-backed STOMP gateway pattern
   - Keep `/user` routing consistent across nodes.

5. **Sticky sessions + stateless auth**
   - Keep JWT validation at WebSocket connect.
   - Prefer sticky LB for lower subscription churn, but not mandatory if events are broker-backed.

6. **Operational controls**
   - Rate-limit join/chat/hint calls using Redis token bucket.
   - Persist periodic whiteboard snapshots in object storage for large sessions.

