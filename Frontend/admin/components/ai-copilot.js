/**
 * AI Site Architect & Co-Pilot for Portfolio CMS Admin Dashboard
 * Connects with /api/ai/chat and provides conversational actions (create projects, skills, backups, UI components)
 * Primary Theme: #0F0E0C (Canvas), #E96B02 (Primary Accent)
 */

window.AiCopilotManager = (function () {
    const getApiUrl = () => {
        if (window.API_BASE && window.API_BASE.startsWith('http')) return `${window.API_BASE}/ai/chat`;
        if (window.location.port !== '5100') return 'http://localhost:5100/api/ai/chat';
        return '/api/ai/chat';
    };
    let isOpen = false;
    let chatHistory = [];

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
                            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                                <span style="font-size:10px; color:#E96B02; font-weight:700;"><i class="fa-solid fa-circle" style="font-size:7px; margin-right:3px;"></i>Active</span>
                                <span id="ai-engine-badge" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.35); color:#FAF9F6; font-size:10px; padding:1px 6px; border-radius:8px; cursor:pointer;" title="Click for Free AI Setup">Engine: Auto</span>
                            </div>
                        </div>
                    </div>
                    <button id="ai-copilot-close" style="background:none; border:none; color:#A8A29E; font-size:18px; cursor:pointer;" title="Close">&times;</button>
                </div>

                <!-- Chat Messages Body -->
                <div id="ai-copilot-messages" style="flex:1; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:14px; background:#0F0E0C;">
                    <!-- Welcome Message -->
                    <div style="background:#171512; border:1px solid rgba(233,107,2,0.2); border-radius:12px; padding:14px; color:#FAF9F6; font-size:13px; line-height:1.5;">
                        <strong style="color:#E96B02; display:block; margin-bottom:4px;">👋 Hey there! Welcome to your AI Co-Pilot!</strong>
                        I'm your chatty, full-stack site architect. I can converse naturally, brainstorm ideas, draft new projects, register skills, design high-taste <strong>#0F0E0C</strong> &amp; <strong>#E96B02</strong> UI elements, or run WordPress Duplicator backups. What are we building today? 🚀
                    </div>
                </div>

                <!-- Quick Action Chips -->
                <div style="padding:8px 14px; background:#171512; border-top:1px solid rgba(233,107,2,0.15); display:flex; gap:6px; overflow-x:auto; white-space:nowrap; scrollbar-width:none;">
                    <button class="ai-chip" data-msg="Hey! What can you help me build today?" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">👋 Say Hello</button>
                    <button class="ai-chip" data-msg="Add project: Autonomous Multi-Agent AI Platform" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">🚀 + Project</button>
                    <button class="ai-chip" data-msg="Design UI component for featured project showcase" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">🎨 Design UI</button>
                    <button class="ai-chip" data-msg="What are my currently registered skills?" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">⚡ My Skills</button>
                    <button class="ai-chip" data-msg="Create a WordPress Duplicator backup snapshot" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer;">📦 Backup Site</button>
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

        // Engine Status & Free Setup Dialog
        const badge = document.getElementById('ai-engine-badge');
        if (badge) {
            badge.onclick = () => {
                const info = `FREE UNLIMITED AI OPTIONS:
1. Ollama (100% Free & Unlimited on your Desktop):
   Install: Run 'winget install Ollama.Ollama'
   Then run: 'ollama run llama3.2'
   The app will automatically detect it on http://localhost:11434 with zero API keys and unlimited tokens!

2. OpenRouter (:free models):
   Sign up free on openrouter.ai and use models ending in ':free' (DeepSeek-R1, Llama 3.3).

3. Google Gemini (Free Tier):
   Google AI Studio gives 1,500 free requests/day with Gemini 1.5/2.0 Flash.

4. Built-in Local Engine:
   Always available offline fallback with direct database actions.`;
                alert(info);
            };
        }
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

    async function sendMessage(customText) {
        const input = document.getElementById('ai-copilot-input');
        const text = customText || input.value.trim();
        if (!text) return;

        if (!customText) input.value = '';
        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });

        const loadingId = appendLoading();

        try {
            const url = getApiUrl();
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, isAdmin: true, history: chatHistory })
            });

            if (!res.ok) {
                const textErr = await res.text();
                throw new Error(`Server returned HTTP ${res.status}: ${textErr.substring(0, 80)}`);
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(`Endpoint returned non-JSON data. Please check that the ASP.NET Core backend is running at http://localhost:5100.`);
            }

            const data = await res.json();
            removeMessage(loadingId);

            if (data && data.success && data.data) {
                chatHistory.push({ role: 'assistant', content: data.data.reply });
                appendMessage(
                    'ai',
                    data.data.reply,
                    data.data.generatedHtml,
                    data.data.actionExecuted,
                    data.data.providerUsed,
                    data.data.modelUsed,
                    data.data.suggestedFollowUps
                );
            } else {
                appendMessage('ai', data?.message || 'Sorry, I encountered an error executing that request.');
            }
        } catch (err) {
            removeMessage(loadingId);
            appendMessage('ai', 'Error connecting to AI service: ' + err.message);
        }
    }

    function formatMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#FAF9F6;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:2px 5px; border-radius:4px; font-size:12px;">$1</code>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n- /g, '<br>&bull; ')
            .replace(/\n/g, '<br>');
    }

    function appendMessage(sender, text, htmlPreview, action, provider, model, followUps) {
        const container = document.getElementById('ai-copilot-messages');
        const msg = document.createElement('div');
        msg.style.cssText = sender === 'user'
            ? 'align-self:flex-end; background:#E96B02; color:#0F0E0C; font-weight:600; padding:10px 14px; border-radius:12px 12px 2px 12px; max-width:85%; font-size:13px; line-height:1.4; box-shadow:0 4px 14px rgba(233,107,2,0.3);'
            : 'align-self:flex-start; background:#171512; border:1px solid rgba(233,107,2,0.25); color:#FAF9F6; padding:12px 14px; border-radius:12px 12px 12px 2px; max-width:90%; font-size:13px; line-height:1.5; box-shadow:0 4px 16px rgba(0,0,0,0.4);';

        let inner = `<div>${formatMarkdown(text)}</div>`;

        if (provider) {
            inner += `
                <div style="margin-top:8px; font-size:10px; color:#A8A29E; display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-microchip" style="color:#E96B02;"></i>
                    <span>Engine: <strong>${provider}</strong> ${model ? `(${model})` : ''}</span>
                </div>
            `;
        }

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

        if (followUps && followUps.length > 0) {
            inner += `<div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:6px; border-top:1px solid rgba(233,107,2,0.15); padding-top:8px;">`;
            followUps.forEach(f => {
                const escaped = f.replace(/"/g, '&quot;');
                inner += `<button class="ai-followup-pill" data-prompt="${escaped}" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.35); color:#E96B02; padding:4px 9px; border-radius:10px; font-size:11px; font-weight:600; cursor:pointer; transition:0.15s;" onmouseover="this.style.background='rgba(233,107,2,0.15)'" onmouseout="this.style.background='#0F0E0C'">${f}</button>`;
            });
            inner += `</div>`;
        }

        msg.innerHTML = inner;

        // Wire follow-up pills
        msg.querySelectorAll('.ai-followup-pill').forEach(btn => {
            btn.onclick = () => sendMessage(btn.dataset.prompt);
        });

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    function appendLoading() {
        const id = 'loading-' + Date.now();
        const container = document.getElementById('ai-copilot-messages');
        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = 'align-self:flex-start; background:#171512; border:1px solid rgba(233,107,2,0.15); color:#E96B02; padding:10px 14px; border-radius:12px; font-size:12px; display:flex; align-items:center; gap:8px;';
        div.innerHTML = `<i class="fa-solid fa-sparkles fa-spin"></i> <span>Thinking &amp; composing response...</span>`;
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
