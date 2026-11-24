/**
 * SocialManager Component
 * Modular component for managing Social Media & Profile links.
 */

window.SocialManager = (() => {
    let SocialLinksAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Social Links</h2>
                <p>Manage social network profiles, GitHub, LinkedIn, Twitter, and custom portfolio links.</p>
            </div>
            <button class="btn-add" id="btn-add-social">
                <i class="fa-solid fa-plus"></i> Add Social Link
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Platform</th>
                        <th>URL</th>
                        <th>Icon</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-social"></tbody>
            </table>
        </div>
    `;

    const loadSocial = async () => {
        const tbody = document.getElementById('tbl-social');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading social links...</td></tr>`;

        try {
            const res = await SocialLinksAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No social links found. Click <strong>+ Add Social Link</strong> to create one.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(s => `
                <tr>
                    <td><strong>${s.platformName}</strong></td>
                    <td><code style="background:var(--bg-card-hover);padding:0.2rem 0.4rem;border-radius:4px;font-size:0.8rem;">${s.url}</code></td>
                    <td><i class="${s.iconClass || 'fa-solid fa-link'}" style="font-size:1.1rem;color:var(--accent);"></i></td>
                    <td>${s.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.SocialManager.editSocial('${s.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.SocialManager.deleteSocial('${s.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading social links: ${err.message}</td></tr>`;
        }
    };

    const socialForm = (s = {}) => `
        <div class="form-group">
            <label class="form-label">Platform Name</label>
            <input class="form-input" id="mf-platform" value="${s.platformName || ''}" placeholder="e.g. GitHub, LinkedIn, Twitter, YouTube">
        </div>
        <div class="form-group">
            <label class="form-label">Profile URL</label>
            <input class="form-input" id="mf-url" value="${s.url || ''}" placeholder="https://github.com/username">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Font Awesome Icon Class</label>
                <input class="form-input" id="mf-icon" value="${s.iconClass || ''}" placeholder="e.g. fa-brands fa-github">
            </div>
            <div class="form-group">
                <label class="form-label">Display Order</label>
                <input class="form-input" type="number" id="mf-order" value="${s.order || 1}">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Social Link</button>
        </div>
    `;

    const socialFormValues = () => ({
        platformName: document.getElementById('mf-platform').value,
        url:          document.getElementById('mf-url').value,
        iconClass:    document.getElementById('mf-icon').value,
        order:        parseInt(document.getElementById('mf-order').value) || 1
    });

    const init = (config = {}) => {
        SocialLinksAPI = config.SocialLinksAPI || window.API?.SocialLinksAPI;
        showToast      = config.toast || window.toast;
        openModal      = config.openModal || window.openModal;

        const container = document.getElementById('panel-social');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-social')?.addEventListener('click', () => {
            openModal('Add Social Link', socialForm(), async () => {
                await SocialLinksAPI.create(socialFormValues());
                if (showToast) showToast('Social link created!');
                loadSocial();
            });
        });
    };

    const editSocial = async (id) => {
        try {
            const res = await SocialLinksAPI.getById(id);
            const s = res.data;
            openModal('Edit Social Link', socialForm(s), async () => {
                await SocialLinksAPI.update(id, socialFormValues());
                if (showToast) showToast('Social link updated!');
                loadSocial();
            });
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteSocial = (id) => {
        if (!confirm('Are you sure you want to delete this social link?')) return;
        (async () => {
            try {
                await SocialLinksAPI.delete(id);
                if (showToast) showToast('Social link deleted!');
                loadSocial();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadSocial,
        editSocial,
        deleteSocial
    };
})();
