import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportResumeAsPdf } from '../../utils/exportPdf';

export const StudioHeader = ({
    title,
    resumeTitle,
    onTitleChange,
    saveStatus = 'Saved',
    onToggleTemplates,
    onToggleColors,
    onBack,
    onExportPdf,
    resume
}) => {
    const navigate = useNavigate();
    const [isExporting, setIsExporting] = useState(false);

    const displayTitle = title ?? resumeTitle ?? 'Untitled Resume';

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            if (onExportPdf) {
                await onExportPdf();
            } else if (resume) {
                await exportResumeAsPdf(resume);
            } else {
                window.print();
            }
        } catch (err) {
            console.error('Export failed:', err);
            // Fallback to window.print if export throws
            window.print();
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackClick = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/my-resumes');
        }
    };

    return (
        <header className="studio-header flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-xs no-print">
            {/* Left Section: Back Button & Resume Name */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleBackClick}
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
                        value={displayTitle}
                        onChange={(e) => onTitleChange?.(e.target.value)}
                        className="text-base font-semibold bg-transparent text-text-primary border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 rounded-xs transition-colors"
                        placeholder="Resume Title"
                    />

                    {/* Save Status Indicator */}
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                saveStatus === 'Saving...' || saveStatus === 'saving'
                                    ? 'bg-warning animate-pulse'
                                    : 'bg-success'
                            }`}
                        />
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus}
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
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-75 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                    <span className={`material-symbols-outlined text-lg ${isExporting ? 'animate-spin' : ''}`}>
                        {isExporting ? 'progress_activity' : 'download'}
                    </span>
                    <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                </button>
            </div>
        </header>
    );
};

export default StudioHeader;