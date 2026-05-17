 /**
 * ─────────────────────────────────────────────
 *  @project    gemini-proxy
 *  @desc       A Gemini AI API proxy (only supports flash models).
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const { fromBuffer } = require('file-type');

async function geminiproxy({ input, model = 'gemini-2.0-flash', fileBuffer, systemInstruction } = {}) {
    try {
        if (!input) throw new Error('Input is required.');
        
        const parts = [{ text: input }];
        
        if (fileBuffer) {
            const fileType = await fromBuffer(fileBuffer);
            if (!fileType) throw new Error('Unable to determine the file type.');
            
            parts.unshift({
                inlineData: {
                    mimeType: fileType.mime,
                    data: fileBuffer.toString('base64')
                }
            });
        }
        
        const contents = [];
        
        if (systemInstruction) {
            contents.push({
                role: 'system',
                parts: [{ text: systemInstruction }]
            });
        }
        
        contents.push({ role: 'user', parts });
        
        const { data } = await axios.post('https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1', {
            model: model,
            contents: contents
        }, {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
            }
        });
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
geminiproxy({
    input: 'hi! how are you?',
    model: 'gemini-3-flash-preview'
}).then(console.log);
