/**
 * ─────────────────────────────────────────────
 *  @project    unlimited ai
 *  @desc       Ask questions and get answers using UnlimitedAI.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const crypto = require('crypto');

async function unlimitedai(question) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const { data } = await axios.post('https://app.unlimitedai.chat/api/chat', {
            chatId: crypto.randomUUID(),
            messages: [{
                id: crypto.randomUUID(),
                role: 'user',
                content: question,
                parts: [{
                    type: 'text',
                    text: question
                }],
                createdAt: new Date().toISOString()
            }],
            selectedChatModel: 'chat-model-reasoning',
            selectedCharacter: null,
            selectedStory: null,
            deviceId: crypto.randomUUID(),
            locale: 'id'
        }, {
            headers: {
                origin: 'https://app.unlimitedai.chat',
                referer: 'https://app.unlimitedai.chat/id',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
                'x-next-intl-locale': 'id'
            }
        });
        
        const result = data.split('\n').filter(line => line.startsWith('{"')).map(line => JSON.parse(line)).map(line => line?.delta).join('');
        if (!result) throw new Error('No result found.');
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Usage:
unlimitedai('hi! who are you?').then(console.log);
