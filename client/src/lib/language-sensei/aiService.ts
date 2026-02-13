/**
 * AI Service – Language Sensei
 *
 * Calls the Google Gemini (Generative Language) API with the
 * Language Sensei system prompt baked in. Returns the raw AI
 * response string.
 */

const SENSEI_SYSTEM_PROMPT = `You are a bilingual Japanese-English Language Sensei. Your goal is to help the user learn Japanese through conversation.

Operational Rules:
1. Always Respond in Both: For every message, provide a Japanese response followed immediately by the English translation.
2. Scripting: Use Kanji/Kana for the Japanese part, and include Romaji in parentheses on its own line so the user knows how to pronounce it.
3. Smart Correction: If the user writes in English, reply naturally but include one 'Challenge Sentence' in Japanese for them to try and translate.
4. Error Handling: If the user makes a grammar mistake in Japanese, gently correct them in English before continuing the conversation.

Response Format (STRICT – follow exactly):
Line 1+: Japanese text in Kanji/Kana (can be multiple lines)
Next line: (Romaji pronunciation in parentheses)
Remaining lines: English translation and any additional notes

Example response:
こんにちは、元気ですか？
(Konnichiwa, genki desu ka?)
Hello, how are you?

If you are correcting a grammar mistake, add a line at the end starting with "[Sensei Note]" followed by the correction tip. Example:
正しくは「日本語が好きです」です。
(Tadashiku wa "Nihongo ga suki desu" desu.)
The correct form is "I like Japanese."
[Sensei Note] Remember: Use が (ga) instead of は (wa) with 好き (suki) because 好き is an adjective that expresses a feeling toward the subject marked by が.`;

const GEMINI_MODEL = 'gemini-2.0-flash';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * Send a message to the Language Sensei AI via Google Gemini.
 */
export async function sendMessage(
    history: ChatMessage[],
    userMessage: string,
    _apiKey?: string, // Deprecated, using server-side key
): Promise<string> {
    // Build Gemini contents array from chat history
    // Gemini uses "user" and "model" roles (no "system" role in contents)
    const contents = history.slice(-20).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));

    // Add the current user message
    contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
    });

    const body = {
        systemInstruction: {
            parts: [{ text: SENSEI_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
        },
    };

    const response = await fetch('/api/language-sensei/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg =
            (error as any)?.error?.message ||
            `Chat error: ${response.status}`;
        throw new Error(msg);
    }

    const data = await response.json();
    const text =
        (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
}

