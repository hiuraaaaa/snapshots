/**
 * ─────────────────────────────────────────────
 *  @project    chrunos
 *  @desc       Chrunos AI chat with real SSE streaming support.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');

/**
 * @param {string} message
 * @param {Object} [options]
 * @param {string} [options.systemPrompt]
 * @param {boolean} [options.useSearch]
 * @param {number} [options.temperature]
 * @param {Array<{role: string, content: string}>} [options.history]
 * @param {function(string): void} [options.onChunk] - callback tiap chunk datang
 * @returns {Promise<{ text: string, searchUsed: boolean }>}
 */
async function chrunos(message, options = {}) {
    if (!message) throw new Error('Message is required.');

    const {
        systemPrompt = 'You are a helpful assistant.',
        useSearch = false,
        temperature = 0.6,
        history = [],
        onChunk = null
    } = options;

    const response = await axios.post('https://tecuts-chat.hf.space/chat/stream', {
        message,
        system_prompt: systemPrompt,
        use_search: useSearch,
        temperature,
        history: [...history, { role: 'user', content: message }]
    }, {
        responseType: 'stream',
        headers: {
            'authority': 'tecuts-chat.hf.space',
            'accept': 'text/event-stream',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'content-type': 'application/json',
            'origin': 'https://chrunos.com',
            'referer': 'https://chrunos.com/',
            'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Linux; Android 14; Infinix X6833B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
        }
    });

    return new Promise((resolve, reject) => {
        let result = { text: '', searchUsed: false };
        let buffer = '';

        response.data.on('data', (chunk) => {
            buffer += chunk.toString();

            // SSE events dipisah \n\n, tapi chunk bisa kepotong di tengah
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // sisa yang belum lengkap, tunggu chunk berikutnya

            for (const line of lines) {
                if (!line.startsWith('data: {')) continue;
                try {
                    const d = JSON.parse(line.substring(6));

                    if (d?.type === 'content' && d?.data) {
                        // Strip <think>...</think>
                        const text = d.data.replace(/<think>[\s\S]*?<\/think>\n?/g, '');
                        result.text += text;
                        if (onChunk && text) onChunk(text);
                    }

                    if (d?.type === 'done') {
                        result.searchUsed = d?.data?.search_used ?? false;
                    }
                } catch (_) {
                    // skip malformed chunk
                }
            }
        });

        response.data.on('end', () => {
            result.text = result.text.trim();
            resolve(result);
        });

        response.data.on('error', reject);
    });
}

// Usage — stream langsung ke console:
chrunos('Lagi apa', {
    useSearch: true,
    onChunk: (text) => process.stdout.write(text)
}).then(result => {
    console.log('\n\n---');
    console.log('Search used:', result.searchUsed);
});
