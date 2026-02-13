import { SenseiMessage } from '@/components/language-sensei/MessageBubble';

export function exportToAnkiCSV(messages: SenseiMessage[]): void {
    // 1. Filter for messages from the last 24 hours
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // We only want messages from "sensei" that have Japanese content
    const exportableMessages = messages.filter(msg => {
        // Check if message is recent enough (using timestamp from ID or creating one if needed)
        // IDs are like "sensei-170..." so we can parse timestamp
        let timestamp = Date.now();
        if (msg.id.includes('-')) {
            const parts = msg.id.split('-');
            const ts = parseInt(parts[1]);
            if (!isNaN(ts)) timestamp = ts;
        }

        return timestamp > twentyFourHoursAgo &&
            msg.sender === 'sensei' &&
            msg.content_jp;
    });

    if (exportableMessages.length === 0) {
        alert('No Japanese messages from the last 24 hours to export.');
        return;
    }

    // 2. Format as CSV
    // Columns: Kanji, Romaji, English, Context
    const headers = ['Kanji', 'Romaji', 'English', 'Context'];
    const csvRows = [headers.join(',')];

    for (const msg of exportableMessages) {
        const kanji = escapeCsv(msg.content_jp || '');
        const romaji = escapeCsv(msg.content_romaji || '');
        const english = escapeCsv(msg.content_en || '');
        // Use senseiNote as context/notes if available
        const context = escapeCsv(msg.senseiNote || '');

        csvRows.push([kanji, romaji, english, context].join(','));
    }

    // 3. Trigger Download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `language_sensei_anki_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCsv(text: string): string {
    if (!text) return '';
    // If text contains comma, quote, or newline, user quotes
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        // Double up quotes
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}
