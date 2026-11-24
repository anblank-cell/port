/**
 * CertificatesManager Component
 * Modular component for managing Professional Certifications & Credentials.
 */

window.CertificatesManager = (() => {
    let CertificatesAPI = null;
    let showToast = null;
    let openModal = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Certificates</h2>
                <p>Manage professional credentials, verified badges, issuing organizations, and certificate URLs.</p>
            </div>
            <button class="btn-add" id="btn-add-certificate">
                <i class="fa-solid fa-plus"></i> Add Certificate
            </button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Issuing Organization</th>
                        <th>Issue Date</th>
                        <th>Credential ID</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-certificates"></tbody>
            </table>
        </div>
    `;

    const loadCertificates = async () => {
        const tbody = document.getElementById('tbl-certificates');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading certificates...</td></tr>`;

        try {
            const res = await CertificatesAPI.getAll();
            const items = res?.data || [];
            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No certificates found. Click <strong>+ Add Certificate</strong> to create one.</td></tr>`;
                return;
            }

            const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '—';

            tbody.innerHTML = items.sort((a, b) => a.order - b.order).map(c => `
                <tr>
                    <td><strong>${c.title}</strong></td>
                    <td>${c.issuingOrganization}</td>
                    <td>${fmtDate(c.issueDate)}</td>
                    <td><code style="background:var(--bg-card-hover);padding:0.2rem 0.4rem;border-radius:4px;font-size:0.8rem;">${c.credentialId || '—'}</code></td>
                    <td>${c.order}</td>
                    <td style="display:flex;gap:0.4rem;">
                        <button class="btn-sm btn-edit"   onclick="window.CertificatesManager.editCertificate('${c.id}')">Edit</button>
                        <button class="btn-sm btn-delete" onclick="window.CertificatesManager.deleteCertificate('${c.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading certificates: ${err.message}</td></tr>`;
        }
    };

    const certForm = (c = {}) => {
        const issueVal = c.issueDate ? new Date(c.issueDate).toISOString().slice(0, 10) : '';

        return `
            <div class="form-group">
                <label class="form-label">Certificate Title</label>
                <input class="form-input" id="mf-title" value="${c.title || ''}" placeholder="e.g. AWS Certified Solutions Architect">
            </div>
            <div class="form-group">
                <label class="form-label">Issuing Organization</label>
                <input class="form-input" id="mf-org" value="${c.issuingOrganization || ''}" placeholder="e.g. Amazon Web Services, Microsoft">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Issue Date</label>
                    <input class="form-input" type="date" id="mf-issue" value="${issueVal}">
                </div>
                <div class="form-group">
                    <label class="form-label">Credential ID</label>
                    <input class="form-input" id="mf-cred-id" value="${c.credentialId || ''}" placeholder="e.g. AWS-839201">
                </div>
            </div>

            ${window.ImageUploader.renderHTML('mf-cert-img', c.credentialUrl || '', 'Certificate Badge / Proof File Upload')}

            <div class="form-group">
                <label class="form-label">Display Order</label>
                <input class="form-input" type="number" id="mf-order" value="${c.order || 1}">
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
                <button class="btn-save" type="button" onclick="window.triggerSave()">Save Certificate</button>
            </div>
        `;
    };

    const certFormValues = () => ({
        title:                document.getElementById('mf-title').value,
        issuingOrganization: document.getElementById('mf-org').value,
        issueDate:            document.getElementById('mf-issue').value ? new Date(document.getElementById('mf-issue').value).toISOString() : new Date().toISOString(),
        credentialId:         document.getElementById('mf-cred-id').value,
        credentialUrl:        document.getElementById('mf-cert-img').value,
        order:                parseInt(document.getElementById('mf-order').value) || 1
    });

    const init = (config = {}) => {
        CertificatesAPI = config.CertificatesAPI || window.API?.CertificatesAPI;
        showToast       = config.toast || window.toast;
        openModal       = config.openModal || window.openModal;

        const container = document.getElementById('panel-certificates');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        document.getElementById('btn-add-certificate')?.addEventListener('click', () => {
            openModal('Add Certificate', certForm(), async () => {
                await CertificatesAPI.create(certFormValues());
                if (showToast) showToast('Certificate created!');
                loadCertificates();
            });
            setTimeout(() => window.ImageUploader.attachDragEvents('mf-cert-img'), 50);
        });
    };

    const editCertificate = async (id) => {
        try {
            const res = await CertificatesAPI.getById(id);
            const c = res.data;
            openModal('Edit Certificate', certForm(c), async () => {
                await CertificatesAPI.update(id, certFormValues());
                if (showToast) showToast('Certificate updated!');
                loadCertificates();
            });
            setTimeout(() => window.ImageUploader.attachDragEvents('mf-cert-img'), 50);
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteCertificate = (id) => {
        if (!confirm('Are you sure you want to delete this certificate?')) return;
        (async () => {
            try {
                await CertificatesAPI.delete(id);
                if (showToast) showToast('Certificate deleted!');
                loadCertificates();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadCertificates,
        editCertificate,
        deleteCertificate
    };
})();
