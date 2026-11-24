/**
 * portfolio.js
 * High-Performance Public Portfolio Engine
 * Implements instant SWR (Stale-While-Revalidate) caching with single-batch API aggregation
 * for ultra-fast perceived load times (< 5ms) and smooth DOM rendering.
 */

(() => {
    const CACHE_KEY = 'cached_portfolio_data';
    const { PortfolioAPI, HeroAPI, ProjectsAPI, SkillsAPI, ExperienceAPI, ServicesAPI, ContactAPI, SiteSettingsAPI, MenuItemsAPI } = window.API || {};

    const fmtYear = (dateStr) => dateStr ? new Date(dateStr).getFullYear() : null;

    const setEl = (id, value) => {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) el.textContent = value;
    };

    // ── Render Functions ──────────────────────────────────────────────────────

    const renderHero = (h) => {
        if (!h) return;
        if (h.title)       setEl('hero-heading', h.title);
        if (h.subtitle)    setEl('hero-badge',   h.subtitle);
        if (h.description) setEl('hero-subtext', h.description);

        const resumeBtn = document.getElementById('hero-resume-btn');
        if (resumeBtn && h.resumeUrl) {
            resumeBtn.href = h.resumeUrl;
            resumeBtn.style.display = 'inline-flex';
        }
    };

    const renderServices = (items = []) => {
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        if (!items.length) {
            grid.innerHTML = `
                <div class="premium-card"><div style="font-size:1.5rem;margin-bottom:1rem;color:var(--accent);"><i class="fa-solid fa-bolt"></i></div><h3>Full Stack Architecture</h3><p>Building robust backend services with clean architecture principles.</p></div>
                <div class="premium-card"><div style="font-size:1.5rem;margin-bottom:1rem;color:var(--accent);"><i class="fa-solid fa-palette"></i></div><h3>Aesthetic Interfaces</h3><p>Crafting minimal, glassmorphic layouts with premium animations.</p></div>
                <div class="premium-card"><div style="font-size:1.5rem;margin-bottom:1rem;color:var(--accent);"><i class="fa-solid fa-shield-halved"></i></div><h3>Enterprise Security</h3><p>JWT auth, token rotation, BCrypt hashing, and data validation layers.</p></div>
            `;
            return;
        }

        grid.innerHTML = items
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((s, i) => `
                <div class="premium-card" id="card-service-${i + 1}">
                    <div style="font-size: 1.5rem; margin-bottom: var(--spacing-sm); color:var(--accent);">${s.icon ? `<i class="${s.icon}"></i>` : '<i class="fa-solid fa-bolt"></i>'}</div>
                    <h3 style="margin-bottom: var(--spacing-xs);">${s.name}</h3>
                    <p>${s.description || ''}</p>
                </div>
            `).join('');

        if (window._initSpotlight) window._initSpotlight();
    };

    const renderProjects = (items = []) => {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;

        if (!items.length) {
            grid.innerHTML = `<div class="premium-card" style="text-align:center;padding:3rem;"><p style="color:var(--text-muted);">No featured projects yet.</p></div>`;
            return;
        }

        grid.innerHTML = items
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(p => `
                <div class="premium-card">
                    ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" style="width:100%;height:180px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" onerror="this.style.display='none'">` : ''}
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                        <h3 style="flex:1;">${p.title}</h3>
                        ${p.categoryTag ? `<span style="background:var(--accent-glow);color:var(--accent);font-size:0.7rem;padding:0.2rem 0.6rem;border-radius:999px;border:1px solid var(--border-color);">${p.categoryTag}</span>` : ''}
                    </div>
                    <p style="margin-bottom:1rem;font-size:0.9rem;">${p.description || ''}</p>
                    ${p.technologies ? `
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:1rem;">
                            ${p.technologies.split(',').map(t => `<span style="display:inline-block;margin:0.15rem 0.2rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:4px;padding:0.1rem 0.4rem;">${t.trim()}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div style="display:flex;gap:0.75rem;">
                        ${p.projectUrl ? `<a href="${p.projectUrl}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:0.5rem 1rem;font-size:0.8rem;">Live ↗</a>` : ''}
                        ${p.githubUrl  ? `<a href="${p.githubUrl}"  target="_blank" rel="noopener" class="btn btn-secondary" style="padding:0.5rem 1rem;font-size:0.8rem;">GitHub ↗</a>` : ''}
                    </div>
                </div>
            `).join('');

        if (window._initSpotlight) window._initSpotlight();
    };

    const renderSkills = (categories = {}) => {
        const container = document.getElementById('skills-container') || document.getElementById('skills-grid');
        if (!container) return;

        if (!Object.keys(categories).length) {
            container.innerHTML = `<p style="text-align:center;color:var(--text-muted);">No skills listed.</p>`;
            return;
        }

        container.innerHTML = Object.entries(categories).map(([cat, skills]) => `
            <div style="margin-bottom:2.5rem; width:100%;">
                <h3 style="font-size:1rem;color:var(--text-secondary);margin-bottom:1.25rem;text-transform:uppercase;letter-spacing:0.1em;">${cat}</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;">
                    ${skills.sort((a,b) => (a.order || 0) - (b.order || 0)).map(s => `
                        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:1rem 1.25rem;">
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
                                <span style="font-weight:500;color:var(--text-primary);">${s.icon ? `<i class="${s.icon}"></i> ` : ''}${s.name}</span>
                                <span style="font-size:0.75rem;color:var(--accent);">${s.proficiencyPercentage}%</span>
                            </div>
                            <div style="height:5px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;">
                                <div style="width:${s.proficiencyPercentage}%;height:100%;background:var(--accent-gradient);border-radius:3px;transition:width 1s ease;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    };

    const renderExperience = (items = []) => {
        const list = document.getElementById('experience-list') || document.getElementById('experience-timeline');
        if (!list) return;

        if (!items.length) {
            list.innerHTML = `<p style="text-align:center;color:var(--text-muted);">No experience entries listed.</p>`;
            return;
        }

        list.innerHTML = `
            <div style="max-width:780px;margin:0 auto;position:relative;">
                <div style="position:absolute;left:28px;top:0;bottom:0;width:2px;background:var(--border-color);"></div>
                ${items.sort((a, b) => (a.order || 0) - (b.order || 0)).map(e => `
                    <div style="display:flex;gap:1.5rem;margin-bottom:2rem;position:relative;">
                        <div style="width:56px;height:56px;background:var(--bg-card);border:2px solid var(--border-color);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0;z-index:1;color:var(--accent);">
                            <i class="fa-solid fa-briefcase"></i>
                        </div>
                        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:1.25rem;flex:1;backdrop-filter:blur(8px);">
                            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
                                <div>
                                    <h3 style="font-size:1rem;margin-bottom:0.2rem;">${e.jobTitle || e.role || ''}</h3>
                                    <p style="color:var(--accent);font-size:0.875rem;font-weight:500;">${e.company || e.companyName || ''}${e.location ? ' · ' + e.location : ''}</p>
                                </div>
                                <span style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap;">
                                    ${fmtYear(e.startDate)} – ${e.isCurrent ? 'Present' : (fmtYear(e.endDate) || '?')}
                                    ${e.isCurrent ? ' <span style="background:hsla(140,60%,45%,0.1);color:hsl(140,60%,60%);border:1px solid hsla(140,60%,45%,0.3);border-radius:999px;padding:0.1rem 0.5rem;font-size:0.7rem;">Current</span>' : ''}
                                </span>
                            </div>
                            ${e.description ? `<p style="font-size:0.875rem;color:var(--text-secondary);margin-top:0.75rem;line-height:1.6;">${e.description}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const applySettings = (settings = {}) => {
        if (!settings) return;
        if (settings.portfolio_theme) {
            localStorage.setItem('portfolio_theme', settings.portfolio_theme);
            if (settings.portfolio_theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
            else document.documentElement.removeAttribute('data-theme');
        }
        if (settings.portfolio_bg) {
            localStorage.setItem('portfolio_bg', settings.portfolio_bg);
            document.documentElement.style.setProperty('--bg-primary', settings.portfolio_bg);
        }
        if (settings.portfolio_accent) {
            localStorage.setItem('portfolio_accent', settings.portfolio_accent);
            document.documentElement.style.setProperty('--accent', settings.portfolio_accent);
        }
        if (settings.site_name) {
            document.title = `${settings.site_name} | Portfolio`;
        }

        // ─── Handle Maintenance Mode ───────────────────────────────────────────
        const isMaintenance = String(settings.maintenance_mode || '').trim().toLowerCase() === 'true' || settings.maintenance_mode === '1';
        const existingOverlay = document.getElementById('maintenance-overlay');
        const existingBanner  = document.getElementById('admin-maintenance-banner');

        if (isMaintenance) {
            const isAdmin = !!localStorage.getItem('access_token');
            const loginPath = window.location.pathname.includes('/public/') ? '../../admin/pages/login.html' : 'admin/pages/login.html';
            const dashPath  = window.location.pathname.includes('/public/') ? '../../admin/pages/dashboard.html' : 'admin/pages/dashboard.html';

            if (isAdmin) {
                if (existingOverlay) existingOverlay.remove();
                if (!existingBanner) {
                    const banner = document.createElement('div');
                    banner.id = 'admin-maintenance-banner';
                    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(90deg, #d97706, #b45309);color:#fff;padding:0.55rem 1.25rem;display:flex;align-items:center;justify-content:space-between;font-size:0.85rem;font-weight:500;box-shadow:0 4px 15px rgba(0,0,0,0.4);backdrop-filter:blur(8px);';
                    banner.innerHTML = `
                        <div style="display:flex;align-items:center;gap:0.6rem;">
                            <i class="fa-solid fa-triangle-exclamation" style="color:#fef08a;font-size:1.05rem;"></i>
                            <span><strong>Maintenance Mode is Active</strong> — The public site is currently locked. You have preview access as an logged-in Administrator.</span>
                        </div>
                        <a href="${dashPath}" style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.25);color:#fff;padding:0.3rem 0.8rem;border-radius:4px;text-decoration:none;font-size:0.75rem;font-weight:600;white-space:nowrap;margin-left:1rem;">Go to Admin Panel</a>
                    `;
                    document.body.prepend(banner);
                    document.body.style.paddingTop = '40px';
                }
            } else {
                if (existingBanner) {
                    existingBanner.remove();
                    document.body.style.paddingTop = '';
                }
                if (!existingOverlay) {
                    const overlay = document.createElement('div');
                    overlay.id = 'maintenance-overlay';
                    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:var(--bg-primary, #09090b);display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center;overflow-y:auto;';
                    overlay.innerHTML = `
                        <div style="max-width:540px;width:100%;background:var(--bg-card, rgba(255,255,255,0.03));border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:var(--radius-md, 16px);padding:3rem 2rem;box-shadow:0 25px 60px rgba(0,0,0,0.6);backdrop-filter:blur(16px);position:relative;">
                            <div class="brand-loader-wrap" style="margin:0 auto 1.5rem;width:48px;height:48px;">
                                <div class="loader">
                                    <div class="loader-square"></div><div class="loader-square"></div>
                                    <div class="loader-square"></div><div class="loader-square"></div>
                                    <div class="loader-square"></div><div class="loader-square"></div>
                                    <div class="loader-square"></div>
                                </div>
                            </div>
                            <div style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.35rem 0.9rem;border-radius:999px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;font-size:0.75rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:1.25rem;">
                                <i class="fa-solid fa-wrench"></i> Under Maintenance
                            </div>
                            <h1 style="font-family:var(--font-heading, inherit);font-size:1.85rem;font-weight:700;margin-bottom:0.75rem;color:var(--text-primary, #fff);line-height:1.25;">
                                ${settings.site_name ? `${settings.site_name} is` : 'Site is'} Under Scheduled Maintenance
                            </h1>
                            <p style="color:var(--text-secondary, #94a3b8);font-size:0.92rem;line-height:1.6;margin-bottom:1.75rem;">
                                ${settings.maintenance_message || "We are currently performing scheduled maintenance and updates to improve your experience. We will be back online shortly."}
                            </p>
                            ${settings.contact_email ? `
                                <div style="margin-bottom:1.75rem;padding:0.85rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;font-size:0.85rem;color:var(--text-muted, #94a3b8);">
                                    Need to reach us urgently? <a href="mailto:${settings.contact_email}" style="color:var(--accent, #818cf8);font-weight:600;text-decoration:none;">${settings.contact_email}</a>
                                </div>
                            ` : ''}
                            <div style="display:flex;align-items:center;justify-content:center;gap:1rem;">
                                <a href="${loginPath}" style="font-size:0.8rem;color:var(--text-muted, #64748b);text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1rem;border-radius:6px;border:1px solid var(--border-color, rgba(255,255,255,0.1));transition:opacity 0.2s;">
                                    <i class="fa-solid fa-lock"></i> Admin Portal
                                </a>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                }
            }
        } else {
            if (existingOverlay) existingOverlay.remove();
            if (existingBanner) {
                existingBanner.remove();
                document.body.style.paddingTop = '';
            }
        }
    };

    const renderNavigationMenu = (items) => {
        const navMenu = document.getElementById('navigation-menu');
        if (!navMenu || !items || !items.length) return;

        const visibleItems = items.filter(item => item.isVisible !== false);
        if (!visibleItems.length) return;

        const rootItems = [];
        const childrenMap = new Map();

        visibleItems.forEach(item => {
            if (item.parentId) {
                if (!childrenMap.has(item.parentId)) {
                    childrenMap.set(item.parentId, []);
                }
                childrenMap.get(item.parentId).push(item);
            } else {
                rootItems.push(item);
            }
        });

        const renderItemHTML = (item, isSubmenu = false) => {
            const children = childrenMap.get(item.id) || [];
            const hasChildren = children.length > 0;
            const targetAttr = item.isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';

            if (hasChildren) {
                return `
                    <li class="${isSubmenu ? 'nav-sub-dropdown' : 'nav-item-dropdown'}">
                        <a href="${item.url || '#'}" class="nav-dropdown-toggle" ${targetAttr}>
                            ${item.title} <i class="fa-solid ${isSubmenu ? 'fa-chevron-right' : 'fa-chevron-down'}"></i>
                        </a>
                        <ul class="nav-dropdown-menu">
                            ${children.map(c => renderItemHTML(c, true)).join('')}
                        </ul>
                    </li>
                `;
            }

            return `
                <li>
                    <a href="${item.url || '#'}" ${targetAttr}>${item.title}</a>
                </li>
            `;
        };

        const loginPath = window.location.pathname.includes('/public/') ? '../../admin/pages/login.html' : 'admin/pages/login.html';
        const loginBtnHTML = `<li><a href="${loginPath}" class="btn btn-secondary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;" id="login-button">Admin Login</a></li>`;

        navMenu.innerHTML = rootItems.map(item => renderItemHTML(item, false)).join('') + loginBtnHTML;
    };

    const renderAll = (data) => {
        if (!data) return;
        if (data.settings) applySettings(data.settings);
        if (data.menuItems) renderNavigationMenu(data.menuItems);
        if (data.hero) renderHero(data.hero);
        if (data.services) renderServices(data.services);
        if (data.projects) renderProjects(data.projects);
        if (data.skillsByCategory) renderSkills(data.skillsByCategory);
        if (data.experience) renderExperience(data.experience);
    };

    const initContactForm = () => {
        const form   = document.getElementById('contact-form');
        const status = document.getElementById('contact-form-status') || document.getElementById('cf-status');
        const submit = document.getElementById('contact-submit-btn') || document.getElementById('cf-submit');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameEl    = document.getElementById('contact-name') || document.getElementById('cf-name');
            const emailEl   = document.getElementById('contact-email') || document.getElementById('cf-email');
            const subjectEl = document.getElementById('contact-subject') || document.getElementById('cf-subject');
            const msgEl     = document.getElementById('contact-message') || document.getElementById('cf-message');

            const name    = nameEl?.value.trim();
            const email   = emailEl?.value.trim();
            const subject = subjectEl?.value.trim() || 'Portfolio Inquiry';
            const message = msgEl?.value.trim();

            if (!name || !email || !message) {
                showStatus('Please fill in all required fields.', false);
                return;
            }

            if (submit) {
                submit.disabled = true;
                submit.textContent = 'Sending…';
            }

            try {
                if (ContactAPI) {
                    await ContactAPI.submit({ name, email, subject, message });
                }
                showStatus('Message sent successfully! I will get back to you soon.', true);
                form.reset();
            } catch (err) {
                showStatus(`Failed to send message: ${err.message}`, false);
            } finally {
                if (submit) {
                    submit.disabled = false;
                    submit.textContent = 'Send Message';
                }
            }
        });

        const showStatus = (msg, success) => {
            if (!status) return;
            status.style.display = 'block';
            status.innerHTML = `${success ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>'} ${msg}`;
            status.style.background = success ? 'hsla(140,60%,45%,0.12)' : 'hsla(0,70%,50%,0.12)';
            status.style.border = `1px solid ${success ? 'hsla(140,60%,45%,0.3)' : 'hsla(0,70%,50%,0.3)'}`;
            status.style.color = success ? 'hsl(140,60%,60%)' : 'hsl(0,70%,65%)';
            status.style.padding = '0.75rem 1rem';
            status.style.borderRadius = '6px';
            status.style.fontSize = '0.85rem';
        };
    };

    // ── High-Speed Engine Execution ───────────────────────────────────────────

    (async () => {
        // 1. Instant Cache Render (0ms perceived wait time)
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                renderAll(parsed);
            }
        } catch {}

        initContactForm();

        // 2. Fetch fresh aggregated public portfolio in 1 single HTTP request
        try {
            if (PortfolioAPI) {
                const res = await PortfolioAPI.getPublic();
                if (res?.data) {
                    renderAll(res.data);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
                    return;
                }
            }
        } catch (e) {
            console.warn('Batch portfolio API unavailable, falling back to individual endpoints:', e.message);
        }

        // 3. Fallback to individual endpoints if aggregated is unavailable
        try {
            const [heroRes, servRes, projRes, skillRes, expRes, menuRes, setRes] = await Promise.allSettled([
                HeroAPI?.getActive(),
                ServicesAPI?.getAll(),
                ProjectsAPI?.getFeatured(),
                SkillsAPI?.byCategory(),
                ExperienceAPI?.getAll(),
                MenuItemsAPI?.getAll(),
                SiteSettingsAPI?.getDictionary()
            ]);

            if (setRes.status === 'fulfilled') applySettings(setRes.value?.data);
            if (menuRes.status === 'fulfilled') renderNavigationMenu(menuRes.value?.data);
            if (heroRes.status === 'fulfilled') renderHero(heroRes.value?.data);
            if (servRes.status === 'fulfilled') renderServices(servRes.value?.data);
            if (projRes.status === 'fulfilled') renderProjects(projRes.value?.data);
            if (skillRes.status === 'fulfilled') renderSkills(skillRes.value?.data);
            if (expRes.status === 'fulfilled') renderExperience(expRes.value?.data);
        } catch (err) {
            console.error('Portfolio fallback load error:', err);
        }
    })();
})();
