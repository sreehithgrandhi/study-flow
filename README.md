# StudyFlow

StudyFlow is a full-stack study planning app with a Vite React client, Express API, Gemini-powered assistant, and Supabase persistence.

## Requirements

- Node.js 20 or newer
- A Gemini API key
- A Supabase project URL and anon key

## Local Development

Run these commands from the project root:

```bash
npm install
```

Create `.env.local` from [.env.example](.env.example) and set these values:

```env
GEMINI_API_KEY="your-gemini-api-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
APP_URL="http://localhost:3000"
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in a browser.

## Production

Build and start the full-stack application with:

```bash
npm run build
npm start
```

Set `NODE_ENV=production` and configure the same environment variables in the hosting provider. Deploy this as a Node.js web service because the Express server provides the `/api/ai/*` endpoints.

## Checks

```bash
npm run lint
npm run build
```

Never commit `.env.local` or any file containing real credentials. The included `.env.example` contains placeholders only.
