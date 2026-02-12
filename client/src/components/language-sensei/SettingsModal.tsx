import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'language_sensei_gemini_key';

/**
 * SettingsModal – Configure Gemini API key.
 * Key is persisted in localStorage.
 */
export default function SettingsModal({
    isOpen,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}) {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(STORAGE_KEY) || '';
            setApiKey(saved);
        }
    }, [isOpen]);

    const handleSave = () => {
        const trimmed = apiKey.trim();
        localStorage.setItem(STORAGE_KEY, trimmed);
        onSave(trimmed);
        onClose();
    };

    const handleClear = () => {
        setApiKey('');
        localStorage.removeItem(STORAGE_KEY);
        onSave('');
    };

    if (!isOpen) return null;

    return (
        <div className="ls-modal-overlay" onClick={onClose}>
            <div className="ls-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="ls-modal-header">
                    <h2>⚙️ Settings</h2>
                    <button className="ls-modal-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="ls-modal-body">
                    <label className="ls-modal-label" htmlFor="ls-api-key-input">
                        Gemini API Key
                    </label>
                    <p className="ls-modal-description">
                        Your key is stored locally in this browser only and is never sent to any server except Google.
                    </p>
                    <input
                        id="ls-api-key-input"
                        type="password"
                        placeholder="AIza..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="ls-modal-input"
                    />
                </div>

                <div className="ls-modal-footer">
                    <button className="ls-btn-ghost" onClick={handleClear}>
                        Clear Key
                    </button>
                    <button className="ls-btn-primary" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
