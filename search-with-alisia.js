/**
 * ─────────────────────────────────────────────
 *  @project    Alisia
 *  @desc       Search with Alisia, real-time AI search with news sources support.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const crypto = require('crypto');

async function alisia(question) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const { data } = await axios.post('https://search-with-alisia-1.onrender.com/searchnew', {
            query: question,
            session_id: crypto.randomUUID(),
            search_type_resources: []
        }, {
            headers: {
                origin: 'https://searchwithalisia.netlify.app',
                referer: 'https://searchwithalisia.netlify.app/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        if (!data?.data?.refined_results) throw new Error('No result found.');
        return {
            text: data.data.refined_results,
            sources: data?.resources?.News || []
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
alisia('hi! find me the latest news in Indonesia').then(console.log);
