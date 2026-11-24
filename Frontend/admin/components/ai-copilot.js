/**
 * AI Site Architect & Co-Pilot for Portfolio CMS Admin Dashboard
 * Connects with /api/ai/chat and provides conversational actions (create projects, skills, backups, UI components)
 * Primary Theme: #0F0E0C (Canvas), #E96B02 (Primary Accent)
 */

window.AiCopilotManager = (function () {
    const API_BASE = '/api/ai';
    let isOpen = false;

    function init() {
        if (document.getElementById('ai-copilot-container')) return;
        renderWidget();
        attachEvents();
    }

    function renderWidget() {
        const wrap = document.createElement('div');
        wrap.id = 'ai-copilot-container';
        wrap.innerHTML = `
            <!-- Floating Launch Button -->
            <button id="ai-copilot-btn" title="Open AI Site Architect" style="position:fixed; bottom:24px; right:24px; background:#0F0E0C; color:#E96B02; border:2px solid #E96B02; padding:12px 20px; border-radius:9999px; font-weight:700; font-size:14px; display:flex; align-items:center; gap:10px; cursor:pointer; box-shadow:0 8px 30px rgba(233,107,2,0.35); z-index:9999; transition:0.25s transform cubic-bezier(0.16, 1, 0.3, 1);">
                <i class="fa-solid fa-wand-magic-sparkles" style="font-size:16px;"></i>
                <span>AI Architect</span>
                <span style="background:#E96B02; color:#0F0E0C; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:800; text-transform:uppercase;">PRO</span>
            </button>

            <!-- Chat Drawer / Modal -->
            <div id="ai-copilot-drawer" style="position:fixed; bottom:85px; right:24px; width:420px; max-width:calc(100vw - 32px); height:600px; max-height:calc(100vh - 120px); background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,0.85); display:none; flex-direction:column; z-index:9999; overflow:hidden; font-family:var(--font-body, sans-serif);">
                <!-- Drawer Header -->
                <div style="background:#171512; border-bottom:1px solid rgba(233,107,2,0.2); padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:34px; height:34px; border-radius:8px; background:#E96B02; color:#0F0E0C; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:bold;">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div>
                            <div style="font-weight:700; font-size:15px; color:#FAF9F6;">AI Site Architect</div>
                            <div style="font-size:11px; color:#E96B02; font-weight:600;"><i class="fa-solid fa-circle" style="font-size:8px; margin-right:4px;"></i>Ready for instructions</div>
                        </div>
                    </div>
                    <button id="ai-copilot-close" style="background:none; border:none; color:#A8A29E; font-size:18px; cursor:pointer;" title="Close">&times;</button>
                </div>

                <!-- Chat Messages Body -->
                <div id="ai-copilot-messages" style="flex:1; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:14px; background:#0F0E0C;">
                    <!-- Welcome Message -->
                    <div style="background:#171512; border:1px solid rgba(233,107,2,0.2); border-radius:12px; padding:14px; color:#FAF9F6; font-size:13px; line-height:1.5;">
                        <strong style="color:#E96B02; display:block; margin-bottom:4px;">Welcome to your AI Co-Pilot!</strong>
                        I have full control over your portfolio system. I can generate projects, skills, services, WordPress Duplicator packages, or high-taste UI elements on the fly.
                    </div>
                </div>

                <!-- Quick Action Chips -->
                <div style="padding:8px 14px; background:#171512; border-top:1px solid rgba(233,107,2,0.15); display:flex; gap:6px; overflow-x:auto; white-space:nowrap; scrollbar-width:none;">
                    <button class="ai-chip" data-msg="Add project: NextGen DeFi Trading Platform" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">+ Project</button>
                    <button class="ai-chip" data-msg="Add skill: Docker & Kubernetes" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">+ Skill</button>
                    <button class="ai-chip" data-msg="Add service: Cloud Solutions Architecture" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">+ Service</button>
                    <button class="ai-chip" data-msg="Create backup package" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">Backup Site</button>
                    <button class="ai-chip" data-msg="Generate UI component for hero showcase" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">Design UI</button>
                </div>

                <!-- Input Footer -->
                <div style="padding:14px; background:#171512; border-top:1px solid rgba(233,107,2,0.2); display:flex; gap:8px;">
                    <input type="text" id="ai-copilot-input" placeholder="Type prompt (e.g. 'Add project: AI SaaS App')..." style="flex:1; background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); border-radius:8px; padding:10px 14px; color:#FAF9F6; font-size:13px; outline:none;" />
                    <button id="ai-copilot-send" style="background:#E96B02; color:#0F0E0C; border:none; width:40px; height:40px; border-radius:8px; font-size:15px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    function attachEvents() {
        const btn = document.getElementById('ai-copilot-btn');
        const drawer = document.getElementById('ai-copilot-drawer');
        const closeBtn = document.getElementById('ai-copilot-close');
        const input = document.getElementById('ai-copilot-input');
        const sendBtn = document.getElementById('ai-copilot-send');

        btn.onclick = () => toggle();
        closeBtn.onclick = () => toggle(false);

        sendBtn.onclick = () => sendMessage();
        input.onkeydown = (e) => {
            if (e.key === 'Enter') sendMessage();
        };

        document.querySelectorAll('.ai-chip').forEach(chip => {
            chip.onclick = () => {
                input.value = chip.dataset.msg;
                sendMessage();
            };
        });
    }

    function toggle(force) {
        isOpen = force !== undefined ? force : !isOpen;
        const drawer = document.getElementById('ai-copilot-drawer');
        if (drawer) {
            drawer.style.display = isOpen ? 'flex' : 'none';
            if (isOpen) {
                document.getElementById('ai-copilot-input').focus();
            }
        }
    }

    async function sendMessage() {
        const input = document.getElementById('ai-copilot-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        appendMessage('user', text);

        const loadingId = appendLoading();

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, isAdmin: true })
            });

            const data = await res.json();
            removeMessage(loadingId);

            if (data && data.success && data.data) {
                appendMessage('ai', data.data.reply, data.data.generatedHtml, data.data.actionExecuted);
            } else {
                appendMessage('ai', data?.message || 'Sorry, I encountered an error executing that request.');
            }
        } catch (err) {
            removeMessage(loadingId);
            appendMessage('ai', 'Error connecting to AI service: ' + err.message);
        }
    }

    function appendMessage(sender, text, htmlPreview, action) {
        const container = document.getElementById('ai-copilot-messages');
        const msg = document.createElement('div');
        msg.style.cssText = sender === 'user'
            ? 'align-self:flex-end; background:#E96B02; color:#0F0E0C; font-weight:600; padding:10px 14px; border-radius:12px 12px 2px 12px; max-width:85%; font-size:13px; line-height:1.4;'
            : 'align-self:flex-start; background:#171512; border:1px solid rgba(233,107,2,0.25); color:#FAF9F6; padding:12px 14px; border-radius:12px 12px 12px 2px; max-width:90%; font-size:13px; line-height:1.5;';

        let inner = `<div>${text}</div>`;

        if (action) {
            inner += `
                <div style="margin-top:8px; background:#0F0E0C; border:1px solid #E96B02; border-radius:6px; padding:6px 10px; font-size:11px; display:inline-flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-circle-check" style="color:#E96B02;"></i>
                    <span><strong>Executed:</strong> ${action.actionType} (${action.targetTitle})</span>
                </div>
            `;
        }

        if (htmlPreview) {
            inner += `
                <div style="margin-top:10px; border-top:1px dashed rgba(233,107,2,0.3); padding-top:10px;">
                    <div style="font-size:11px; color:#E96B02; font-weight:700; margin-bottom:6px;">GENERATED COMPONENT PREVIEW:</div>
                    <div style="background:#0F0E0C; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); max-height:200px; overflow-y:auto;">
                        ${htmlPreview}
                    </div>
                </div>
            `;
        }

        msg.innerHTML = inner;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    function appendLoading() {
        const id = 'loading-' + Date.now();
        const container = document.getElementById('ai-copilot-messages');
        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = 'align-self:flex-start; background:#171512; border:1px solid rgba(233,107,2,0.15); color:#E96B02; padding:10px 14px; border-radius:12px; font-size:12px; display:flex; align-items:center; gap:8px;';
        div.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing intent and synthesizing action...`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    return {
        init,
        toggle
    };
})();
