/**
 * ServicesManager Component
 * Modular component for managing Offered Services & Skills Offerings.
 */

window.ServicesManager = (() => {
    let ServicesAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Services</h2>
                <p>Manage offered services, consulting offerings, icons, and descriptions.</p>
            </div>
            <button class="btn-add" id="btn-add-service">
                <i class="fa-solid fa-plus"></i> Add Service
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th>Service Name</th>
                        <th>Description</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-services"></tbody>
            </table>
        </div>
    `;

    const loadServices = async () => {
        const tbody = document.getElementById('tbl-services');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading services...</td></tr>`;

        try {
            const res = await ServicesAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No services found. Click <strong>+ Add Service</strong> to create one.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(s => `
                <tr>
                    <td><span style="font-size:1.2rem;color:var(--accent);"><i class="${s.icon || 'fa-solid fa-bolt'}"></i></span></td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.description ? (s.description.length > 50 ? s.description.slice(0,50)+'...' : s.description) : '—'}</td>
                    <td>${s.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.ServicesManager.editService('${s.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.ServicesManager.deleteService('${s.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading services: ${err.message}</td></tr>`;
        }
    };

    const serviceForm = (s = {}) => `
        <div class="form-group">
            <label class="form-label">Service Name</label>
            <input class="form-input" id="mf-name" value="${s.name || ''}" placeholder="e.g. Web Development, Cloud Architecture">
        </div>
        <div class="form-group">
            <label class="form-label">Icon Class (Font Awesome)</label>
            <input class="form-input" id="mf-icon" value="${s.icon || ''}" placeholder="e.g. fa-solid fa-code or fa-solid fa-cloud">
        </div>
        <div class="form-group">
            <label class="form-label">Display Order</label>
            <input class="form-input" type="number" id="mf-order" value="${s.order || 1}">
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-input" id="mf-desc" rows="3" placeholder="What does this service include?">${s.description || ''}</textarea>
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Service</button>
        </div>
    `;

    const serviceFormValues = () => ({
        name:        document.getElementById('mf-name').value,
        icon:        document.getElementById('mf-icon').value,
        order:       parseInt(document.getElementById('mf-order').value) || 1,
        description: document.getElementById('mf-desc').value
    });

    const init = (config = {}) => {
        ServicesAPI = config.ServicesAPI || window.API?.ServicesAPI;
        showToast   = config.toast || window.toast;
        openModal   = config.openModal || window.openModal;

        const container = document.getElementById('panel-services');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-service')?.addEventListener('click', () => {
            openModal('Add Service', serviceForm(), async () => {
                await ServicesAPI.create(serviceFormValues());
                if (showToast) showToast('Service created!');
                loadServices();
            });
        });
    };

    const editService = async (id) => {
        try {
            const res = await ServicesAPI.getById(id);
            const s = res.data;
            openModal('Edit Service', serviceForm(s), async () => {
                await ServicesAPI.update(id, serviceFormValues());
                if (showToast) showToast('Service updated!');
                loadServices();
            });
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteService = (id) => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        (async () => {
            try {
                await ServicesAPI.delete(id);
                if (showToast) showToast('Service deleted!');
                loadServices();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadServices,
        editService,
        deleteService
    };
})();
