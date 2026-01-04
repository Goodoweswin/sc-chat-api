# sc-chat-api
**AI Chat Backend for Bio-Tools**

A serverless API built with Cloudflare Workers, providing AI capabilities to the [Bio-Tools](https://github.com/Goodoweswin/bio-tools) static site.

## Features
- **AI Model**: Google Gemini Pro integration.
- **Security**: HTTP Basic Auth & CORS protection.
- **Rate Limiting**: IP-based limiting using Cloudflare KV.
- **Knowledge Base**: RAG-ready architecture using KV storage.

## Tech Stack
- Cloudflare Workers
- Wrangler
- Node.js

## Deployment
```bash
npm run deploy
```
