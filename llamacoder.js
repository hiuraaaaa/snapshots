/**
 * ─────────────────────────────────────────────
 *  @project    LlamaCoder
 *  @desc       AI code generator by Together AI
 *  @models     zai-org/GLM-5
 *              zai-org/GLM-5.1
 *              MiniMaxAI/MiniMax-M2.7
 *              Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8
 *              Qwen/Qwen3-Coder-Next-FP8
 *  @author     Hhh
 *  @repo       github.com/Hhh/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const MODELS = [
    'zai-org/GLM-5',
    'zai-org/GLM-5.1',
    'MiniMaxAI/MiniMax-M2.7',
    'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8',
    'Qwen/Qwen3-Coder-Next-FP8'
];

const HEADERS = {
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'origin': 'https://llamacoder.together.ai',
    'referer': 'https://llamacoder.together.ai/',
    'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 14; Infinix X6833B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
};

async function uploadImage(imagePath) {
    const filename = path.basename(imagePath);
    const filetype = 'image/jpeg';

    const { data } = await axios.post(
        'https://llamacoder.together.ai/api/s3-upload',
        { filename, filetype, _nextS3: { strategy: 'aws-sdk' } },
        { headers: { ...HEADERS, 'content-type': 'application/json' } }
    );

    const { AccessKeyId, SecretAccessKey, SessionToken } = data.token.Credentials;
    const { key, bucket, region } = data;

    const s3 = new S3Client({
        region,
        credentials: { accessKeyId: AccessKeyId, secretAccessKey: SecretAccessKey, sessionToken: SessionToken }
    });

    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(imagePath),
        ContentType: filetype
    }));

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function llamacoder(prompt, {
    model = 'zai-org/GLM-5',
    streamModel = null,
    quality = 'low',
    imagePath = null
} = {}) {
    try {
        if (!prompt) throw new Error('Prompt is required.');
        if (!MODELS.includes(model)) throw new Error(`Invalid model. Available: ${MODELS.join(', ')}`);
        if (streamModel && !MODELS.includes(streamModel)) throw new Error(`Invalid streamModel. Available: ${MODELS.join(', ')}`);

        let imageUrl = null;
        if (imagePath) imageUrl = await uploadImage(imagePath);

        const chatBody = { prompt, model, quality };
        if (imageUrl) chatBody.imageUrl = imageUrl;

        const { data: chat } = await axios.post(
            'https://llamacoder.together.ai/api/create-chat',
            chatBody,
            { headers: { ...HEADERS, 'content-type': 'application/json' } }
        );

        const messageId = chat.lastMessageId;
        if (!messageId) throw new Error('Failed to get messageId.');

        const { data: stream } = await axios.post(
            'https://llamacoder.together.ai/api/get-next-completion-stream-promise',
            { messageId, model: streamModel || model },
            { headers: { ...HEADERS, 'content-type': 'text/plain;charset=UTF-8' } }
        );

        const text = stream
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    const json = JSON.parse(line);
                    return json.choices?.[0]?.delta?.content || '';
                } catch { return ''; }
            })
            .join('');

        return { chatId: chat.chatId, messageId, text };

    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
llamacoder('Buat button React yang cantik', {
    model: 'Qwen/Qwen3-Coder-Next-FP8'
}).then(r => console.log(r.text));

// Export buat dipake di project lain:
module.exports = { llamacoder, MODELS };
