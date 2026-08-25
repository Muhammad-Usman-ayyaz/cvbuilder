import { fetchApi } from './client';

export async function getProfile() {
    const data = await fetchApi('/profile');
    return data;
}

export async function upsertProfile(profileData) {
    const data = await fetchApi('/profile', {
        method: 'POST',
        body: profileData,
    });
    return data;
}
