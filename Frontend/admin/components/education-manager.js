/**
 * EducationManager Component
 * Modular component for managing Education history, degrees, and academic records.
 */

window.EducationManager = (() => {
    let EducationAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Education</h2>
                <p>Manage academic degrees, universities, fields of study, and graduation dates.</p>
            </div>
            <button class="btn-add" id="btn-add-education">
                <i class="fa-solid fa-plus"></i> Add Education
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Degree / Certificate</th>
                        <th>Institution</th>
                        <th>Field of Study</th>
                        <th>Year</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-education"></tbody>
            </table>
        </div>
    `;

    const loadEducation = async () => {
        const tbody = document.getElementById('tbl-education');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading education...</td></tr>`;

        try {
            const res = await EducationAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No education entries found. Click <strong>+ Add Education</strong> to create one.</td></tr>`;
                return;
            }

            const fmtYear = (d) => d ? new Date(d).getFullYear() : '—';

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(e => `
                <tr>
                    <td><strong>${e.degree}</strong></td>
                    <td>${e.institution}</td>
                    <td><span class="tag">${e.fieldOfStudy || 'General'}</span></td>
                    <td>${fmtYear(e.startDate)} - ${fmtYear(e.endDate)}</td>
                    <td>${e.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.EducationManager.editEducation('${e.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.EducationManager.deleteEducation('${e.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading education: ${err.message}</td></tr>`;
        }
    };

    const eduForm = (e = {}) => {
        const startVal = e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '';
        const endVal   = e.endDate ? new Date(e.endDate).toISOString().slice(0, 10) : '';

        return `
            <div class="form-group">
                <label class="form-label">Degree / Qualification</label>
                <input class="form-input" id="mf-degree" value="${e.degree || ''}" placeholder="e.g. Bachelor of Science in Computer Science">
            </div>
            <div class="form-group">
                <label class="form-label">Institution / University</label>
                <input class="form-input" id="mf-inst" value="${e.institution || ''}" placeholder="e.g. Stanford University">
            </div>
            <div class="form-group">
                <label class="form-label">Field of Study</label>
                <input class="form-input" id="mf-field" value="${e.fieldOfStudy || ''}" placeholder="e.g. Computer Science & AI">
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
                    <label class="form-label">Grade / GPA / Honors</label>
                    <input class="form-input" id="mf-grade" value="${e.grade || ''}" placeholder="e.g. 3.9 GPA / First Class Honors">
                </div>
                <div class="form-group">
                    <label class="form-label">Display Order</label>
                    <input class="form-input" type="number" id="mf-order" value="${e.order || 1}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Description & Activities</label>
                <textarea class="form-input" id="mf-desc" rows="3" placeholder="Courses, achievements...">${e.description || ''}</textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
                <button class="btn-save" type="button" onclick="window.triggerSave()">Save Education</button>
            </div>
        `;
    };

    const eduFormValues = () => ({
        degree:       document.getElementById('mf-degree').value,
        institution:  document.getElementById('mf-inst').value,
        fieldOfStudy: document.getElementById('mf-field').value,
        startDate:    document.getElementById('mf-start').value ? new Date(document.getElementById('mf-start').value).toISOString() : new Date().toISOString(),
        endDate:      document.getElementById('mf-end').value ? new Date(document.getElementById('mf-end').value).toISOString() : null,
        grade:        document.getElementById('mf-grade').value,
        order:        parseInt(document.getElementById('mf-order').value) || 1,
        description:  document.getElementById('mf-desc').value
    });

    const init = (config = {}) => {
        EducationAPI = config.EducationAPI || window.API?.EducationAPI;
        showToast    = config.toast || window.toast;
        openModal    = config.openModal || window.openModal;

        const container = document.getElementById('panel-education');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-education')?.addEventListener('click', () => {
            openModal('Add Education', eduForm(), async () => {
                await EducationAPI.create(eduFormValues());
                if (showToast) showToast('Education entry created!');
                loadEducation();
            });
        });
    };

    const editEducation = async (id) => {
        try {
            const res = await EducationAPI.getById(id);
            const e = res.data;
            openModal('Edit Education', eduForm(e), async () => {
                await EducationAPI.update(id, eduFormValues());
                if (showToast) showToast('Education entry updated!');
                loadEducation();
            });
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteEducation = (id) => {
        if (!confirm('Are you sure you want to delete this education entry?')) return;
        (async () => {
            try {
                await EducationAPI.delete(id);
                if (showToast) showToast('Education entry deleted!');
                loadEducation();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadEducation,
        editEducation,
        deleteEducation
    };
})();
