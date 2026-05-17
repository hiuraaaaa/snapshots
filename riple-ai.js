/**
 * ─────────────────────────────────────────────
 *  @project    riple
 *  @desc       Riple AI, real-time AI for answering questions.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');

async function ripleai(question) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const { data } = await axios.post('https://ai.riple.org/', {
            messages: [{
                role: 'user',
                content: question
            }]
        }, {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const result = data.split('\n\n').filter(line => line && !line.includes('[DONE]')).map(line => JSON.parse(line.substring(6))).map(line => line.choices[0]?.delta?.content).join('');
        if (!result) throw new Error('No result found.');
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage
ripleai('hi!').then(console.log);
