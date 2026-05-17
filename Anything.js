/**
 * ─────────────────────────────────────────────
 *  @project    Teach Anything
 *  @desc       AI-powered explanation for any topic
 *  @author     Hhh
 *  @repo       github.com/Hhh/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');

async function teachAnything(content) {
    try {
        if (!content) throw new Error('Content is required.');

        const { data } = await axios.post(
            'https://www.teach-anything.com/api/generate',
            { prompt: content },
            {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'origin': 'https://www.teach-anything.com',
                    'referer': 'https://www.teach-anything.com/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 14; Infinix X6833B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
                },
                timeout: 30000
            }
        );

        return { text: data };

    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
teachAnything('Explain how photosynthesis works.').then(console.log);

module.exports = teachAnything;
