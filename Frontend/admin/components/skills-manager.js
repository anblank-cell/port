/**
 * SkillsManager Component
 * Modular component for managing Technical Skills & Proficiency indicators.
 */

window.SkillsManager = (() => {
    let SkillsAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Skills</h2>
                <p>Manage technical proficiencies, skill categories, and display weights.</p>
            </div>
            <button class="btn-add" id="btn-add-skill">
                <i class="fa-solid fa-plus"></i> Add Skill
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Skill Name</th>
                        <th>Category</th>
                        <th>Proficiency</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-skills"></tbody>
            </table>
        </div>
    `;

    const loadSkills = async () => {
        const tbody = document.getElementById('tbl-skills');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading skills...</td></tr>`;

        try {
            const res = await SkillsAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No skills found. Click <strong>+ Add Skill</strong> to create one.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(s => `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td><span class="tag">${s.category || 'General'}</span></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <div style="flex:1;height:6px;background:var(--bg-card-hover);border-radius:3px;overflow:hidden;max-width:100px;">
                                <div style="width:${s.proficiencyPercentage}%;height:100%;background:var(--accent);"></div>
                            </div>
                            <span style="font-size:0.8rem;font-weight:600;">${s.proficiencyPercentage}%</span>
                        </div>
                    </td>
                    <td>${s.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.SkillsManager.editSkill('${s.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.SkillsManager.deleteSkill('${s.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading skills: ${e.message}</td></tr>`;
        }
    };

    const skillForm = (s = {}) => `
        <div class="form-group">
            <label class="form-label">Skill Name</label>
            <input class="form-input" id="mf-name" value="${s.name || ''}" placeholder="e.g. C# / .NET Core, React, PostgreSQL">
        </div>
        <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-input" id="mf-cat" value="${s.category || ''}" placeholder="e.g. Backend, Frontend, Cloud & DevOps">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Proficiency Percentage (0-100)</label>
                <input class="form-input" type="number" id="mf-pct" min="0" max="100" value="${s.proficiencyPercentage || 85}">
            </div>
            <div class="form-group">
                <label class="form-label">Display Order</label>
                <input class="form-input" type="number" id="mf-order" value="${s.order || 1}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Icon Class (Font Awesome)</label>
            <input class="form-input" id="mf-icon" value="${s.icon || ''}" placeholder="e.g. fa-solid fa-code">
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Skill</button>
        </div>
    `;

    const skillFormValues = () => ({
        name:                  document.getElementById('mf-name').value,
        category:              document.getElementById('mf-cat').value,
        proficiencyPercentage: parseInt(document.getElementById('mf-pct').value) || 85,
        order:                 parseInt(document.getElementById('mf-order').value) || 1,
        icon:                  document.getElementById('mf-icon').value
    });

    const init = (config = {}) => {
        SkillsAPI = config.SkillsAPI || window.API?.SkillsAPI;
        showToast = config.toast || window.toast;
        openModal = config.openModal || window.openModal;

        const container = document.getElementById('panel-skills');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-skill')?.addEventListener('click', () => {
            openModal('Add Skill', skillForm(), async () => {
                await SkillsAPI.create(skillFormValues());
                if (showToast) showToast('Skill created!');
                loadSkills();
            });
        });
    };

    const editSkill = async (id) => {
        try {
            const res = await SkillsAPI.getById(id);
            const s = res.data;
            openModal('Edit Skill', skillForm(s), async () => {
                await SkillsAPI.update(id, skillFormValues());
                if (showToast) showToast('Skill updated!');
                loadSkills();
            });
        } catch (e) {
            if (showToast) showToast(`Edit error: ${e.message}`, 'error');
        }
    };

    const deleteSkill = (id) => {
        if (!confirm('Are you sure you want to delete this skill?')) return;
        (async () => {
            try {
                await SkillsAPI.delete(id);
                if (showToast) showToast('Skill deleted!');
                loadSkills();
            } catch (e) {
                if (showToast) showToast(`Delete error: ${e.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadSkills,
        editSkill,
        deleteSkill
    };
})();
