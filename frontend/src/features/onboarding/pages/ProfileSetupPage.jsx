import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    professionalTitle: '',
    linkedinUrl: '',
    portfolioUrl: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Save to backend via context
    await updateProfile(formData);
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg-main p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-primary">person_add</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary">
            Welcome, {user?.fullName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-text-secondary mt-2">
            Let's get your profile set up so we can start building your perfect resume.
          </p>
        </div>

        <Card className="p-8 shadow-lg shadow-primary/5 border-primary/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="professionalTitle"
              name="professionalTitle"
              label="Professional Title"
              placeholder="e.g. Senior Frontend Developer"
              value={formData.professionalTitle}
              onChange={handleChange}
              required
            />
            
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/username"
              type="url"
              value={formData.linkedinUrl}
              onChange={handleChange}
            />

            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              label="Portfolio / Website URL (Optional)"
              placeholder="https://yourwebsite.com"
              type="url"
              value={formData.portfolioUrl}
              onChange={handleChange}
            />

            <div className="pt-4">
              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
                Complete Setup
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
