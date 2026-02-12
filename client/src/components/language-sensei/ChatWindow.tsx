import { useEffect, useRef } from 'react';
import MessageBubble, { SenseiMessage } from './MessageBubble';

/**
 * ChatWindow – Scrollable message list with auto-scroll.
 */
export default function ChatWindow({
    messages,
    isLoading,
}: {
    messages: SenseiMessage[];
    isLoading: boolean;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="ls-chat-window">
            {/* Welcome state */}
            {messages.length === 0 && !isLoading && (
                <div className="ls-chat-welcome">
                    <span className="ls-chat-welcome-icon">🎌</span>
                    <h2>ようこそ！</h2>
                    <p className="ls-chat-welcome-romaji">(Youkoso!)</p>
                    <p className="ls-chat-welcome-en">Welcome! Start a conversation with your Sensei.</p>
                    <p className="ls-chat-welcome-hint">Try saying <strong>"Hello"</strong> or <strong>"こんにちは"</strong></p>
                </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
                <MessageBubble key={msg.id || i} message={msg} />
            ))}

            {/* Typing indicator */}
            {isLoading && (
                <div className="ls-message-row sensei">
                    <div className="ls-message-avatar">⛩️</div>
                    <div className="ls-message-bubble-wrapper">
                        <span className="ls-message-sender">Sensei</span>
                        <div className="ls-message-bubble sensei ls-typing-indicator">
                            <span className="ls-dot" />
                            <span className="ls-dot" />
                            <span className="ls-dot" />
                        </div>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
