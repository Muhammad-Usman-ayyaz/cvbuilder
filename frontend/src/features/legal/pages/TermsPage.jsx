import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../../components/common/Card';

export default function TermsPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === '#privacy') {
      const element = document.getElementById('privacy');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/signup" className="flex items-center text-text-secondary hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
          <span className="text-sm font-semibold">Back</span>
        </Link>
        <div className="h-6 w-[1px] bg-border" />
        <h1 className="text-2xl font-extrabold text-text-primary">Legal &amp; Policies</h1>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="prose prose-sm md:prose-base max-w-none text-text-secondary">
          <h2 className="font-bold text-xl mb-4 text-text-primary" id="terms">Terms &amp; Conditions</h2>
          <p className="mb-4">
            Welcome to <strong className="text-text-primary">AI Resume Builder</strong>. By accessing and using our website and services, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <ul className="list-disc pl-5 mb-8 space-y-2">
            <li><strong className="text-text-primary">Usage:</strong> You agree to use the service only for lawful purposes and in a way that does not infringe the rights of others.</li>
            <li><strong className="text-text-primary">Accounts:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
            <li><strong className="text-text-primary">Content:</strong> Any resumes, text, or data you provide remain your property. However, we reserve the right to suspend accounts that upload malicious or inappropriate content.</li>
            <li><strong className="text-text-primary">Modifications:</strong> We reserve the right to modify or discontinue the service at any time without notice.</li>
          </ul>

          <div className="w-full h-[1px] my-8 bg-border" />

          <h2 className="font-bold text-xl mb-4 text-text-primary" id="privacy">Privacy Policy</h2>
          <p className="mb-4">
            At <strong className="text-text-primary">AI Resume Builder</strong>, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.
          </p>
          <ul className="list-disc pl-5 mb-8 space-y-2">
            <li><strong className="text-text-primary">Information Collection:</strong> We collect information you provide directly, such as your name, email address, and resume content.</li>
            <li><strong className="text-text-primary">How We Use It:</strong> We use this information solely to provide, maintain, and improve our resume building services.</li>
            <li><strong className="text-text-primary">Data Security:</strong> We implement standard industry security measures to protect your personal data from unauthorized access or disclosure.</li>
            <li><strong className="text-text-primary">Third Parties:</strong> We do not sell your personal data to third parties. We may use trusted third-party services (like analytics) who are bound by confidentiality agreements.</li>
          </ul>

          <p className="text-sm mt-8 border-t border-border pt-6">
            Last updated: August 2026
          </p>
        </div>
      </Card>
    </div>
  );
}
