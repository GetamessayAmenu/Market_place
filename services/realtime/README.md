# @marketplace/realtime

Standalone Socket.IO chat service for buyer ↔ seller messaging.

## Stack

- NestJS + Socket.IO
- `@socket.io/redis-adapter` for horizontal scaling
- Shared PostgreSQL (Prisma) + Redis (sessions, presence, rate limits)

## Run

```bash
cp services/realtime/.env.example services/realtime/.env
# Align JWT_ACCESS_SECRET with services/api/.env

npm run dev --workspace=@marketplace/realtime
```

Default port: **3002** (`REALTIME_URL=http://localhost:3002`).

## HTTP API (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Liveness |
| POST | `/conversations` | Bearer JWT | Start conversation from listing |
| GET | `/conversations` | Bearer JWT | Conversation list + unread |
| GET | `/conversations/:id/messages` | Bearer JWT | Message history |
| POST | `/conversations/:id/read` | Bearer JWT | Mark messages read |

## WebSocket

Connect with access token:

```javascript
io('http://localhost:3002', {
  auth: { token: '<access_token>' },
});
```

### Client → Server

| Event | Payload |
|-------|---------|
| `chat:join` | `{ conversationId }` |
| `chat:send` | `{ conversationId, body }` |
| `chat:typing` | `{ conversationId, isTyping }` |
| `chat:read` | `{ conversationId, messageIds? }` |

### Server → Client

| Event | Description |
|-------|-------------|
| `chat:new_message` | New message persisted |
| `chat:user_typing` | Typing indicator |
| `chat:message_read` | Read receipt broadcast |
| `chat:user_online` / `chat:user_offline` | Presence |
| `chat:joined` | Room join ack |
