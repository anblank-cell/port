/**
 * TestimonialsManager Component
 * Modular component for managing Client Testimonials and Avatar Image Uploads.
 */

window.TestimonialsManager = (() => {
    let TestimonialsAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Testimonials</h2>
                <p>Manage client reviews, recommendations, client roles, and avatar photos.</p>
            </div>
            <button class="btn-add" id="btn-add-testimonial">
                <i class="fa-solid fa-plus"></i> Add Testimonial
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Avatar</th>
                        <th>Client Name</th>
                        <th>Role / Company</th>
                        <th>Feedback</th>
                        <th>Rating</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-testimonials"></tbody>
            </table>
        </div>
    `;

    const loadTestimonials = async () => {
        const tbody = document.getElementById('tbl-testimonials');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading testimonials...</td></tr>`;

        try {
            const res = await TestimonialsAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No testimonials found. Click <strong>+ Add Testimonial</strong> to create one.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(t => `
                <tr>
                    <td>
                        <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--bg-card-hover);display:flex;align-items:center;justify-content:center;">
                            ${t.avatarUrl ? `<img src="${t.avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<i class="fa-solid fa-user" style="color:var(--text-muted);"></i>`}
                        </div>
                    </td>
                    <td><strong>${t.clientName}</strong></td>
                    <td>${t.clientRole || ''} ${t.companyName ? '@ '+t.companyName : ''}</td>
                    <td>${t.content ? (t.content.length > 40 ? t.content.slice(0,40)+'...' : t.content) : '—'}</td>
                    <td><span class="tag tag-green">${t.rating || 5} Stars</span></td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.TestimonialsManager.editTestimonial('${t.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.TestimonialsManager.deleteTestimonial('${t.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading testimonials: ${err.message}</td></tr>`;
        }
    };

    const testimonialForm = (t = {}) => `
        <div class="form-group">
            <label class="form-label">Client Name</label>
            <input class="form-input" id="mf-name" value="${t.clientName || ''}" placeholder="e.g. Sarah Connor">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Client Job Role</label>
                <input class="form-input" id="mf-role" value="${t.clientRole || ''}" placeholder="e.g. Product Manager">
            </div>
            <div class="form-group">
                <label class="form-label">Company Name</label>
                <input class="form-input" id="mf-company" value="${t.companyName || ''}" placeholder="e.g. TechCorp">
            </div>
        </div>

        ${window.ImageUploader.renderHTML('mf-avatar', t.avatarUrl || '', 'Client Avatar Image Upload')}

        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Rating Stars (1-5)</label>
                <input class="form-input" type="number" id="mf-rating" min="1" max="5" value="${t.rating || 5}">
            </div>
            <div class="form-group">
                <label class="form-label">Display Order</label>
                <input class="form-input" type="number" id="mf-order" value="${t.order || 1}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Testimonial Content / Review</label>
            <textarea class="form-input" id="mf-content" rows="3" placeholder="Client feedback...">${t.content || ''}</textarea>
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Testimonial</button>
        </div>
    `;

    const testimonialFormValues = () => ({
        clientName:  document.getElementById('mf-name').value,
        clientRole:  document.getElementById('mf-role').value,
        companyName: document.getElementById('mf-company').value,
        avatarUrl:   document.getElementById('mf-avatar').value,
        rating:      parseInt(document.getElementById('mf-rating').value) || 5,
        order:       parseInt(document.getElementById('mf-order').value) || 1,
        content:     document.getElementById('mf-content').value
    });

    const init = (config = {}) => {
        TestimonialsAPI = config.TestimonialsAPI || window.API?.TestimonialsAPI;
        showToast       = config.toast || window.toast;
        openModal       = config.openModal || window.openModal;

        const container = document.getElementById('panel-testimonials');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-testimonial')?.addEventListener('click', () => {
            openModal('Add Testimonial', testimonialForm(), async () => {
                await TestimonialsAPI.create(testimonialFormValues());
                if (showToast) showToast('Testimonial created!');
                loadTestimonials();
            });
            setTimeout(() => window.ImageUploader.attachDragEvents('mf-avatar'), 50);
        });
    };

    const editTestimonial = async (id) => {
        try {
            const res = await TestimonialsAPI.getById(id);
            const t = res.data;
            openModal('Edit Testimonial', testimonialForm(t), async () => {
                await TestimonialsAPI.update(id, testimonialFormValues());
                if (showToast) showToast('Testimonial updated!');
                loadTestimonials();
            });
            setTimeout(() => window.ImageUploader.attachDragEvents('mf-avatar'), 50);
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteTestimonial = (id) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        (async () => {
            try {
                await TestimonialsAPI.delete(id);
                if (showToast) showToast('Testimonial deleted!');
                loadTestimonials();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadTestimonials,
        editTestimonial,
        deleteTestimonial
    };
})();
