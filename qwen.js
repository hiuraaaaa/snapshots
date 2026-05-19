/***
  @ Base: https://play.google.com/store/apps/details?id=ai.qwenlm.chat.android
  @ Author: Shannz
  @ Note: Wrapper from apk qwen ai.
***/

import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CONFIG = {
    BASE_URL: "https://chat.qwen.ai/api/v2",
    HEADERS: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 15; 25028RN03A Build/AP3A.240905.015.A2) AliApp(QWENCHAT/1.16.1) AppType/Release AplusBridgeLite',
        'Connection': 'Keep-Alive',
        'Accept': 'application/json',
        'X-Platform': 'android',
        'source': 'app',
        'Accept-Language': 'en-US',
        'Accept-Charset': 'UTF-8'
    }
};

const utils = {
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    generateUUID: () => crypto.randomUUID(),

    hashPassword: (password) => {
        return crypto.createHash('sha256').update(password).digest('hex');
    },

    getFileType: (filename) => {
        const ext = path.extname(filename).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
        if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return 'video';
        return 'file'; 
    },
    
    getMimeType: (filetype, filename) => {
        const ext = path.extname(filename).toLowerCase();
        if (filetype === 'image') return 'image/jpeg';
        if (filetype === 'video') return 'video/mp4';
        return 'application/octet-stream';
    },

    parseSSE: (chunk) => {
        const lines = chunk.toString().split('\n');
        const events = [];
        let currentEvent = { event: 'message', data: '' };

        for (const line of lines) {
            if (line.startsWith('event:')) {
                if (currentEvent.data) events.push({ ...currentEvent });
                currentEvent = { event: line.substring(6).trim(), data: '' };
            } else if (line.startsWith('data:')) {
                currentEvent.data += line.substring(5).trim();
            } else if (line === '' && currentEvent.data) {
                events.push({ ...currentEvent });
                currentEvent = { event: 'message', data: '' };
            }
        }
        if (currentEvent.data) events.push(currentEvent);
        return events;
    },

    getAuthHeaders: (token) => ({
        ...CONFIG.HEADERS,
        'Authorization': `Bearer ${token}`,
        'x-request-id': utils.generateUUID()
    })
};

