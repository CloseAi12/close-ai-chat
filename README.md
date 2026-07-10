# Close AI — Chat Frontend

Mobile-first chat UI for Close AI, built with Next.js (App Router) + TypeScript + Tailwind.

## Features
- Sidebar with conversation list — new / rename / delete, collapses to a hamburger drawer on mobile
- Message bubbles (user right, assistant left) with real token-by-token streaming
- Voice input via the Web Speech API (mic button, EN/UR toggle for recognition language)
- Accepts Roman Urdu, Urdu (اردو) and English input — no translation, input passes through as typed
- Light / dark mode toggle (persisted, respects system preference on first load)
- "Copy code" button on every fenced code block in a reply
- Typing indicator while the AI is generating
- Conversations persist in `localStorage` so refreshing the page doesn't lose history

## Run it
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Connecting to your Part 1 `/api/chat` backend
`app/api/chat/route.ts` currently contains a **mock** handler so the UI is testable standalone.
Replace its body with your real backend call (e.g. the Anthropic API). Keep the request/response
contract, and the frontend needs no changes:

**Request** — `POST /api/chat`
```json
{
  "conversationId": "abc123",
  "messages": [
    { "role": "user", "content": "Salam, kaise ho?" },
    { "role": "assistant", "content": "Theek hoon, shukriya!" }
  ]
}
```

**Response** — a streamed body, either shape works:
- SSE frames: `data: {"content":"next token "}\n\n` ... ending with `data: [DONE]\n\n`
- Or plain incremental text chunks (no `data:` prefix)

The parsing logic lives in `lib/streamChat.ts` — adjust `onDelta`'s field lookup
(`json.content ?? json.delta ?? json.text ?? json.token`) if your backend uses a different key.

## Project structure
```
app/
  layout.tsx          root layout, fonts, theme color
  page.tsx             entry point, renders <ChatInterface />
  api/chat/route.ts    backend endpoint (replace with Part 1 logic)
  globals.css
components/
  ChatInterface.tsx    main orchestrator: state, streaming, layout
  Sidebar.tsx          conversation list + mobile drawer
  MessageBubble.tsx     renders a message, splits out code fences
  CodeBlock.tsx         code block with "Copy code" button
  TypingIndicator.tsx   animated dots shown while streaming starts
  VoiceInputButton.tsx  Web Speech API mic button
lib/
  types.ts
  storage.ts            localStorage persistence (conversations + theme)
  streamChat.ts          fetch + stream parser for /api/chat
```

## Notes
- Voice input uses `webkitSpeechRecognition` / `SpeechRecognition`, supported in Chrome/Edge/Safari.
  In unsupported browsers (e.g. desktop Firefox) the mic button is disabled with a tooltip —
  typing still works normally.
- Roman Urdu speech recognition accuracy depends on the browser's language model; the EN/UR
  toggle in the header switches the recognition locale between `en-US` and `ur-PK`.
- Design tokens (colors, type scale) live in `tailwind.config.ts` under a dedicated
  `canvas / surface / ink / brand / line` palette — change them there to re-theme the whole app.
