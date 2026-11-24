/**
 * API Service Layer
 * Centralizes all HTTP communication with the backend.
 * Handles: base URL, auth headers, token refresh, error normalization.
 */

const API_BASE = 'http://localhost:5100/api';

// ─── Token Helpers ────────────────────────────────────────────────────────────

const Auth = {
    getAccess:   () => localStorage.getItem('access_token'),
    getToken:    () => localStorage.getItem('access_token'),
    getRefresh:  () => localStorage.getItem('refresh_token'),
    setTokens:   (access, refresh) => {
        localStorage.setItem('access_token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
    },
    setSession:  (token, user) => {
        localStorage.setItem('access_token', token);
        if (user) localStorage.setItem('admin_user', JSON.stringify(user));
    },
    clear:       () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin_user');
    },
    isLoggedIn:  () => !!localStorage.getItem('access_token'),
    setUser:     (user) => localStorage.setItem('admin_user', JSON.stringify(user)),
    getUser:     () => {
        try { return JSON.parse(localStorage.getItem('admin_user')); }
        catch { return null; }
    }
};

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];

async function apiFetch(endpoint, options = {}, retry = true) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = Auth.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    // Auto-refresh on 401 (excluding auth endpoints like login/register)
    if (res.status === 401 && retry && !endpoint.startsWith('/auth/')) {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    // Drain queue
                    refreshQueue.forEach(resolve => resolve());
                    refreshQueue = [];
                    isRefreshing = false;
                    return apiFetch(endpoint, options, false); // Retry once
                } else {
                    Auth.clear();
                    if (window.location.href.includes('dashboard.html')) {
                        console.warn("API Auth failure: Redirect bypassed in dashboard.html for UI testing.");
                        return;
                    }
                    window.location.href = '/pages/login.html';
                    return;
                }
            } catch {
                Auth.clear();
                if (window.location.href.includes('dashboard.html')) {
                    console.warn("API Auth failure: Redirect bypassed in dashboard.html for UI testing.");
                    return;
                }
                window.location.href = '/pages/login.html';
                return;
            }
        } else {
            // Queue the retry
            return new Promise(resolve => {
                refreshQueue.push(() => resolve(apiFetch(endpoint, options, false)));
            });
        }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const message = data.message || data.errors?.[0] || `HTTP ${res.status}`;
        throw new ApiError(message, res.status, data.errors);
    }

    return data;
}

async function refreshAccessToken() {
    const refreshToken = Auth.getRefresh();
    if (!refreshToken) return false;

    const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.success && data.data?.accessToken) {
        Auth.setTokens(data.data.accessToken, data.data.refreshToken || refreshToken);
        return true;
    }
    return false;
}

class ApiError extends Error {
    constructor(message, status, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

const AuthAPI = {
    login: (emailOrCreds, password) => {
        const payload = (typeof emailOrCreds === 'object' && emailOrCreds !== null)
            ? emailOrCreds
            : { email: emailOrCreds, password };
        return apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    register: (email, password, fullName) =>
        apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName })
        }),

    logout: () =>
        apiFetch('/auth/logout', { method: 'POST' }).finally(() => Auth.clear()),

    refresh: (refreshToken) =>
        apiFetch('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        })
};

// ─── Public Portfolio Endpoints ───────────────────────────────────────────────

