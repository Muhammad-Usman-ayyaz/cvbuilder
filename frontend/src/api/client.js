const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-flight GET request deduplication map
const inFlightRequests = new Map();

// Short-lived memory cache for idempotent GET requests (TTL in ms)
const responseCache = new Map();
const DEFAULT_GET_TTL_MS = 5000;

/**
 * Invalidates cache entries matching a prefix or pattern.
 * @param {string} prefix
 */
export function invalidateCache(prefix) {
    if (!prefix) {
        responseCache.clear();
        return;
    }
    for (const key of responseCache.keys()) {
        if (key.includes(prefix)) {
            responseCache.delete(key);
        }
    }
}

export async function fetchApi(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const method = (config.method || 'GET').toUpperCase();
    const isGet = method === 'GET';
    const cacheKey = `${token || 'anon'}:${method}:${endpoint}`;

    // On mutating requests (POST, PUT, DELETE, PATCH), invalidate related GET caches
    if (!isGet) {
        if (endpoint.startsWith('/resumes')) {
            invalidateCache('/resumes');
        } else if (endpoint.startsWith('/ats')) {
            invalidateCache('/ats');
        } else if (endpoint.startsWith('/templates')) {
            invalidateCache('/templates');
        } else if (endpoint.startsWith('/profile')) {
            invalidateCache('/profile');
        }
    }

    // For GET requests, check memory cache unless forceRefresh is true
    if (isGet && !options.forceRefresh) {
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < (options.ttl ?? DEFAULT_GET_TTL_MS)) {
            return structuredClone(cached.data);
        }

        // In-flight deduplication: reuse active request promise if one is already pending
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }
    }

    const executeRequest = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            let data;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                const error = new Error((data && data.error) || response.statusText || 'An error occurred');
                if (data && data.code) error.code = data.code;
                throw error;
            }

            if (isGet) {
                responseCache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                });
            }

            return data;
        } finally {
            if (isGet) {
                inFlightRequests.delete(cacheKey);
            }
        }
    };

    if (isGet) {
        const promise = executeRequest();
        inFlightRequests.set(cacheKey, promise);
        return promise;
    }

    return executeRequest();
}
