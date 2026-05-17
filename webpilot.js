const axios = require('axios');

async function webpilot(query) {
    try {
        if (!query) throw new Error('Query is required.');
        
        const { data } = await axios.post('https://api.webpilotai.com/rupee/v1/search', {
            q: query,
            threadId: ''
        }, {
            headers: {
                authority: 'api.webpilotai.com',
                accept: 'application/json, text/plain, */*, text/event-stream',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                authorization: 'Bearer null',
                'cache-control': 'no-cache',
                'content-type': 'application/json;charset=UTF-8',
                origin: 'https://www.webpilot.ai',
                pragma: 'no-cache',
                referer: 'https://www.webpilot.ai/',
                'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
            }
        });
        
        let content = '';
        const sources = [];
        
        data.split('\n').forEach(line => {
            if (line.startsWith('data:')) {
                try {
                    const json = JSON.parse(line.slice(5));
                    if (json.type === 'data' && json.data?.section_id === void 0 && json.data?.content) content += json.data.content;
                    if (json.action === 'using_internet' && json.data) sources.push(json.data);
                } catch {}
            }
        });
        
        return {
            content: content,
            sources: sources
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
webpilot('Latest news in Indonesia').then(console.log);
