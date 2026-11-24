/**
 * HeroManager Component
 * Modular manager for Hero Section configuration and profile photo upload.
 */

window.HeroManager = (() => {
    let HeroAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Hero Section</h2>
                <p>Manage main homepage banner title, tagline, bio description, and profile image.</p>
            </div>
            <button class="btn-add" id="btn-edit-hero">
                <i class="fa-solid fa-pen-to-square"></i> Edit Hero Content
            </button>
        </div>
        <div class="table-wrapper" style="padding:1.5rem;" id="hero-display-card">
            <div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;">
                <div style="width:120px;height:120px;border-radius:50%;overflow:hidden;background:var(--bg-card);border:2px solid var(--border-color);display:flex;align-items:center;justify-content:center;">
                    <img id="hero-display-img" src="" alt="Profile Image" style="width:100%;height:100%;object-fit:cover;display:none;" />
                    <span id="hero-img-fallback" style="font-size:2.5rem;color:var(--text-muted);"><i class="fa-solid fa-user"></i></span>
                </div>
                <div style="flex:1;min-width:260px;">
                    <span class="tag tag-green" id="hero-display-badge" style="margin-bottom:0.5rem;">Active Banner</span>
                    <h3 id="hero-display-title" style="font-size:1.3rem;margin-bottom:0.25rem;">—</h3>
                    <div id="hero-display-subtitle" style="font-size:0.95rem;color:var(--accent);font-weight:600;margin-bottom:0.75rem;">—</div>
                    <p id="hero-display-desc" style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5;">—</p>
                </div>
            </div>
        </div>
    `;

    const loadHero = async () => {
        try {
            const res = await HeroAPI.getActive();
            const h = res?.data;
            if (!h) return;

            const titleEl = document.getElementById('hero-display-title');
            const subEl   = document.getElementById('hero-display-subtitle');
            const descEl  = document.getElementById('hero-display-desc');
            const imgEl   = document.getElementById('hero-display-img');
            const fallEl  = document.getElementById('hero-img-fallback');

            if (titleEl) titleEl.textContent = h.title || 'Untitled Banner';
            if (subEl)   subEl.textContent   = h.subtitle || '';
            if (descEl)  descEl.textContent  = h.description || '';

            if (h.profileImageUrl && imgEl) {
                imgEl.src = h.profileImageUrl;
                imgEl.style.display = 'block';
                if (fallEl) fallEl.style.display = 'none';
            }
        } catch (e) {
            if (showToast) showToast('Failed to load hero section', 'error');
        }
    };

    const heroForm = (h = {}) => `
        <div class="form-group">
            <label class="form-label">Banner Title</label>
            <input class="form-input" id="mf-title" value="${h.title || ''}" placeholder="e.g. Hi, I'm Alex Johnson">
        </div>
        <div class="form-group">
            <label class="form-label">Subtitle / Subheading</label>
            <input class="form-input" id="mf-subtitle" value="${h.subtitle || ''}" placeholder="e.g. Senior Full Stack Engineer">
        </div>
        <div class="form-group">
            <label class="form-label">Description / Bio Text</label>
            <textarea class="form-input" id="mf-desc" rows="3" placeholder="Brief introduction...">${h.description || ''}</textarea>
        </div>
        
        ${window.ImageUploader.renderHTML('mf-profile-img', h.profileImageUrl || '', 'Profile Photo Upload', 'image')}

        ${window.ImageUploader.renderHTML('mf-resume', h.resumeUrl || '', 'Resume / CV Document (PDF / Word)', 'document')}

        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Hero Section</button>
        </div>
    `;

    const init = (config = {}) => {
        HeroAPI   = config.HeroAPI || window.API?.HeroAPI;
        showToast = config.toast || window.toast;
        openModal = config.openModal || window.openModal;

        const container = document.getElementById('panel-hero');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-edit-hero')?.addEventListener('click', async () => {
            try {
                const res = await HeroAPI.getActive();
                const h = res?.data || {};
                openModal('Edit Hero Section', heroForm(h), async () => {
                    const dto = {
                        title: document.getElementById('mf-title').value,
                        subtitle: document.getElementById('mf-subtitle').value,
                        description: document.getElementById('mf-desc').value,
                        profileImageUrl: document.getElementById('mf-profile-img').value,
                        resumeUrl: document.getElementById('mf-resume').value,
                        isVisible: true
                    };
                    if (h.id) {
                        await HeroAPI.update(h.id, dto);
                    } else {
                        await HeroAPI.create(dto);
                    }
                    if (showToast) showToast('Hero section updated!');
                    loadHero();
                });

                setTimeout(() => {
                    window.ImageUploader.attachDragEvents('mf-profile-img');
                    window.ImageUploader.attachDragEvents('mf-resume');
                }, 50);
            } catch (e) {
                if (showToast) showToast(`Error: ${e.message}`, 'error');
            }
        });
    };

    return {
        init,
        renderPanelHTML,
        loadHero
    };
})();
