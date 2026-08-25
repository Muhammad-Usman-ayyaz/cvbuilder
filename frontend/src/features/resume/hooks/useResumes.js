import { useState, useEffect, useCallback } from 'react';
import * as resumeApi from '../api/resumeApi';
import { createEmptyResume, duplicateResume as duplicateResumeModel } from '../utils/resumeModel';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * CRUD hook for resumes, backed by resumeStorage (now Supabase, was
 * localStorage).
 *
 * This is the single source of truth for resume state across the feature —
 * both MyResumesPage (list/grid) and ResumeStudioPage (single-resume editor)
 * should go through this hook rather than importing resumeStorage directly,
 * so all consumers stay in sync via React state.
 *
 * BEHAVIOR CHANGES vs. the old localStorage version:
 * - Every mutating function (createResume, saveResume, duplicateResume,
 *   deleteResume) is now async — callers must `await` them.
 * - Resumes are scoped to the signed-in user (via useAuth()) instead of
 *   being global to the browser, so getAllResumes(userId) needs a user.
 * - seedIfFirstVisit() has been removed. A brand-new real account should
 *   start with an empty "My Resumes" grid, not a fake sample resume.
 * - The old cross-tab sync via the `storage` event was localStorage-only
 *   and doesn't apply to a real backend, so it's been dropped too. (If
 *   live multi-tab sync is wanted later, Supabase Realtime can do this,
 *   but that's a separate addition, not part of this migration.)
 *
 * @returns {{
 *   resumes: import('../utils/resumeModel').ResumeDocument[],
 *   isLoading: boolean,
 *   getResume: (id: string) => import('../utils/resumeModel').ResumeDocument | undefined,
 *   createResume: (params: { title: string, templateId?: string, themeColor?: string }) => Promise<import('../utils/resumeModel').ResumeDocument>,
 *   saveResume: (resume: import('../utils/resumeModel').ResumeDocument) => Promise<import('../utils/resumeModel').ResumeDocument>,
 *   duplicateResume: (id: string) => Promise<import('../utils/resumeModel').ResumeDocument | null>,
 *   deleteResume: (id: string) => Promise<void>,
 * }}
 */
export function useResumes() {
    const { user } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!user) {
            setResumes([]);
            return;
        }
        const data = await resumeApi.getAllResumes();
        setResumes(data);
    }, [user]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);
            try {
                await refresh();
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();

        return () => {
            cancelled = true;
        };
    }, [refresh]);

    /**
     * @param {string} id
     */
    const getResume = useCallback(
        (id) => resumes.find((r) => r.id === id),
        [resumes]
    );

    /**
     * Creates and persists a brand-new resume, returning it so the caller
     * can immediately navigate to the studio with its id.
     * @param {{ title: string, templateId?: string, themeColor?: string }} params
     */
    const createResume = useCallback(
        async (params) => {
            const resume = createEmptyResume(params);
            const saved = await resumeApi.upsertResume(resume);
            setResumes((prev) => [saved, ...prev]);
            return saved;
        },
        [user]
    );

    /**
     * Full upsert — used by the studio for both manual "Save" and autosave.
     * @param {import('../utils/resumeModel').ResumeDocument} resume
     */
    const saveResume = useCallback(
        async (resume) => {
            const saved = await resumeApi.upsertResume(resume);
            setResumes((prev) => {
                const exists = prev.some((r) => r.id === saved.id);
                return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
            });
            return saved;
        },
        [user]
    );

    /**
     * @param {string} id
     * @returns {Promise<import('../utils/resumeModel').ResumeDocument | null>}
     */
    const duplicateResume = useCallback(
        async (id) => {
            const source = await resumeApi.getResumeById(id);
            if (!source) return null;
            const copy = duplicateResumeModel(source);
            const saved = await resumeApi.upsertResume(copy);
            setResumes((prev) => [saved, ...prev]);
            return saved;
        },
        [user]
    );

    /**
     * @param {string} id
     */
    const deleteResume = useCallback(async (id) => {
        await resumeApi.removeResume(id);
        setResumes((prev) => prev.filter((r) => r.id !== id));
    }, []);

    return {
        resumes,
        isLoading,
        getResume,
        createResume,
        saveResume,
        duplicateResume,
        deleteResume,
    };
}