export const qwen = {
    login: async (email, password) => {
        try {
            const hashedPassword = utils.hashPassword(password);
            
            const response = await axios.post(`${CONFIG.BASE_URL}/auths/signin`, {
                email: email,
                password: hashedPassword
            }, { 
                headers: { 
                    ...CONFIG.HEADERS, 
                    'x-request-id': utils.generateUUID() 
                } 
            });

            if (!response.data.success) throw new Error("Login failed");
            
            return {
                token: response.data.data.token,
                user: response.data.data
            };
        } catch (error) {
            console.error(`Login error: ${error.message}`);
            return null;
        }
    },

    createSession: async (token) => {
        try {
            const response = await axios.post(`${CONFIG.BASE_URL}/chats/new`, {
                chat_mode: "normal",
                project_id: ""
            }, {
                headers: utils.getAuthHeaders(token)
            });
            
            if (!response.data.success) throw new Error('Failed to create session');
            return response.data.data.id;
        } catch (error) {
            console.error(`Create session error: ${error.message}`);
            return null;
        }
    },
    
    getListSession: async (token, page = 1) => {
        try {
            const response = await axios.get(`${CONFIG.BASE_URL}/chats/list?exclude_project=true&page=${page}`, {
                headers: utils.getAuthHeaders(token)
            });
            
            if (!response.data.success) throw new Error('Failed to get session list');
            return response.data.data;
        } catch (error) {
            console.error(`Get list session error: ${error.message}`);
            return null;
        }
    },

    getHistory: async (token, chatId) => {
        try {
            const response = await axios.get(`${CONFIG.BASE_URL}/chats/${chatId}`, {
                headers: utils.getAuthHeaders(token)
            });
            
            if (!response.data.success) throw new Error('Failed to get history');
            return response.data.data;
        } catch (error) {
            console.error(`Get history error: ${error.message}`);
            return null;
        }
    },
    
    deleteSession: async (token, chatId) => {
        try {
            const response = await axios.delete(`${CONFIG.BASE_URL}/chats/${chatId}`, {
                headers: utils.getAuthHeaders(token)
            });
            
            if (!response.data.success) throw new Error('Failed to delete session');
            return response.data.data.status;
        } catch (error) {
            console.error(`Delete session error: ${error.message}`);
            return false;
        }
    },

    upload: async (token, filePath) => {
        try {
            if (!fs.existsSync(filePath)) throw new Error('File not found');
            const stats = fs.statSync(filePath);
            const filename = path.basename(filePath);
            const filetype = utils.getFileType(filename);
            const mimeType = utils.getMimeType(filetype, filename);
            const fileBuffer = fs.readFileSync(filePath);

            process.stdout.write(`\x1b[36m[Uploading ${filetype}...] \x1b[0m`);

            const stsRes = await axios.post(`${CONFIG.BASE_URL}/files/getstsToken`, {
                filename: filename, filetype: filetype, filesize: stats.size.toString()
            }, { headers: utils.getAuthHeaders(token) });

            if (!stsRes.data.success) throw new Error('Failed to get STS Token');
            const stsData = stsRes.data.data;
            const fileId = stsData.file_id;
            const dateStr = new Date().toUTCString();
            const stringToSign = `PUT\n\n${mimeType}\n${dateStr}\nx-oss-security-token:${stsData.security_token}\n/${stsData.bucketname}/${stsData.file_path}`;
            const signature = crypto.createHmac('sha1', stsData.access_key_secret).update(stringToSign).digest('base64');
            const putUrl = `https://${stsData.bucketname}.${stsData.region}.aliyuncs.com/${stsData.file_path}`;

            await axios.put(putUrl, fileBuffer, {
                headers: { 
                    'User-Agent': 'aliyun-sdk-android/2.9.21',
                    'Authorization': `OSS ${stsData.access_key_id}:${signature}`,
                    'x-oss-security-token': stsData.security_token,
                    'Date': dateStr,
                    'Content-Type': mimeType
                },
                maxBodyLength: Infinity
            });

            if (filetype === 'image' || filetype === 'video') {
                process.stdout.write('\x1b[32m DONE!\x1b[0m\n');
                return { id: fileId, type: filetype, name: filename, size: stats.size, url: stsData.file_url };
            }

            process.stdout.write('\x1b[33m[Parsing...]\x1b[0m ');
            const parseRes = await axios.post(`${CONFIG.BASE_URL}/files/parse`, { file_id: fileId }, { headers: utils.getAuthHeaders(token) });
            if (!parseRes.data.success) throw new Error('Parse init failed');

            let attempts = 0;
            while (attempts < 30) {
                await utils.sleep(3000);
                const statusRes = await axios.post(`${CONFIG.BASE_URL}/files/parse/status`, { file_id_list: [fileId] }, { headers: utils.getAuthHeaders(token) });

                if (statusRes.data.success && statusRes.data.data.length > 0) {
                    const statusData = statusRes.data.data[0];
                    if (statusData.status === 'success') {
                        process.stdout.write('\x1b[32m DONE!\x1b[0m\n');
                        return { id: fileId, type: filetype, name: filename, size: stats.size, url: stsData.file_url };
                    } else if (statusData.status === 'failed' || statusData.error_code) {
                         process.stdout.write('\x1b[31m FAILED!\x1b[0m\n');
                         return null;
                    }
                }
                process.stdout.write('.');
                attempts++;
            }

            process.stdout.write('\x1b[31m TIMEOUT!\x1b[0m\n');
            return null;

        } catch (error) {
            console.error(`\nUpload error: ${error.message}`);
            if(error.response && error.response.data) {
                console.error("Detail Error:", error.response.data.toString());
            }
            return null;
        }
    },
    
    MODELS: [
        "qwen3.5-flash", 
        "qwen3.5-397b-a17b", 
        "qwen3.5-122b-a10b", 
        "qwen3.5-27b", 
        "qwen3.5-35b-a3b", 
        "qwen3-max-2026-01-23", 
        "qwen-plus-2025-07-28", 
        "qwen3-coder-plus", 
        "qwen3-vl-plus", 
        "qwen3-omni-flash-2025-12-01", 
        "qwen-max-latest",
        "qwen3.5-plus" // Default model
    ],

    chat: async (token, chatId, prompt, options = {}) => {
        try {
            const useStream = options.stream !== false;
            const messageId = utils.generateUUID();
            const selectedModel = options.model || "qwen3.5-plus";
            
            let fileAttachment = [];
            if (options.file) {
                fileAttachment = [{
                    type: options.file.type,
                    file: {
                        data: {},
                        filename: options.file.name,
                        meta: {
                            name: options.file.name,
                            size: options.file.size,
                            content_type: options.file.type === 'image' ? '' : options.file.type 
                        }
                    },
                    url: options.file.url,
                    name: options.file.name,
                    file_type: options.file.type === 'image' ? undefined : options.file.name.split('.').pop()
                }];

                if (options.file.type === 'image') {
                    fileAttachment[0].image_width = 1000;
                    fileAttachment[0].image_height = 1000;
                }
            }

            const payload = {
                stream: true, 
                incremental_output: true,
                chat_id: chatId,
                chat_mode: "normal",
                model: selectedModel,
                messages: [
                    {
                        chat_type: "t2t",
                        content: prompt,
                        role: "user",
                        feature_config: {
                            output_schema: "phase",
                            thinking_enabled: options.thinkingEnabled !== false,
                            thinking_format: "summary",
                            auto_thinking: true,
                            auto_search: options.searchEnabled !== false
                        },
                        timestamp: Math.floor(Date.now() / 1000),
                        sub_chat_type: "t2t",
                        models: [selectedModel],
                        fid: messageId,
                        user_action: "chat",
                        extra: { meta: { subChatType: "t2t" } },
                        ...(fileAttachment.length > 0 && { files: fileAttachment })
                    }
                ],
                timestamp: Math.floor(Date.now() / 1000),
                share_id: "",
                origin_branch_message_id: ""
            };

            if (options.parentId) {
                payload.parent_id = options.parentId;
                payload.messages[0].parentId = options.parentId;
                payload.messages[0].parent_id = options.parentId;
            }

            const response = await axios.post(`${CONFIG.BASE_URL}/chat/completions?chat_id=${chatId}`, payload, {
                headers: {
                    ...utils.getAuthHeaders(token),
                    'Accept': '*/*,text/event-stream',
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                responseType: 'stream'
            });

            let fullText = '';
            let thoughtText = '';
            let searchResults = [];
            let buffer = '';
            
            let thinkingStarted = false;
            let searchingStarted = false;
            let printedThoughts = 0;
            let searchPrinted = false;

            const printToConsole = (type, content) => {
                if (!useStream) return;

                if (type === 'SEARCH_START') {
                    if (!searchingStarted) {
                        process.stdout.write('\x1b[36m\n[🔍 Searching Web / Analyzing...]\x1b[0m\n');
                        searchingStarted = true;
                    }
                } else if (type === 'SEARCH_RESULT') {
                    if (Array.isArray(content)) {
                         content.forEach((res, idx) => {
                             process.stdout.write(`\x1b[36m  > [${idx+1}] ${res.title}\x1b[0m\n`);
                         });
                    }
                } else if (type === 'THINK') {
                    if (!thinkingStarted) {
                        process.stdout.write('\x1b[33m\n[🧠 Thinking]\n\x1b[0m');
                        thinkingStarted = true;
                    }
                    process.stdout.write(`\x1b[33m- ${content}\x1b[0m\n`);
                } else if (type === 'RESPONSE') {
                    if (thinkingStarted || searchingStarted) {
                        process.stdout.write('\n\n\x1b[0m');
                        thinkingStarted = false;
                        searchingStarted = false;
                    }
                    process.stdout.write(content);
                }
            };

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n\n'); 
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const events = utils.parseSSE(line + '\n\n');
                        for (const event of events) {
                            if (!event.data || event.data === ':') continue;

                            try {
                                const parsed = JSON.parse(event.data);

                                if (!parsed.choices || parsed.choices.length === 0) continue;
                                const delta = parsed.choices[0].delta;
                                if (!delta) continue;

                                if (delta.phase === 'thinking_summary') {
                                    if (delta.extra && delta.extra.summary_thought && delta.extra.summary_thought.content) {
                                        const thoughts = delta.extra.summary_thought.content;
                                        for (let i = printedThoughts; i < thoughts.length; i++) {
                                            thoughtText += thoughts[i] + '\n';
                                            printToConsole('THINK', thoughts[i]);
                                        }
                                        printedThoughts = thoughts.length;
                                    }
                                }

                                if (delta.phase === 'image_search' || delta.phase === 'search') {
                                    printToConsole('SEARCH_START');
                                    
                                    if (delta.extra && delta.extra.search_result && !searchPrinted) {
                                        searchResults = delta.extra.search_result;
                                        printToConsole('SEARCH_RESULT', searchResults);
                                        searchPrinted = true;
                                    }
                                }

                                if (delta.phase === 'answer') {
                                    if (delta.content) {
                                        fullText += delta.content;
                                        printToConsole('RESPONSE', delta.content);
                                    }
                                }

                            } catch (e) { }
                        }
                    }
                });

                response.data.on('end', () => {
                    if (useStream) process.stdout.write('\n'); 

                    if (useStream) {
                        resolve(fullText || 'No response');
                    } else {
                        resolve({
                            status: 'success',
                            thinking: thoughtText.trim(),
                            search_results: searchResults,
                            response: fullText.trim()
                        });
                    }
                });
                
                response.data.on('error', (err) => {
                    if (useStream) reject(err);
                    else resolve({ status: 'error', message: err.message });
                });
            });

        } catch (error) {
            console.error(`Chat error: ${error.message}`);
            return options.stream !== false ? null : { status: 'error', message: error.message };
        }
    }
};

