const getBaseUrl = () => {
    // If running on Capacitor (native), use the host IP for the emulator
    // On Android emulator, 10.0.2.2 points to host machine localhost
    if (typeof window !== 'undefined' && (window as any).Capacitor?.getPlatform() === 'android') {
        return 'http://10.0.2.2:3002/api';
    }
    return 'http://localhost:3002/api';
};

const API_URL = getBaseUrl();

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const api = {
    auth: {
        register: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Registration failed');
            }
            return res.json();
        },
        login: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let errorMessage = 'Login failed';
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    const text = await res.text();
                    errorMessage = text || `Error ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return res.json();
        },
        getProfile: async () => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        updateProfile: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return res.json();
        },
    },
    activities: {
        list: async () => {
            const res = await fetch(`${API_URL}/activities`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch activities');
            return res.json();
        },
        clear: async () => {
            const res = await fetch(`${API_URL}/activities/clear`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed: ${res.status} ${res.statusText} - ${text}`);
            }
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create activity');
            return res.json();
        },
    },
    travel: {
        list: async () => {
            const res = await fetch(`${API_URL}/travel`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch travel history');
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/travel`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create travel segment');
            return res.json();
        },
    },
    goals: {
        list: async () => {
            const res = await fetch(`${API_URL}/goals`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch goals');
            return res.json();
        },
        clear: async () => {
            const res = await fetch(`${API_URL}/goals/clear`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed: ${res.status} ${res.statusText} - ${text}`);
            }
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create goal');
            return res.json();
        },
    },
    insights: {
        get: async () => {
            const res = await fetch(`${API_URL}/insights`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch insights');
            return res.json();
        }
    },
    admin: {
        getUsers: async () => {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
        getFactors: async () => {
            const res = await fetch(`${API_URL}/emission-factors`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch emission factors');
            return res.json();
        },
        updateFactor: async (id: number, factor: number) => {
            const res = await fetch(`${API_URL}/admin/emission-factors/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ factor }),
            });
            if (!res.ok) throw new Error('Failed to update emission factor');
            return res.json();
        },
        getRecommendations: async () => {
            const res = await fetch(`${API_URL}/admin/recommendations`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch recommendations');
            return res.json();
        },
        createRecommendation: async (data: any) => {
            const res = await fetch(`${API_URL}/admin/recommendations`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create recommendation');
            return res.json();
        },
        updateRecommendation: async (id: number, data: any) => {
            const res = await fetch(`${API_URL}/admin/recommendations/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update recommendation');
            return res.json();
        },
        deleteRecommendation: async (id: number) => {
            const res = await fetch(`${API_URL}/admin/recommendations/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to delete recommendation');
            return res.json();
        },
    }
};
