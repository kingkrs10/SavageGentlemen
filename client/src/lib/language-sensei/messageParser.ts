/**
 * MessageParser – Language Sensei
 *
 * Parses a structured AI response into three distinct segments
 * so each can be styled independently in the UI.
 *
 * Expected AI response format:
 *   日本語テキスト          (Japanese – Kanji / Kana)
 *   (Romaji tekisuto)       (Romaji – pronunciation guide in parentheses)
 *   English translation     (English)
 */

export interface ParsedMessage {
    japanese: string;
    romaji: string;
    english: string;
}

export function parseMessage(raw: string): ParsedMessage {
    if (!raw || typeof raw !== 'string') {
        return { japanese: '', romaji: '', english: '' };
    }

    const lines = raw.split('\n');

    // Find the first line that is wrapped entirely in parentheses: (…)
    const romajiRegex = /^\s*\((.+)\)\s*$/;
    let romajiIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (romajiRegex.test(lines[i])) {
            romajiIndex = i;
            break;
        }
    }

    // No romaji delimiter found – treat entire text as japanese
    if (romajiIndex === -1) {
        return {
            japanese: raw.trim(),
            romaji: '',
            english: '',
        };
    }

    // Extract the three segments
    const japanesePart = lines.slice(0, romajiIndex).join('\n').trim();

    const romajiMatch = lines[romajiIndex].match(romajiRegex);
    const romajiPart = romajiMatch ? romajiMatch[1].trim() : '';

    const englishPart = lines.slice(romajiIndex + 1).join('\n').trim();

    return {
        japanese: japanesePart,
        romaji: romajiPart,
        english: englishPart,
    };
}
