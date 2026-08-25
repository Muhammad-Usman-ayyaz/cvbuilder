import { supabase } from '../config/supabase.js';

export async function getProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertProfile(profileData, userId) {
    if (!userId) throw new Error("User ID is required");

    // Supabase profiles table uses 'id' as the foreign key to auth.users
    const dbPayload = {
        id: userId,
        full_name: profileData.fullName !== undefined ? profileData.fullName : undefined,
        professional_title: profileData.professionalTitle,
        email: profileData.email,
        phone: profileData.phone,
        city: profileData.city,
        country: profileData.country,
        linkedin_url: profileData.linkedinUrl,
        github_url: profileData.githubUrl,
        portfolio_url: profileData.portfolioUrl,
        education: profileData.education || [],
        experience: profileData.experience || [],
        skills: profileData.skills || [],
        projects: profileData.projects || [],
        certifications: profileData.certifications || [],
        achievements: profileData.achievements || [],
        languages: profileData.languages || [],
        updated_at: new Date().toISOString()
    };

    // Remove undefined fields to prevent overwriting with null unintentionally if partial update
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const { data, error } = await supabase
        .from('profiles')
        .upsert(dbPayload)
        .select()
        .single();

    if (error) throw error;
    return data;
}
