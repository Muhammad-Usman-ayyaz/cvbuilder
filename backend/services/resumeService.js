import { supabase } from '../config/supabase.js';

function fromDbRow(row) {
    if (!row) return undefined;
    return {
        id: row.id,
        title: row.title,
        templateId: row.template_id,
        themeColor: row.theme_color,
        updatedAt: row.updated_at,
        content: row.content,
    };
}

function toDbRow(resume, userId) {
    return {
        id: resume.id,
        user_id: userId,
        title: resume.title,
        template_id: resume.templateId,
        theme_color: resume.themeColor,
        content: resume.content,
    };
}

export async function getAllResumes(userId) {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data.map(fromDbRow);
}

export async function getResumeById(id) {
    const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return fromDbRow(data);
}

export async function upsertResume(resume, userId) {
    const { data, error } = await supabase
        .from('resumes')
        .upsert(toDbRow(resume, userId))
        .select()
        .single();

    if (error) throw error;
    return fromDbRow(data);
}

export async function removeResume(id) {
    const { error, count } = await supabase
        .from('resumes')
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) throw error;
    return (count ?? 0) > 0;
}
