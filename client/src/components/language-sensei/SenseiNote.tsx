import { useState } from 'react';

/**
 * SenseiNote – Expandable grammar correction callout.
 */
export default function SenseiNote({ note }: { note: string | null }) {
    const [expanded, setExpanded] = useState(false);

    if (!note) return null;

    return (
        <div className={`ls-sensei-note ${expanded ? 'expanded' : ''}`}>
            <button
                className="ls-sensei-note-toggle"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                <span className="ls-sensei-note-icon">📝</span>
                <span className="ls-sensei-note-label">Sensei Note</span>
                <span className={`ls-sensei-note-chevron ${expanded ? 'open' : ''}`}>›</span>
            </button>
            {expanded && (
                <div className="ls-sensei-note-content">
                    {note}
                </div>
            )}
        </div>
    );
}
