/**
 * Public AI Interactive Portfolio Guide
 * Real-time, conversational portfolio assistant powered by multi-turn AI.
 * Primary Theme: #0F0E0C (Canvas), #E96B02 (Primary Accent)
 */

document.addEventListener('DOMContentLoaded', () => {
    let pubChatHistory = [];

    const getApiUrl = () => {
        if (window.API_BASE && window.API_BASE.startsWith('http')) return `${window.API_BASE}/ai/chat`;
        if (window.location.port !== '5100') return 'http://localhost:5100/api/ai/chat';
        return '/api/ai/chat';
    };

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

    // Inject Floating AI widget into public page
    const widget = document.createElement('div');
    widget.id = 'public-ai-widget';
    widget.innerHTML = `
        <button id="public-ai-btn" aria-label="Open AI Assistant" style="position:fixed; bottom:28px; right:28px; background:#0F0E0C; color:#E96B02; border:2px solid #E96B02; padding:12px 20px; border-radius:9999px; font-weight:700; font-size:13px; display:flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 8px 30px rgba(233,107,2,0.35); z-index:999; transition:0.25s transform, 0.25s box-shadow;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 12px 35px rgba(233,107,2,0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 30px rgba(233,107,2,0.35)'">
            <i class="fa-solid fa-sparkles"></i>
            <span>Ask Portfolio AI</span>
        </button>

        <div id="public-ai-box" style="position:fixed; bottom:85px; right:28px; width:380px; max-width:calc(100vw - 32px); height:520px; max-height:calc(100vh - 120px); background:#0F0E0C; border:1px solid rgba(233,107,2,0.35); border-radius:18px; box-shadow:0 25px 70px rgba(0,0,0,0.9); display:none; flex-direction:column; z-index:999; overflow:hidden; font-family:var(--font-body, system-ui, sans-serif); animation:pubAiFadeIn 0.2s ease-out;">
            <!-- Header -->
            <div style="background:#171512; border-bottom:1px solid rgba(233,107,2,0.25); padding:14px 18px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:8px; background:#E96B02; color:#0F0E0C; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:bold; box-shadow:0 2px 10px rgba(233,107,2,0.4);">
                        <i class="fa-solid fa-sparkles"></i>
                    </div>
                    <div>
                        <div style="font-weight:700; font-size:14px; color:#FAF9F6; display:flex; align-items:center; gap:6px;">
                            <span>Portfolio Co-Pilot</span>
                            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10B981;"></span>
                        </div>
                        <div style="font-size:11px; color:#A8A29E;">Conversational • Multi-turn • Witty</div>
                    </div>
                </div>
                <button id="public-ai-close" aria-label="Close Assistant" style="background:none; border:none; color:#A8A29E; font-size:20px; cursor:pointer; padding:4px; line-height:1; transition:0.15s color;" onmouseover="this.style.color='#FAF9F6'" onmouseout="this.style.color='#A8A29E'">&times;</button>
            </div>

            <!-- Messages Body -->
            <div id="public-ai-msgs" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:#0F0E0C;">
                <div style="background:#171512; border:1px solid rgba(233,107,2,0.2); border-radius:12px; padding:14px; color:#FAF9F6; font-size:13px; line-height:1.55; box-shadow:0 4px 14px rgba(0,0,0,0.3);">
                    👋 <strong>Hey there!</strong> I'm your interactive portfolio guide.<br><br>
                    Ask me anything about my featured projects, technical skills, services, background, or just say hello! I'm here to chat. ✨
                </div>
            </div>

            <!-- Dynamic Follow-Up Chips / Starter Suggestions -->
            <div id="public-ai-chips" style="padding:8px 12px; background:#171512; border-top:1px solid rgba(233,107,2,0.12); display:flex; gap:6px; overflow-x:auto; white-space:nowrap; scrollbar-width:none;">
                <button class="pub-chip" data-q="What are your top skills?" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer; transition:0.15s;" onmouseover="this.style.background='rgba(233,107,2,0.15)'" onmouseout="this.style.background='#0F0E0C'">⚡ Top Skills</button>
                <button class="pub-chip" data-q="Tell me about your featured projects." style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer; transition:0.15s;" onmouseover="this.style.background='rgba(233,107,2,0.15)'" onmouseout="this.style.background='#0F0E0C'">🚀 Featured Projects</button>
                <button class="pub-chip" data-q="What services do you provide?" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer; transition:0.15s;" onmouseover="this.style.background='rgba(233,107,2,0.15)'" onmouseout="this.style.background='#0F0E0C'">🛠️ Services</button>
                <button class="pub-chip" data-q="Tell me a joke!" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); color:#E96B02; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer; transition:0.15s;" onmouseover="this.style.background='rgba(233,107,2,0.15)'" onmouseout="this.style.background='#0F0E0C'">😄 Tell me a joke</button>
            </div>

            <!-- Input Bar -->
            <div style="padding:12px 14px; background:#171512; border-top:1px solid rgba(233,107,2,0.25); display:flex; gap:8px; align-items:center;">
                <input type="text" id="public-ai-input" placeholder="Ask anything (e.g. 'Tell me about yourself')..." style="flex:1; background:#0F0E0C; border:1px solid rgba(233,107,2,0.35); border-radius:10px; padding:9px 13px; color:#FAF9F6; font-size:13px; outline:none; transition:0.15s border-color;" onfocus="this.style.borderColor='#E96B02'" onblur="this.style.borderColor='rgba(233,107,2,0.35)'" />
                <button id="public-ai-send" aria-label="Send message" style="background:#E96B02; color:#0F0E0C; border:none; width:38px; height:38px; border-radius:10px; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.15s transform;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    const btn = document.getElementById('public-ai-btn');
    const box = document.getElementById('public-ai-box');
    const close = document.getElementById('public-ai-close');
    const input = document.getElementById('public-ai-input');
    const send = document.getElementById('public-ai-send');
    const msgs = document.getElementById('public-ai-msgs');
    const chipsContainer = document.getElementById('public-ai-chips');

    btn.onclick = () => {
        const isHidden = box.style.display === 'none' || !box.style.display;
        box.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) input.focus();
    };

    close.onclick = () => { box.style.display = 'none'; };

    const bindChips = () => {
        chipsContainer.querySelectorAll('.pub-chip').forEach(c => {
            c.onclick = () => {
                input.value = c.dataset.q;
                handleSend();
            };
        });
    };
    bindChips();

    const handleSend = async (customPrompt) => {
        const q = customPrompt || input.value.trim();
        if (!q) return;
        if (!customPrompt) input.value = '';

        // Add User Message
        const uMsg = document.createElement('div');
        uMsg.style.cssText = 'align-self:flex-end; background:#E96B02; color:#0F0E0C; font-weight:600; padding:9px 13px; border-radius:12px 12px 2px 12px; font-size:13px; max-width:85%; box-shadow:0 4px 12px rgba(233,107,2,0.25);';
        uMsg.textContent = q;
        msgs.appendChild(uMsg);

        // Record in conversation history
        pubChatHistory.push({ role: 'user', content: q });

        // Add Loading Indicator
        const lMsg = document.createElement('div');
        lMsg.style.cssText = 'align-self:flex-start; color:#E96B02; font-size:12px; display:flex; align-items:center; gap:8px; padding:4px 8px;';
        lMsg.innerHTML = '<i class="fa-solid fa-sparkles fa-spin"></i> <span>Composing thoughtful answer...</span>';
        msgs.appendChild(lMsg);
        msgs.scrollTop = msgs.scrollHeight;

        try {
            const res = await fetch(getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: q, isAdmin: false, history: pubChatHistory })
            });

            if (!res.ok) {
                const textErr = await res.text();
                throw new Error(`Server returned HTTP ${res.status}: ${textErr.substring(0, 80)}`);
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Backend returned non-JSON response. Please ensure ASP.NET Core backend is running at http://localhost:5100.');
            }

            const data = await res.json();
            lMsg.remove();

            const replyText = data?.data?.reply || 'I am happy to help, but could not locate that information.';
            pubChatHistory.push({ role: 'assistant', content: replyText });

            const aiMsg = document.createElement('div');
            aiMsg.style.cssText = 'align-self:flex-start; background:#171512; border:1px solid rgba(233,107,2,0.25); color:#FAF9F6; padding:12px 14px; border-radius:12px 12px 12px 2px; font-size:13px; max-width:88%; line-height:1.55; box-shadow:0 4px 16px rgba(0,0,0,0.35);';

            let contentHtml = `<div>${formatMarkdown(replyText)}</div>`;

            if (data?.data?.providerUsed) {
                contentHtml += `
                    <div style="margin-top:8px; font-size:10px; color:#A8A29E; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-microchip" style="color:#E96B02;"></i>
                        <span>Engine: <strong>${data.data.providerUsed}</strong> ${data.data.modelUsed ? `(${data.data.modelUsed})` : ''}</span>
                    </div>
                `;
            }

            aiMsg.innerHTML = contentHtml;
            msgs.appendChild(aiMsg);

            // Update follow-up chips if provided
            if (data?.data?.suggestedFollowUps && data.data.suggestedFollowUps.length > 0) {
                chipsContainer.innerHTML = '';
                data.data.suggestedFollowUps.forEach(f => {
                    const chip = document.createElement('button');
                    chip.className = 'pub-chip';
                    chip.dataset.q = f;
                    chip.style.cssText = 'background:#0F0E0C; border:1px solid rgba(233,107,2,0.35); color:#E96B02; padding:4px 9px; border-radius:12px; font-size:11px; font-weight:600; cursor:pointer; transition:0.15s;';
                    chip.textContent = f;
                    chip.onmouseover = () => { chip.style.background = 'rgba(233,107,2,0.15)'; };
                    chip.onmouseout = () => { chip.style.background = '#0F0E0C'; };
                    chipsContainer.appendChild(chip);
                });
                bindChips();
            }

            msgs.scrollTop = msgs.scrollHeight;
        } catch (err) {
            lMsg.remove();
            const errDiv = document.createElement('div');
            errDiv.style.cssText = 'color:#EF4444; font-size:12px; background:#171512; border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:8px;';
            errDiv.textContent = 'Assistant offline: ' + (err.message || 'Unable to connect to backend.');
            msgs.appendChild(errDiv);
            msgs.scrollTop = msgs.scrollHeight;
        }
    };

    send.onclick = () => handleSend();
    input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };
});
