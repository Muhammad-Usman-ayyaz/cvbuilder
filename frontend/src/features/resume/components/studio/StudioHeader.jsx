import React from 'react';
import { useNavigate } from 'react-router-dom';

export const StudioHeader = ({
    resumeTitle = 'Untitled Resume',
    onTitleChange,
    saveStatus = 'Saved', // 'Saved', 'Saving...', 'Unsaved'
    onToggleTemplates,
    onToggleColors
}) => {
    const navigate = useNavigate();

    // Triggers browser native print -> Save as PDF
    // CSS in globals.css (@media print) automatically isolate #resume-print-canvas
    // and output vector/selectable text for ATS compatibility.
    const handleExportPdf = () => {
        window.print();
    };

    return (
        <header className="studio-header flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-xs no-print">
            {/* Left Section: Back Button & Resume Name */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/resumes')}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    title="Back to My Resumes"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span className="hidden sm:inline font-medium">Resumes</span>
                </button>

                <div className="h-4 w-[1px] bg-border" />

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={resumeTitle}
                        onChange={(e) => onTitleChange?.(e.target.value)}
                        className="text-base font-semibold bg-transparent text-text-primary border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 rounded-xs transition-colors"
                        placeholder="Resume Title"
                    />

                    {/* Save Status Indicator */}
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                        <span
                            className={`w-2 h-2 rounded-full ${saveStatus === 'Saving...' ? 'bg-warning animate-pulse' : 'bg-success'
                                }`}
                        />
                        {saveStatus}
                    </span>
                </div>
            </div>

            {/* Right Section: Customization Controls & Export CTA */}
            <div className="flex items-center gap-3">
                {/* Template Selector Button */}
                {onToggleTemplates && (
                    <button
                        onClick={onToggleTemplates}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-main hover:bg-soft-indigo border border-border rounded-lg transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">dashboard</span>
                        <span className="hidden md:inline">Templates</span>
                    </button>
                )}

                {/* Color Palette Button */}
                {onToggleColors && (
                    <button
                        onClick={onToggleColors}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-main hover:bg-soft-indigo border border-border rounded-lg transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">palette</span>
                        <span className="hidden md:inline">Theme</span>
                    </button>
                )}

                {/* Primary Export Button */}
                <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Export PDF</span>
                </button>
            </div>
        </header>
    );
};

// Export as default to prevent import mismatch errors in ResumeStudioPage.jsx
export default StudioHeader;