import { useState } from 'react';

/**
 * ChatInput – Message input with send button.
 * Disabled while the AI is responding.
 */
export default function ChatInput({
    onSend,
    disabled,
}: {
    onSend: (text: string) => void;
    disabled: boolean;
}) {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className="ls-chat-input-form" onSubmit={handleSubmit}>
            <div className="ls-chat-input-wrapper">
                <textarea
                    id="ls-chat-input"
                    className="ls-chat-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type in English or Japanese..."
                    rows={1}
                    disabled={disabled}
                    autoFocus
                />
                <button
                    type="submit"
                    className="ls-chat-send-btn"
                    disabled={disabled || !text.trim()}
                    aria-label="Send message"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
            <p className="ls-chat-input-hint">
                Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
            </p>
        </form>
    );
}
