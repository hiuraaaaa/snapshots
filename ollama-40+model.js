cat > ollama-master-v2.js << 'EOF'
/**
 * ─────────────────────────────────────────────
 *  @project    Ollama Master v2
 *  @desc       Multi-instance Ollama pool with auto fallback
 *              & model routing — sourced via Shodan hunting
 *  @models     70B+ models, uncensored, coders, vision, etc
 *  @author     Hhh
 *  @repo       github.com/Hhh/snapshots
 * ─────────────────────────────────────────────
 */

const axios = require('axios');

const POOL = {
    general: [
        '45.136.197.139', '38.180.104.127', '51.161.131.235',
        '168.235.81.149', '38.180.22.86',   '176.107.181.163',
        '66.240.205.176', '81.4.125.240',   '107.161.25.224',
        '43.198.22.151',  '47.128.155.71',  '117.121.214.52',
        '15.223.1.30',    '3.98.108.205',   '54.188.149.86',
        '51.16.9.115'
    ],
    deepseek70b: [
        '172.105.226.85', '139.162.131.147'
    ],
    llama70b: [
        '64.23.201.44'
    ],
    qwen: [
        '52.255.216.43'
    ],
    india: [
        '103.82.209.175'
    ],
    uncensored: [
        '172.233.44.98'
    ],
    mistral: [
        '172.193.168.107'
    ],
    llama_jp: [
        '49.212.157.177'
    ],
    codellama: [
        '18.184.4.189', '16.51.151.86',
        '43.218.124.29', '51.16.9.115'
    ]
};

const MODELS = {
    // 70B+
    'deepseek-r1:70b':                        POOL.deepseek70b,
    'llama3.1:70b':                           POOL.llama70b,
    'mixtral:latest':                         POOL.llama70b,
    'deepseek-coder-v2:latest':               POOL.llama70b,
    'qwen2.5:72b':                            [...POOL.general, ...POOL.llama70b],

    // India pool (unique models)
    'bjoernb/claude-opus-4-5:latest':         POOL.india,
    'qwen3-coder:30b':                        POOL.india,
    'gemma3:27b':                             POOL.india,
    'gemma3:4b':                              POOL.india,
    'qwen3:4b':                               POOL.india,
    'deepseek-coder:latest':                  POOL.india,
    'stable-code:3b-code-q4_0':              POOL.india,

    // Qwen pool
    'qwen3:14b':                              POOL.qwen,
    'qwen3-vl:4b':                            POOL.qwen,
    'glm-4.7-flash:latest':                   POOL.qwen,
    'glm4:latest':                            POOL.qwen,
    'llama3.2:3b':                            POOL.qwen,
    'qwen3.6:35b':                            POOL.qwen,

    // Uncensored
    'dolphin-llama3:8b-uncensored':           POOL.uncensored,
    'wizard-vicuna-uncensored:30b':           POOL.uncensored,
    'starcoder2-internal:15b':                POOL.uncensored,

    // Mistral
    'mistral-small:24b-instruct-2501-q4_K_M': POOL.mistral,
    'mistral:latest':                         [...POOL.india, ...POOL.llama70b],

    // Llama
    'llama3.1:8b':                            POOL.llama_jp,
    'llama3.1:8b-instruct-q8_0':             POOL.deepseek70b,
    'llama3.1:latest':                        POOL.llama70b,
    'llama3:latest':                          POOL.general,
    'llama2:latest':                          POOL.general,

    // Code
    'codellama:13b':                          POOL.codellama,
    'codellama:latest':                       POOL.llama70b,

    // General
    'deepseek-r1:14b':                        POOL.general,
    'deepseek-r1:latest':                     POOL.general,
    'gemma3:8.2b':                            POOL.general,
    'gemma2:latest':                          POOL.llama70b,
    'openchat:7b':                            [...POOL.codellama, ...POOL.general],
    'phi3:latest':                            POOL.general,
    'qwen2.5:3b':                             POOL.general,
    'qwen2.5:1.5b':                           POOL.general,
    'qwen2.5:latest':                         POOL.general,
    'qwen2:latest':                           POOL.llama70b,
    'nomic-embed-text:latest':                POOL.llama70b,
};

async function ollama(prompt, { model = 'deepseek-r1:14b', system = null } = {}) {
    try {
        if (!prompt) throw new Error('Prompt is required.');
        if (!MODELS[model]) throw new Error(`Invalid model. Available:\n${Object.keys(MODELS).join('\n')}`);

        const instances = MODELS[model];
        const messages = [];
        if (system) messages.push({ role: 'system', content: system });
        messages.push({ role: 'user', content: prompt });

        for (const ip of instances) {
            try {
                const { data } = await axios.post(
                    `http://${ip}:11434/api/chat`,
                    { model, messages, stream: false },
                    { responseType: 'text', timeout: 120000 }
                );

                const lines = data.trim().split('\n').map(l => JSON.parse(l));
                const text = lines.map(l => l.message?.content || '').join('');
                if (!text) continue;

                return { text, model, instance: ip };

            } catch {
                console.warn(`[ollama] ${ip} failed, trying next...`);
                continue;
            }
        }

        throw new Error('All instances failed.');

    } catch (error) {
        throw new Error(error.message);
    }
}

function listModels() {
    return Object.keys(MODELS);
}

// Usage:
ollama('Halo, siapa kamu?').then(console.log);

// Usage model spesifik:
// ollama('Write fibonacci in python', { model: 'codellama:13b' }).then(console.log);
// ollama('Explain black holes', { model: 'deepseek-r1:70b' }).then(console.log);
// ollama('hi', { model: 'bjoernb/claude-opus-4-5:latest' }).then(console.log);

module.exports = { ollama, listModels, POOL, MODELS };
EOF
node ollama-master-v2.js
