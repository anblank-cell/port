/**
 * EmailSettingsManager Component
 * Modular component for managing Email Sending & Receiving Configuration,
 * SMTP Provider presets, test emails, and notification preferences.
 */

window.EmailSettingsManager = (() => {
    let SiteSettingsAPI = null;
    let showToast = null;
    let openModal = null;
    let currentSettings = [];

    // SMTP Provider preset definitions for dropdown
    const EMAIL_PRESETS = {
        gmail: {
            name: 'Google / Gmail SMTP',
            host: 'smtp.gmail.com',
            port: '587',
            encryption: 'tls',
            hint: 'Use your full Gmail address as the SMTP Username and a 16-character Google App Password (create under Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords).'
        },
        outlook: {
            name: 'Microsoft Outlook / Office 365',
            host: 'smtp.office365.com',
            port: '587',
            encryption: 'tls',
            hint: 'Use your full Outlook or Office 365 email as the SMTP Username and your password or app password.'
        },
        sendgrid: {
            name: 'SendGrid SMTP',
            host: 'smtp.sendgrid.net',
            port: '587',
            encryption: 'tls',
            hint: 'Use <strong>apikey</strong> as the SMTP username, and your SendGrid API key as the password.'
        },
        mailgun: {
            name: 'Mailgun SMTP',
            host: 'smtp.mailgun.org',
            port: '587',
            encryption: 'tls',
            hint: 'Use your Mailgun SMTP login domain username and password.'
        },
        yahoo: {
            name: 'Yahoo Mail SMTP',
            host: 'smtp.mail.yahoo.com',
            port: '587',
            encryption: 'tls',
            hint: 'Use your Yahoo email address as the SMTP Username and generate a Yahoo App Password in account security.'
        },
        custom: {
            name: 'Custom SMTP Server',
            host: '',
            port: '587',
            encryption: 'tls',
            hint: 'Enter your custom SMTP server host, port, and authentication credentials.'
        },
        disabled: {
            name: 'Disabled (Store Messages in Database Only)',
            host: '',
            port: '',
            encryption: 'none',
            hint: 'Email sending is currently disabled. Visitor messages will still be saved safely in the admin Messages tab.'
        }
    };

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Email Sending &amp; Receiving Configuration</h2>
                <p>Configure outgoing SMTP mail delivery, incoming admin alerts, and automated visitor acknowledgments.</p>
            </div>
            <button class="btn-sm" id="btn-test-email-top" type="button" style="background:rgba(99,102,241,0.15);color:var(--accent);border:1px solid rgba(99,102,241,0.3);padding:0.55rem 1.25rem;font-weight:600;display:inline-flex;align-items:center;gap:0.5rem;">
                <i class="fa-solid fa-paper-plane"></i> Send Test Email
            </button>
        </div>

        <!-- ─── Email Configuration Main Card ─────────────────────────────── -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.5rem;margin-bottom:1.5rem;backdrop-filter:blur(8px);">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.25rem;">
                <div>
                    <h3 style="font-size:1.1rem;margin-bottom:0.35rem;display:flex;align-items:center;gap:0.6rem;">
                        <i class="fa-solid fa-envelope-circle-check" style="color:var(--accent);"></i> Email Service Provider &amp; Mode
                    </h3>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin:0;">
                        Select an email provider or configure custom SMTP to send visitor auto-replies, forward contact inquiries, and test delivery.
                    </p>
                </div>
                <div id="email-status-badge" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.4rem 1rem;border-radius:999px;font-size:0.8rem;font-weight:600;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);color:var(--accent);">
                    <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
                    <span id="email-status-badge-text">Provider: Loading...</span>
                </div>
            </div>

            <!-- Provider Selection Dropdown -->
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:1.1rem;margin-bottom:1.25rem;">
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem;align-items:center;">
                    <div>
                        <label class="form-label" for="email-provider-select" style="font-weight:600;display:flex;align-items:center;gap:0.4rem;">
                            <i class="fa-solid fa-server" style="color:var(--accent);"></i> Select Email Provider
                        </label>
                        <select class="form-select" id="email-provider-select" style="width:100%;font-weight:500;">
                            <option value="gmail">Google / Gmail SMTP (smtp.gmail.com)</option>
                            <option value="outlook">Microsoft Outlook / Office 365 (smtp.office365.com)</option>
                            <option value="sendgrid">SendGrid SMTP (smtp.sendgrid.net)</option>
                            <option value="mailgun">Mailgun SMTP (smtp.mailgun.org)</option>
                            <option value="yahoo">Yahoo Mail SMTP (smtp.mail.yahoo.com)</option>
                            <option value="custom">Custom SMTP Server (Self-hosted / Other)</option>
                            <option value="disabled">Disabled (Store Messages in Database Only)</option>
                        </select>
                    </div>
                    <div id="email-provider-hint-box" style="font-size:0.8rem;color:var(--text-muted);background:rgba(0,0,0,0.2);padding:0.75rem 1rem;border-radius:6px;border-left:3px solid var(--accent);line-height:1.45;">
                        <span id="email-provider-hint-text">Select a provider above to auto-fill recommended connection details.</span>
                    </div>
                </div>
            </div>

            <!-- 2-Column Grid: Outgoing (Sending) vs Incoming (Receiving) -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1.5rem;margin-bottom:1.25rem;">
                
                <!-- 📤 Outgoing Mail Settings (Sending / SMTP) -->
                <div style="background:rgba(255,255,255,0.015);border:1px solid var(--border-color);border-radius:8px;padding:1.2rem;">
                    <h4 style="font-size:0.95rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;color:var(--text-primary);border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;">
                        <i class="fa-solid fa-paper-plane" style="color:#38bdf8;"></i> Outgoing Mail (Sending / SMTP)
                    </h4>
                    
                    <div style="display:grid;gap:0.85rem;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                            <div>
                                <label class="form-label" for="email-smtp-host">SMTP Host / Server</label>
                                <input class="form-input" type="text" id="email-smtp-host" placeholder="e.g. smtp.gmail.com">
                            </div>
                            <div>
                                <label class="form-label" for="email-smtp-port">SMTP Port</label>
                                <input class="form-input" type="number" id="email-smtp-port" placeholder="e.g. 587">
                            </div>
                        </div>

                        <div>
                            <label class="form-label" for="email-smtp-encryption">Encryption / SSL Mode</label>
                            <select class="form-select" id="email-smtp-encryption" style="width:100%;">
                                <option value="tls">STARTTLS / TLS (Port 587)</option>
                                <option value="ssl">SSL (Port 465)</option>
                                <option value="none">None / Unencrypted (Port 25)</option>
                            </select>
                        </div>

                        <div>
                            <label class="form-label" for="email-smtp-user">SMTP Username / Account Email</label>
                            <input class="form-input" type="text" id="email-smtp-user" placeholder="e.g. your-email@gmail.com or API Key">
                        </div>

                        <div>
                            <label class="form-label" for="email-smtp-pass">SMTP Password / App Password</label>
                            <div style="position:relative;display:flex;align-items:center;">
                                <input class="form-input" type="password" id="email-smtp-pass" placeholder="••••••••••••" style="padding-right:2.5rem;width:100%;">
                                <button type="button" id="btn-toggle-smtp-pass" title="Toggle password visibility" style="position:absolute;right:0.75rem;background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0.25rem;">
                                    <i class="fa-solid fa-eye" id="icon-toggle-smtp-pass"></i>
                                </button>
                            </div>
                        </div>

                        <div style="border-top:1px dashed var(--border-color);padding-top:0.75rem;margin-top:0.25rem;">
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
                                <label class="form-label" for="email-autoreply-toggle" style="margin:0;">Visitor Auto-Reply Acknowledgment</label>
                                <select class="form-select" id="email-autoreply-toggle" style="width:auto;padding:0.25rem 0.6rem;font-size:0.8rem;">
                                    <option value="false">Disabled</option>
                                    <option value="true">Enabled</option>
                                </select>
                            </div>
                            <input class="form-input" type="text" id="email-autoreply-subject" placeholder="Auto-Reply Subject (e.g. Thanks for reaching out!)" style="margin-bottom:0.5rem;font-size:0.85rem;">
                            <textarea class="form-input" id="email-autoreply-msg" rows="2" placeholder="Custom Auto-Reply Message body..." style="font-size:0.85rem;resize:vertical;"></textarea>
                        </div>
                    </div>
                </div>

                <!-- 📥 Incoming Mail Settings (Receiving / Admin Alerts) -->
                <div style="background:rgba(255,255,255,0.015);border:1px solid var(--border-color);border-radius:8px;padding:1.2rem;display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <h4 style="font-size:0.95rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;color:var(--text-primary);border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;">
                            <i class="fa-solid fa-inbox" style="color:#a855f7;"></i> Incoming Inquiries (Receiving &amp; Alerts)
                        </h4>

                        <div style="display:grid;gap:0.85rem;">
                            <div>
                                <label class="form-label" for="email-receiver-email">Admin Receiving Email Address</label>
                                <input class="form-input" type="email" id="email-receiver-email" placeholder="e.g. admin@portfolio.com">
                                <span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-top:0.25rem;">
                                    Where visitor contact form messages and system alerts are sent.
                                </span>
                            </div>

                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                                <div>
                                    <label class="form-label" for="email-notify-admin">New Inquiry Notification</label>
                                    <select class="form-select" id="email-notify-admin" style="width:100%;">
                                        <option value="true">Enabled (Notify on new message)</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="form-label" for="email-subject-prefix">Subject Line Tag</label>
                                    <input class="form-input" type="text" id="email-subject-prefix" placeholder="e.g. [Portfolio Contact]">
                                </div>
                            </div>

                            <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2);border-radius:6px;padding:0.9rem;margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted);line-height:1.5;">
                                <strong style="color:var(--text-primary);display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem;">
                                    <i class="fa-solid fa-circle-info" style="color:var(--accent);"></i> How it works:
                                </strong>
                                When a visitor submits the contact form on your public portfolio, the system securely routes the message to your Admin Receiving Email and automatically delivers a confirmation email back to the visitor.
                            </div>
                        </div>
                    </div>

                    <!-- Test Email & Action Area -->
                    <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
                        <button class="btn-sm" id="btn-test-email" type="button" style="background:rgba(99,102,241,0.15);color:var(--accent);border:1px solid rgba(99,102,241,0.3);padding:0.5rem 1rem;font-weight:600;display:inline-flex;align-items:center;gap:0.5rem;">
                            <i class="fa-solid fa-paper-plane"></i> Send Test Email
                        </button>
                        <span id="test-email-quick-status" style="font-size:0.8rem;color:var(--text-muted);"></span>
                    </div>
                </div>
            </div>

            <!-- Email Settings Action Bar -->
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:0.75rem;border-top:1px solid var(--border-color);padding-top:1rem;">
                <button class="btn-add" id="btn-save-email-config" style="padding:0.55rem 1.4rem;background:linear-gradient(135deg, #6366f1, #4f46e5);color:#fff;font-weight:600;">
                    <i class="fa-solid fa-floppy-disk"></i> Save Email Configuration
                </button>
            </div>
        </div>
    `;

    const updateEmailStatusBadge = (provider) => {
        const badge = document.getElementById('email-status-badge');
        const badgeText = document.getElementById('email-status-badge-text');
        if (!badge || !badgeText) return;

        const p = (provider || 'disabled').toLowerCase();
        if (p === 'disabled' || p === 'off') {
            badge.style.background = 'rgba(148, 163, 184, 0.12)';
            badge.style.border = '1px solid rgba(148, 163, 184, 0.3)';
            badge.style.color = '#94a3b8';
            badge.innerHTML = `
                <span style="width:8px;height:8px;border-radius:50%;background:#94a3b8;display:inline-block;"></span>
                <span>Email Sending: Disabled (DB Only)</span>
            `;
        } else {
            const label = EMAIL_PRESETS[p]?.name || p.toUpperCase();
            badge.style.background = 'rgba(34, 197, 94, 0.12)';
            badge.style.border = '1px solid rgba(34, 197, 94, 0.3)';
            badge.style.color = '#4ade80';
            badge.innerHTML = `
                <span style="width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block;box-shadow:0 0 6px #4ade80;"></span>
                <span>Active: ${label}</span>
            `;
        }
    };

    const applyProviderPresetUI = (providerKey) => {
        const preset = EMAIL_PRESETS[providerKey] || EMAIL_PRESETS.custom;
        const hintEl = document.getElementById('email-provider-hint-text');
        if (hintEl) hintEl.innerHTML = preset.hint;

        const hostEl = document.getElementById('email-smtp-host');
        const portEl = document.getElementById('email-smtp-port');
        const encEl  = document.getElementById('email-smtp-encryption');

        if (preset.host && hostEl) hostEl.value = preset.host;
        if (preset.port && portEl) portEl.value = preset.port;
        if (preset.encryption && encEl) encEl.value = preset.encryption;

        updateEmailStatusBadge(providerKey);
    };

    const loadEmailSettings = async () => {
        try {
            const res = await SiteSettingsAPI.getAll();
            currentSettings = res?.data || [];
            
            const getVal = (k, def = '') => currentSettings.find(s => s.key.toLowerCase() === k.toLowerCase())?.value || def;

            const siteName     = getVal('site_name', '');
            const contactEmail = getVal('contact_email', '');

            const emailProvider    = getVal('email_provider', 'gmail');
            const emailSmtpHost    = getVal('email_smtp_host', 'smtp.gmail.com');
            const emailSmtpPort    = getVal('email_smtp_port', '587');
            const emailSmtpEnc     = getVal('email_smtp_encryption', 'tls');
            const emailSmtpUser    = getVal('email_smtp_user', contactEmail || '');
            const emailSmtpPass    = getVal('email_smtp_pass', '');
            const emailReceiver    = getVal('email_receiver_email', contactEmail || '');
            const emailNotifyAdmin = getVal('email_notify_admin', 'true');
            const emailPrefix      = getVal('email_subject_prefix', '[Portfolio Contact]');
            const emailAutoReply   = getVal('email_autoreply_enabled', 'false');
            const emailAutoSubject = getVal('email_autoreply_subject', `Thank you for contacting ${siteName || 'Portfolio'}`);
            const emailAutoMsg     = getVal('email_autoreply_message', 'Thank you for reaching out! I have received your message and will get back to you as soon as possible.');

            const provSelEl = document.getElementById('email-provider-select');
            if (provSelEl) provSelEl.value = emailProvider;

            const setField = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val;
            };

            setField('email-smtp-host', emailSmtpHost);
            setField('email-smtp-port', emailSmtpPort);
            setField('email-smtp-encryption', emailSmtpEnc);
            setField('email-smtp-user', emailSmtpUser);
            setField('email-smtp-pass', emailSmtpPass);
            setField('email-receiver-email', emailReceiver);
            setField('email-notify-admin', emailNotifyAdmin);
            setField('email-subject-prefix', emailPrefix);
            setField('email-autoreply-toggle', emailAutoReply);
            setField('email-autoreply-subject', emailAutoSubject);
            setField('email-autoreply-msg', emailAutoMsg);

            updateEmailStatusBadge(emailProvider);
            const presetHint = EMAIL_PRESETS[emailProvider]?.hint || EMAIL_PRESETS.custom.hint;
            const hintBox = document.getElementById('email-provider-hint-text');
            if (hintBox) hintBox.innerHTML = presetHint;
        } catch (err) {
            console.error('Error loading email settings:', err);
            if (showToast) showToast(`Error loading email settings: ${err.message}`, 'error');
        }
    };

    const triggerTestEmailModal = () => {
        const receiverVal = document.getElementById('email-receiver-email')?.value?.trim() 
            || '';

        const testModalContent = `
            <div style="padding:0.5rem 0;">
                <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:1.25rem;">
                    Send a live test verification email to verify your SMTP server host, port, authentication, and TLS security connection.
                </p>
                <div class="form-group" style="margin-bottom:1.25rem;">
                    <label class="form-label" for="test-email-target">Recipient Email Address</label>
                    <input class="form-input" type="email" id="test-email-target" value="${receiverVal}" placeholder="e.g. your-email@domain.com" style="width:100%;">
                </div>
                <div id="test-email-result-box" style="display:none;padding:0.75rem 1rem;border-radius:6px;font-size:0.85rem;margin-bottom:1rem;"></div>
                <div class="modal-actions">
                    <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Close</button>
                    <button class="btn-save" type="button" id="btn-execute-test-email" style="background:var(--accent);">
                        <i class="fa-solid fa-paper-plane"></i> Send Test Now
                    </button>
                </div>
            </div>
        `;

        openModal('Send Test Email', testModalContent);

        const btnExec = document.getElementById('btn-execute-test-email');
        if (btnExec) {
            btnExec.addEventListener('click', async () => {
                const target = document.getElementById('test-email-target')?.value?.trim();
                const resBox = document.getElementById('test-email-result-box');

                if (!target) {
                    if (showToast) showToast('Please enter a recipient email address.', 'error');
                    return;
                }

                btnExec.disabled = true;
                btnExec.innerHTML = '<span class="spinner"></span> Testing connection…';
                if (resBox) {
                    resBox.style.display = 'block';
                    resBox.style.background = 'rgba(99,102,241,0.1)';
                    resBox.style.border = '1px solid rgba(99,102,241,0.3)';
                    resBox.style.color = 'var(--text-primary)';
                    resBox.innerHTML = '<span class="spinner"></span> Connecting to SMTP server and transmitting test email...';
                }

                try {
                    const res = await SiteSettingsAPI.testEmail({ targetEmail: target });
                    if (resBox) {
                        resBox.style.background = 'rgba(34,197,94,0.15)';
                        resBox.style.border = '1px solid rgba(34,197,94,0.4)';
                        resBox.style.color = '#4ade80';
                        resBox.innerHTML = `<strong>✅ Success!</strong> ${res.message || 'Test email dispatched successfully.'}`;
                    }
                    if (showToast) showToast('✅ Test email delivered successfully!', 'success');
                } catch (err) {
                    if (resBox) {
                        resBox.style.background = 'rgba(239,68,68,0.15)';
                        resBox.style.border = '1px solid rgba(239,68,68,0.4)';
                        resBox.style.color = '#f87171';
                        resBox.innerHTML = `<strong>❌ Delivery Failed:</strong> ${err.message}`;
                    }
                    if (showToast) showToast(`Email test failed: ${err.message}`, 'error');
                } finally {
                    btnExec.disabled = false;
                    btnExec.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Test Now';
                }
            });
        }
    };

    const init = (config = {}) => {
        SiteSettingsAPI = config.SiteSettingsAPI || window.API?.SiteSettingsAPI;
        showToast       = config.toast || window.toast;
        openModal       = config.openModal || window.openModal;

        const container = document.getElementById('panel-emailsettings');
        if (container) {
            container.innerHTML = renderPanelHTML();
        }

        // ─── Bind Provider Dropdown Change ──────────────────────────────────
        const provSelect = document.getElementById('email-provider-select');
        if (provSelect) {
            provSelect.addEventListener('change', (e) => {
                applyProviderPresetUI(e.target.value);
            });
        }

        // ─── Bind Password Toggle ───────────────────────────────────────────
        const btnTogglePass = document.getElementById('btn-toggle-smtp-pass');
        const passInput = document.getElementById('email-smtp-pass');
        const iconPass = document.getElementById('icon-toggle-smtp-pass');
        if (btnTogglePass && passInput && iconPass) {
            btnTogglePass.addEventListener('click', () => {
                const isPass = passInput.type === 'password';
                passInput.type = isPass ? 'text' : 'password';
                iconPass.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            });
        }

        // ─── Bind Save Email Configuration Button ────────────────────────────
        const btnSaveEmail = document.getElementById('btn-save-email-config');
        if (btnSaveEmail) {
            btnSaveEmail.addEventListener('click', async () => {
                btnSaveEmail.disabled = true;
                btnSaveEmail.innerHTML = '<span class="spinner"></span> Saving Email Config…';

                try {
                    const getElVal = (id) => document.getElementById(id)?.value?.trim() || '';

                    const emailProvider    = getElVal('email-provider-select') || 'disabled';
                    const emailSmtpHost    = getElVal('email-smtp-host');
                    const emailSmtpPort    = getElVal('email-smtp-port');
                    const emailSmtpEnc     = getElVal('email-smtp-encryption');
                    const emailSmtpUser    = getElVal('email-smtp-user');
                    const emailSmtpPass    = document.getElementById('email-smtp-pass')?.value || '';
                    const emailReceiver    = getElVal('email-receiver-email');
                    const emailNotifyAdmin = getElVal('email-notify-admin');
                    const emailPrefix      = getElVal('email-subject-prefix');
                    const emailAutoReply   = getElVal('email-autoreply-toggle');
                    const emailAutoSubject = getElVal('email-autoreply-subject');
                    const emailAutoMsg     = getElVal('email-autoreply-msg');

                    const entries = [
                        { key: 'email_provider', value: emailProvider },
                        { key: 'email_smtp_host', value: emailSmtpHost },
                        { key: 'email_smtp_port', value: emailSmtpPort },
                        { key: 'email_smtp_encryption', value: emailSmtpEnc },
                        { key: 'email_smtp_user', value: emailSmtpUser },
                        { key: 'email_smtp_pass', value: emailSmtpPass },
                        { key: 'email_receiver_email', value: emailReceiver },
                        { key: 'email_notify_admin', value: emailNotifyAdmin },
                        { key: 'email_subject_prefix', value: emailPrefix },
                        { key: 'email_autoreply_enabled', value: emailAutoReply },
                        { key: 'email_autoreply_subject', value: emailAutoSubject },
                        { key: 'email_autoreply_message', value: emailAutoMsg }
                    ];

                    for (const item of entries) {
                        await SiteSettingsAPI.upsert(item);
                    }

                    updateEmailStatusBadge(emailProvider);
                    if (showToast) {
                        showToast(`✉️ Email configuration for '${EMAIL_PRESETS[emailProvider]?.name || emailProvider}' saved successfully!`, 'success');
                    }
                    loadEmailSettings();
                } catch (e) {
                    if (showToast) showToast(`Failed to save email settings: ${e.message}`, 'error');
                } finally {
                    btnSaveEmail.disabled = false;
                    btnSaveEmail.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Email Configuration';
                }
            });
        }

        // ─── Bind Send Test Email Buttons ─────────────────────────────────────
        document.getElementById('btn-test-email')?.addEventListener('click', triggerTestEmailModal);
        document.getElementById('btn-test-email-top')?.addEventListener('click', triggerTestEmailModal);
    };

    return {
        init,
        renderPanelHTML,
        loadEmailSettings
    };
})();
