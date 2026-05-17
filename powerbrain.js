/**
 * ─────────────────────────────────────────────
 *  @project    PowerBrain AI
 *  @desc       Free AI chat with no auth required
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');

async function powerbrainai(message, { messageCount = 1 } = {}) {
    try {
        if (!message) throw new Error('Message is required.');

        const { data } = await axios.post('https://powerbrainai.com/chat.php',
            new URLSearchParams({ message, messageCount }).toString(),
            {
                headers: {
                    'authority': 'powerbrainai.com',
                    'accept': '*/*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://powerbrainai.com',
                    'referer': 'https://powerbrainai.com/chat.html',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 14; Infinix X6833B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
                }
            }
        );

        return { text: data };
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
powerbrainai('Haloo woi').then(console.log);
