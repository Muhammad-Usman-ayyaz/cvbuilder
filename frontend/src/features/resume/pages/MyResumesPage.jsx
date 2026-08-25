import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResumes } from '../hooks/useResumes';
import ResumeCard from '../components/ResumeCard';
import CreateResumeModal from '../components/CreateResumeModal';
import EmptyState from '../../../components/common/EmptyState';
import Button from '../../../components/common/Button';
import PageHeader from '../../../components/layout/PageHeader';

export default function MyResumesPage() {
  const navigate = useNavigate();
  const { resumes, isLoading, createResume, duplicateResume, deleteResume, saveResume } = useResumes();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingDuplicate, setPendingDuplicate] = useState(null); // { id, defaultTitle }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (params) => {
    setIsSubmitting(true);
    try {
      const resume = await createResume(params);
      setIsCreateOpen(false);
      navigate(`/resume-studio/${resume.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = (id) => navigate(`/resume-studio/${id}`);

  // Opens the rename dialog instead of duplicating immediately, so the
  // person can name the copy (e.g. "MERN — Frontend Focus") before it's
  // created, rather than editing it after the fact.
  const handleDuplicateRequest = (id) => {
    const source = resumes.find((r) => r.id === id);
    setPendingDuplicate({
      id,
      defaultTitle: `Copy of ${source?.title || 'Untitled Resume'}`,
    });
  };

  const confirmDuplicate = async (title) => {
    if (!pendingDuplicate) return;
    setIsSubmitting(true);
    try {
      const newResume = await duplicateResume(pendingDuplicate.id);
      if (newResume) {
        const trimmed = title.trim();
        await saveResume({ ...newResume, title: trimmed || newResume.title });
      }
    } finally {
      setPendingDuplicate(null);
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (pendingDeleteId) await deleteResume(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const pendingResume = resumes.find((r) => r.id === pendingDeleteId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="My Resumes"
        subtitle="Create, edit, and manage all your resume versions in one place."
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            New Resume
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="description"
            title="No resumes yet"
            description="Create your first resume to get started — pick a template, fill in your details, and export a polished PDF in minutes."
            actionLabel="Create Resume"
            actionOnClick={() => setIsCreateOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onOpen={handleOpen}
              onDuplicate={handleDuplicateRequest}
              onDelete={(id) => setPendingDeleteId(id)}
            />
          ))}
        </div>
      )}

      <CreateResumeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
        isSubmitting={isSubmitting}
      />

      {pendingDuplicate && (
        <DuplicateResumeDialog
          defaultTitle={pendingDuplicate.defaultTitle}
          onCancel={() => setPendingDuplicate(null)}
          onConfirm={confirmDuplicate}
          isSubmitting={isSubmitting}
        />
      )}

      {pendingResume && (
        <DeleteConfirmDialog
          resumeTitle={pendingResume.title}
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

/**
 * Lets the person name the duplicate before it's created — e.g. turning
 * "MERN Job Resume" into "MERN — Backend Focus" — instead of only being
 * able to rename after the fact. Pre-fills with "Copy of {original}" but
 * the field is fully editable and selected on open for a fast overwrite.
 */
function DuplicateResumeDialog({ defaultTitle, onCancel, onConfirm, isSubmitting }) {
  const [title, setTitle] = useState(defaultTitle);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(title);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-resume-title"
        className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-5"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-soft-indigo flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-primary">content_copy</span>
          </div>
          <div>
            <h2 id="duplicate-resume-title" className="text-sm font-semibold text-text-primary">
              Name your copy
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Give this version a name so you can tell it apart — e.g. tailored for a different role.
            </p>
          </div>
        </div>

        <label htmlFor="duplicate-title-input" className="sr-only">
          Resume name
        </label>
        <input
          id="duplicate-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onFocus={(e) => e.target.select()}
          placeholder="Untitled Resume"
          className="w-full text-sm text-text-primary bg-bg-main border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors mb-4"
        />

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Duplicating…' : 'Duplicate'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Minimal inline confirm dialog for delete — same rationale as
 * CreateResumeModal: no shared Modal/ConfirmDialog component exists yet,
 * so this stays self-contained rather than inventing a new shared one.
 */
function DeleteConfirmDialog({ resumeTitle, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-resume-title"
        className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-5"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-error">delete_outline</span>
          </div>
          <div>
            <h2 id="delete-resume-title" className="text-sm font-semibold text-text-primary">
              Delete "{resumeTitle || 'Untitled Resume'}"?
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              This can't be undone. The resume and all its content will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}