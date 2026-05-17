/**
 * ─────────────────────────────────────────────
 *  @project    mathgpt
 *  @desc       Solve math questions with image support using MathGPT AI.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const crypto = require('crypto');
const { fromBuffer } = require('file-type');

async function mathgpt({ question, think = false, image = null } = {}) {
    try {
        if (!question) throw new Error('Question is required.');
        
        const ip = [10, crypto.randomInt(256), crypto.randomInt(256), crypto.randomInt(256)].join('.');
        const inst = axios.create({
            baseURL: 'https://math-gpt.ai/api',
            headers: {
                'accept': 'application/json',
                'accept-language': 'id-ID',
                'content-type': 'application/json',
                'origin': 'https://math-gpt.ai',
                'priority': 'u=1, i',
                'referer': 'https://math-gpt.ai/',
                'sec-ch-ua': '"Chromium";v="127", "Not)A;Brand";v="99"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
                'x-forwarded-for': ip,
                'x-originating-ip': ip,
                'x-remote-ip': ip,
                'x-remote-addr': ip,
                'x-forwarded-host': ip,
                'x-connecting-ip': ip,
                'client-ip': ip,
                'x-client-ip': ip,
                'x-real-ip': ip,
                'x-forwarded-for-original': ip,
                'x-forwarded': ip,
                'x-cluster-client-ip': ip,
                'x-original-forwarded-for': ip
            }
        });
        
        let fileDetails = null;
        
        if (image) {
            try {
                const { mime, ext } = await fromBuffer(image);
                
                if (mime?.startsWith('image/')) {
                    const filePath = `chat/${crypto.randomBytes(32).toString('hex')}.${ext}`;
                    
                    const { data: up } = await inst.post('/trpc/uploads.signedUploadUrl?batch=1', {
                        0: {
                            json: {
                                path: filePath, bucket: 'mathgpt'
                            }
                        }
                    });
                    
                    await axios.put(up[0].result.data.json, image, {
                        headers: {
                            'content-type': mime
                        }
                    });
                    
                    fileDetails = {
                        fileUrl: `https://files.math-gpt.ai/${filePath}`,
                        mimeType: mime,
                        fileName: `image-${Date.now()}.${ext}`
                    };
                }
            } catch {}
        }
        
        const { data } = await inst.post('/ai/generateAnswerStream', {
            messages: [{
                id: Date.now(),
                text: question,
                sender: 'user',
                ...(fileDetails || {})
            }],
            type: 'MathAI',
            isJustAnswerEnabled: false,
            isThinkingEnabled: think,
            visitorId: crypto.randomUUID().replace(/-/g, '')
        });
        
        const result = data.split('\n\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.substring(6))).find(line => line.type === 'end');
        if (!result) throw new Error('No result found.');
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
mathgpt({ question: '1+1=?' }).then(console.log);
