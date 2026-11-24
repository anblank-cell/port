/**
 * ExperienceManager Component
 * Modular component for managing Work Experience entries.
 */

window.ExperienceManager = (() => {
    let ExperienceAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Experience</h2>
                <p>Manage career timeline, company roles, responsibilities, and employment dates.</p>
            </div>
            <button class="btn-add" id="btn-add-experience">
                <i class="fa-solid fa-plus"></i> Add Experience
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Role / Title</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Duration</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-experience"></tbody>
            </table>
        </div>
    `;

    const loadExperience = async () => {
        const tbody = document.getElementById('tbl-experience');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading experience...</td></tr>`;

        try {
            const res = await ExperienceAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No experience entries found. Click <strong>+ Add Experience</strong> to create one.</td></tr>`;
                return;
            }

            const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : 'Present';

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(e => `
                <tr>
                    <td><strong>${e.role}</strong></td>
                    <td>${e.companyName}</td>
                    <td>${e.location || '—'}</td>
                    <td><span class="tag">${fmtDate(e.startDate)} → ${e.isCurrent ? 'Present' : fmtDate(e.endDate)}</span></td>
                    <td>${e.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.ExperienceManager.editExperience('${e.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.ExperienceManager.deleteExperience('${e.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading experience: ${err.message}</td></tr>`;
        }
    };

    const expForm = (e = {}) => {
        const startVal = e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '';
        const endVal   = e.endDate ? new Date(e.endDate).toISOString().slice(0, 10) : '';

        return `
            <div class="form-group">
                <label class="form-label">Job Role / Title</label>
                <input class="form-input" id="mf-role" value="${e.role || ''}" placeholder="e.g. Senior Software Engineer">
            </div>
            <div class="form-group">
                <label class="form-label">Company Name</label>
                <input class="form-input" id="mf-company" value="${e.companyName || ''}" placeholder="e.g. Acme Corp">
            </div>
            <div class="form-group">
                <label class="form-label">Location</label>
                <input class="form-input" id="mf-loc" value="${e.location || ''}" placeholder="e.g. San Francisco, CA (Remote)">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input class="form-input" type="date" id="mf-start" value="${startVal}">
                </div>
                <div class="form-group">
                    <label class="form-label">End Date</label>
                    <input class="form-input" type="date" id="mf-end" value="${endVal}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Currently Working Here</label>
                    <select class="form-select" id="mf-current">
                        <option value="false" ${!e.isCurrent ? 'selected':''}>No</option>
                        <option value="true"  ${e.isCurrent ? 'selected':''}>Yes (Current Role)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Display Order</label>
                    <input class="form-input" type="number" id="mf-order" value="${e.order || 1}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Description & Achievements</label>
                <textarea class="form-input" id="mf-desc" rows="3" placeholder="Key responsibilities...">${e.description || ''}</textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
                <button class="btn-save" type="button" onclick="window.triggerSave()">Save Experience</button>
            </div>
        `;
    };

    const expFormValues = () => ({
        role:        document.getElementById('mf-role').value,
        companyName: document.getElementById('mf-company').value,
        location:    document.getElementById('mf-loc').value,
        startDate:   document.getElementById('mf-start').value ? new Date(document.getElementById('mf-start').value).toISOString() : new Date().toISOString(),
        endDate:     document.getElementById('mf-end').value ? new Date(document.getElementById('mf-end').value).toISOString() : null,
        isCurrent:   document.getElementById('mf-current').value === 'true',
        order:       parseInt(document.getElementById('mf-order').value) || 1,
        description: document.getElementById('mf-desc').value
    });

    const init = (config = {}) => {
        ExperienceAPI = config.ExperienceAPI || window.API?.ExperienceAPI;
        showToast     = config.toast || window.toast;
        openModal     = config.openModal || window.openModal;

        const container = document.getElementById('panel-experience');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-experience')?.addEventListener('click', () => {
            openModal('Add Experience', expForm(), async () => {
                await ExperienceAPI.create(expFormValues());
                if (showToast) showToast('Experience created!');
                loadExperience();
            });
        });
    };

    const editExperience = async (id) => {
        try {
            const res = await ExperienceAPI.getById(id);
            const e = res.data;
            openModal('Edit Experience', expForm(e), async () => {
                await ExperienceAPI.update(id, expFormValues());
                if (showToast) showToast('Experience updated!');
                loadExperience();
            });
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteExperience = (id) => {
        if (!confirm('Are you sure you want to delete this experience entry?')) return;
        (async () => {
            try {
                await ExperienceAPI.delete(id);
                if (showToast) showToast('Experience deleted!');
                loadExperience();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadExperience,
        editExperience,
        deleteExperience
    };
})();