const HeroAPI = {
    getActive: () => apiFetch('/herosection/active'),
    getAll:    () => apiFetch('/herosection'),
    create:    (dto) => apiFetch('/herosection', { method: 'POST', body: JSON.stringify(dto) }),
    update:    (id, dto) => apiFetch(`/herosection/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:    (id) => apiFetch(`/herosection/${id}`, { method: 'DELETE' })
};

const PagesAPI = {
    getAll:    () => apiFetch('/pages'),
    getById:   (id) => apiFetch(`/pages/${id}`),
    getBySlug: (slug) => apiFetch(`/pages/slug/${slug}`),
    create:    (dto) => apiFetch('/pages', { method: 'POST', body: JSON.stringify(dto) }),
    update:    (id, dto) => apiFetch(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:    (id) => apiFetch(`/pages/${id}`, { method: 'DELETE' })
};

const ProjectsAPI = {
    getAll:      () => apiFetch('/projects'),
    getFeatured: () => apiFetch('/projects/featured'),
    getById:     (id) => apiFetch(`/projects/${id}`),
    create:      (dto) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(dto) }),
    update:      (id, dto) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:      (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' })
};

const SkillsAPI = {
    getAll:       () => apiFetch('/skills'),
    byCategory:   () => apiFetch('/skills/by-category'),
    getById:      (id) => apiFetch(`/skills/${id}`),
    create:       (dto) => apiFetch('/skills', { method: 'POST', body: JSON.stringify(dto) }),
    update:       (id, dto) => apiFetch(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:       (id) => apiFetch(`/skills/${id}`, { method: 'DELETE' })
};

const ExperienceAPI = {
    getAll:  () => apiFetch('/experience'),
    getById: (id) => apiFetch(`/experience/${id}`),
    create:  (dto) => apiFetch('/experience', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/experience/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/experience/${id}`, { method: 'DELETE' })
};

const EducationAPI = {
    getAll:  () => apiFetch('/education'),
    getById: (id) => apiFetch(`/education/${id}`),
    create:  (dto) => apiFetch('/education', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/education/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/education/${id}`, { method: 'DELETE' })
};

const CertificatesAPI = {
    getAll:  () => apiFetch('/certificates'),
    getById: (id) => apiFetch(`/certificates/${id}`),
    create:  (dto) => apiFetch('/certificates', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/certificates/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/certificates/${id}`, { method: 'DELETE' })
};

const ServicesAPI = {
    getAll:  () => apiFetch('/services'),
    getById: (id) => apiFetch(`/services/${id}`),
    create:  (dto) => apiFetch('/services', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/services/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/services/${id}`, { method: 'DELETE' })
};

const TestimonialsAPI = {
    getAll:  () => apiFetch('/testimonials'),
    getById: (id) => apiFetch(`/testimonials/${id}`),
    create:  (dto) => apiFetch('/testimonials', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/testimonials/${id}`, { method: 'DELETE' })
};

