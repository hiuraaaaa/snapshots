/**
 * ─────────────────────────────────────────────
 *  @project    upstage
 *  @desc       Ask questions using Upstage Solar AI with web search and reasoning mode support.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const crypto = require('crypto');

async function upstageai(question, { reasoning = false, web_search = true } = {}) {
    try {
        if (!question) throw new Error('Question is required.');
        if (typeof reasoning !== 'boolean') throw new Error('Reasoning must be a boolean.');
        if (typeof web_search !== 'boolean') throw new Error('Reasoning must be a boolean.');
        
        const { data: t } = await axios.post('https://console.upstage.ai/playground/chat', [], {
            headers: {
                'next-action': '1ff2578641a7f2874dd589a45ffc0bab2cbb63be',
                'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(frame)%22%2C%7B%22children%22%3A%5B%22playground%22%2C%7B%22children%22%3A%5B%22(llm)%22%2C%7B%22children%22%3A%5B%22chat%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
                referer: 'https://console.upstage.ai/playground/chat',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });
        
        const token = JSON.parse(t.split('\n').filter(l => l.trim().startsWith('1:'))[0].split('1:')[1]).token;
        if (!token) throw new Error('Failed to get token.');
        
        const { data } = await axios.post('https://ap-northeast-2.apistage.ai/v1/web/demo/chat/completions', {
            conversation_id: crypto.randomUUID(),
            stream: false,
            log_enabled: false,
            messages: [{
                role: 'user',
                content: question,
                ...(web_search && { mode: ['search'] })
            }],
            model: 'solar-pro3',
            reasoning_effort: reasoning ? 'high' : 'low'
        }, {
            headers: {
                'x-csrf-token': token
            },
            ...(reasoning && {
                params: {
                    include_think: true
                }
            })
        });
        
        let result = { think: '', text: '', search: [] };
        let fullText = '';
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data:') && !line.includes('[DONE]')) {
                const d = JSON.parse(line.substring(6));
                if (d?.choices) fullText += d?.choices?.[0]?.delta?.content;
                if (d.search?.status?.action === 'search_finish') result.search = d.search.search_queries[0].results;
            }
        }
        
        const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
        result.think = thinkMatch ? thinkMatch[1].trim() : '';
        result.text = fullText.replace(/[\s\S]*?<\/think>/, '').trim();
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
upstageai('hi! find me the latest news in Indonesia').then(console.log);
