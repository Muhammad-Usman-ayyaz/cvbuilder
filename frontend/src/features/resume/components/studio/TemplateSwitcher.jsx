import { useState, useRef, useEffect } from 'react';
import { TEMPLATES } from '../../utils/templateMeta';

/**
 * Custom Dropdown for selecting templates with thumbnails.
 *
 * @param {{
 *   value: 'classic'|'modern'|'minimal',
 *   onChange: (nextTemplateId: string) => void,
 *   onToggle?: (isOpen: boolean) => void,
 * }} props
 */
export default function TemplateSwitcher({ value, onChange, onToggle }) {
    const [isOpen, setIsOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (onToggle) {
            onToggle(isOpen);
        }
    }, [isOpen, onToggle]);

    const activeTemplate = TEMPLATES.find((t) => t.id === value) || TEMPLATES[0];

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Dropdown Toggle */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-text-secondary/40 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <img 
                        src={activeTemplate.thumbnailUrl} 
                        alt={activeTemplate.name} 
                        className="w-10 h-10 object-cover rounded shadow-sm border border-border" 
                    />
                    <div className="text-left">
                        <span className="block text-sm font-semibold text-text-primary">
                            {activeTemplate.name}
                        </span>
                        <span className="block text-xs text-text-secondary truncate max-w-[150px]">
                            {activeTemplate.description}
                        </span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto p-1 overscroll-contain">
                        {TEMPLATES.map((template) => {
                            const isActive = template.id === value;
                            return (
                                <div
                                    key={template.id}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                                        isActive ? 'bg-soft-indigo' : 'hover:bg-bg-main'
                                    }`}
                                    onClick={() => {
                                        onChange(template.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={template.thumbnailUrl} 
                                            alt={template.name} 
                                            className="w-10 h-10 object-cover rounded shadow-sm border border-border" 
                                        />
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                                                {template.name}
                                            </span>
                                            {isActive && (
                                                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Preview Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewTemplate(template);
                                        }}
                                        className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-white transition-colors"
                                        title="View Full Size"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal for Full Size Preview */}
            {previewTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="text-lg font-bold text-text-primary">
                                {previewTemplate.name} Template Preview
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPreviewTemplate(null)}
                                className="p-1 rounded-full hover:bg-bg-main text-text-secondary transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-auto flex-1 flex justify-center bg-bg-main">
                            <img 
                                src={previewTemplate.largeImageUrl} 
                                alt={previewTemplate.name} 
                                className="max-w-full rounded shadow-md object-contain" 
                            />
                        </div>
                        <div className="p-4 border-t border-border flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(previewTemplate.id);
                                    setPreviewTemplate(null);
                                    setIsOpen(false);
                                }}
                                className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                Use This Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}