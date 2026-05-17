/**
 * ─────────────────────────────────────────────
 *  @project    microsoft-copilot
 *  @desc       Copilot AI, real-time AI that supports web search.
 *  @author     Hiura
 *  @repo       github.com/hiuraaaaa/snapshots
 * ─────────────────────────────────────────────
 */

const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');

class Copilot {
    constructor() {
        this.conversationId = null;
        this.models = {
            default: 'chat',
            'think-deeper': 'reasoning',
            'gpt-5': 'smart'
        };
        this.headers = {
            origin: 'https://copilot.microsoft.com',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        };
    }
    
    async createConversation() {
        const { data } = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, {
            headers: this.headers
        });
        
        this.conversationId = data.id;
        return this.conversationId;
    }
    
    async chat(message, { model = 'default' } = {}) {
        if (!this.conversationId) await this.createConversation();
        if (!this.models[model]) throw new Error(`Available models: ${Object.keys(this.models).join(', ')}`);
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1${this.accessToken ? `&accessToken=${this.accessToken}` : ''}`, {
                headers: this.headers
            });

            const response = { text: '', citations: [] };
            
            ws.on('open', () => {
                ws.send(JSON.stringify({
                    event: 'setOptions',
                    supportedFeatures: ['partial-generated-images'],
                    supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
                    ads: {
                        supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion']
                    }
                }));

                ws.send(JSON.stringify({
                    event: 'send',
                    mode: this.models[model],
                    conversationId: this.conversationId,
                    content: [{ type: 'text', text: message }],
                    context: {}
                }));
            });

            ws.on('message', (chunk) => {
                try {
                    const parsed = JSON.parse(chunk.toString());
                    
                    switch (parsed.event) {
                        case 'appendText':
                            response.text += parsed.text || '';
                        break;
                            
                        case 'citation':
                            response.citations.push({
                                id: parsed.id,
                                messageId: parsed.messageId,
                                partId: parsed.partId,
                                title: parsed.title,
                                icon: parsed.iconUrl,
                                url: parsed.url,
                                publisher: parsed.publisher
                            });
                        break;
                            
                        case 'done':
                            resolve(response);
                            ws.close();
                        break;
                            
                        case 'error':
                            reject(new Error(parsed.message));
                            ws.close();
                        break;
                    }
                } catch (error) {
                    reject(error.message);
                }
            });
            
            ws.on('error', reject);
        });
    }
}

// Usage:
const copilot = new Copilot();
copilot.chat('hi! find me the latest news in Indonesia').then(console.log);
