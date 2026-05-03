# Real-Time AI Tutor + Adaptive Recommendations

## 1. High-level architecture

```text
React ChatWidget
  -> REST /api/ai/* (session, history, recommendations, usage)
  -> WebSocket STOMP /ws-ai + /app/ai/session/{id}/ask

Spring Boot AI module
  -> AiController (REST)
  -> AiWebSocketController (realtime asks)
  -> AiRealtimeService (async generation + token streaming)
  -> GeminiAiProviderAdapter (AI provider port adapter)
  -> MySQL (ai_session, ai_message, ai_recommendation, ai_feedback, ai_usage_daily)
```

```text
Isolation rule:
LMS core modules (courses, assessments, learning, progress) remain unchanged.
AI module runs in separate services and writes only ai_* tables.
```

## 2. Database changes

Implemented entities and schema:

- `ai_session`
- `ai_message`
- `ai_recommendation`
- `ai_feedback`
- `ai_usage_daily`

DDL script: `backend/src/main/resources/sql/ai_schema.sql`

## 3. Backend service layer design

- Port: `AiProviderPort`
- Adapter: `GeminiAiProviderAdapter`
- Orchestration: `AiRealtimeService`
- Session/history/feedback APIs: `AiSessionService`
- Recommendations: `AiRecommendationService`
- Daily usage accounting: `AiUsageService`
- Prompt construction: `AiPromptBuilderService`
- Rate limiting: `AiRateLimiterService`

## 4. Controller APIs

- `POST /api/ai/sessions`
- `GET /api/ai/sessions/{sessionId}`
- `GET /api/ai/sessions/{sessionId}/messages?limit=50`
- `GET /api/ai/recommendations?courseId={uuid}`
- `POST /api/ai/messages/{messageId}/feedback`
- `GET /api/ai/usage/daily`

## 5. WebSocket integration

- Endpoint: `/ws-ai`
- App destination: `/app/ai/session/{sessionId}/ask`
- Topic destinations:
  - `/topic/ai/session/{sessionId}/stream`
  - `/topic/ai/session/{sessionId}/done`
  - `/topic/ai/session/{sessionId}/error`

Flow:

```text
Client CONNECT /ws-ai (Authorization: Bearer JWT)
 -> JwtChannelInterceptor validates token and binds user principal
Client SEND /app/ai/session/{id}/ask
 -> AiRealtimeService calls provider asynchronously
 -> server emits TOKEN chunks to /topic/.../stream
 -> server emits DONE
```

## 6. Frontend components

- Updated: `frontend/src/Components/ChatWidget.jsx`
  - creates AI session
  - opens STOMP socket
  - streams assistant tokens in real time
  - shows adaptive recommendations
  - shows daily AI usage stats
  - falls back to existing `/api/chat` if socket is unavailable
- Added service: `frontend/src/api/ai.service.js`

## 7. AI model integration

- Adapter pattern through `AiProviderPort`
- Current adapter delegates to `GeminiService`
- Prompt strategy includes course + lesson context when available
- Responses are chunked and streamed to client for low perceived latency

## 8. Security considerations

- JWT auth required for all `/api/ai/**`
- WebSocket CONNECT JWT validated in `JwtChannelInterceptor`
- Session ownership checks (`sessionId + userId`) before read/write
- Feedback ownership checks (user can only vote on own session messages)
- Rate limit guard per user for ask requests

## 9. Scalability considerations

- Async worker pool (`aiTaskExecutor`) for AI requests
- Token streaming avoids large response blocking
- Indexed AI tables for user/session history paths
- AI module isolated from core LMS modules to reduce blast radius
- In-memory rate limiter can be replaced with Redis for multi-instance scale

## 10. Future enhancements

- Replace simple broker with broker relay for high-scale fan-out
- Replace in-memory rate limit with Redis token bucket
- Introduce queue-based AI worker for long-running generation
- Add moderation pipeline and content safety rules
- Add RAG (vector search over course lessons)

