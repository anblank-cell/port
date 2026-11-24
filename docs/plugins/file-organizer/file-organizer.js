/**
 * FileOrganizerManager — Admin File Organizer & IDE
 *
 * A VS Code / WordPress File Organizer–inspired panel that lets the admin:
 *   • Browse the Frontend project directory tree
 *   • Open and edit any text file in a built-in code editor
 *   • Create, rename, and delete files and folders
 *   • View file metadata (size, modified date, type)
 *
 * Uses CodeMirror 5 (loaded from CDN on first open) for syntax highlighting.
 */

window.FileOrganizerManager = (() => {
    'use strict';

    // ─── State ────────────────────────────────────────────────────────────────
    const state = {
        currentPath:   '',        // current browsed directory path
        openTabs:      [],        // [{ path, name, content, modified, isEditable }]
        activeTab:     null,      // path of currently visible tab
        selectedItem:  null,      // currently selected file/folder in file list
        treeExpanded:  new Set(), // expanded folder paths in tree
        codeMirror:    null,      // CodeMirror instance
        cmLoaded:      false,     // whether CodeMirror was loaded from CDN
        loading:       false,
        searchQuery:   '',
        view:          'list',    // 'list' | 'grid'
    };

    // ─── CodeMirror Loader ────────────────────────────────────────────────────
    async function ensureCodeMirror() {
        if (state.cmLoaded) return;
        return new Promise((resolve) => {
            // Load CSS
            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css';
            document.head.appendChild(link);

            const themeLink = document.createElement('link');
            themeLink.rel  = 'stylesheet';
            themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css';
            document.head.appendChild(themeLink);

            // Load core
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js';
            script.onload = () => {
                // Load modes
                const modes = [
                    'xml', 'htmlmixed', 'javascript', 'css', 'clike', 'markdown'
                ];
                let loaded = 0;
                modes.forEach(m => {
                    const s = document.createElement('script');
                    s.src = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/${m}/${m}.min.js`;
                    s.onload = () => { loaded++; if (loaded === modes.length) { state.cmLoaded = true; resolve(); } };
                    document.head.appendChild(s);
                });
            };
            document.head.appendChild(script);
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => [...document.querySelectorAll(sel)];

    function ext2mode(extension) {
        const map = {
            '.html': 'htmlmixed',
            '.css':  'css',
            '.js':   'javascript',
            '.ts':   'javascript',
            '.jsx':  'javascript',
            '.tsx':  'javascript',
            '.json': 'javascript',
            '.cs':   'text/x-csharp',
            '.xml':  'xml',
            '.svg':  'xml',
            '.md':   'markdown',
            '.txt':  'null',
            '.yml':  'null',
            '.yaml': 'null',
        };
        return map[extension] || 'null';
    }

    function ext2icon(extension, isDir) {
        if (isDir) return '<i class="fa-solid fa-folder fo-icon-folder"></i>';
        const map = {
            '.html': '<i class="fa-brands fa-html5 fo-icon-html"></i>',
            '.css':  '<i class="fa-brands fa-css3-alt fo-icon-css"></i>',
            '.js':   '<i class="fa-brands fa-js fo-icon-js"></i>',
            '.ts':   '<i class="fa-solid fa-code fo-icon-ts"></i>',
            '.json': '<i class="fa-solid fa-brackets-curly fo-icon-json"></i>',
            '.md':   '<i class="fa-solid fa-file-lines fo-icon-md"></i>',
            '.cs':   '<i class="fa-solid fa-code fo-icon-cs"></i>',
            '.svg':  '<i class="fa-solid fa-image fo-icon-img"></i>',
            '.png':  '<i class="fa-solid fa-image fo-icon-img"></i>',
            '.jpg':  '<i class="fa-solid fa-image fo-icon-img"></i>',
            '.jpeg': '<i class="fa-solid fa-image fo-icon-img"></i>',
            '.webp': '<i class="fa-solid fa-image fo-icon-img"></i>',
            '.pdf':  '<i class="fa-solid fa-file-pdf fo-icon-pdf"></i>',
        };
        return map[extension] || '<i class="fa-solid fa-file fo-icon-file"></i>';
    }

    function getTabByPath(path) {
        return state.openTabs.find(t => t.path === path) || null;
    }

    // ─── Panel HTML ───────────────────────────────────────────────────────────
    function buildPanelHTML() {
        return `
<div class="fo-root" id="fo-root">

  <!-- Topbar -->
  <div class="fo-topbar">
    <div class="fo-topbar-left">
      <i class="fa-solid fa-folder-tree"></i>
      <span class="fo-topbar-title">File Organizer</span>
      <span class="fo-breadcrumb" id="fo-breadcrumb">/ Frontend</span>
    </div>
    <div class="fo-topbar-actions">
      <button class="fo-action-btn" id="fo-btn-new-file" title="New File"><i class="fa-solid fa-file-plus"></i> New File</button>
      <button class="fo-action-btn" id="fo-btn-new-folder" title="New Folder"><i class="fa-solid fa-folder-plus"></i> New Folder</button>
      <button class="fo-action-btn fo-action-btn--icon" id="fo-btn-refresh" title="Refresh"><i class="fa-solid fa-rotate-right"></i></button>
    </div>
  </div>

  <!-- Main Layout -->
  <div class="fo-layout">

    <!-- Left: File Tree -->
    <aside class="fo-tree-panel" id="fo-tree-panel">
      <div class="fo-tree-header">
        <span class="fo-tree-label">EXPLORER</span>
        <button class="fo-icon-btn fo-tree-collapse-all" id="fo-collapse-all" title="Collapse All">
          <i class="fa-solid fa-angles-up"></i>
        </button>
      </div>
      <div class="fo-tree-body" id="fo-tree-body">
        <div class="fo-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</div>
      </div>
    </aside>

    <!-- Right: Editor + File List -->
    <div class="fo-editor-area">

      <!-- Tab Bar -->
      <div class="fo-tab-bar" id="fo-tab-bar">
        <div class="fo-tabs" id="fo-tabs"></div>
        <div class="fo-tab-actions">
          <button class="fo-icon-btn" id="fo-save-btn" title="Save (Ctrl+S)" style="display:none">
            <i class="fa-solid fa-floppy-disk"></i> Save
          </button>
        </div>
      </div>

      <!-- Editor -->
      <div class="fo-editor-wrap" id="fo-editor-wrap">
        <div class="fo-welcome" id="fo-welcome">
          <div class="fo-welcome-inner">
            <i class="fa-solid fa-code fo-welcome-icon"></i>
            <h3>File Organizer</h3>
            <p>Select a file from the tree to open it in the editor.</p>
            <div class="fo-welcome-tips">
              <div class="fo-tip"><kbd>Click</kbd> file to open</div>
              <div class="fo-tip"><kbd>Double-click</kbd> folder to expand</div>
              <div class="fo-tip"><kbd>Ctrl+S</kbd> to save</div>
              <div class="fo-tip"><kbd>Right-click</kbd> for context menu</div>
            </div>
          </div>
        </div>
        <div class="fo-editor-container" id="fo-editor-container" style="display:none">
          <textarea id="fo-cm-textarea"></textarea>
        </div>
        <div class="fo-binary-placeholder" id="fo-binary-view" style="display:none">
          <i class="fa-solid fa-file-circle-xmark"></i>
          <p>Binary files cannot be edited in the browser.</p>
        </div>
      </div>

      <!-- Status bar -->
      <div class="fo-statusbar" id="fo-statusbar">
        <span id="fo-status-path">No file open</span>
        <span id="fo-status-mode"></span>
        <span id="fo-status-modified"></span>
        <span id="fo-status-lines"></span>
      </div>

    </div><!-- /.fo-editor-area -->
  </div><!-- /.fo-layout -->

  <!-- Context Menu -->
  <div class="fo-context-menu" id="fo-context-menu" style="display:none">
    <div class="fo-ctx-item" data-action="open"><i class="fa-solid fa-arrow-right"></i> Open</div>
    <div class="fo-ctx-item" data-action="rename"><i class="fa-solid fa-pen-to-square"></i> Rename</div>
    <div class="fo-ctx-separator"></div>
    <div class="fo-ctx-item fo-ctx-danger" data-action="delete"><i class="fa-solid fa-trash"></i> Delete</div>
  </div>
</div>`;
    }

    // ─── File Tree ────────────────────────────────────────────────────────────
    async function loadTree(path = '') {
        const treeBody = $('#fo-tree-body');
        if (!treeBody) return;
        treeBody.innerHTML = '<div class="fo-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</div>';
        try {
            const res = await window.API.FileSystemAPI.browse(path);
            const items = res?.data || [];
            treeBody.innerHTML = '';
            renderTreeRoot(treeBody, items, path, 0);
        } catch (e) {
            treeBody.innerHTML = `<div class="fo-tree-error"><i class="fa-solid fa-circle-exclamation"></i> ${e.message}</div>`;
        }
    }

    function renderTreeRoot(container, items, basePath, depth) {
        items.forEach(item => {
            const el = buildTreeItem(item, depth);
            container.appendChild(el);
            if (item.isDirectory && state.treeExpanded.has(item.relativePath)) {
                const childrenWrap = document.createElement('div');
                childrenWrap.className = 'fo-tree-children';
                childrenWrap.dataset.path = item.relativePath;
                container.appendChild(childrenWrap);
                loadTreeChildren(item.relativePath, childrenWrap, depth + 1);
            }
        });
    }

    async function loadTreeChildren(path, container, depth) {
        container.innerHTML = '<div class="fo-loading fo-loading-sm"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        try {
            const res = await window.API.FileSystemAPI.browse(path);
            const items = res?.data || [];
            container.innerHTML = '';
            renderTreeRoot(container, items, path, depth);
        } catch {
            container.innerHTML = '';
        }
    }

    function buildTreeItem(item, depth) {
        const el = document.createElement('div');
        el.className = 'fo-tree-item';
        el.dataset.path = item.relativePath;
        el.dataset.isDir = item.isDirectory;
        el.style.paddingLeft = `${12 + depth * 14}px`;

        const isExpanded = item.isDirectory && state.treeExpanded.has(item.relativePath);

        el.innerHTML = `
            <span class="fo-tree-arrow ${item.isDirectory ? '' : 'fo-tree-arrow-hidden'}">
                <i class="fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
            </span>
            <span class="fo-tree-icon">${ext2icon(item.extension, item.isDirectory)}</span>
            <span class="fo-tree-name">${item.name}</span>`;

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            onTreeItemClick(item, el);
        });

        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, item);
        });

        return el;
    }

    async function onTreeItemClick(item, el) {
        // Deselect all
        $$('.fo-tree-item.fo-selected').forEach(n => n.classList.remove('fo-selected'));
        el.classList.add('fo-selected');
        state.selectedItem = item;

        if (item.isDirectory) {
            const isExpanded = state.treeExpanded.has(item.relativePath);
            const arrow = el.querySelector('.fo-tree-arrow i');

            if (isExpanded) {
                // Collapse
                state.treeExpanded.delete(item.relativePath);
                arrow.className = 'fa-solid fa-chevron-right';
                const childrenWrap = el.nextElementSibling;
                if (childrenWrap?.dataset?.path === item.relativePath) {
                    childrenWrap.remove();
                }
            } else {
                // Expand
                state.treeExpanded.add(item.relativePath);
                arrow.className = 'fa-solid fa-chevron-down';
                const childrenWrap = document.createElement('div');
                childrenWrap.className = 'fo-tree-children';
                childrenWrap.dataset.path = item.relativePath;
                el.insertAdjacentElement('afterend', childrenWrap);
                await loadTreeChildren(item.relativePath, childrenWrap, parseInt(el.style.paddingLeft) / 14);
            }
        } else {
            await openFile(item);
        }
    }

    // ─── Tabs & Editor ────────────────────────────────────────────────────────
    async function openFile(item) {
        if (!item.isEditable && item.sizeBytes !== undefined) {
            showBinaryView(item);
            return;
        }

        // Check if already open
        const existing = getTabByPath(item.relativePath);
        if (existing) {
            await switchTab(item.relativePath);
            return;
        }

        // Load from API
        try {
            const res = await window.API.FileSystemAPI.read(item.relativePath);
            if (!res?.data) throw new Error('Empty response');

            const tab = {
                path:      item.relativePath,
                name:      item.name,
                content:   res.data.content,
                saved:     res.data.content,
                extension: item.extension,
                isEditable: res.data.isEditable,
                modified:  false,
            };
            state.openTabs.push(tab);
            renderTabs();
            await switchTab(item.relativePath);
        } catch (e) {
            window.toast?.(`Failed to open: ${e.message}`, 'error');
        }
    }

    function showBinaryView(item) {
        $('#fo-welcome').style.display = 'none';
        $('#fo-editor-container').style.display = 'none';
        $('#fo-binary-view').style.display = 'flex';
        updateStatusBar(item.relativePath, '', false);
    }

    async function switchTab(path) {
        state.activeTab = path;
        $$('.fo-tab').forEach(t => t.classList.toggle('fo-tab-active', t.dataset.path === path));

        const tab = getTabByPath(path);
        if (!tab) return;

        $('#fo-welcome').style.display     = 'none';
        $('#fo-binary-view').style.display = 'none';
        $('#fo-editor-container').style.display = 'block';

        await ensureCodeMirror();
        const saveBtn = $('#fo-save-btn');
        if (saveBtn) saveBtn.style.display = tab.isEditable ? 'flex' : 'none';

        if (!state.codeMirror) {
            state.codeMirror = CodeMirror.fromTextArea($('#fo-cm-textarea'), {
                lineNumbers:    true,
                theme:          'material-darker',
                indentWithTabs: false,
                tabSize:        4,
                lineWrapping:   false,
                autoCloseBrackets: true,
                autofocus:      true,
                readOnly:       false,
            });
            state.codeMirror.setSize('100%', '100%');
            state.codeMirror.on('change', onEditorChange);
        }

        state.codeMirror.setOption('mode', ext2mode(tab.extension));
        state.codeMirror.setOption('readOnly', !tab.isEditable);
        state.codeMirror.setValue(tab.content);
        state.codeMirror.clearHistory();
        updateStatusBar(tab.path, tab.extension, tab.modified);
        setTimeout(() => state.codeMirror?.refresh(), 50);
    }

    function onEditorChange() {
        if (!state.activeTab || !state.codeMirror) return;
        const tab = getTabByPath(state.activeTab);
        if (!tab) return;
        const newContent = state.codeMirror.getValue();
        tab.content = newContent;
        tab.modified = newContent !== tab.saved;
        updateTabModifiedIndicator(tab);
        updateStatusBar(tab.path, tab.extension, tab.modified);
    }

    function renderTabs() {
        const tabsEl = $('#fo-tabs');
        if (!tabsEl) return;
        tabsEl.innerHTML = state.openTabs.map(tab => `
            <div class="fo-tab ${tab.path === state.activeTab ? 'fo-tab-active' : ''} ${tab.modified ? 'fo-tab-modified' : ''}"
                 data-path="${tab.path}" title="${tab.path}">
                <span class="fo-tab-icon">${ext2icon(tab.extension, false)}</span>
                <span class="fo-tab-name">${tab.name}</span>
                ${tab.modified ? '<span class="fo-tab-dot"></span>' : ''}
                <button class="fo-tab-close" data-path="${tab.path}"><i class="fa-solid fa-xmark"></i></button>
            </div>`).join('');

        tabsEl.querySelectorAll('.fo-tab').forEach(el => {
            el.addEventListener('click', (e) => {
                if (!e.target.closest('.fo-tab-close')) switchTab(el.dataset.path);
            });
        });
        tabsEl.querySelectorAll('.fo-tab-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(btn.dataset.path);
            });
        });
    }

    function updateTabModifiedIndicator(tab) {
        const tabEl = $(`#fo-tabs .fo-tab[data-path="${CSS.escape(tab.path)}"]`);
        if (!tabEl) { renderTabs(); return; }
        tabEl.classList.toggle('fo-tab-modified', tab.modified);
        const dot = tabEl.querySelector('.fo-tab-dot');
        if (tab.modified && !dot) {
            tabEl.querySelector('.fo-tab-name').insertAdjacentHTML('afterend', '<span class="fo-tab-dot"></span>');
        } else if (!tab.modified && dot) {
            dot.remove();
        }
    }

    async function closeTab(path) {
        const tab = getTabByPath(path);
        if (tab?.modified) {
            if (!confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) return;
        }
        state.openTabs = state.openTabs.filter(t => t.path !== path);
        if (state.activeTab === path) {
            state.activeTab = state.openTabs.length ? state.openTabs[state.openTabs.length - 1].path : null;
        }
        renderTabs();
        if (state.activeTab) {
            await switchTab(state.activeTab);
        } else {
            showWelcome();
        }
    }

    function showWelcome() {
        $('#fo-welcome').style.display        = 'flex';
        $('#fo-editor-container').style.display = 'none';
        $('#fo-binary-view').style.display    = 'none';
        if ($('#fo-save-btn')) $('#fo-save-btn').style.display = 'none';
        updateStatusBar('', '', false);
    }

    // ─── Save ─────────────────────────────────────────────────────────────────
    async function saveActiveFile() {
        const tab = state.activeTab ? getTabByPath(state.activeTab) : null;
        if (!tab || !tab.isEditable) return;

        const content = state.codeMirror?.getValue() ?? tab.content;
        try {
            await window.API.FileSystemAPI.write(tab.path, content);
            tab.saved = content;
            tab.modified = false;
            tab.content = content;
            updateTabModifiedIndicator(tab);
            updateStatusBar(tab.path, tab.extension, false);
            window.toast?.('File saved successfully!', 'success');
        } catch (e) {
            window.toast?.(`Save failed: ${e.message}`, 'error');
        }
    }

    // ─── Status Bar ───────────────────────────────────────────────────────────
    function updateStatusBar(path, extension, modified) {
        const pathEl   = $('#fo-status-path');
        const modeEl   = $('#fo-status-mode');
        const modEl    = $('#fo-status-modified');
        const linesEl  = $('#fo-status-lines');
        if (pathEl) pathEl.textContent = path ? `📄 ${path}` : 'No file open';
        if (modeEl) modeEl.textContent = extension ? extension.replace('.', '').toUpperCase() : '';
        if (modEl)  modEl.textContent  = modified ? '● Unsaved' : '';
        if (linesEl && state.codeMirror && path) {
            linesEl.textContent = `Ln ${state.codeMirror.lineCount()}`;
        }
    }

    // ─── Context Menu ─────────────────────────────────────────────────────────
    let _ctxItem = null;

    function showContextMenu(e, item) {
        _ctxItem = item;
        const menu = $('#fo-context-menu');
        if (!menu) return;
        menu.style.display = 'block';
        menu.style.left = `${e.pageX}px`;
        menu.style.top  = `${e.pageY}px`;

        // Hide "Open" for directories
        const openItem = menu.querySelector('[data-action="open"]');
        if (openItem) openItem.style.display = item.isDirectory ? 'none' : 'flex';
    }

    function hideContextMenu() {
        const menu = $('#fo-context-menu');
        if (menu) menu.style.display = 'none';
    }

    // ─── Create / Rename / Delete ─────────────────────────────────────────────
    function promptNewItem(isDir) {
        const name = prompt(`Enter ${isDir ? 'folder' : 'file'} name:`);
        if (!name?.trim()) return;
        const base = state.selectedItem?.isDirectory
            ? state.selectedItem.relativePath
            : (state.selectedItem ? state.selectedItem.relativePath.split('/').slice(0, -1).join('/') : '');
        const newPath = base ? `${base}/${name.trim()}` : name.trim();
        window.API.FileSystemAPI.create(newPath, isDir).then(() => {
            window.toast?.(`Created: ${name}`, 'success');
            loadTree();
        }).catch(e => window.toast?.(e.message, 'error'));
    }

    function promptRename(item) {
        const newName = prompt('Rename to:', item.name);
        if (!newName?.trim() || newName === item.name) return;
        window.API.FileSystemAPI.rename(item.relativePath, newName.trim()).then(() => {
            window.toast?.(`Renamed to: ${newName}`, 'success');
            // Close tab if open
            closeTab(item.relativePath);
            loadTree();
        }).catch(e => window.toast?.(e.message, 'error'));
    }

    async function confirmDelete(item) {
        if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        try {
            await window.API.FileSystemAPI.delete(item.relativePath);
            window.toast?.(`Deleted: ${item.name}`, 'success');
            closeTab(item.relativePath);
            loadTree();
        } catch (e) {
            window.toast?.(e.message, 'error');
        }
    }

    // ─── Breadcrumb ───────────────────────────────────────────────────────────
    function updateBreadcrumb(path) {
        const el = $('#fo-breadcrumb');
        if (!el) return;
        const parts = path ? path.split('/') : [];
        const crumbs = [{ label: 'Frontend', path: '' }, ...parts.map((p, i) => ({
            label: p, path: parts.slice(0, i + 1).join('/')
        }))];
        el.innerHTML = crumbs.map((c, i) =>
            i < crumbs.length - 1
                ? `<span class="fo-crumb fo-crumb-link" data-path="${c.path}">${c.label}</span><span class="fo-crumb-sep">/</span>`
                : `<span class="fo-crumb fo-crumb-active">${c.label}</span>`
        ).join('');
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    let _initialized = false;

    function init() {
        const panel = document.getElementById('panel-fileorganizer');
        if (!panel) return;

        if (_initialized && panel.innerHTML.trim()) return;
        _initialized = true;

        panel.innerHTML = buildPanelHTML();

        // Keyboard shortcut: Ctrl+S
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && state.activeTab) {
                e.preventDefault();
                saveActiveFile();
            }
        });

        // Bind toolbar buttons
        $('#fo-btn-new-file')?.addEventListener('click', () => promptNewItem(false));
        $('#fo-btn-new-folder')?.addEventListener('click', () => promptNewItem(true));
        $('#fo-btn-refresh')?.addEventListener('click', () => { state.treeExpanded.clear(); loadTree(); });
        $('#fo-save-btn')?.addEventListener('click', saveActiveFile);
        $('#fo-collapse-all')?.addEventListener('click', () => { state.treeExpanded.clear(); loadTree(); });

        // Context menu actions
        $('#fo-context-menu')?.querySelectorAll('.fo-ctx-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                hideContextMenu();
                if (!_ctxItem) return;
                if (action === 'open') openFile(_ctxItem);
                if (action === 'rename') promptRename(_ctxItem);
                if (action === 'delete') confirmDelete(_ctxItem);
            });
        });

        // Hide context menu on outside click
        document.addEventListener('click', hideContextMenu);

        // Start loading tree
        loadTree();
    }

    return { init };
})();
