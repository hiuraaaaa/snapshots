/**
 * ─────────────────────────────────────────────
 *  @project    Alfisy AI
 *  @desc       Multi-modal AI: chat, vision, OCR, transcribe, img gen
 *  @author     Hhh
 *  @repo       github.com/Hhh/snapshots
 *  @base       https://ai.alfisy.my.id/api
 * ─────────────────────────────────────────────
 *
 *  MODELS (via GET /api/models):
 *  ┌─────────────────┬──────────────────────┬──────────────────────────────┐
 *  │ ID              │ Name                 │ Desc                         │
 *  ├─────────────────┼──────────────────────┼──────────────────────────────┤
 *  │ mistral-agent   │ Alfixd Agent         │ General purpose (default)    │
 *  │ pixtral         │ Pixtral Large        │ Vision / image analysis      │
 *  │ codestral       │ Codestral            │ Code-focused                 │
 *  │ gemini          │ Gemini 3 Flash       │ Google model + web search    │
 *  │ claude          │ Claude Sonnet 4.5    │ High-end Anthropic model     │
 *  │ kimi            │ Kimi K2              │ Smart AI with vision         │
 *  │ deepseek        │ DeepSeek Multimodal  │ DeepSeek V3 + vision         │
 *  │ zai-glm         │ Z.AI GLM-4.7         │ Zhipu AI model               │
 *  │ gpt5            │ GPT-5                │ Next-gen OpenAI model        │
 *  └─────────────────┴──────────────────────┴──────────────────────────────┘
 *
 *  FUNCTIONS:
 *  - alfisyChat(message, { model?, imagePath? })  → { text }
 *  - alfisyTxt2Img(prompt, { model? })            → { imageUrl }
 *  - alfisyTranscribe(audioPath)                  → { text }
 *  - alfisyOCR(filePath)                          → { text }
 *  - alfisyModels()                               → { models }
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE = 'https://ai.alfisy.my.id/api';
const TIMEOUT = 30_000;

// ──────────────────────────────────────────────
//  CHAT  (text + vision)
//  model default : mistral-agent
//  imagePath     : auto switch ke pixtral
// ──────────────────────────────────────────────
async function alfisyChat(message, { model = 'mistral-agent', imagePath = null } = {}) {
    if (!message) throw new Error('Message is required.');

    const body = { message, model };

    if (imagePath) {
        const base64 = fs.readFileSync(imagePath).toString('base64');
        body.imageData = `data:image/jpeg;base64,${base64}`;
        body.model = 'pixtral';
    }

    const { data } = await axios.post(`${BASE}/chat`, body, {
        headers: { 'content-type': 'application/json' },
        timeout: TIMEOUT,
    });

    return { text: data.response || data.text };
}

// ──────────────────────────────────────────────
//  TEXT TO IMAGE
//  model default : Flux1schnell
// ──────────────────────────────────────────────
async function alfisyTxt2Img(prompt, { model = 'Flux1schnell' } = {}) {
    if (!prompt) throw new Error('Prompt is required.');

    const { data } = await axios.post(`${BASE}/txt2img`, { prompt, model }, {
        headers: { 'content-type': 'application/json' },
        timeout: TIMEOUT,
    });

    return { imageUrl: data.imageUrl };
}

// ──────────────────────────────────────────────
//  TRANSCRIBE  (speech to text)
//  format : mp3
// ──────────────────────────────────────────────
async function alfisyTranscribe(audioPath) {
    if (!audioPath) throw new Error('Audio path is required.');

    const form = new FormData();
    form.append('audio', fs.createReadStream(audioPath), {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg',
    });

    const { data } = await axios.post(`${BASE}/transcribe`, form, {
        headers: { ...form.getHeaders() },
        timeout: TIMEOUT,
    });

    return { text: data.text || data.transcription };
}

// ──────────────────────────────────────────────
//  OCR  (pdf / image → text)
//  otomatis detect mime dari ekstensi file
// ──────────────────────────────────────────────
async function alfisyOCR(filePath) {
    if (!filePath) throw new Error('File path is required.');

    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
    const base64 = fs.readFileSync(filePath).toString('base64');

    const { data } = await axios.post(`${BASE}/ocr`, {
        fileData: `data:${mime};base64,${base64}`,
        fileName: path.basename(filePath),
    }, {
        headers: { 'content-type': 'application/json' },
        timeout: TIMEOUT,
    });

    return { text: data.text || data.result };
}

// ──────────────────────────────────────────────
//  GET MODELS
//  fetch daftar model yang tersedia
// ──────────────────────────────────────────────
async function alfisyModels() {
    const { data } = await axios.get(`${BASE}/models`, { timeout: TIMEOUT });
    return { models: data.models };
}

// ──────────────────────────────────────────────
//  USAGE EXAMPLES
// ──────────────────────────────────────────────

// alfisyChat('Halo!').then(console.log);
// alfisyChat('Apa ini?', { imagePath: './foto.jpg' }).then(console.log);
// alfisyChat('Tulis fungsi sort', { model: 'codestral' }).then(console.log);
// alfisyTxt2Img('kucing astronot di bulan').then(console.log);
// alfisyTranscribe('./audio.mp3').then(console.log);
// alfisyOCR('./dokumen.pdf').then(console.log);
// alfisyModels().then(console.log);

module.exports = { alfisyChat, alfisyTxt2Img, alfisyTranscribe, alfisyOCR, alfisyModels };
