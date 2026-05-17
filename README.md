# 📸 snapshots

> Kumpulan scraper AI gratis tanpa API key — siap pakai di Node.js.

---

## 📦 Install

```bash
npm install axios
```

> Beberapa scraper butuh dependencies tambahan, cek masing-masing file.

---

## 🤖 Daftar Scraper

| File | Project | Deskripsi |
|------|---------|-----------|
| `Anything.js` | Teach Anything | AI-powered explanation for any topic |
| `ch-at.js` | Ch.at | AI chat |
| `degreeguru.js` | DegreeGuru | AI assistant for degree & education queries |
| `dolphin-ai.js` | Dolphin AI | Chat with customizable response templates |
| `felo-ai.js` | Felo AI | Real-time AI with web search support |
| `gemini-proxy.js` | Gemini Proxy | Gemini AI proxy (flash models only) |
| `gemmy-gemini.js` | Gemmy Gemini | Chat with Gemini AI models |
| `isou.js` | Isou Chat | Real-time AI search, multi-engine support |
| `llamacoder.js` | LlamaCoder | AI code generator by Together AI |
| `mathgpt.js` | MathGPT | Solve math questions with image support |
| `microsoft-copilot.js` | Microsoft Copilot | Real-time AI with web search |
| `monica.js` | Monica | Real-time AI search with web sources |
| `morphic.js` | Morphic | AI search with web sources & image results |
| `perplexity.js` | Perplexity | AI with sources from web, journals, etc |
| `powerbrain.js` | PowerBrain AI | Free AI chat, no auth required |
| `public-ai.js` | PublicAI | Q&A using PublicAI |
| `riple-ai.js` | Riple AI | Real-time AI for answering questions |
| `search-with-alisia.js` | Alisia | Real-time AI search with news sources |
| `turboseek-ai.js` | TurboSeek AI | Real-time AI with web search |
| `unlimited-ai.js` | UnlimitedAI | Q&A using UnlimitedAI |
| `upstage-ai.js` | Upstage Solar | AI with web search & reasoning mode |
| `webpilot.js` | WebPilot | Real-time AI answers with web sources |
| `xdash-ai.js` | XDash AI | AI chat |

---

## 🚀 Usage

Semua scraper punya struktur yang konsisten:

```js
const scraper = require('./powerbrain');

scraper('Halo, apa kabar?').then(console.log);
// { text: '...' }
```

Beberapa scraper support opsi tambahan:

```js
const isou = require('./isou');

isou('Latest news in Indonesia', { engine: 'SEARXNG', deep_research: false })
  .then(console.log);
// { text: '...', search: [...] }
```

```js
const llamacoder = require('./llamacoder');

llamacoder('Buat button React yang cantik', {
  model: 'Qwen/Qwen3-Coder-Next-FP8'
}).then(r => console.log(r.text));
```

---

## ⚠️ Disclaimer

Repo ini dibuat untuk keperluan edukasi dan riset.
Semua scraper menggunakan endpoint publik tanpa autentikasi.
Gunakan dengan bijak dan hormati rate limit masing-masing layanan.

---

## 👤 Author

**Hhh** — [github.com/Hhh/snapshots](https://github.com/Hhh/snapshots)
