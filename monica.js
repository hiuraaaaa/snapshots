 /**
 * ─────────────────────────────────────────────
 *  @project    monica
 *  @desc       Monica, real-time AI search with web page sources support.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const crypto = require('crypto');

async function monica(question) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const { data } = await axios.post('https://monica.so/api/search_v1/search', {
            pro: false,
            query: question,
            round: 1,
            session_id: '',
            language: 'auto',
            task_id: crypto.randomUUID()
        }, {
            headers: {
                origin: 'https://monica.so',
                referer: 'https://monica.so/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        let result = { text: '', sources: [] };
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data: {')) {
                const d = JSON.parse(line.substring(6));
                if (d?.text) result.text += d.text;
                if (d?.search_result?.search_web_page_result_list) result.sources = d.search_result.search_web_page_result_list
            }
        }
        
        result.text = result.text.trim();
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
monica('what is llm?').then(console.log);
