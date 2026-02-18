import SenseiNote from './SenseiNote';

export interface SenseiMessage {
    id: string;
    sender: 'user' | 'sensei';
    content_jp: string | null;
    content_romaji: string | null;
    content_en: string | null;
    senseiNote: string | null;
}

/**
 * MessageBubble – Three-layer message display.
 *
 * Sensei messages show:
 *   Top:    Bold Japanese (Kanji / Kana)
 *   Mid:    Grey Romaji
 *   Bottom: Italic English
 *
 * User messages show plain content.
 */
export default function MessageBubble({ message }: { message: SenseiMessage }) {
    const { sender, content_jp, content_romaji, content_en, senseiNote } = message;
    const isSensei = sender === 'sensei';

    return (
        <div className={`ls-message-row ${isSensei ? 'sensei' : 'user'}`}>
            {/* Avatar */}
            <div className="ls-message-avatar">
                {isSensei ? '⛩️' : '👤'}
            </div>

            <div className="ls-message-bubble-wrapper">
                {/* Sender label */}
                <span className="ls-message-sender">
                    {isSensei ? 'Sensei' : 'You'}
                </span>

                <div className={`ls-message-bubble ${isSensei ? 'sensei' : 'user'}`}>
                    {isSensei ? (
                        <>
                            {/* Japanese – Bold top layer */}
                            {content_jp && (
                                <p className="ls-msg-japanese">{content_jp}</p>
                            )}

                            {/* Romaji – Grey mid layer */}
                            {content_romaji && (
                                <p className="ls-msg-romaji">{content_romaji}</p>
                            )}

                            {/* English – Italic bottom layer */}
                            {content_en && (
                                <p className="ls-msg-english">{content_en}</p>
                            )}

                            {/* Sensei Note (grammar correction) */}
                            <SenseiNote note={senseiNote} />
                        </>
                    ) : (
                        /* User messages – plain text */
                        <p className="ls-msg-user-text">
                            {content_en || content_jp || ''}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
