/**
 * Command Palette (Ctrl + K) for Portfolio CMS Admin Dashboard
 * Quick navigation and immediate action runner
 * Primary Theme: #0F0E0C (Canvas), #E96B02 (Primary Accent)
 */

window.CommandPalette = (function () {
    let isOpen = false;

    const commands = [
        { id: 'overview', title: 'Dashboard Overview', icon: 'fa-gauge-high', category: 'Navigation', action: () => window.switchAdminPanel('overview') },
        { id: 'pages', title: 'Manage Pages', icon: 'fa-copy', category: 'Navigation', action: () => window.switchAdminPanel('pages') },
        { id: 'projects', title: 'Projects Section', icon: 'fa-diagram-project', category: 'Navigation', action: () => window.switchAdminPanel('projects') },
        { id: 'skills', title: 'Skills & Tech Stack', icon: 'fa-code', category: 'Navigation', action: () => window.switchAdminPanel('skills') },
        { id: 'services', title: 'Professional Services', icon: 'fa-layer-group', category: 'Navigation', action: () => window.switchAdminPanel('services') },
        { id: 'duplicator', title: 'WordPress Duplicator', icon: 'fa-clone', category: 'Duplicator', action: () => window.switchAdminPanel('duplicator') },
        { id: 'backup', title: 'Create Duplicator Snapshot Backup', icon: 'fa-box-archive', category: 'Duplicator', action: () => window.DuplicatorManager?.createPackage() },
        { id: 'media', title: 'Media Library', icon: 'fa-photo-film', category: 'Navigation', action: () => window.switchAdminPanel('media') },
        { id: 'sitesettings', title: 'Site Settings', icon: 'fa-sliders', category: 'Settings', action: () => window.switchAdminPanel('sitesettings') },
        { id: 'ai', title: 'Open AI Site Architect', icon: 'fa-wand-magic-sparkles', category: 'AI Assistant', action: () => window.AiCopilotManager?.toggle(true) },
        { id: 'theme', title: 'Toggle Light / Dark Theme', icon: 'fa-circle-half-stroke', category: 'Appearance', action: () => document.getElementById('theme-toggle-btn')?.click() }
    ];

    function init() {
        if (document.getElementById('command-palette-overlay')) return;
        render();
        attachEvents();
    }

    function render() {
        const overlay = document.createElement('div');
        overlay.id = 'command-palette-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,14,12,0.8); backdrop-filter:blur(8px); z-index:10000; display:none; align-items:flex-start; justify-content:center; padding-top:15vh; font-family:var(--font-body, sans-serif);';

        overlay.innerHTML = `
            <div id="command-palette-box" style="width:580px; max-width:90vw; background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); border-radius:14px; box-shadow:0 25px 70px rgba(0,0,0,0.9); overflow:hidden;">
                <div style="display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid rgba(233,107,2,0.2);">
                    <i class="fa-solid fa-magnifying-glass" style="color:#E96B02; font-size:18px;"></i>
                    <input type="text" id="command-palette-input" placeholder="Type a command or search section (e.g. 'duplicator', 'project', 'ai')..." style="flex:1; background:none; border:none; color:#FAF9F6; font-size:15px; outline:none;" autocomplete="off" />
                    <span style="background:#171512; border:1px solid rgba(233,107,2,0.2); color:#A8A29E; font-size:11px; padding:3px 8px; border-radius:6px;">ESC</span>
                </div>
                <div id="command-palette-results" style="max-height:360px; overflow-y:auto; padding:8px 0;"></div>
                <div style="background:#171512; border-top:1px solid rgba(233,107,2,0.15); padding:10px 20px; display:flex; justify-content:space-between; font-size:12px; color:#A8A29E;">
                    <span>Use <kbd style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); padding:2px 6px; border-radius:4px; color:#E96B02;">↑</kbd> <kbd style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); padding:2px 6px; border-radius:4px; color:#E96B02;">↓</kbd> to navigate</span>
                    <span>Press <kbd style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); padding:2px 6px; border-radius:4px; color:#E96B02;">ENTER</kbd> to select</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function attachEvents() {
        const overlay = document.getElementById('command-palette-overlay');
        const input = document.getElementById('command-palette-input');

        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                toggle();
            } else if (e.key === 'Escape' && isOpen) {
                toggle(false);
            }
        });

        overlay.onclick = (e) => {
            if (e.target === overlay) toggle(false);
        };

        input.oninput = () => renderResults(input.value);
    }

    function toggle(force) {
        isOpen = force !== undefined ? force : !isOpen;
        const overlay = document.getElementById('command-palette-overlay');
        const input = document.getElementById('command-palette-input');
        if (overlay) {
            overlay.style.display = isOpen ? 'flex' : 'none';
            if (isOpen) {
                input.value = '';
                renderResults('');
                input.focus();
            }
        }
    }

    function renderResults(query) {
        const list = document.getElementById('command-palette-results');
        const q = query.toLowerCase().trim();
        const filtered = commands.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));

        if (filtered.length === 0) {
            list.innerHTML = `<div style="padding:20px; text-align:center; color:#78716C; font-size:13px;">No commands matching "${query}"</div>`;
            return;
        }

        list.innerHTML = filtered.map((c, i) => `
            <div class="cmd-item" data-index="${i}" onclick="CommandPalette.execute(${i})" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='rgba(233,107,2,0.1)'" onmouseout="this.style.background='transparent'">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:28px; height:28px; border-radius:6px; background:#171512; border:1px solid rgba(233,107,2,0.3); display:flex; align-items:center; justify-content:center; color:#E96B02; font-size:13px;">
                        <i class="fa-solid ${c.icon}"></i>
                    </div>
                    <div>
                        <div style="color:#FAF9F6; font-size:14px; font-weight:600;">${c.title}</div>
                        <div style="color:#78716C; font-size:11px;">${c.category}</div>
                    </div>
                </div>
                <i class="fa-solid fa-arrow-turn-down" style="color:rgba(233,107,2,0.5); font-size:11px;"></i>
            </div>
        `).join('');
    }

    function execute(index) {
        const input = document.getElementById('command-palette-input');
        const q = input.value.toLowerCase().trim();
        const filtered = commands.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
        if (filtered[index]) {
            toggle(false);
            filtered[index].action();
        }
    }

    return {
        init,
        toggle,
        execute
    };
})();
