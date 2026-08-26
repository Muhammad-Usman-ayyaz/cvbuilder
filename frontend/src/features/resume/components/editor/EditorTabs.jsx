import { useState } from 'react';
import PersonalInfoForm from './PersonalInfoForm';
import ExperienceForm from './ExperienceForm';
import EducationForm from './EducationForm';
import ProjectsForm from './ProjectsForm';
import SkillsForm from './SkillsForm';

const TABS = [
    { id: 'personal', label: 'Personal', icon: 'person' },
    { id: 'education', label: 'Education', icon: 'school' },
    { id: 'experience', label: 'Experience', icon: 'work' },
    { id: 'projects', label: 'Projects', icon: 'code' },
    { id: 'skills', label: 'Skills', icon: 'star' },
];

/**
 * Wizard container for all five resume editor sections. Holds its own
 * active-step state and fans a single `onChange(nextContent)` out to each
 * section form, updating just that section's slice of `content`.
 *
 * @param {{
 *   content: import('../../utils/resumeModel').ResumeContent,
 *   onChange: (next: import('../../utils/resumeModel').ResumeContent) => void,
 * }} props
 */
export default function EditorTabs({ content, onChange }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const updateField = (field) => (next) => {
        onChange({ ...content, [field]: next });
    };

    const scrollToTop = () => {
        document.getElementById('editor-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        if (activeIndex < TABS.length - 1) {
            setActiveIndex(activeIndex + 1);
            scrollToTop();
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
            scrollToTop();
        }
    };

    const activeTab = TABS[activeIndex].id;

    return (
        <div className="flex flex-col">
            {/* Stepper Header */}
            <div className="flex overflow-x-auto mb-5 pb-2 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }} role="tablist">
                {TABS.map((tab, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;
                    
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => {
                                setActiveIndex(index);
                                scrollToTop();
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-full mr-2 ${
                                isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : isCompleted
                                        ? 'bg-soft-indigo text-primary border border-primary/20 hover:bg-primary/10'
                                        : 'bg-bg-main text-text-secondary hover:text-text-primary border border-border hover:bg-card'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {isCompleted && !isActive ? 'check' : tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Form Content */}
            <div>
                {activeTab === 'personal' && (
                    <PersonalInfoForm value={content.personal} onChange={updateField('personal')} />
                )}
                {activeTab === 'experience' && (
                    <ExperienceForm value={content.experience} onChange={updateField('experience')} />
                )}
                {activeTab === 'education' && (
                    <EducationForm value={content.education} onChange={updateField('education')} />
                )}
                {activeTab === 'projects' && (
                    <ProjectsForm value={content.projects} onChange={updateField('projects')} />
                )}
                {activeTab === 'skills' && (
                    <SkillsForm value={content.skills} onChange={updateField('skills')} />
                )}
            </div>

            {/* Fixed Bottom Navigation */}
            <div className="mt-8 flex items-center justify-between pt-4 border-t border-border">
                {activeIndex > 0 ? (
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-main transition-colors border border-border"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Previous: {TABS[activeIndex - 1].label}
                    </button>
                ) : (
                    <div></div> // Spacer
                )}

                {activeIndex < TABS.length - 1 ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm ml-auto"
                    >
                        Next: {TABS[activeIndex + 1].label}
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            // User finished.
                        }}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm ml-auto opacity-50 cursor-default"
                        disabled
                    >
                        Finished
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </button>
                )}
            </div>
        </div>
    );
}