/**
 * ─────────────────────────────────────────────
 *  @project    DegreeGuru
 *  @desc       AI assistant for degree & education queries
 *  @author     Hhh
 *  @repo       github.com/Hhh/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');

async function degreeGuru(message) {
    try {
        if (!message) throw new Error('Message is required.');

        const { data } = await axios.post(
            'https://degreeguru.vercel.app/api/guru',
            { messages: [{ role: 'user', content: message }] },
            {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'origin': 'https://degreeguru.vercel.app',
                    'referer': 'https://degreeguru.vercel.app/',
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
degreeGuru('What is computer science?').then(console.log);

module.exports = degreeGuru;
