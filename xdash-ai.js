const axios = require('axios');
const crypto = require('crypto');

async function xdash(question) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const inst = axios.create({
            baseURL: 'https://xdash.ai',
            headers: {
                origin: 'https://xdash.ai',
                referer: 'https://xdash.ai/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        const { headers } = await inst.get('/');
        inst.defaults.headers.common['cookie'] = headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        
        const { data: a } = await inst.post('/api/trpc/chat.startStream?batch=1', {
            '0': {
                messages: [{
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: question
                }],
                conversationId: crypto.randomUUID(),
                chatMode: 'simple'
            }
        });
        
        if (!a?.[0]?.result?.data?.streamId) throw new Error('Failed to get streamId.');
        
        const { data } = await inst.get('https://xdash.ai/api/trpc/chat.stream', {
            params: {
                input: JSON.stringify({
                    streamId: a[0].result.data.streamId
                })
            }
        });
        
        let result = { text: '', sources: [] };
        const outerLines = data.split('\n');
        
        for (const outer of outerLines) {
            if (outer.startsWith('data: {')) {
                const { chunk } = JSON.parse(outer.slice(6).trim());
                if (!chunk) continue;
                
                const innerLines = chunk.split('\n');
                for (const inner of innerLines) {
                    if (inner.startsWith('data:') && !inner.includes('[DONE]')) {
                        const d = JSON.parse(inner.slice(6).trim());
                        
                        if (d?.choices?.[0]?.delta?.content) result.text += d.choices[0].delta.content;
                        if (d?.chatui_tool_event?.status === 'completed') {
                            const { name, response } = d.chatui_tool_event;
                            if (name === 'web_search' && response?.results) result.sources = response.results;
                        }
                    }
                }
            }
        }
        
        result.text = result.text.replace(/<\|tool_call>[\s\S]*?<tool_call\|>/g, '').trim();
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Using:
xdash('hi! find me the latest news in Indonesia').then(console.log);
