import { useState, useEffect, useCallback } from 'react';
import * as resumeApi from '../api/resumeApi';
import { createEmptyResume, duplicateResume as duplicateResumeModel } from '../utils/resumeModel';
import { useAuth } from '../../auth/context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';

// Shared module-level store across all hook consumers
let sharedResumes = [];
let sharedIsLoading = true;
let hasInitialLoadCompleted = false;
let activeFetchPromise = null;
const subscribers = new Set();

function notifySubscribers() {
    for (const sub of subscribers) {
        sub({ resumes: sharedResumes, isLoading: sharedIsLoading });
    }
}

export function useResumes() {
    const { user } = useAuth();
    const { profile } = useProfile();

    const [state, setState] = useState(() => ({
        resumes: sharedResumes,
        isLoading: hasInitialLoadCompleted ? false : sharedIsLoading,
    }));

    const refresh = useCallback(async () => {
        if (!user) {
            sharedResumes = [];
            sharedIsLoading = false;
            hasInitialLoadCompleted = false;
            notifySubscribers();
            return;
        }

        if (activeFetchPromise) {
            return activeFetchPromise;
        }

        activeFetchPromise = (async () => {
            try {
                if (!hasInitialLoadCompleted) {
                    sharedIsLoading = true;
                    notifySubscribers();
                }
                const data = await resumeApi.getAllResumes();
                sharedResumes = Array.isArray(data) ? data : [];
                hasInitialLoadCompleted = true;
            } catch (err) {
                console.error('Failed to load resumes', err);
            } finally {
                sharedIsLoading = false;
                activeFetchPromise = null;
                notifySubscribers();
            }
        })();

        return activeFetchPromise;
    }, [user]);

    useEffect(() => {
        subscribers.add(setState);

        if (user && !hasInitialLoadCompleted && !activeFetchPromise) {
            refresh();
        } else if (!user && sharedResumes.length > 0) {
            sharedResumes = [];
            hasInitialLoadCompleted = false;
            sharedIsLoading = false;
            notifySubscribers();
        }

        return () => {
            subscribers.delete(setState);
        };
    }, [user, refresh]);

    /**
     * @param {string} id
     */
    const getResume = useCallback(
        (id) => state.resumes.find((r) => r.id === id),
        [state.resumes]
    );

    /**
     * @param {{ title: string, templateId?: string, themeColor?: string }} params
     */
    const createResume = useCallback(
        async (params) => {
            const resume = createEmptyResume({ ...params, profile: params?.profile || profile });
            const saved = await resumeApi.upsertResume(resume);
            sharedResumes = [saved, ...sharedResumes.filter((r) => r.id !== saved.id)];
            notifySubscribers();
            return saved;
        },
        [profile]
    );

    /**
     * @param {import('../utils/resumeModel').ResumeDocument} resume
     */
    const saveResume = useCallback(async (resume) => {
        const saved = await resumeApi.upsertResume(resume);
        const exists = sharedResumes.some((r) => r.id === saved.id);
        sharedResumes = exists
            ? sharedResumes.map((r) => (r.id === saved.id ? saved : r))
            : [saved, ...sharedResumes];
        notifySubscribers();
        return saved;
    }, []);

    /**
     * @param {string} id
     * @returns {Promise<import('../utils/resumeModel').ResumeDocument | null>}
     */
    const duplicateResume = useCallback(async (id) => {
        let source = sharedResumes.find((r) => r.id === id);
        if (!source) {
            source = await resumeApi.getResumeById(id);
        }
        if (!source) return null;
        const copy = duplicateResumeModel(source);
        const saved = await resumeApi.upsertResume(copy);
        sharedResumes = [saved, ...sharedResumes];
        notifySubscribers();
        return saved;
    }, []);

    /**
     * @param {string} id
     */
    const deleteResume = useCallback(async (id) => {
        await resumeApi.removeResume(id);
        sharedResumes = sharedResumes.filter((r) => r.id !== id);
        notifySubscribers();
    }, []);

    return {
        resumes: state.resumes,
        isLoading: state.isLoading,
        refresh,
        getResume,
        createResume,
        saveResume,
        duplicateResume,
        deleteResume,
    };
}