import { supabase } from '../config/supabase.js';

export async function signUpUser({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
}

export async function loginUser({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getUserProfile(userId) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

    return profile;
}

export async function updateUserProfile(userId, fullName) {
    const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);
    if (error) throw error;
}
