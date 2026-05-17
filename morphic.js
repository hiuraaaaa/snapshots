/**
 * ─────────────────────────────────────────────
 *  @project    morphic
 *  @desc       Morphic Chat, real-time AI search with web sources and image results.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const crypto = require('crypto');

async function morphic(question) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const chatId = crypto.randomBytes(12).toString('hex');
        const msgId = crypto.randomBytes(12).toString('hex');
        const { data } = await axios.post('https://chat.morphic.sh/api/chat', {
            trigger: 'submit-message',
            chatId,
            messages: [{
                role: 'user',
                parts: [{ type: 'text', text: question }],
                id: msgId
            }],
            message: {
                role: 'user',
                parts: [{ type: 'text', text: question }],
                id: msgId
            },
            isNewChat: true
        }, {
            headers: {
                origin: 'https://chat.morphic.sh',
                referer: 'https://chat.morphic.sh/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        let result = { text: '', sources: [], images: [] };
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data:') && !line.includes('[DONE]')) {
                const d = JSON.parse(line.substring(6));
                if (d.type === 'text-delta') result.text += d.delta ?? '';
                if (d.type === 'tool-output-available' && d.output?.state === 'complete') {
                    if (d.output.results) result.sources = d.output.results.map(r => ({ title: r.title, url: r.url, content: r.content }));
                    if (d.output.images) result.images = d.output.images.map(i => ({ url: i.url, description: i.description, title: i.title }));
                }
            }
        }
        
        result.text = result.text.replace(/```spec[\s\S]*?```/g, '').trim();
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
morphic('hi! find me the latest news in Indonesia').then(console.log);
