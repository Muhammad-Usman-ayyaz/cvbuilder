import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../../components/layout/PageHeader';
import Card from '../../../components/common/Card';
import Loader from '../../../components/feedback/Loader';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { TEMPLATES } from '../../resume/utils/templateMeta';
import { getImportedTemplates, deleteImportedTemplate } from '../api/templateApi';
import { staggerContainer, fadeSlideUp } from '../../../lib/motion';

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function BuiltInTemplateCard({ template }) {
  return (
    <motion.div variants={fadeSlideUp} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="aspect-[3/4] bg-bg-main flex items-center justify-center">
        <span className="material-symbols-outlined text-[40px] text-primary/60">{template.icon}</span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-text-primary">{template.name}</h3>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{template.description}</p>
      </div>
    </motion.div>
  );
}

/**
 * An imported ("Other") template is a detected document design, not a
 * renderable React template — there is no "Use this template" action
 * here, only view/delete. See backend/services/templateService.js's
 * module docstring for exactly what "imported" means for these records.
 */
function ImportedTemplateCard({ template, onDelete, isDeleting }) {
  return (
    <motion.div variants={fadeSlideUp} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="aspect-[3/4] bg-bg-main flex flex-col items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[40px] text-text-secondary/60">description</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary bg-soft-primary px-2 py-0.5 rounded">
          Imported
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-text-primary truncate">{template.name}</h3>
        <p className="text-xs text-text-secondary mt-1">
          Detected from an uploaded CV · {formatDate(template.createdAt)}
        </p>
        <button
          type="button"
          onClick={() => onDelete(template.id)}
          disabled={isDeleting}
          className="mt-3 text-xs font-medium text-error hover:underline disabled:opacity-50 disabled:pointer-events-none"
        >
          {isDeleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </motion.div>
  );
}

export default function TemplateGalleryPage() {
  const [importedTemplates, setImportedTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getImportedTemplates()
      .then((data) => {
        if (!cancelled) setImportedTemplates(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load imported templates.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id) => {
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

  return (
    <div>
      <PageHeader title="Templates" description="Browse available resume designs." />

      {error && <ErrorMessage message={error} className="mb-4" />}

      <Card title="Recommended" subtitle="Built-in templates, ready to use for any new resume." noPadding>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {TEMPLATES.map((template) => (
            <BuiltInTemplateCard key={template.id} template={template} />
          ))}
        </motion.div>
      </Card>

      {/* Only shown once there's something to show — an empty "Other"
          section with nothing in it would just be confusing chrome. */}
      {isLoading ? (
        <div className="mt-6">
          <Loader message="Loading your imported templates..." />
        </div>
      ) : (
        importedTemplates.length > 0 && (
          <Card
            title="Other"
            subtitle="Detected from CVs you've uploaded — for reference, not for starting a new resume."
            noPadding
            className="mt-6"
          >
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {importedTemplates.map((template) => (
                <ImportedTemplateCard
                  key={template.id}
                  template={template}
                  onDelete={handleDelete}
                  isDeleting={deletingId === template.id}
                />
              ))}
            </motion.div>
          </Card>
        )
      )}
    </div>
  );
}