/*
(async () => {
    // 1. Login
    console.log("Logging in...");
    const auth = await qwen.login("email-lu", "pw-lu");
    if (!auth) return console.log("Login Gagal");
    
    const token = auth.token;
    console.log('Login Success!');

    // 2. Buat Sesi Baru
    console.log("Creating session...");
    const chatId = await qwen.createSession(token);
    console.log('Chat ID:', chatId);
    
    // 3. Upload Media (foto, video, document)
    console.log("Uploading file...");
    const uploadedFile = await qwen.upload(token, './u.pdf');
    
    // 4. Chat
    console.log("Chatting...\n");
    const chatResponse = await qwen.chat(token, chatId, "file apa ini?", { 
        stream: false, // true untuk streaming
        model: "qwen-max-latest", // model
        thinkingEnabled: true, // thinking mode
        searchEnabled: true, // search mode
        file: uploadedFile, // contoh pakai file
    });

    if (!chatResponse.status) {
         console.log("\n[Done Streaming]");
    } else {
         console.log(chatResponse);
    }
    
    // 5. History Session
    console.log("Get History...");
    const history = await qwen.getHistory(token, chatId);
    console.log("History:", history);
    
    // 6. List Session
    console.log("List All Session");
    const list = await qwen.getListSession(token);
    console.log("List Session:", list);
    
    // 7. Delete Session
    console.log("Delete Session");
    const del = await qwen.deleteSession(token, chatId);
    console.log("Deleting Session Status:", del);
})();
*/
