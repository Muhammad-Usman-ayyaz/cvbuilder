import { useState, useEffect } from 'react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { TEMPLATES, THEME_COLORS } from '../utils/templateMeta';

/**
 * Modal for creating a new resume — title, template choice, accent color.
 * No shared Modal component exists in this project yet, so the
 * backdrop/panel/focus-trap-lite behavior is self-contained here. If a
 * shared Modal component gets added later, this should be refactored to
 * use it instead of duplicating overlay markup.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onCreate: (params: { title: string, templateId: string, themeColor: string }) => void,
 * }} props
 */
export default function CreateResumeModal({ isOpen, onClose, onCreate, isSubmitting }) {
    const [title, setTitle] = useState('');
    const [templateId, setTemplateId] = useState(TEMPLATES[0]?.id ?? 'classic');
    const [themeColor, setThemeColor] = useState(THEME_COLORS[0]?.value ?? '#4F46E5');
    const [error, setError] = useState('');

    // Reset form state each time the modal opens.
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setTemplateId(TEMPLATES[0]?.id ?? 'classic');
            setThemeColor(THEME_COLORS[0]?.value ?? '#4F46E5');
            setError('');
        }
    }, [isOpen]);

    // Close on Escape.
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Give your resume a name so you can find it later.');
            return;
        }
        onCreate({ title: title.trim(), templateId, themeColor });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-resume-title"
                className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 id="create-resume-title" className="text-base font-semibold text-text-primary">
                        Create a new resume
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-main transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        id="new-resume-title"
                        label="Resume Name"
                        placeholder="e.g. Frontend Developer — Google"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (error) setError('');
                        }}
                        error={error}
                        autoFocus
                    />

                    <div>
                        <p className="text-sm font-medium text-text-primary mb-2">Starting Template</p>
                        <div className="grid grid-cols-3 gap-2">
                            {TEMPLATES.map((template) => {
                                const isActive = template.id === templateId;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => setTemplateId(template.id)}
                                        aria-pressed={isActive}
                                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-colors ${isActive
                                            ? 'border-primary bg-soft-indigo text-primary'
                                            : 'border-border text-text-secondary hover:border-text-secondary/40'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{template.icon}</span>
                                        <span className="text-xs font-medium">{template.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-text-primary mb-2">Accent Color</p>
                        <div className="flex flex-wrap gap-2">
                            {THEME_COLORS.map((color) => {
                                const isActive = color.value.toLowerCase() === themeColor.toLowerCase();
                                return (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setThemeColor(color.value)}
                                        aria-label={color.label}
                                        aria-pressed={isActive}
                                        title={color.label}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${isActive ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                    >
                                        {isActive && (
                                            <span className="material-symbols-outlined text-[14px] text-white">check</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>
                            Create Resume
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}