const SocialLinksAPI = {
    getAll:  () => apiFetch('/sociallinks'),
    getById: (id) => apiFetch(`/sociallinks/${id}`),
    create:  (dto) => apiFetch('/sociallinks', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/sociallinks/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/sociallinks/${id}`, { method: 'DELETE' })
};

const StatisticsAPI = {
    getAll:  () => apiFetch('/statistics'),
    getById: (id) => apiFetch(`/statistics/${id}`),
    create:  (dto) => apiFetch('/statistics', { method: 'POST', body: JSON.stringify(dto) }),
    update:  (id, dto) => apiFetch(`/statistics/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:  (id) => apiFetch(`/statistics/${id}`, { method: 'DELETE' })
};

const ContactAPI = {
    submit:       (dto) => apiFetch('/contactmessages', { method: 'POST', body: JSON.stringify(dto) }),
    getAll:       () => apiFetch('/contactmessages'),
    getUnread:    () => apiFetch('/contactmessages/unread-count'),
    markRead:     (id) => apiFetch(`/contactmessages/${id}`, {
                      method: 'PATCH', body: JSON.stringify({ isRead: true })
                  }),
    delete:       (id) => apiFetch(`/contactmessages/${id}`, { method: 'DELETE' })
};

const SiteSettingsAPI = {
    getAll:        () => apiFetch('/sitesettings'),
    getDictionary: () => apiFetch('/sitesettings/dictionary'),
    getByKey:      (key) => apiFetch(`/sitesettings/by-key/${key}`),
    create:        (dto) => apiFetch('/sitesettings', { method: 'POST', body: JSON.stringify(dto) }),
    upsert:        (dto) => apiFetch('/sitesettings/upsert', { method: 'POST', body: JSON.stringify(dto) }),
    set:           (key, value) => apiFetch('/sitesettings/upsert', { method: 'POST', body: JSON.stringify({ key, value: String(value) }) }),
    update:        (id, dto) => apiFetch(`/sitesettings/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:        (id) => apiFetch(`/sitesettings/${id}`, { method: 'DELETE' }),
    testEmail:     (dto) => apiFetch('/sitesettings/test-email', { method: 'POST', body: JSON.stringify(dto || {}) })
};

const MenuItemsAPI = {
    getAll:    () => apiFetch('/menuitems'),
    getById:   (id) => apiFetch(`/menuitems/${id}`),
    create:    (dto) => apiFetch('/menuitems', { method: 'POST', body: JSON.stringify(dto) }),
    update:    (id, dto) => apiFetch(`/menuitems/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:    (id) => apiFetch(`/menuitems/${id}`, { method: 'DELETE' }),
    batchSave: (items) => apiFetch('/menuitems/batch', { method: 'POST', body: JSON.stringify(items) })
};

const MenusAPI = {
    getAll:         () => apiFetch('/menus'),
    getById:        (id) => apiFetch(`/menus/${id}`),
    create:         (dto) => apiFetch('/menus', { method: 'POST', body: JSON.stringify(dto) }),
    update:         (id, dto) => apiFetch(`/menus/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    delete:         (id) => apiFetch(`/menus/${id}`, { method: 'DELETE' }),
    batchSaveItems: (menuId, items) => apiFetch(`/menus/${menuId}/items/batch`, { method: 'POST', body: JSON.stringify(items) })
};

const UploadAPI = {
    getAll: () => apiFetch('/uploads'),
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = Auth.getToken();
        return fetch(`${API_BASE}/uploads/image`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new ApiError(data.message || 'Upload failed', res.status);
            return data;
        });
    },
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = Auth.getToken();
        return fetch(`${API_BASE}/uploads/file`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new ApiError(data.message || 'Upload failed', res.status);
            return data;
        });
    },
    uploadMedia: (file) => {
        const ext = (file.name || '').split('.').pop().toLowerCase();
        const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
        return isImg ? UploadAPI.uploadImage(file) : UploadAPI.uploadFile(file);
    },
    delete: (fileName) => apiFetch(`/uploads/${encodeURIComponent(fileName)}`, { method: 'DELETE' })
};

const PortfolioAPI = {
    getPublic: () => apiFetch('/portfolio/public'),
    clearCache: () => apiFetch('/portfolio/clear-cache', { method: 'POST' })
};

// ─── File System API (Admin File Organizer) ───────────────────────────────────

const FileSystemAPI = {
    /** List directory contents at the given relative path */
    browse:  (path = '')     => apiFetch(`/filesystem/browse?path=${encodeURIComponent(path)}`),
    /** Read a text file's content */
    read:    (path)          => apiFetch(`/filesystem/read?path=${encodeURIComponent(path)}`),
    /** Write (create/overwrite) a text file */
    write:   (path, content) => apiFetch('/filesystem/write', { method: 'POST', body: JSON.stringify({ relativePath: path, content }) }),
    /** Create a new file or directory */
    create:  (path, isDir)   => apiFetch('/filesystem/create', { method: 'POST', body: JSON.stringify({ relativePath: path, isDirectory: isDir }) }),
    /** Rename a file or directory */
    rename:  (path, newName) => apiFetch('/filesystem/rename', { method: 'POST', body: JSON.stringify({ relativePath: path, newName }) }),
    /** Delete a file or directory */
    delete:  (path)          => apiFetch(`/filesystem/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
    /** Get root path info */
    rootInfo: ()             => apiFetch('/filesystem/root-info')
};

// ─── Plugins API ────────────────────────────────────────────────────────────────

const PluginsAPI = {
    getAvailable: () => apiFetch('/plugins/available'),
    install:      (id) => apiFetch(`/plugins/install/${encodeURIComponent(id)}`, { method: 'POST' }),
    delete:       (id) => apiFetch(`/plugins/${encodeURIComponent(id)}`, { method: 'DELETE' })
};

// ─── Export ───────────────────────────────────────────────────────────────────

window.API = {
    Auth, AuthAPI,
    PortfolioAPI,
    PagesAPI,
    HeroAPI, ProjectsAPI, SkillsAPI,
    ExperienceAPI, EducationAPI, CertificatesAPI,
    ServicesAPI, TestimonialsAPI, SocialLinksAPI,
    StatisticsAPI, ContactAPI, SiteSettingsAPI,
    MenuItemsAPI, MenusAPI, UploadAPI,
    FileSystemAPI, PluginsAPI,
    ApiError
};
