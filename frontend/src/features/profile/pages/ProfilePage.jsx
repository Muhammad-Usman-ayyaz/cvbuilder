import { useState, useEffect } from 'react';
import { useProfile } from '../../../context/ProfileContext';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';

export default function ProfilePage() {
  const { profile, updateProfile, isLoading, completeness, missingItems } = useProfile();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: '',
  });

  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        fullName: profile.full_name || profile.fullName || '',
        professionalTitle: profile.professional_title || profile.professionalTitle || '',
        email: profile.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || '',
        linkedin: profile.linkedin_url || profile.linkedinUrl || profile.linkedin || '',
        github: profile.github_url || profile.githubUrl || profile.github || '',
        portfolio: profile.portfolio_url || profile.portfolioUrl || profile.portfolio || '',
        summary: profile.summary || '',
      });

      setExperience(Array.isArray(profile.experience) ? profile.experience : []);
      setEducation(Array.isArray(profile.education) ? profile.education : []);
      setProjects(Array.isArray(profile.projects) ? profile.projects : []);

      if (Array.isArray(profile.skills)) {
        if (typeof profile.skills[0] === 'string') {
          setSkills(profile.skills);
        } else if (profile.skills[0]?.items) {
          setSkills(profile.skills.flatMap(s => s.items || []));
        }
      }
    }
  }, [profile]);

  const handlePersonalChange = (e) => {
    setPersonalInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Experience handlers
  const addExperience = () => {
    setExperience(prev => [
      ...prev,
      {
        id: `exp_${Date.now()}`,
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  };

  const updateExperienceItem = (index, field, value) => {
    setExperience(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeExperienceItem = (index) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };

  // Education handlers
  const addEducation = () => {
    setEducation(prev => [
      ...prev,
      {
        id: `edu_${Date.now()}`,
        school: '',
        degree: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
  };

  const updateEducationItem = (index, field, value) => {
    setEducation(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeEducationItem = (index) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };

  // Skill handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // Project handlers
  const addProject = () => {
    setProjects(prev => [
      ...prev,
      {
        id: `proj_${Date.now()}`,
        name: '',
        techStack: '',
        link: '',
        description: '',
      },
    ]);
  };

  const updateProjectItem = (index, field, value) => {
    setProjects(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeProjectItem = (index) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  // Save all profile data
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      full_name: personalInfo.fullName,
      professional_title: personalInfo.professionalTitle,
      email: personalInfo.email,
      phone: personalInfo.phone,
      city: personalInfo.city,
      country: personalInfo.country,
      location: [personalInfo.city, personalInfo.country].filter(Boolean).join(', '),
      linkedinUrl: personalInfo.linkedin,
      githubUrl: personalInfo.github,
      portfolioUrl: personalInfo.portfolio,
      summary: personalInfo.summary,
      experience,
      education,
      skills,
      projects,
    };

    const res = await updateProfile(payload);
    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'person' },
    { id: 'experience', label: 'Work Experience', icon: 'work' },
    { id: 'education', label: 'Education', icon: 'school' },
    { id: 'skills', label: 'Skills', icon: 'auto_awesome' },
    { id: 'projects', label: 'Projects & Links', icon: 'code' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Master Profile</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Fill your common info once. Every new resume will auto-fill with this data!
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[var(--color-bg-main)] p-3 rounded-lg border border-[var(--color-border)] shrink-0">
          <div className="text-right">
            <div className="text-xs font-bold text-[var(--color-text-primary)]">
              Strength: <span className="text-[var(--color-primary)] font-extrabold">{completeness}%</span>
            </div>
            <div className="w-36 h-2 bg-[var(--color-border)] rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          <Button variant="primary" onClick={handleSaveAll} isLoading={isSaving} className="text-xs">
            Save Profile
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Master Profile updated successfully! All new resumes will now pre-fill with these details.
        </div>
      )}

      {/* Actionable Suggestions Callout */}
      {missingItems.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15 space-y-2">
          <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)]">task_alt</span>
            Complete these items to reach 100% Profile Strength:
          </div>
          <div className="flex flex-wrap gap-2">
            {missingItems.map((item, idx) => (
              <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--color-border)] overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-card)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Personal Information */}
      {activeTab === 'personal' && (
        <Card className="p-6 space-y-5 rounded-xl border-[var(--color-border)]">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Personal & Contact Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" name="fullName" value={personalInfo.fullName} onChange={handlePersonalChange} placeholder="John Doe" />
            <Input label="Professional Title" name="professionalTitle" value={personalInfo.professionalTitle} onChange={handlePersonalChange} placeholder="Software Engineer" />
            <Input label="Email Address" name="email" value={personalInfo.email} onChange={handlePersonalChange} type="email" placeholder="john@example.com" />
            <Input label="Phone Number" name="phone" value={personalInfo.phone} onChange={handlePersonalChange} placeholder="+1 234 567 890" />
            <Input label="City" name="city" value={personalInfo.city} onChange={handlePersonalChange} placeholder="New York" />
            <Input label="Country" name="country" value={personalInfo.country} onChange={handlePersonalChange} placeholder="USA" />
            <Input label="LinkedIn URL" name="linkedin" value={personalInfo.linkedin} onChange={handlePersonalChange} placeholder="https://linkedin.com/in/username" />
            <Input label="GitHub URL" name="github" value={personalInfo.github} onChange={handlePersonalChange} placeholder="https://github.com/username" />
            <div className="sm:col-span-2">
              <Input label="Portfolio / Website URL" name="portfolio" value={personalInfo.portfolio} onChange={handlePersonalChange} placeholder="https://portfolio.com" />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Professional Summary" name="summary" value={personalInfo.summary} onChange={handlePersonalChange} rows={4} placeholder="Summary of your experience, key skills, and goals..." />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Work Experience */}
      {activeTab === 'experience' && (
        <Card className="p-6 space-y-6 rounded-xl border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Work Experience</h2>
            <Button variant="secondary" onClick={addExperience} className="text-xs">
              + Add Position
            </Button>
          </div>

          {experience.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
              No work experience added yet. Click "+ Add Position" to include your employment history.
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-[var(--color-border)]">
              {experience.map((item, idx) => (
                <div key={item.id || idx} className="pt-4 first:pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-primary)]">Position #{idx + 1}</span>
                    <button onClick={() => removeExperienceItem(idx)} className="text-xs text-[var(--color-error)] hover:underline">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Company Name" value={item.company || ''} onChange={(e) => updateExperienceItem(idx, 'company', e.target.value)} placeholder="Acme Corp" />
                    <Input label="Job Title / Role" value={item.role || ''} onChange={(e) => updateExperienceItem(idx, 'role', e.target.value)} placeholder="Frontend Developer" />
                    <Input label="Location" value={item.location || ''} onChange={(e) => updateExperienceItem(idx, 'location', e.target.value)} placeholder="San Francisco, CA" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start Date" value={item.startDate || ''} onChange={(e) => updateExperienceItem(idx, 'startDate', e.target.value)} placeholder="Jan 2022" />
                      <Input label="End Date" value={item.endDate || ''} onChange={(e) => updateExperienceItem(idx, 'endDate', e.target.value)} placeholder="Present" disabled={item.current} />
                    </div>
                    <div className="sm:col-span-2">
                      <TextArea label="Key Responsibilities & Achievements" value={item.description || ''} onChange={(e) => updateExperienceItem(idx, 'description', e.target.value)} rows={3} placeholder="Developed web applications using React..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Education */}
      {activeTab === 'education' && (
        <Card className="p-6 space-y-6 rounded-xl border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Education History</h2>
            <Button variant="secondary" onClick={addEducation} className="text-xs">
              + Add Education
            </Button>
          </div>

          {education.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
              No education added yet. Click "+ Add Education" to add your degree or academic history.
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-[var(--color-border)]">
              {education.map((item, idx) => (
                <div key={item.id || idx} className="pt-4 first:pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-primary)]">Education #{idx + 1}</span>
                    <button onClick={() => removeEducationItem(idx)} className="text-xs text-[var(--color-error)] hover:underline">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="School / University" value={item.school || ''} onChange={(e) => updateEducationItem(idx, 'school', e.target.value)} placeholder="Stanford University" />
                    <Input label="Degree / Field of Study" value={item.degree || ''} onChange={(e) => updateEducationItem(idx, 'degree', e.target.value)} placeholder="B.S. Computer Science" />
                    <Input label="Location" value={item.location || ''} onChange={(e) => updateEducationItem(idx, 'location', e.target.value)} placeholder="Stanford, CA" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Start Year" value={item.startDate || ''} onChange={(e) => updateEducationItem(idx, 'startDate', e.target.value)} placeholder="2018" />
                      <Input label="End Year" value={item.endDate || ''} onChange={(e) => updateEducationItem(idx, 'endDate', e.target.value)} placeholder="2022" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Skills */}
      {activeTab === 'skills' && (
        <Card className="p-6 space-y-5 rounded-xl border-[var(--color-border)]">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Skills & Competencies</h2>

          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, Project Management"
              className="flex-1 rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-xs bg-[var(--color-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
            <Button type="submit" variant="primary" className="text-xs shrink-0">
              Add Skill
            </Button>
          </form>

          {skills.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
              No skills added yet. Type a skill above and click "Add Skill".
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 font-bold">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 5: Projects & Links */}
      {activeTab === 'projects' && (
        <Card className="p-6 space-y-6 rounded-xl border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Projects & Portfolio</h2>
            <Button variant="secondary" onClick={addProject} className="text-xs">
              + Add Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
              No projects added yet. Click "+ Add Project" to highlight your key projects.
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-[var(--color-border)]">
              {projects.map((item, idx) => (
                <div key={item.id || idx} className="pt-4 first:pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-primary)]">Project #{idx + 1}</span>
                    <button onClick={() => removeProjectItem(idx)} className="text-xs text-[var(--color-error)] hover:underline">
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Project Name" value={item.name || ''} onChange={(e) => updateProjectItem(idx, 'name', e.target.value)} placeholder="E-commerce Dashboard" />
                    <Input label="Tech Stack" value={item.techStack || ''} onChange={(e) => updateProjectItem(idx, 'techStack', e.target.value)} placeholder="React, Node.js, Tailwind" />
                    <div className="sm:col-span-2">
                      <Input label="Project URL / Link" value={item.link || ''} onChange={(e) => updateProjectItem(idx, 'link', e.target.value)} placeholder="https://github.com/user/project" />
                    </div>
                    <div className="sm:col-span-2">
                      <TextArea label="Description" value={item.description || ''} onChange={(e) => updateProjectItem(idx, 'description', e.target.value)} rows={3} placeholder="Key highlights and features of the project..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-4">
        <Button variant="primary" onClick={handleSaveAll} isLoading={isSaving}>
          Save All Master Profile Changes
        </Button>
      </div>
    </div>
  );
}
