/**
 * Public AI Interactive Portfolio Guide
 * Answers questions about projects, skills, services, and experience in real time.
 * Primary Theme: #0F0E0C (Canvas), #E96B02 (Primary Accent)
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = '/api/ai';

    // Inject Floating AI widget into public page
    const widget = document.createElement('div');
    widget.id = 'public-ai-widget';
    widget.innerHTML = `
        <button id="public-ai-btn" style="position:fixed; bottom:28px; right:28px; background:#0F0E0C; color:#E96B02; border:2px solid #E96B02; padding:12px 20px; border-radius:9999px; font-weight:700; font-size:13px; display:flex; align-items:center; gap:8px; cursor:pointer; box-shadow:0 8px 30px rgba(233,107,2,0.3); z-index:999; transition:0.2s transform;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <i class="fa-solid fa-sparkles"></i>
            <span>Ask Portfolio AI</span>
        </button>

        <div id="public-ai-box" style="position:fixed; bottom:85px; right:28px; width:360px; max-width:calc(100vw - 32px); height:480px; max-height:calc(100vh - 120px); background:#0F0E0C; border:1px solid rgba(233,107,2,0.35); border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.85); display:none; flex-direction:column; z-index:999; overflow:hidden; font-family:var(--font-body, sans-serif);">
            <!-- Header -->
            <div style="background:#171512; border-bottom:1px solid rgba(233,107,2,0.2); padding:14px 18px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:6px; background:#E96B02; color:#0F0E0C; display:flex; align-items:center; justify-content:center; font-size:14px;">
                        <i class="fa-solid fa-comment-dots"></i>
                    </div>
                    <div>
                        <div style="font-weight:700; font-size:14px; color:#FAF9F6;">Portfolio Assistant</div>
                        <div style="font-size:11px; color:#A8A29E;">Ask anything about this portfolio</div>
                    </div>
                </div>
                <button id="public-ai-close" style="background:none; border:none; color:#A8A29E; font-size:18px; cursor:pointer;">&times;</button>
            </div>

            <!-- Messages Body -->
            <div id="public-ai-msgs" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:#0F0E0C;">
                <div style="background:#171512; border:1px solid rgba(233,107,2,0.15); border-radius:10px; padding:12px; color:#FAF9F6; font-size:13px; line-height:1.5;">
                    👋 Hi! I am the portfolio interactive assistant. Ask me anything about projects, skills, or available services!
                </div>
            </div>

            <!-- Suggestions -->
            <div style="padding:6px 12px; background:#171512; display:flex; gap:6px; overflow-x:auto; white-space:nowrap; scrollbar-width:none;">
                <button class="pub-chip" data-q="What are your top skills?" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.25); color:#E96B02; padding:3px 8px; border-radius:10px; font-size:11px; cursor:pointer;">Top Skills</button>
                <button class="pub-chip" data-q="Tell me about your featured projects." style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.25); color:#E96B02; padding:3px 8px; border-radius:10px; font-size:11px; cursor:pointer;">Projects</button>
                <button class="pub-chip" data-q="What services do you offer?" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.25); color:#E96B02; padding:3px 8px; border-radius:10px; font-size:11px; cursor:pointer;">Services</button>
            </div>

            <!-- Input Bar -->
            <div style="padding:12px; background:#171512; border-top:1px solid rgba(233,107,2,0.2); display:flex; gap:8px;">
                <input type="text" id="public-ai-input" placeholder="Ask a question..." style="flex:1; background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); border-radius:8px; padding:8px 12px; color:#FAF9F6; font-size:13px; outline:none;" />
                <button id="public-ai-send" style="background:#E96B02; color:#0F0E0C; border:none; width:36px; height:36px; border-radius:8px; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-arrow-up"></i>
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

    btn.onclick = () => {
        const isHidden = box.style.display === 'none';
        box.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) input.focus();
    };

    close.onclick = () => { box.style.display = 'none'; };

    const handleSend = async () => {
        const q = input.value.trim();
        if (!q) return;
        input.value = '';

        const msgs = document.getElementById('public-ai-msgs');
        
        // Add User Message
        const uMsg = document.createElement('div');
        uMsg.style.cssText = 'align-self:flex-end; background:#E96B02; color:#0F0E0C; font-weight:600; padding:8px 12px; border-radius:10px 10px 2px 10px; font-size:13px; max-width:85%;';
        uMsg.textContent = q;
        msgs.appendChild(uMsg);

        // Add Loading Indicator
        const lMsg = document.createElement('div');
        lMsg.style.cssText = 'align-self:flex-start; color:#E96B02; font-size:12px;';
        lMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Consulting portfolio database...';
        msgs.appendChild(lMsg);
        msgs.scrollTop = msgs.scrollHeight;

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: q, isAdmin: false })
            });
            const data = await res.json();
            lMsg.remove();

            const aiMsg = document.createElement('div');
            aiMsg.style.cssText = 'align-self:flex-start; background:#171512; border:1px solid rgba(233,107,2,0.2); color:#FAF9F6; padding:10px 12px; border-radius:10px 10px 10px 2px; font-size:13px; max-width:85%; line-height:1.4;';
            aiMsg.innerHTML = data?.data?.reply ? data.data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : 'I could not find that information.';
            msgs.appendChild(aiMsg);
            msgs.scrollTop = msgs.scrollHeight;
        } catch {
            lMsg.remove();
            const err = document.createElement('div');
            err.style.cssText = 'color:#EF4444; font-size:12px;';
            err.textContent = 'Unable to reach portfolio AI assistant.';
            msgs.appendChild(err);
        }
    };

    send.onclick = handleSend;
    input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };

    document.querySelectorAll('.pub-chip').forEach(c => {
        c.onclick = () => {
            input.value = c.dataset.q;
            handleSend();
        };
    });
});
