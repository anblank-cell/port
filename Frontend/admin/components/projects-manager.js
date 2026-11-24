/**
 * ProjectsManager Component
 * Modular component for managing Projects portfolio items and image uploads.
 */

window.ProjectsManager = (() => {
    let ProjectsAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Projects</h2>
                <p>Manage showcased projects, tech stacks, live links, GitHub URLs, and cover images.</p>
            </div>
            <button class="btn-add" id="btn-add-project">
                <i class="fa-solid fa-plus"></i> Add Project
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Cover</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Order</th>
                        <th>Featured</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-projects"></tbody>
            </table>
        </div>
    `;

    const loadProjects = async () => {
        const tbody = document.getElementById('tbl-projects');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading projects...</td></tr>`;

        try {
            const res = await ProjectsAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No projects found. Click <strong>+ Add Project</strong> to create one.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(p => `
                <tr>
                    <td>
                        <div style="width:48px;height:36px;border-radius:4px;overflow:hidden;background:var(--bg-card-hover);display:flex;align-items:center;justify-content:center;">
                            ${p.imageUrl ? `<img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<i class="fa-solid fa-image" style="color:var(--text-muted);"></i>`}
                        </div>
                    </td>
                    <td><strong>${p.title}</strong></td>
                    <td><span class="tag">${p.categoryTag || 'General'}</span></td>
                    <td>${p.order}</td>
                    <td>${p.isFeatured ? '<span class="tag tag-green">Featured</span>' : '<span class="tag">Standard</span>'}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.ProjectsManager.editProject('${p.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.ProjectsManager.deleteProject('${p.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading projects: ${e.message}</td></tr>`;
        }
    };

    const projectForm = (p = {}) => `
        <div class="form-group">
            <label class="form-label">Project Title</label>
            <input class="form-input" id="mf-title" value="${p.title || ''}" placeholder="e.g. E-Commerce Platform API">
        </div>
        <div class="form-group">
            <label class="form-label">Category Tag</label>
            <input class="form-input" id="mf-category" value="${p.categoryTag || ''}" placeholder="e.g. Full Stack, AI Tools, Mobile App">
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-input" id="mf-desc" rows="3" placeholder="Key features and details...">${p.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Technologies Used (Comma-separated)</label>
            <input class="form-input" id="mf-tech" value="${p.technologies || ''}" placeholder="e.g. React, ASP.NET Core, PostgreSQL">
        </div>

        ${window.ImageUploader.renderHTML('mf-img', p.imageUrl || '', 'Project Cover Image Upload')}

        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Live Project URL</label>
                <input class="form-input" id="mf-url" value="${p.projectUrl || ''}" placeholder="https://myproject.com">
            </div>
            <div class="form-group">
                <label class="form-label">GitHub Repository URL</label>
                <input class="form-input" id="mf-github" value="${p.githubUrl || ''}" placeholder="https://github.com/user/repo">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Display Order</label>
                <input class="form-input" type="number" id="mf-order" value="${p.order || 1}">
            </div>
            <div class="form-group">
                <label class="form-label">Featured Status</label>
                <select class="form-select" id="mf-featured">
                    <option value="true"  ${p.isFeatured ? 'selected':''}>Yes (Featured)</option>
                    <option value="false" ${!p.isFeatured ? 'selected':''}>No (Standard)</option>
                </select>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Project</button>
        </div>
    `;

    const projectFormValues = () => ({
        title:        document.getElementById('mf-title').value,
        categoryTag:  document.getElementById('mf-category').value,
        description:  document.getElementById('mf-desc').value,
        technologies: document.getElementById('mf-tech').value,
        imageUrl:     document.getElementById('mf-img').value,
        projectUrl:   document.getElementById('mf-url').value,
        githubUrl:    document.getElementById('mf-github').value,
        order:        parseInt(document.getElementById('mf-order').value) || 1,
        isFeatured:   document.getElementById('mf-featured').value === 'true'
    });

    const init = (config = {}) => {
        ProjectsAPI = config.ProjectsAPI || window.API?.ProjectsAPI;
        showToast   = config.toast || window.toast;
        openModal   = config.openModal || window.openModal;

        const container = document.getElementById('panel-projects');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-project')?.addEventListener('click', () => {
            openModal('Add Project', projectForm(), async () => {
                await ProjectsAPI.create(projectFormValues());
                if (showToast) showToast('Project created!');
                loadProjects();
            });
            setTimeout(() => window.ImageUploader.attachDragEvents('mf-img'), 50);
        });
    };

    const editProject = async (id) => {
        try {
            const res = await ProjectsAPI.getById(id);
            const p = res.data;
            openModal('Edit Project', projectForm(p), async () => {
                await ProjectsAPI.update(id, projectFormValues());
                if (showToast) showToast('Project updated!');
                loadProjects();
            });
            setTimeout(() => window.ImageUploader.attachDragEvents('mf-img'), 50);
        } catch (e) {
            if (showToast) showToast(`Edit error: ${e.message}`, 'error');
        }
    };

    const deleteProject = (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        (async () => {
            try {
                await ProjectsAPI.delete(id);
                if (showToast) showToast('Project deleted!');
                loadProjects();
            } catch (e) {
                if (showToast) showToast(`Delete error: ${e.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadProjects,
        editProject,
        deleteProject
    };
})();
