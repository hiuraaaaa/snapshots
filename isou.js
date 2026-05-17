const axios = require('axios');

async function isou(question, { engine = 'SEARXNG', deep_research = false } = {}) {
    try {
        if (!question) throw new Error('Question is required.');
        if (!['SEARXNG', 'ZHIPU', 'SOGOU'].includes(engine)) throw new Error('Available engines: SEARXNG, ZHIPU, SOGOU.');
        if (typeof deep_research !== 'boolean') throw new Error('Deep research must be a boolean.');
        
        const { data } = await axios.post('https://isou.chat/api/chat', {
            messages: [{
                role: 'user',
                content: question
            }],
            model: 'gpt-5.4-mini',
            provider: 'openai',
            engine: engine,
            language: 'en',
            categories: ['general'],
            systemPrompt: 'You are a helpful assistant that helps the user to search the web effectively.',
            temperature: 0.6,
            enabledDeepResearch: deep_research
        }, {
            headers: {
                origin: 'https://isou.chat',
                referer: 'https://isou.chat/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        let result = { text: '', search: [] };
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data:') && !line.includes('[DONE]')) {
                const d = JSON.parse(line.substring(5));
                if (d?.data?.content) result.text += d?.data?.content;
                if (d?.data?.contexts) result.search = d?.data?.contexts;
            }
        }
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
isou('hi! find me the latest news in Indonesia').then(console.log);
