import { fetchApi } from '../../../api/client.js';

export async function login(email, password) {
    return fetchApi('/auth/login', {
        method: 'POST',
        body: { email, password },
    });
}

export async function signup(email, password, fullName) {
    return fetchApi('/auth/signup', {
        method: 'POST',
        body: { email, password, fullName },
    });
}

export async function logout() {
    return fetchApi('/auth/logout', {
        method: 'POST',
    });
}

export async function getMe() {
    return fetchApi('/auth/me', {
        method: 'GET',
    });
}

export async function updateProfile(fullName) {
    return fetchApi('/auth/profile', {
        method: 'PUT',
        body: { fullName },
    });
}
