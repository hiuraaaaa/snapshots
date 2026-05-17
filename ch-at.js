const axios = require('axios');

async function chat(question) {
    try {
        if (!question) throw new Error(error.message);
        
        const { data } = await axios.get('https://ch.at/', {
            params: {
                q: question
            }
        });
        
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Usage:
chat('hi! who are you?').then(console.log);
