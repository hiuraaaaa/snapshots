/**
 * ─────────────────────────────────────────────
 *  @project    llamacoder
 *  @desc       LlamaCoder AI code generator with auto zip output.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOST = 'llamacoder.together.ai';

function post(pathname, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = https.request({
            hostname: HOST,
            path: pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let raw = '';
            res.on('data', (c) => raw += c);
            res.on('end', () => resolve(JSON.parse(raw)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function streamCompletion(pathname, data, onChunk = null) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        let full = '';
        const req = https.request({
            hostname: HOST,
            path: pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            res.on('data', (chunk) => {
                chunk.toString().split('\n').filter(Boolean).forEach((line) => {
                    try {
                        const j = JSON.parse(line);
                        const text = j.choices?.[0]?.delta?.content;
                        if (text) {
                            full += text;
                            if (onChunk) onChunk(text);
                        }
                    } catch (_) {}
                });
            });
            res.on('end', () => resolve(full));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function parseFiles(output) {
    const files = [];
    const regex = /```(?:tsx|ts|js|jsx|css|json|html)\{path=([^}]+)\}\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(output)) !== null) {
        files.push({ path: match[1], content: match[2] });
    }
    return files;
}

function writeFiles(files, outDir) {
    for (const file of files) {
        const full = path.join(outDir, file.path);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, file.content);
    }
}

/**
 * @param {string} prompt
 * @param {Object} [options]
 * @param {string} [options.model]
 * @param {string} [options.quality]
 * @param {string} [options.outDir]
 * @param {boolean} [options.zip]
 * @param {function(string): void} [options.onChunk]
 * @returns {Promise<{ files: Array, zipPath: string|null, output: string }>}
 */
async function llamacoder(prompt, options = {}) {
    if (!prompt) throw new Error('Prompt is required.');

    const {
        model = 'zai-org/GLM-5',
        quality = 'low',
        outDir = path.join(process.cwd(), `output-${prompt.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`),
        zip = true,
        onChunk = null
    } = options;

    // Step 1: Buat chat
    const { chatId, lastMessageId } = await post('/api/create-chat', { prompt, model, quality });

    // Step 2: Stream completion
    const output = await streamCompletion(
        '/api/get-next-completion-stream-promise',
        { messageId: lastMessageId, model },
        onChunk
    );

    // Step 3: Parse files dari output
    const files = parseFiles(output);
    if (files.length === 0) return { files: [], zipPath: null, output };

    // Step 4: Tulis files
    fs.mkdirSync(outDir, { recursive: true });
    writeFiles(files, outDir);

    // Step 5: Zip kalau diminta
    let zipPath = null;
    if (zip) {
        zipPath = `${outDir}.zip`;
        execSync(`zip -r "${zipPath}" "${path.basename(outDir)}"`, { cwd: process.cwd() });
        fs.rmSync(outDir, { recursive: true, force: true });
    }

    return { files, zipPath, output };
}

// Usage:
const prompt = process.argv.slice(2).join(' ') || 'landing page';

process.stdout.write(`\x1b[36m⟳ Prompt: ${prompt}\x1b[0m\n\n`);

llamacoder(prompt, {
    onChunk: (text) => process.stdout.write(text)
}).then(({ files, zipPath }) => {
    if (files.length === 0) {
        process.stdout.write('\x1b[31m✗ No files parsed\x1b[0m\n');
        return;
    }
    process.stdout.write(`\n\n\x1b[32m✓ Done → ${zipPath}\x1b[0m\n`);
    files.forEach((f) => process.stdout.write(`  \x1b[90m${f.path}\x1b[0m\n`));
}).catch((e) => {
    process.stderr.write('\x1b[31m✗ ' + e.message + '\x1b[0m\n');
    process.exit(1);
});
