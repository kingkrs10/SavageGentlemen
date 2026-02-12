import { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { sendMessage, ChatMessage } from '@/lib/language-sensei/aiService';
import { parseMessage } from '@/lib/language-sensei/messageParser';
import ChatWindow from '@/components/language-sensei/ChatWindow';
import ChatInput from '@/components/language-sensei/ChatInput';
import SettingsModal, { STORAGE_KEY } from '@/components/language-sensei/SettingsModal';
import { SenseiMessage } from '@/components/language-sensei/MessageBubble';
import '@/components/language-sensei/language-sensei.css';

/**
 * Extract [Sensei Note] from english text
 */
function extractSenseiNote(text: string | null): string | null {
    if (!text) return null;
    const marker = '[Sensei Note]';
    const idx = text.indexOf(marker);
    if (idx === -1) return null;
    return text.slice(idx + marker.length).trim();
}

function stripSenseiNote(text: string | null): string | null {
    if (!text) return text;
    const marker = '[Sensei Note]';
    const idx = text.indexOf(marker);
    if (idx === -1) return text;
    return text.slice(0, idx).trim();
}

export default function AppsLanguageSensei() {
    const [messages, setMessages] = useState<SenseiMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

    const handleSend = useCallback(async (text: string) => {
        if (!apiKey) {
            setSettingsOpen(true);
            return;
        }

        setError('');

        // 1. Add user message to local state
        const userMsg: SenseiMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            content_jp: null,
            content_romaji: null,
            content_en: text,
            senseiNote: null,
        };
        setMessages((prev) => [...prev, userMsg]);

        // 2. Build chat history for OpenAI
        const history: ChatMessage[] = messages.map((m) => ({
            role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.sender === 'user'
                ? (m.content_en || m.content_jp || '')
                : [m.content_jp, m.content_romaji ? `(${m.content_romaji})` : '', m.content_en]
                    .filter(Boolean)
                    .join('\n'),
        }));

        // 3. Call AI
        setIsLoading(true);
        try {
            const rawResponse = await sendMessage(history, text, apiKey);
            const parsed = parseMessage(rawResponse);

            const senseiNote = extractSenseiNote(parsed.english);
            const cleanEnglish = stripSenseiNote(parsed.english);

            const senseiMsg: SenseiMessage = {
                id: `sensei-${Date.now()}`,
                sender: 'sensei',
                content_jp: parsed.japanese,
                content_romaji: parsed.romaji,
                content_en: cleanEnglish,
                senseiNote,
            };
            setMessages((prev) => [...prev, senseiMsg]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, messages]);

    return (
        <>
            <SEOHead
                title="Language Sensei"
                description="Learn Japanese through AI-powered conversation. Three-layer messages: Japanese, Romaji, and English."
            />

            <div className="language-sensei-app max-w-4xl mx-auto">
                {/* Back nav */}
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/apps">
                        <span className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors cursor-pointer">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Apps
                        </span>
                    </Link>
                </div>

                {/* App shell */}
                <div className="ls-app-shell">
                    {/* Header */}
                    <header className="ls-app-header">
                        <div className="ls-app-header-left">
                            <span className="ls-app-logo">⛩️</span>
                            <h1 className="ls-app-title">Language Sensei</h1>
                        </div>
                        <div className="ls-app-header-right">
                            <span className="ls-demo-badge">Demo</span>
                            <button
                                className="ls-header-btn"
                                onClick={() => setSettingsOpen(true)}
                                aria-label="Settings"
                            >
                                ⚙️
                            </button>
                        </div>
                    </header>

                    {/* Chat */}
                    <main className="ls-app-main">
                        <ChatWindow messages={messages} isLoading={isLoading} />
                    </main>

                    {/* Error */}
                    {error && (
                        <div className="ls-app-error">
                            <p>{error}</p>
                            <button onClick={() => setError('')}>✕</button>
                        </div>
                    )}

                    {/* Input */}
                    <footer className="ls-app-footer">
                        <ChatInput onSend={handleSend} disabled={isLoading} />
                    </footer>
                </div>

                {/* Settings Modal */}
                <SettingsModal
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onSave={(key) => setApiKey(key)}
                />
            </div>
        </>
    );
}
