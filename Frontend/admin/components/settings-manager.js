/**
 * SettingsManager Component
 * Modular component for managing Site Settings, Portfolio Identity, and Theme Appearance.
 */

window.SettingsManager = (() => {
    let SiteSettingsAPI = null;
    let showToast = null;
    let openModal = null;
    let currentSettings = [];

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Site Settings &amp; Identity</h2>
                <p>Configure global portfolio identity, branding title, contact details, theme colors, and custom site properties.</p>
            </div>
            <button class="btn-add" id="btn-add-setting">
                <i class="fa-solid fa-plus"></i> Add Custom Setting
            </button>
        </div>

        <!-- ─── Quick Email Configuration Banner ──────────────────────────── -->
        <div style="background:linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:var(--radius-md);padding:1.25rem 1.5rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
            <div style="display:flex;align-items:center;gap:0.9rem;">
                <div style="width:42px;height:42px;border-radius:10px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.25rem;">
                    <i class="fa-solid fa-envelope-circle-check"></i>
                </div>
                <div>
                    <h3 style="font-size:1rem;margin:0 0 0.25rem 0;color:var(--text-primary);">Email Sending &amp; Receiving Configuration</h3>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin:0;">Configure Gmail, Outlook, SendGrid, custom SMTP, visitor auto-replies, and test delivery.</p>
                </div>
            </div>
            <button class="btn-sm" type="button" onclick="window.switchAdminPanel('emailsettings')" style="background:var(--accent);color:#fff;font-weight:600;padding:0.5rem 1.2rem;border:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:0.5rem;">
                <span>Open Email Settings</span> <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>

        <!-- ─── Portfolio Appearance & Identity Card ──────────────────────── -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;margin-bottom:1.5rem;backdrop-filter:blur(8px);">
            <h3 style="font-size:1.05rem;margin-bottom:0.4rem;display:flex;align-items:center;gap:0.5rem;">
                <i class="fa-solid fa-palette" style="color:var(--accent);"></i> Portfolio Identity &amp; Appearance
            </h3>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.25rem;">Set site name, branding text, public contact email, and accent colors.</p>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem;margin-bottom:1.25rem;">
                <div>
                    <label class="form-label" for="pref-site-name">Site Name / Brand Title</label>
                    <input class="form-input" type="text" id="pref-site-name" placeholder="e.g. My Portfolio">
                </div>
                <div>
                    <label class="form-label" for="pref-contact-email">Public Display Contact Email</label>
                    <input class="form-input" type="email" id="pref-contact-email" placeholder="e.g. admin@portfolio.com">
                </div>
                <div>
                    <label class="form-label" for="pref-portfolio-theme">Portfolio Theme Mode</label>
                    <select class="form-select" id="pref-portfolio-theme" style="width:100%;">
                        <option value="dark">Dark Theme (Default)</option>
                        <option value="light">Light Theme</option>
                    </select>
                </div>
                <div>
                    <label class="form-label" for="pref-portfolio-accent">Accent Color</label>
                    <input class="form-input" type="text" id="pref-portfolio-accent" placeholder="e.g. #6366f1 or hsl(250,95%,68%)">
                </div>
            </div>
            <button class="btn-add" id="btn-save-portfolio-theme" style="padding:0.55rem 1.25rem;">
                <i class="fa-solid fa-floppy-disk"></i> Save Identity &amp; Appearance
            </button>
        </div>

        <!-- ─── Key-Value Settings Table ─────────────────────────────────── -->
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width:30%;">Setting Key</th>
                        <th style="width:45%;">Setting Value</th>
                        <th style="width:25%;">Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-sitesettings"></tbody>
            </table>
        </div>
    `;

    const loadSiteSettings = async () => {
        const tbody = document.getElementById('tbl-sitesettings');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading site settings...</td></tr>`;

        try {
            const res = await SiteSettingsAPI.getAll();
            currentSettings = res?.data || [];
            
            const getVal = (k, def = '') => currentSettings.find(s => s.key.toLowerCase() === k.toLowerCase())?.value || def;

            // Populate Identity/Appearance
            const siteName     = getVal('site_name', '');
            const contactEmail = getVal('contact_email', '');
            const theme        = getVal('portfolio_theme', localStorage.getItem('portfolio_theme') || 'dark');
            const accent       = getVal('portfolio_accent', localStorage.getItem('portfolio_accent') || '');

            const siteNameEl   = document.getElementById('pref-site-name');
            const emailEl      = document.getElementById('pref-contact-email');
            const themeEl      = document.getElementById('pref-portfolio-theme');
            const accentEl     = document.getElementById('pref-portfolio-accent');

            if (siteNameEl)   siteNameEl.value = siteName;
            if (emailEl)      emailEl.value = contactEmail;
            if (themeEl)      themeEl.value = theme;
            if (accentEl)     accentEl.value = accent;

            // Populate Key-Value Table
            if (!currentSettings.length) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No custom site settings found. Click <strong>+ Add Custom Setting</strong> to create one.</td></tr>`;
                return;
            }

            const trunc = (txt, n = 50) => (txt && txt.length > n) ? txt.slice(0, n) + '...' : (txt || '—');

            tbody.innerHTML = currentSettings.map(s => {
                const isPassKey = s.key.toLowerCase().includes('pass') || s.key.toLowerCase().includes('secret');
                const displayVal = isPassKey ? '••••••••••••' : trunc(s.value, 50);

                return `
                    <tr>
                        <td>
                            <code style="color:var(--accent);font-size:0.85rem;font-weight:600;">${s.key}</code>
                        </td>
                        <td>${displayVal}</td>
                        <td style="display:flex;gap:0.4rem;align-items:center;">
                            <button class="btn-sm btn-edit"   onclick="window.SettingsManager.editSetting('${s.id}')">Edit</button>
                            <button class="btn-sm btn-delete" onclick="window.SettingsManager.deleteSetting('${s.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading settings: ${err.message}</td></tr>`;
        }
    };

    const settingForm = (s = {}) => `
        <div class="form-group">
            <label class="form-label">Setting Key</label>
            <input class="form-input" id="mf-key" value="${s.key || ''}" placeholder="e.g. site_name, contact_email, custom_property" ${s.id ? 'readonly style="opacity:0.8;"' : ''}>
        </div>
        <div class="form-group">
            <label class="form-label">Setting Value</label>
            <input class="form-input" id="mf-val" value="${s.value || ''}" placeholder="Setting value...">
        </div>
        <div class="modal-actions">
            <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
            <button class="btn-save" type="button" onclick="window.triggerSave()">Save Setting</button>
        </div>
    `;

    const settingFormValues = () => ({
        key:   document.getElementById('mf-key').value.trim(),
        value: document.getElementById('mf-val').value.trim()
    });

    const init = (config = {}) => {
        SiteSettingsAPI = config.SiteSettingsAPI || window.API?.SiteSettingsAPI;
        showToast       = config.toast || window.toast;
        openModal       = config.openModal || window.openModal;

        const container = document.getElementById('panel-sitesettings');
        if (container) {
            container.innerHTML = renderPanelHTML();
        }

        // ─── Bind Identity & Appearance Button ──────────────────────────────
        const btnSavePref = document.getElementById('btn-save-portfolio-theme');
        if (btnSavePref) {
            btnSavePref.addEventListener('click', async () => {
                const siteName     = document.getElementById('pref-site-name')?.value.trim() || '';
                const contactEmail = document.getElementById('pref-contact-email')?.value.trim() || '';
                const theme        = document.getElementById('pref-portfolio-theme')?.value || 'dark';
                const accent       = document.getElementById('pref-portfolio-accent')?.value.trim() || '';

                localStorage.setItem('portfolio_theme', theme);
                if (accent) localStorage.setItem('portfolio_accent', accent); else localStorage.removeItem('portfolio_accent');

                btnSavePref.disabled = true;
                btnSavePref.innerHTML = '<span class="spinner"></span> Saving…';

                try {
                    if (siteName)     await SiteSettingsAPI.upsert({ key: 'site_name', value: siteName });
                    if (contactEmail) await SiteSettingsAPI.upsert({ key: 'contact_email', value: contactEmail });
                    await SiteSettingsAPI.upsert({ key: 'portfolio_theme', value: theme });
                    if (accent)       await SiteSettingsAPI.upsert({ key: 'portfolio_accent', value: accent });

                    if (showToast) showToast('Identity & Appearance settings saved successfully!');
                    loadSiteSettings();
                } catch (e) {
                    if (showToast) showToast(`Settings saved locally. Server sync error: ${e.message}`, 'warning');
                } finally {
                    btnSavePref.disabled = false;
                    btnSavePref.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Identity & Appearance';
                }
            });
        }

        // ─── Bind Add Custom Setting Button ─────────────────────────────────
        document.getElementById('btn-add-setting')?.addEventListener('click', () => {
            openModal('Add Custom Site Setting', settingForm(), async () => {
                const dto = settingFormValues();
                if (!dto.key) {
                    if (showToast) showToast('Setting key cannot be empty.', 'error');
                    return;
                }
                await SiteSettingsAPI.upsert(dto);
                if (showToast) showToast(`Setting '${dto.key}' saved successfully!`);
                loadSiteSettings();
            });
        });
    };

    const editSetting = async (id) => {
        try {
            const s = currentSettings.find(x => x.id === id);
            if (!s) return;
            openModal(`Edit Setting (${s.key})`, settingForm(s), async () => {
                const dto = settingFormValues();
                await SiteSettingsAPI.upsert(dto);
                if (showToast) showToast(`Setting '${s.key}' updated!`);
                loadSiteSettings();
            });
        } catch (err) {
            if (showToast) showToast(`Edit error: ${err.message}`, 'error');
        }
    };

    const deleteSetting = (id) => {
        const s = currentSettings.find(x => x.id === id);
        const name = s ? `'${s.key}'` : 'this setting';
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        (async () => {
            try {
                await SiteSettingsAPI.delete(id);
                if (showToast) showToast('Setting deleted successfully!');
                loadSiteSettings();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    return {
        init,
        renderPanelHTML,
        loadSiteSettings,
        editSetting,
        deleteSetting
    };
})();
