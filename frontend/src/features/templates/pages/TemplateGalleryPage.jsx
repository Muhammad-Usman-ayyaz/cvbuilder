import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfile } from '../../../context/ProfileContext';
import { useResumes } from '../../resume/hooks/useResumes';
import { TEMPLATES, getTemplateMeta } from '../../resume/utils/templateMeta';
import { getTemplatePreviewResume } from '../utils/templatePreviewData';
import TemplateCard from '../components/TemplateCard';
import TemplatePreviewModal from '../components/TemplatePreviewModal';
import { getImportedTemplates, deleteImportedTemplate } from '../api/templateApi';
import Loader from '../../../components/feedback/Loader';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { staggerContainer, fadeSlideUp } from '../../../lib/motion';

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ImportedTemplateCard({ template, onDelete, isDeleting }) {
  return (
    <motion.div
      variants={fadeSlideUp}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:border-primary/40 transition-colors"
    >
      <div className="aspect-[3/4] bg-bg-main flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="material-symbols-outlined text-[36px] text-text-secondary/60">description</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-soft-primary px-2.5 py-0.5 rounded-md border border-primary/20">
          Imported CV
        </span>
      </div>
      <div className="p-4 border-t border-border">
        <h4 className="text-xs font-bold text-text-primary truncate">{template.name}</h4>
        <p className="text-[11px] text-text-secondary mt-0.5">
          Detected design · {formatDate(template.createdAt)}
        </p>
        <button
          type="button"
          onClick={() => onDelete(template.id)}
          disabled={isDeleting}
          className="mt-3 text-xs font-semibold text-error hover:underline disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
          <span>{isDeleting ? 'Removing…' : 'Remove'}</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function TemplateGalleryPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { createResume } = useResumes();

  const [activeFilter, setActiveFilter] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Imported templates state (preserved)
  const [importedTemplates, setImportedTemplates] = useState([]);
  const [isLoadingImported, setIsLoadingImported] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getImportedTemplates()
      .then((data) => {
        if (!cancelled) setImportedTemplates(data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load imported templates.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingImported(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteImported = async (id) => {
    setDeletingId(id);
    try {
      await deleteImportedTemplate(id);
      setImportedTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to remove this template.');
    } finally {
      setDeletingId(null);
    }
  };

  // Pre-generate realistic preview documents for each built-in template
  const previewResumes = useMemo(() => {
    const map = {};
    for (const t of TEMPLATES) {
      map[t.id] = getTemplatePreviewResume(t.id, profile);
    }
    return map;
  }, [profile]);

  const filteredTemplates = useMemo(() => {
    if (activeFilter === 'all') return TEMPLATES;
    return TEMPLATES.filter((t) => t.id === activeFilter);
  }, [activeFilter]);

  const handleSelectTemplate = async (templateId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const templateMeta = getTemplateMeta(templateId);
      const userDisplayName = profile?.full_name || profile?.fullName;
      const defaultTitle = userDisplayName
        ? `${userDisplayName.split(' ')[0]}'s ${templateMeta.name} Resume`
        : `${templateMeta.name} Resume`;

      const newResume = await createResume({
        title: defaultTitle,
        templateId,
      });

      if (previewTemplate) setPreviewTemplate(null);
      navigate(`/resume-studio/${newResume.id}`);
    } catch (err) {
      console.error('Failed to create resume with template', err);
      setError(err.message || 'Could not start resume with this template. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center gap-1.5 text-primary select-none">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Resume Templates
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Choose Your Resume Style
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Pick a design that fits your career. You can switch templates anytime in the Studio without losing your resume content or section layout.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 pt-5 border-t border-border flex items-center gap-2 flex-wrap relative z-10">
          <span className="text-xs font-semibold text-text-secondary mr-1">Style:</span>
          {[
            { id: 'all', label: 'All Styles' },
            { id: 'classic', label: 'Classic' },
            { id: 'modern', label: 'Modern' },
            { id: 'minimal', label: 'Minimal' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-bg-main hover:bg-card border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {/* Built-in Templates Gallery Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 items-stretch"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            previewResume={previewResumes[template.id]}
            onPreview={(tpl) => setPreviewTemplate(tpl)}
            onSelect={handleSelectTemplate}
            isSubmitting={isSubmitting}
          />
        ))}
      </motion.div>

      {/* Full Size Preview Modal */}
      <TemplatePreviewModal
        isOpen={Boolean(previewTemplate)}
        template={previewTemplate}
        previewResume={previewTemplate ? previewResumes[previewTemplate.id] : null}
        onClose={() => setPreviewTemplate(null)}
        onSelect={handleSelectTemplate}
        isSubmitting={isSubmitting}
      />

      {/* Imported CV Templates Section (Preserved for reference / CV upload provenance) */}
      <div className="pt-8 border-t border-border/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Imported CV Designs
            </h3>
            <p className="text-xs text-text-secondary">
              Detected from CV files you have uploaded. Kept for provenance and fingerprinting reference.
            </p>
          </div>
          {importedTemplates.length > 0 && (
            <span className="text-xs font-medium text-text-secondary">
              {importedTemplates.length} detected
            </span>
          )}
        </div>

        {isLoadingImported ? (
          <div className="py-6">
            <Loader message="Loading imported designs..." />
          </div>
        ) : importedTemplates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-text-secondary bg-card/40">
            No external designs detected yet. When you upload a CV, its structure will appear here.
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {importedTemplates.map((item) => (
              <ImportedTemplateCard
                key={item.id}
                template={item}
                onDelete={handleDeleteImported}
                isDeleting={deletingId === item.id}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
