import { useState, useEffect } from 'react';
import { useProfile } from '../../../context/ProfileContext';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

export default function ProfilePage() {
  const { profile, updateProfile, isLoading, completeness } = useProfile();
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        fullName: profile.full_name || '',
        professionalTitle: profile.professional_title || '',
        email: profile.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || '',
        linkedinUrl: profile.linkedin_url || '',
        githubUrl: profile.github_url || '',
        portfolioUrl: profile.portfolio_url || '',
      });
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  const handlePersonalChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const savePersonalInfo = async () => {
    setIsSaving(true);
    await updateProfile({
      fullName: personalInfo.fullName,
      professionalTitle: personalInfo.professionalTitle,
      email: personalInfo.email,
      phone: personalInfo.phone,
      city: personalInfo.city,
      country: personalInfo.country,
      linkedinUrl: personalInfo.linkedinUrl,
      githubUrl: personalInfo.githubUrl,
      portfolioUrl: personalInfo.portfolioUrl,
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Master Profile</h1>
          <p className="text-text-secondary mt-1">
            Build your profile once. Generate unlimited tailored resumes.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-primary mb-1">Profile Completeness</div>
          <div className="w-48 h-2.5 bg-bg-main rounded-full overflow-hidden border border-border-light">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-text-primary mb-5 flex items-center">
          <span className="material-symbols-outlined mr-2 text-primary">person</span>
          Personal Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Full Name" name="fullName" value={personalInfo.fullName} onChange={handlePersonalChange} />
          <Input label="Professional Title" name="professionalTitle" value={personalInfo.professionalTitle} onChange={handlePersonalChange} placeholder="e.g. Software Engineer" />
          <Input label="Email" name="email" value={personalInfo.email} onChange={handlePersonalChange} type="email" />
          <Input label="Phone" name="phone" value={personalInfo.phone} onChange={handlePersonalChange} />
          <Input label="City" name="city" value={personalInfo.city} onChange={handlePersonalChange} />
          <Input label="Country" name="country" value={personalInfo.country} onChange={handlePersonalChange} />
          <Input label="LinkedIn URL" name="linkedinUrl" value={personalInfo.linkedinUrl} onChange={handlePersonalChange} />
          <Input label="GitHub URL" name="githubUrl" value={personalInfo.githubUrl} onChange={handlePersonalChange} />
          <div className="md:col-span-2">
            <Input label="Portfolio URL" name="portfolioUrl" value={personalInfo.portfolioUrl} onChange={handlePersonalChange} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={savePersonalInfo} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Placeholders for future sections */}
      <Card className="p-6 opacity-60">
        <h2 className="text-xl font-bold text-text-primary mb-1 flex items-center">
          <span className="material-symbols-outlined mr-2 text-primary">school</span>
          Education (Coming soon)
        </h2>
      </Card>

      <Card className="p-6 opacity-60">
        <h2 className="text-xl font-bold text-text-primary mb-1 flex items-center">
          <span className="material-symbols-outlined mr-2 text-primary">work</span>
          Experience (Coming soon)
        </h2>
      </Card>
      
      <Card className="p-6 opacity-60">
        <h2 className="text-xl font-bold text-text-primary mb-1 flex items-center">
          <span className="material-symbols-outlined mr-2 text-primary">lightbulb</span>
          Skills (Coming soon)
        </h2>
      </Card>
    </div>
  );
}
