/**
 * StatisticsManager Component
 * Modular component for managing Portfolio Impact Statistics & Key Metrics.
 */

window.StatisticsManager = (() => {
    let StatisticsAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Statistics</h2>
                <p>Manage highlight stats, completed projects, client satisfaction metrics, and years of experience.</p>
            </div>
            <button class="btn-add" id="btn-add-stat">
                <i class="fa-solid fa-plus"></i> Add Metric
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Metric Label</th>
                        <th>Value</th>
                        <th>Icon</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-statistics"></tbody>
            </table>
        </div>
    `;

    const loadStatistics = async () => {
        const tbody = document.getElementById('tbl-statistics');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading statistics...</td></tr>`;

        try {
            const res = await StatisticsAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No statistics found. Click <strong>+ Add Metric</strong> to create one.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(s => `
                <tr>
                    <td><strong>${s.label}</strong></td>
                    <td><span class="tag tag-green" style="font-size:0.9rem;font-weight:700;">${s.value}</span></td>
                    <td><i class="${s.icon || 'fa-solid fa-chart-line'}" style="color:var(--accent);"></i></td>
                    <td>${s.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.StatisticsManager.editStatistic('${s.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.StatisticsManager.deleteStatistic('${s.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading statistics: ${err.message}</td></tr>`;
        }
    };

    const statForm = (s = {}) => `
        <div class="form-group">
            <label class="form-label">Metric Label</label>
            <input class="form-input" id="mf-label" value="${s.label || ''}" placeholder="e.g. Projects Completed, Happy Clients">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Display Value</label>
                <input class="form-input" id="mf-val" value="${s.value || ''}" placeholder="e.g. 50+, 99%, 5+">
            </div>
            <div class="form-group">
                <label class="form-label">Display Order</label>
                <input class="form-input" type="number" id="mf-order" value="${s.order || 1}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Font Awesome Icon Class</label>
            <input class="form-input" id="mf-icon" value="${s.icon || ''}" placeholder="e.g. fa-solid fa-briefcase">
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Metric</button>
        </div>
    `;

    const statFormValues = () => ({
        label: document.getElementById('mf-label').value,
        value: document.getElementById('mf-val').value,
        order: parseInt(document.getElementById('mf-order').value) || 1,
        icon:  document.getElementById('mf-icon').value
    });

    const init = (config = {}) => {
        StatisticsAPI = config.StatisticsAPI || window.API?.StatisticsAPI;
        showToast     = config.toast || window.toast;
        openModal     = config.openModal || window.openModal;

        const container = document.getElementById('panel-statistics');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-stat')?.addEventListener('click', () => {
            openModal('Add Metric', statForm(), async () => {
                await StatisticsAPI.create(statFormValues());
                if (showToast) showToast('Metric created!');
                loadStatistics();
            });
        });
    };

    const editStatistic = async (id) => {
        try {
            const res = await StatisticsAPI.getById(id);
            const s = res.data;
            openModal('Edit Metric', statForm(s), async () => {
                await StatisticsAPI.update(id, statFormValues());
                if (showToast) showToast('Metric updated!');
                loadStatistics();
            });
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteStatistic = (id) => {
        if (!confirm('Are you sure you want to delete this metric?')) return;
        (async () => {
            try {
                await StatisticsAPI.delete(id);
                if (showToast) showToast('Metric deleted!');
                loadStatistics();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadStatistics,
        editStatistic,
        deleteStatistic
    };
})();
