/**
 * PagesManager Component
 * Clean, streamlined Pages management table + Unified Home Page Section Studio.
 * Combines all 10 portfolio content sections into a single dynamic Home Page manager.
 */

window.PagesManager = (() => {
    let APIs = {};
    let showToast = null;
    let openModal = null;
    let closeModal = null;
    let switchPanel = null;

    let activeTab = 'all';
    let searchQuery = '';
    let isStudioOpen = false;
    let sectionDataCache = {};

    const sectionDefinitions = [
        {
            id: 'hero',
            title: 'Hero Section',
            slug: 'hero-section',
            icon: 'fa-solid fa-user-tie',
            iconColor: '#3b82f6',
            desc: 'Homepage headline, introduction bio, profile picture, and downloadable resume.',
            endpointKey: 'HeroAPI',
            panelId: 'hero'
        },
        {
            id: 'services',
            title: 'Specialized Services',
            slug: 'services',
            icon: 'fa-solid fa-bolt',
            iconColor: '#eab308',
            desc: 'Client service offerings, icons, summaries, and display ordering.',
            endpointKey: 'ServicesAPI',
            panelId: 'services'
        },
        {
            id: 'projects',
            title: 'Featured Projects',
            slug: 'projects',
            icon: 'fa-solid fa-folder-open',
            iconColor: '#a855f7',
            desc: 'Portfolio showcase items, category filters, tech tags, GitHub & live preview URLs.',
            endpointKey: 'ProjectsAPI',
            panelId: 'projects'
        },
        {
            id: 'skills',
            title: 'Technical Skills',
            slug: 'skills',
            icon: 'fa-solid fa-gears',
            iconColor: '#10b981',
            desc: 'Categorized technical proficiencies, skill bars, and icon indicators.',
            endpointKey: 'SkillsAPI',
            panelId: 'skills'
        },
        {
            id: 'experience',
            title: 'Work Experience',
            slug: 'experience',
            icon: 'fa-solid fa-briefcase',
            iconColor: '#f97316',
            desc: 'Career timeline, roles, organizations, dates, and responsibilities.',
            endpointKey: 'ExperienceAPI',
            panelId: 'experience'
        },
        {
            id: 'education',
            title: 'Academic Education',
            slug: 'education',
            icon: 'fa-solid fa-graduation-cap',
            iconColor: '#06b6d4',
            desc: 'Degrees, educational institutions, majors, and study dates.',
            endpointKey: 'EducationAPI',
            panelId: 'education'
        },
        {
            id: 'certificates',
            title: 'Certificates & Credentials',
            slug: 'certificates',
            icon: 'fa-solid fa-award',
            iconColor: '#ec4899',
            desc: 'Professional certificates, license IDs, issuing bodies, and verification links.',
            endpointKey: 'CertificatesAPI',
            panelId: 'certificates'
        },
        {
            id: 'testimonials',
            title: 'Client Testimonials',
            slug: 'testimonials',
            icon: 'fa-solid fa-comments',
            iconColor: '#8b5cf6',
            desc: 'Client reviews, ratings, designations, companies, and avatars.',
            endpointKey: 'TestimonialsAPI',
            panelId: 'testimonials'
        },
        {
            id: 'statistics',
            title: 'Key Statistics',
            slug: 'statistics',
            icon: 'fa-solid fa-chart-simple',
            iconColor: '#22c55e',
            desc: 'Numeric counters and quantifiable career milestones.',
            endpointKey: 'StatisticsAPI',
            panelId: 'statistics'
        },
        {
            id: 'social',
            title: 'Social Profiles',
            slug: 'social',
            icon: 'fa-solid fa-link',
            iconColor: '#0ea5e9',
            desc: 'Social network icons and external link connections.',
            endpointKey: 'SocialLinksAPI',
            panelId: 'social'
        }
    ];

    // Fetch dynamic content data from backend
    const fetchAllDynamicData = async () => {
        try {
            const [
                hero, services, projects, skills, exp,
                edu, certs, tests, stats, social, msgs, pagesRes
            ] = await Promise.allSettled([
                APIs.HeroAPI?.getActive?.(),
                APIs.ServicesAPI?.getAll?.(),
                APIs.ProjectsAPI?.getAll?.(),
                APIs.SkillsAPI?.getAll?.(),
                APIs.ExperienceAPI?.getAll?.(),
                APIs.EducationAPI?.getAll?.(),
                APIs.CertificatesAPI?.getAll?.(),
                APIs.TestimonialsAPI?.getAll?.(),
                APIs.StatisticsAPI?.getAll?.(),
                APIs.SocialLinksAPI?.getAll?.(),
                APIs.ContactAPI?.getAll?.(),
                APIs.PagesAPI?.getAll?.()
            ]);

            sectionDataCache = {
                hero: hero.status === 'fulfilled' ? hero.value?.data : null,
                services: services.status === 'fulfilled' ? (services.value?.data || []) : [],
                projects: projects.status === 'fulfilled' ? (projects.value?.data || []) : [],
                skills: skills.status === 'fulfilled' ? (skills.value?.data || []) : [],
                experience: exp.status === 'fulfilled' ? (exp.value?.data || []) : [],
                education: edu.status === 'fulfilled' ? (edu.value?.data || []) : [],
                certificates: certs.status === 'fulfilled' ? (certs.value?.data || []) : [],
                testimonials: tests.status === 'fulfilled' ? (tests.value?.data || []) : [],
                statistics: stats.status === 'fulfilled' ? (stats.value?.data || []) : [],
                social: social.status === 'fulfilled' ? (social.value?.data || []) : [],
                messages: msgs.status === 'fulfilled' ? (msgs.value?.data || []) : [],
                pages: (pagesRes && pagesRes.status === 'fulfilled') ? (pagesRes.value?.data || []) : []
            };
        } catch (e) {
            console.warn('PagesManager data fetch error:', e);
        }
    };

    const getSectionCount = (id) => {
        const data = sectionDataCache[id];
        if (!data) return 0;
        if (Array.isArray(data)) return data.length;
        if (typeof data === 'object') return 1;
        return 0;
    };

    const renderPagesTableHTML = () => {
        const unreadMsgs = (sectionDataCache.messages || []).filter(m => !m.isRead).length;
        const authorName = (window.API?.Auth?.getUser()?.email?.split('@')[0]) || 'admin';
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

        const showHome = !searchQuery || 'home front page'.includes(searchQuery.toLowerCase());

        return `
            <div class="wp-wrap">
                <!-- Clean Header with Title & Add Page Button -->
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:0.75rem;">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <h1 class="wp-heading-inline" style="margin:0;">Pages</h1>
                        <button class="wp-page-title-action" id="btn-wp-add-page">
                            <i class="fa-solid fa-plus"></i> Add Page
                        </button>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <a href="../../index.html" target="_blank" class="wp-page-title-action" style="background:var(--bg-secondary);border-color:var(--border-color);color:var(--text-primary);">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> View Live Site
                        </a>
                    </div>
                </div>

                <!-- Clean Filter Tabs: All | Mine | Published | Draft | Trash -->
                <ul class="wp-subsubsub">
                    <li><a href="#" class="${activeTab === 'all' ? 'current' : ''}" data-tab="all">All <span class="count">(1)</span></a> <span class="sep">|</span></li>
                    <li><a href="#" class="${activeTab === 'mine' ? 'current' : ''}" data-tab="mine">Mine <span class="count">(1)</span></a> <span class="sep">|</span></li>
                    <li><a href="#" class="${activeTab === 'published' ? 'current' : ''}" data-tab="published">Published <span class="count">(1)</span></a> <span class="sep">|</span></li>
                    <li><a href="#" class="${activeTab === 'draft' ? 'current' : ''}" data-tab="draft">Draft <span class="count">(0)</span></a> <span class="sep">|</span></li>
                    <li><a href="#" class="${activeTab === 'trash' ? 'current' : ''}" data-tab="trash">Trash <span class="count">(0)</span></a></li>
                </ul>

                <!-- Filter Bar & Search Box -->
                <div class="wp-tablenav">
                    <div class="actions">
                        <select id="wp-bulk-actions">
                            <option value="-1">Bulk actions</option>
                            <option value="edit">Edit</option>
                        </select>
                        <button class="button" id="btn-wp-bulk-apply">Apply</button>

                        <select id="wp-filter-date">
                            <option value="0">All dates</option>
                            <option value="current">Current Month</option>
                        </select>
                        <button class="button" id="btn-wp-filter">Filter</button>
                    </div>

                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="display:flex;gap:0.35rem;">
                            <input type="search" id="wp-search-input" placeholder="Search pages..." value="${searchQuery}">
                            <button class="button" id="btn-wp-search">Search Pages</button>
                        </div>
                        <div class="wp-pagination">
                            <span>${showHome ? 1 : 0} items</span>
                            <button class="page-btn" disabled>&laquo;</button>
                            <button class="page-btn" disabled>&lsaquo;</button>
                            <span style="padding:0 0.3rem;"><strong>1</strong> of 1</span>
                            <button class="page-btn" disabled>&rsaquo;</button>
                            <button class="page-btn" disabled>&raquo;</button>
                        </div>
                    </div>
                </div>

                <!-- Clean Table (Only Top-Level Pages) -->
                <table class="wp-table-pages">
                    <thead>
                        <tr>
                            <th style="width:36px;"><input type="checkbox" id="wp-cb-select-all"></th>
                            <th style="width:48%;">Title</th>
                            <th style="width:14%;">Author</th>
                            <th style="width:60px;text-align:center;"><i class="fa-solid fa-comment" title="Contact Inquiries"></i></th>
                            <th style="width:18%;">Date</th>
                            <th style="width:120px;text-align:right;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${showHome ? `
                            <tr style="background:rgba(99, 102, 241, 0.05);border-left:3px solid var(--accent, #6366f1);">
                                <td><input type="checkbox"></td>
                                <td>
                                    <div>
                                        <a href="#" class="wp-row-title" onclick="window.PagesManager.openHomeStudio(event)" style="font-size:0.95rem;font-weight:700;">
                                            Home
                                        </a>
                                        <span style="font-size:0.75rem;color:var(--accent);font-weight:600;margin-left:0.4rem;padding:0.15rem 0.45rem;background:rgba(99,102,241,0.15);border-radius:4px;">
                                            Front Page
                                        </span>
                                    </div>
                                    <div class="wp-row-actions">
                                        <button onclick="window.PagesManager.openHomeStudio(event)" style="color:#60a5fa;font-weight:600;">Edit</button> <span class="sep">|</span>
                                        <button onclick="window.PagesManager.quickEditHome(event)">Quick Edit</button> <span class="sep">|</span>
                                        <button class="trash-action" onclick="window.PagesManager.trashHome(event)">Trash</button> <span class="sep">|</span>
                                        <a href="../../index.html" target="_blank">View</a>
                                    </div>
                                </td>
                                <td><span style="color:var(--text-secondary);">${authorName}</span></td>
                                <td style="text-align:center;">
                                    <span style="color:var(--text-muted);">${unreadMsgs > 0 ? `<strong style="color:#fbbf24;">${unreadMsgs}</strong>` : '—'}</span>
                                </td>
                                <td>
                                    <div style="font-size:0.8rem;color:var(--text-muted);">Published</div>
                                    <div style="font-size:0.8rem;color:var(--text-primary);font-weight:500;">${dateStr}</div>
                                </td>
                                <td style="text-align:right;">
                                    <span class="tag tag-green" style="font-size:0.75rem;padding:0.25rem 0.6rem;">Published</span>
                                </td>
                            </tr>
                        ` : ''}
                        
                        ${(sectionDataCache.pages || []).filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => `
                            <tr>
                                <td><input type="checkbox"></td>
                                <td>
                                    <div>
                                        <a href="#" class="wp-row-title" onclick="window.PagesManager.openGrapesJSBuilder('${p.id}', event)" style="font-size:0.95rem;font-weight:700;">
                                            ${p.title}
                                        </a>
                                    </div>
                                    <div class="wp-row-actions">
                                        <button onclick="window.PagesManager.openGrapesJSBuilder('${p.id}', event)" style="color:#60a5fa;font-weight:600;">Edit with Builder</button> <span class="sep">|</span>
                                        <button class="trash-action" onclick="window.PagesManager.deletePage('${p.id}', event)">Trash</button> <span class="sep">|</span>
                                        <a href="../../custom.html?page=${p.slug}" target="_blank">View</a>
                                    </div>
                                </td>
                                <td><span style="color:var(--text-secondary);">${authorName}</span></td>
                                <td style="text-align:center;"><span style="color:var(--text-muted);">—</span></td>
                                <td>
                                    <div style="font-size:0.8rem;color:var(--text-muted);">${p.status === 'published' ? 'Published' : 'Draft'}</div>
                                    <div style="font-size:0.8rem;color:var(--text-primary);font-weight:500;">${new Date(p.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td style="text-align:right;">
                                    <span class="tag ${p.status === 'published' ? 'tag-green' : 'tag-gray'}" style="font-size:0.75rem;padding:0.25rem 0.6rem;">${p.status}</span>
                                </td>
                            </tr>
                        `).join('')}

                        ${!showHome && (!sectionDataCache.pages || sectionDataCache.pages.length === 0) ? `
                            <tr>
                                <td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                                    No pages found matching your search.
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderHomeStudioHTML = () => {
        const heroData = sectionDataCache.hero;
        const totalProjects = (sectionDataCache.projects || []).length;
        const totalServices = (sectionDataCache.services || []).length;
        const totalSkills   = (sectionDataCache.skills || []).length;
        const totalExp      = (sectionDataCache.experience || []).length;
        const totalEdu      = (sectionDataCache.education || []).length;
        const totalCerts    = (sectionDataCache.certificates || []).length;
        const totalTests    = (sectionDataCache.testimonials || []).length;
        const totalStats    = (sectionDataCache.statistics || []).length;
        const totalSocial   = (sectionDataCache.social || []).length;

        return `
            <div class="wp-wrap">
                <!-- Studio Navigation Bar -->
                <div class="studio-hdr">
                    <div>
                        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;">
                            <h2 style="font-size:1.3rem;font-weight:700;margin:0;color:var(--text-primary);">
                                Home Page — Sections Manager
                            </h2>
                        </div>
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0;">
                            All 10 portfolio content sections combined into a single unified page. Manage, preview, and update live content dynamically.
                        </p>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
                        <button class="btn-sm" id="btn-studio-back-pages" style="padding:0.5rem 0.9rem;background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);">
                            <i class="fa-solid fa-arrow-left"></i> Back to Pages Table
                        </button>
                        <button class="btn-sm" id="btn-studio-refresh-all" style="padding:0.5rem 0.9rem;background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);">
                            <i class="fa-solid fa-rotate"></i> Sync Live Data
                        </button>
                        <a href="../../index.html" target="_blank" class="btn-add" style="text-decoration:none;padding:0.5rem 1rem;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> View Live Site
                        </a>
                    </div>
                </div>

                <!-- Sections Accordion Cards -->
                <div id="studio-sections-accordion">
                    <!-- 1. Hero Section -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-hero')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">1. Hero Section (Header Banner)</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">Main headline, bio, profile avatar & resume link</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">Active</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('hero')">Edit</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-hero">
                            <div style="display:flex;gap:1.25rem;flex-wrap:wrap;align-items:center;">
                                <div style="width:64px;height:64px;border-radius:8px;background:var(--bg-secondary);border:1px solid var(--border-color);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                    ${heroData?.profileImageUrl ? `<img src="${heroData.profileImageUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<i class="fa-solid fa-user" style="color:var(--text-muted);font-size:1.5rem;"></i>`}
                                </div>
                                <div style="flex:1;">
                                    <div style="font-size:1.05rem;font-weight:700;color:var(--text-primary);">${heroData?.title || 'Creative Developer & Architect'}</div>
                                    <div style="font-size:0.85rem;color:var(--accent);font-weight:500;">${heroData?.subtitle || 'Building Exceptional Web Experiences'}</div>
                                    <p style="font-size:0.8rem;color:var(--text-muted);margin:0.25rem 0 0;line-height:1.4;">${heroData?.description || 'No bio description set yet.'}</p>
                                </div>
                                <div style="display:flex;gap:0.4rem;">
                                    <button class="btn-sm" style="background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);" onclick="window.PagesManager.jumpToSection('hero')">
                                        <i class="fa-solid fa-pen"></i> Full Editor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Services Section -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-services')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">2. Specialized Services</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalServices} dynamic services loaded</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalServices} Services</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('services')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-services" style="display:none;">
                            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:0.85rem;">
                                ${(sectionDataCache.services || []).map(s => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.85rem;">
                                        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
                                            <i class="${s.icon || 'fa-solid fa-bolt'}" style="color:var(--accent);"></i>
                                            <strong>${s.name}</strong>
                                        </div>
                                        <p style="font-size:0.75rem;color:var(--text-muted);margin:0;line-height:1.3;">${s.description?.slice(0, 65) || 'No description'}...</p>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No services created yet.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 3. Featured Projects -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-projects')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">3. Featured Projects</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalProjects} showcase projects loaded</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalProjects} Projects</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('projects')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-projects" style="display:none;">
                            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:0.85rem;">
                                ${(sectionDataCache.projects || []).map(p => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.75rem;display:flex;gap:0.6rem;align-items:center;">
                                        <div style="width:48px;height:38px;border-radius:4px;overflow:hidden;background:var(--bg-secondary);flex-shrink:0;">
                                            ${p.imageUrl ? `<img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<i class="fa-solid fa-image" style="color:var(--text-muted);display:flex;align-items:center;justify-content:center;height:100%;"></i>`}
                                        </div>
                                        <div style="overflow:hidden;">
                                            <strong style="font-size:0.85rem;color:var(--text-primary);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title}</strong>
                                            <span style="font-size:0.7rem;color:var(--accent);">${p.categoryTag || 'Project'}</span>
                                        </div>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No projects created yet.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 4. Technical Skills -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-skills')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">4. Technical Skills & Proficiencies</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalSkills} skills categorized</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalSkills} Skills</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('skills')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-skills" style="display:none;">
                            <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
                                ${(sectionDataCache.skills || []).map(sk => `
                                    <span style="background:var(--bg-card);border:1px solid var(--border-color);padding:0.3rem 0.65rem;border-radius:4px;font-size:0.8rem;display:inline-flex;align-items:center;gap:0.4rem;">
                                        <i class="${sk.icon || 'fa-solid fa-code'}" style="color:var(--accent);"></i>
                                        ${sk.name} <strong style="color:#10b981;font-size:0.75rem;">${sk.proficiencyPercentage}%</strong>
                                    </span>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No skills added yet.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 5. Work Experience Timeline -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-exp')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">5. Work Experience Timeline</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalExp} career timeline records</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalExp} Roles</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('experience')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-exp" style="display:none;">
                            <div style="display:grid;gap:0.6rem;">
                                ${(sectionDataCache.experience || []).map(e => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.75rem;display:flex;justify-content:space-between;align-items:center;">
                                        <div>
                                            <strong style="color:var(--text-primary);font-size:0.85rem;">${e.role}</strong> — <span style="color:var(--accent);font-size:0.85rem;">${e.companyName}</span>
                                            <div style="font-size:0.75rem;color:var(--text-muted);">${e.location || 'Remote'} · ${e.isCurrent ? 'Current' : 'Completed'}</div>
                                        </div>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No experience entries.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 6. Academic Education -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-edu')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">6. Academic Education</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalEdu} degrees & institutions</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalEdu} Degrees</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('education')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-edu" style="display:none;">
                            <div style="display:grid;gap:0.6rem;">
                                ${(sectionDataCache.education || []).map(ed => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.75rem;">
                                        <strong style="color:var(--text-primary);font-size:0.85rem;">${ed.degree}</strong> in ${ed.fieldOfStudy}
                                        <div style="font-size:0.75rem;color:var(--accent);">${ed.institutionName}</div>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No education entries.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 7. Certificates & Credentials -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-certs')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">7. Certificates & Credentials</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalCerts} verified certifications</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalCerts} Certs</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('certificates')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-certs" style="display:none;">
                            <div style="display:grid;gap:0.6rem;">
                                ${(sectionDataCache.certificates || []).map(c => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.75rem;display:flex;justify-content:space-between;align-items:center;">
                                        <div>
                                            <strong style="color:var(--text-primary);font-size:0.85rem;">${c.name}</strong>
                                            <div style="font-size:0.75rem;color:var(--text-muted);">${c.issuingOrganization} · ${c.credentialId || 'ID: Active'}</div>
                                        </div>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No certificates added.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 8. Client Testimonials -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-tests')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">8. Client Testimonials & Reviews</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalTests} reviews & feedback</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalTests} Reviews</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('testimonials')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-tests" style="display:none;">
                            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:0.75rem;">
                                ${(sectionDataCache.testimonials || []).map(t => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.85rem;">
                                        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
                                            <strong style="font-size:0.85rem;color:var(--text-primary);">${t.clientName}</strong>
                                            <span style="font-size:0.75rem;color:var(--accent);">(${t.clientRole})</span>
                                        </div>
                                        <p style="font-size:0.75rem;color:var(--text-muted);margin:0;line-height:1.3;">"${t.feedback?.slice(0, 70)}..."</p>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No testimonials created.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 9. Key Statistics -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-stats')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">9. Key Statistics & Counters</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalStats} milestone counters</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalStats} Metrics</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('statistics')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-stats" style="display:none;">
                            <div style="display:flex;flex-wrap:wrap;gap:0.6rem;">
                                ${(sectionDataCache.statistics || []).map(st => `
                                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;padding:0.6rem 1rem;text-align:center;">
                                        <div style="font-size:1.2rem;font-weight:700;color:var(--accent);">${st.value}</div>
                                        <div style="font-size:0.75rem;color:var(--text-muted);">${st.label}</div>
                                    </div>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No statistics defined.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- 10. Social Profiles -->
                    <div class="studio-section-card">
                        <div class="studio-section-hdr" onclick="window.PagesManager.toggleSectionCard('studio-card-social')">
                            <div>
                                <strong style="font-size:0.95rem;color:var(--text-primary);">10. Social Profiles & Links</strong>
                                <div style="font-size:0.75rem;color:var(--text-muted);">${totalSocial} active connections</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;">
                                <span class="tag tag-green" style="font-size:0.7rem;">${totalSocial} Links</span>
                                <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.PagesManager.jumpToSection('social')">Manage</button>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;color:var(--text-muted);"></i>
                            </div>
                        </div>
                        <div class="studio-section-body" id="studio-card-social" style="display:none;">
                            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                                ${(sectionDataCache.social || []).map(sc => `
                                    <a href="${sc.url}" target="_blank" style="background:var(--bg-card);border:1px solid var(--border-color);padding:0.4rem 0.8rem;border-radius:6px;font-size:0.8rem;color:var(--text-primary);text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;">
                                        <i class="${sc.icon || 'fa-solid fa-globe'}" style="color:var(--accent);"></i> ${sc.platformName}
                                    </a>
                                `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No social profiles.</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const toggleSectionCard = (bodyId) => {
        const body = document.getElementById(bodyId);
        if (!body) return;
        const isClosed = body.style.display === 'none';
        body.style.display = isClosed ? 'block' : 'none';
    };

    const openHomeStudio = (e) => {
        if (e) e.preventDefault();
        isStudioOpen = true;
        render();
    };

    const closeHomeStudio = () => {
        isStudioOpen = false;
        render();
    };

    const quickEditHome = (e) => {
        if (e) e.preventDefault();
        openModal?.('Quick Edit: Home', `
            <div class="form-group">
                <label class="form-label">Page Title</label>
                <input class="form-input" id="qe-title" value="Home">
            </div>
            <div class="form-group">
                <label class="form-label">Slug</label>
                <input class="form-input" id="qe-slug" value="home">
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" id="qe-status">
                    <option value="published" selected>Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
                <button class="btn-save" type="button" onclick="window.PagesManager.saveQuickEdit()">Update Page</button>
            </div>
        `);
    };

    const trashHome = (e) => {
        if (e) e.preventDefault();
        showToast?.('The Front Page (Home) cannot be deleted as it is your active landing page.', 'warning');
    };

    const saveQuickEdit = () => {
        document.getElementById('modal-overlay')?.classList.remove('open');
        showToast?.('Page properties updated successfully!');
    };

    const jumpToSection = (panelId, e) => {
        if (e) e.preventDefault();
        if (typeof switchPanel === 'function') {
            switchPanel(panelId);
        } else if (typeof window.switchAdminPanel === 'function') {
            window.switchAdminPanel(panelId);
        }
    };

    const render = () => {
        const container = document.getElementById('panel-pages');
        if (!container) return;

        if (isStudioOpen) {
            container.innerHTML = renderHomeStudioHTML();
            document.getElementById('btn-studio-back-pages')?.addEventListener('click', closeHomeStudio);
            document.getElementById('btn-studio-refresh-all')?.addEventListener('click', async () => {
                showToast?.('Syncing live API data for all sections…');
                await fetchAllDynamicData();
                render();
                showToast?.('All section data synchronized!');
            });
        } else {
            container.innerHTML = renderPagesTableHTML();

            // Bind Add Page
            document.getElementById('btn-wp-add-page')?.addEventListener('click', () => {
                openModal?.('Add New Page', `
                    <div class="form-group">
                        <label class="form-label">Page Title</label>
                        <input class="form-input" id="np-title" placeholder="e.g. Case Studies, Blog, About Us">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Template Type</label>
                        <select class="form-select" id="np-type">
                            <option value="standard">Standard Content Page</option>
                            <option value="fullwidth">Full Width Page</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
                        <button class="btn-save" type="button" onclick="window.PagesManager.createPage()">Create Page</button>
                    </div>
                `);
            });

            // Bind Tab filters
            container.querySelectorAll('.wp-subsubsub a').forEach(a => {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    activeTab = a.dataset.tab;
                    render();
                });
            });

            // Bind Search
            document.getElementById('btn-wp-search')?.addEventListener('click', () => {
                searchQuery = document.getElementById('wp-search-input')?.value.trim() || '';
                render();
            });

            document.getElementById('wp-search-input')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    searchQuery = e.target.value.trim();
                    render();
                }
            });
        }
    };

    const createPage = async () => {
        const title = document.getElementById('np-title')?.value.trim();
        if (!title) return showToast?.('Title is required', 'error');
        try {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            await APIs.PagesAPI.create({ title, slug, htmlContent: '', cssContent: '', status: 'draft' });
            showToast?.('Page created successfully!', 'success');
            closeModal?.();
            await fetchAllDynamicData();
            render();
        } catch (err) {
            showToast?.(err.message || 'Error creating page', 'error');
        }
    };

    const deletePage = async (id, event) => {
        event?.preventDefault();
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await APIs.PagesAPI.delete(id);
            showToast?.('Page deleted!', 'success');
            await fetchAllDynamicData();
            render();
        } catch (err) {
            showToast?.(err.message || 'Error deleting page', 'error');
        }
    };

    let editor = null;
    const openGrapesJSBuilder = (id, event) => {
        event?.preventDefault();
        const page = sectionDataCache.pages?.find(p => p.id === id);
        if (!page) return showToast?.('Page not found', 'error');

        const modal = document.getElementById('grapes-modal-overlay');
        const titleEl = document.getElementById('grapes-modal-title');
        const closeBtn = document.getElementById('grapes-modal-close');
        const saveBtn = document.getElementById('grapes-save-btn');
        if (!modal) return showToast?.('GrapesJS modal not found', 'error');

        titleEl.textContent = `Editing: ${page.title}`;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        if (editor) {
            editor.destroy();
        }

        editor = grapesjs.init({
            container: '#gjs',
            height: '100%',
            width: '100%',
            storageManager: false,
            panels: { defaults: [] },
            components: page.htmlContent || '<h1>Hello World</h1>',
            style: page.cssContent || ''
        });

        saveBtn.onclick = async () => {
            try {
                const html = editor.getHtml();
                const css = editor.getCss();
                await APIs.PagesAPI.update(id, { ...page, htmlContent: html, cssContent: css });
                showToast?.('Page saved!', 'success');
            } catch (err) {
                showToast?.('Error saving page', 'error');
            }
        };

        closeBtn.onclick = () => {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            editor.destroy();
            editor = null;
            fetchAllDynamicData().then(render);
        };
    };

    const init = (config = {}) => {
        APIs = {
            HeroAPI: config.HeroAPI || window.API?.HeroAPI,
            ProjectsAPI: config.ProjectsAPI || window.API?.ProjectsAPI,
            SkillsAPI: config.SkillsAPI || window.API?.SkillsAPI,
            ExperienceAPI: config.ExperienceAPI || window.API?.ExperienceAPI,
            EducationAPI: config.EducationAPI || window.API?.EducationAPI,
            CertificatesAPI: config.CertificatesAPI || window.API?.CertificatesAPI,
            ServicesAPI: config.ServicesAPI || window.API?.ServicesAPI,
            TestimonialsAPI: config.TestimonialsAPI || window.API?.TestimonialsAPI,
            SocialLinksAPI: config.SocialLinksAPI || window.API?.SocialLinksAPI,
            StatisticsAPI: config.StatisticsAPI || window.API?.StatisticsAPI,
            ContactAPI: config.ContactAPI || window.API?.ContactAPI,
            SiteSettingsAPI: config.SiteSettingsAPI || window.API?.SiteSettingsAPI
        };

        showToast   = config.toast || window.toast;
        openModal   = config.openModal || window.openModal;
        closeModal  = config.closeModal || window.closeModal;
        switchPanel = config.switchPanel || window.switchAdminPanel;
    };

    return {
        init: (apiRefs, toastFn, modalOpenFn, modalCloseFn, switchPanelFn) => {
            APIs = apiRefs;
            showToast = toastFn;
            openModal = modalOpenFn;
            closeModal = modalCloseFn;
            switchPanel = switchPanelFn;
            fetchAllDynamicData().then(render);
        },
        refresh: () => {
            fetchAllDynamicData().then(render);
        },
        openHomeStudio,
        quickEditHome,
        trashHome,
        saveQuickEdit,
        jumpToSection,
        toggleSectionCard,
        openGrapesJSBuilder,
        createPage,
        deletePage
    };
})();
