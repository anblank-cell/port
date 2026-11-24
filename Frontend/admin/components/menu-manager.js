/**
 * Navigation Menu Manager Component
 * WordPress-grade Multi-Menu Management System with Hierarchical Drag & Drop,
 * Multiple Menu Creation, Switching, Renaming, Location Assignment, and Cascade Deletion.
 */

window.MenuManager = (() => {
    let APIs = {};
    let showToast = null;
    let openModal = null;
    let closeModal = null;

    // UUID Generator for reliable parent-child relational GUIDs
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            try { return crypto.randomUUID(); } catch {}
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Available pages and sections for the left accordion
    const PRESET_PAGES = [
        { title: 'Home — Front Page', url: '#hero', type: 'Page' },
        { title: 'BLOG — Posts Page', url: '#projects', type: 'Page' },
        { title: 'Privacy Policy — Privacy Policy', url: '#contact', type: 'Page' }
    ];

    const PRESET_SUB_PAGES = [
        { title: 'About Me', url: '#hero', type: 'Page' },
        { title: 'Services', url: '#services', type: 'Page' },
        { title: 'Projects', url: '#projects', type: 'Page' },
        { title: 'Contact Us', url: '#contact', type: 'Page' }
    ];

    const PRESET_SECTIONS = [
        { title: 'Hero Section', url: '#hero', type: 'Section' },
        { title: 'Specialized Services', url: '#services', type: 'Section' },
        { title: 'Featured Projects', url: '#projects', type: 'Section' },
        { title: 'Technical Skills', url: '#skills', type: 'Section' },
        { title: 'Work Experience', url: '#experience', type: 'Section' },
        { title: 'Academic Education', url: '#education', type: 'Section' },
        { title: 'Verified Certificates', url: '#certificates', type: 'Section' },
        { title: 'Client Testimonials', url: '#testimonials', type: 'Section' },
        { title: 'Key Statistics', url: '#statistics', type: 'Section' },
        { title: 'Social Profiles', url: '#social', type: 'Section' }
    ];

    // Multi-menu state
    let allMenus = [];
    let activeMenuId = null;
    let activeMenu = null;
    let currentMenuItems = [];

    // Accordion and UI states
    let activePagesTab = 'all';
    let pagesAccordionOpen = true;
    let customLinksAccordionOpen = false;
    let sectionsAccordionOpen = false;
    let bulkSelectActive = false;
    let openItemIds = new Set();

    // Drag and Drop State
    let isDragging = false;
    let dragStartIndex = null;
    let draggedSubtree = [];
    let dropTargetIndex = null;
    let dropTargetDepth = 0;
    let placeholderEl = null;

    // Helper: Calculate depth for every item based on parentId chain
    const computeDepths = (items) => {
        const idMap = new Map();
        items.forEach((item, idx) => {
            if (!item.id || item.id === '00000000-0000-0000-0000-000000000000') {
                item.id = generateUUID();
            }
            idMap.set(item.id, { item, idx });
        });

        items.forEach((item) => {
            let depth = 0;
            let currentParentId = item.parentId;
            let visited = new Set();

            while (currentParentId && idMap.has(currentParentId) && !visited.has(currentParentId)) {
                visited.add(currentParentId);
                depth++;
                currentParentId = idMap.get(currentParentId).item.parentId;
            }

            if (currentParentId && !idMap.has(currentParentId)) {
                item.parentId = null;
                depth = 0;
            }

            item.depth = depth;
        });

        return items;
    };

    // Helper: Get indices of an item and all its nested children
    const getSubtreeIndices = (startIndex, items) => {
        const rootItem = items[startIndex];
        if (!rootItem) return [startIndex];

        const rootDepth = rootItem.depth || 0;
        const indices = [startIndex];

        for (let i = startIndex + 1; i < items.length; i++) {
            const currentItem = items[i];
            if ((currentItem.depth || 0) > rootDepth) {
                indices.push(i);
            } else {
                break;
            }
        }

        return indices;
    };

    const renderPanelHTML = () => {
        const menuName = activeMenu?.name || 'Primary Navigation Menu';
        const isHeader = activeMenu?.isPrimary || activeMenu?.location === 'header';
        const isFooter = activeMenu?.location === 'footer';
        const isSecondary = activeMenu?.location === 'secondary';

        return `
            <div class="section-hdr" style="margin-bottom:0.75rem;">
                <div>
                    <h2 style="margin:0 0 0.25rem;">Menus</h2>
                    <p style="margin:0;font-size:0.85rem;color:var(--text-muted);">
                        Create and manage multiple navigation menus, build custom structures, and assign them to website locations.
                    </p>
                </div>
            </div>

            <!-- ─── TOP BAR: Menu Selection Switcher ───────────────────────── -->
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:0.85rem 1.25rem;margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;backdrop-filter:blur(8px);">
                <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                    <label for="select-active-menu" style="font-weight:600;font-size:0.85rem;color:var(--text-primary);white-space:nowrap;">
                        <i class="fa-solid fa-bars-staggered" style="color:var(--accent);margin-right:0.3rem;"></i> Select a menu to edit:
                    </label>
                    <select id="select-active-menu" class="form-select" style="min-width:240px;padding:0.4rem 0.75rem;font-size:0.85rem;font-weight:500;">
                        ${allMenus.map(m => `
                            <option value="${m.id}" ${m.id === activeMenuId ? 'selected' : ''}>
                                ${m.name} ${m.isPrimary ? '(Header Navigation)' : (m.location ? `(${m.location})` : '')}
                            </option>
                        `).join('')}
                    </select>
                    <button class="button" id="btn-switch-menu" style="padding:0.4rem 0.9rem;" onclick="window.MenuManager.switchMenu()">
                        Select
                    </button>
                    <span style="font-size:0.85rem;color:var(--text-muted);">
                        or <a href="#" id="link-create-menu" onclick="window.MenuManager.promptCreateMenu(event)" style="color:var(--accent);text-decoration:underline;font-weight:600;">create a new menu</a>.
                    </span>
                </div>
                ${allMenus.length > 1 ? `
                    <button class="btn-sm btn-delete" onclick="window.MenuManager.deleteCurrentMenu()" style="padding:0.4rem 0.85rem;font-size:0.8rem;display:inline-flex;align-items:center;gap:0.4rem;">
                        <i class="fa-solid fa-trash"></i> Delete Menu
                    </button>
                ` : ''}
            </div>

            <div class="wp-nav-menus-wrap">
                <!-- ─── LEFT COLUMN: Add Menu Items Accordion ─────────────── -->
                <div class="wp-nav-menu-meta-col">
                    <!-- Pages Meta Box -->
                    <div class="wp-menu-meta-box">
                        <div class="wp-meta-box-header" id="header-box-pages" onclick="window.MenuManager.togglePagesBox()">
                            <span>Pages</span>
                            <i class="fa-solid ${pagesAccordionOpen ? 'fa-caret-up' : 'fa-caret-down'}" id="arrow-box-pages"></i>
                        </div>
                        <div id="body-box-pages" style="display:${pagesAccordionOpen ? 'block' : 'none'};">
                            <div class="wp-meta-box-tabs">
                                <a href="#" class="wp-meta-tab ${activePagesTab === 'recent' ? 'active' : ''}" onclick="window.MenuManager.setPagesTab('recent', event)">Most Recent</a>
                                <a href="#" class="wp-meta-tab ${activePagesTab === 'all' ? 'active' : ''}" onclick="window.MenuManager.setPagesTab('all', event)">View All</a>
                                <a href="#" class="wp-meta-tab ${activePagesTab === 'search' ? 'active' : ''}" onclick="window.MenuManager.setPagesTab('search', event)">Search</a>
                            </div>
                            <div class="wp-meta-tab-content">
                                ${renderPagesTabContent()}
                            </div>
                            <div class="wp-meta-box-footer">
                                <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:0.35rem;">
                                    <input type="checkbox" id="cb-select-all-pages" onchange="window.MenuManager.toggleSelectAllPages(this.checked)">
                                    Select All
                                </label>
                                <button class="button" id="btn-add-pages-to-menu" onclick="window.MenuManager.addSelectedPagesToMenu()">
                                    Add to Menu
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Links Meta Box -->
                    <div class="wp-menu-meta-box">
                        <div class="wp-meta-box-header" id="header-box-custom" onclick="window.MenuManager.toggleCustomLinksBox()">
                            <span>Custom Links</span>
                            <i class="fa-solid ${customLinksAccordionOpen ? 'fa-caret-up' : 'fa-caret-down'}" id="arrow-box-custom"></i>
                        </div>
                        <div id="body-box-custom" style="display:${customLinksAccordionOpen ? 'block' : 'none'};">
                            <div style="padding:0.85rem;">
                                <div class="form-group" style="margin-bottom:0.6rem;">
                                    <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">URL</label>
                                    <input class="form-input" id="custom-link-url" value="https://" style="font-size:0.85rem;padding:0.35rem 0.6rem;">
                                </div>
                                <div class="form-group" style="margin-bottom:0.6rem;">
                                    <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Link Text</label>
                                    <input class="form-input" id="custom-link-text" placeholder="Menu Item" style="font-size:0.85rem;padding:0.35rem 0.6rem;">
                                </div>
                            </div>
                            <div class="wp-meta-box-footer" style="justify-content:flex-end;">
                                <button class="button" onclick="window.MenuManager.addCustomLinkToMenu()">
                                    Add to Menu
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Page Sections Meta Box -->
                    <div class="wp-menu-meta-box">
                        <div class="wp-meta-box-header" id="header-box-sections" onclick="window.MenuManager.toggleSectionsBox()">
                            <span>Sections &amp; Anchors</span>
                            <i class="fa-solid ${sectionsAccordionOpen ? 'fa-caret-up' : 'fa-caret-down'}" id="arrow-box-sections"></i>
                        </div>
                        <div id="body-box-sections" style="display:${sectionsAccordionOpen ? 'block' : 'none'};">
                            <div class="wp-meta-tab-content" style="max-height:180px;overflow-y:auto;padding:0.5rem 0.85rem;">
                                <ul class="wp-checkbox-list" style="list-style:none;padding:0;margin:0;">
                                    ${PRESET_SECTIONS.map((s, i) => `
                                        <li style="margin-bottom:0.35rem;">
                                            <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:0.4rem;">
                                                <input type="checkbox" class="cb-section-item" value="${i}">
                                                <span>${s.title}</span>
                                            </label>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div class="wp-meta-box-footer">
                                <button class="button" onclick="window.MenuManager.addSelectedSectionsToMenu()">
                                    Add to Menu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ─── RIGHT COLUMN: Menu Structure Canvas ───────────────── -->
                <div class="wp-nav-menu-management-col">
                    <div class="wp-menu-management">
                        <!-- Top Menu Header -->
                        <div class="wp-menu-header">
                            <div class="wp-menu-name-wrap">
                                <label for="wp-menu-name-input"><strong>Menu Name</strong></label>
                                <input type="text" class="wp-menu-name-input" id="wp-menu-name-input" value="${menuName}">
                            </div>
                            <button class="btn-add" id="btn-save-menu-top" style="background:#2271b1;color:#fff;border:none;padding:0.45rem 1rem;" onclick="window.MenuManager.saveMenu()">
                                Save Menu
                            </button>
                        </div>

                        <!-- Menu Body Canvas -->
                        <div class="wp-menu-body">
                            <h3 style="font-size:1rem;margin:0 0 0.35rem;font-weight:700;">Menu Structure</h3>
                            <div class="wp-menu-instructions">
                                Drag the items into the order you prefer. Drag an item to the right to make it a submenu of the item above it, or to the left to return it to the top level. Click the arrow on the right to reveal options.
                            </div>

                            <div class="wp-menu-toolbar">
                                <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:0.35rem;">
                                    <input type="checkbox" id="cb-bulk-select-menu" ${bulkSelectActive ? 'checked' : ''} onchange="window.MenuManager.toggleBulkSelect(this.checked)">
                                    Bulk Select
                                </label>
                                ${bulkSelectActive ? `
                                    <button class="btn-sm btn-delete" onclick="window.MenuManager.deleteSelectedMenuItems()">
                                        Delete Selected
                                    </button>
                                ` : ''}
                            </div>

                            <!-- List of Menu Item Blocks -->
                            <div class="wp-menu-items-list" id="menu-items-container">
                                ${renderMenuItemsListHTML()}
                            </div>

                            <!-- Menu Settings Section -->
                            <div class="wp-menu-settings-section">
                                <h4>Menu Settings</h4>
                                <div style="display:flex;gap:2rem;align-items:flex-start;font-size:0.8rem;">
                                    <div style="color:var(--text-muted);min-width:120px;">Display location</div>
                                    <div style="display:grid;gap:0.6rem;">
                                        <label style="display:flex;align-items:center;gap:0.45rem;cursor:pointer;color:var(--text-primary);">
                                            <input type="checkbox" id="loc-header" name="menu-loc" ${isHeader ? 'checked' : ''}>
                                            <span><strong>Header Navigation Menu</strong> (Top Bar)</span>
                                        </label>
                                        <label style="display:flex;align-items:center;gap:0.45rem;cursor:pointer;color:var(--text-primary);">
                                            <input type="checkbox" id="loc-footer" name="menu-loc" ${isFooter ? 'checked' : ''}>
                                            <span><strong>Footer Navigation Menu</strong> (Footer Links)</span>
                                        </label>
                                        <label style="display:flex;align-items:center;gap:0.45rem;cursor:pointer;color:var(--text-primary);">
                                            <input type="checkbox" id="loc-secondary" name="menu-loc" ${isSecondary ? 'checked' : ''}>
                                            <span><strong>Secondary / Mobile Drawer Menu</strong></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Menu Footer -->
                        <div class="wp-menu-footer-bar">
                            <button class="wp-btn-link-danger" onclick="window.MenuManager.resetToDefaults()">
                                Reset to Default Menu
                            </button>
                            <button class="btn-add" id="btn-save-menu-bottom" style="background:#2271b1;color:#fff;border:none;padding:0.45rem 1.25rem;" onclick="window.MenuManager.saveMenu()">
                                Save Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderPagesTabContent = () => {
        if (activePagesTab === 'search') {
            return `
                <div style="padding:0.5rem 0;">
                    <input type="text" class="form-input" placeholder="Search pages…" style="font-size:0.8rem;padding:0.35rem 0.6rem;margin-bottom:0.5rem;" oninput="window.MenuManager.filterPagesSearch(this.value)">
                    <ul class="wp-checkbox-list" id="pages-search-list">
                        ${[...PRESET_PAGES, ...PRESET_SUB_PAGES].map((p, i) => `
                            <li>
                                <label>
                                    <input type="checkbox" class="cb-page-item" value="${i}" data-title="${p.title}" data-url="${p.url}">
                                    <span>${p.title}</span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        const list = activePagesTab === 'recent' ? PRESET_PAGES : [...PRESET_PAGES, ...PRESET_SUB_PAGES];

        return `
            <ul class="wp-checkbox-list" id="pages-tab-list">
                ${list.map((p, i) => `
                    <li>
                        <label>
                            <input type="checkbox" class="cb-page-item" value="${i}" data-title="${p.title}" data-url="${p.url}">
                            <span>${p.title}</span>
                        </label>
                    </li>
                `).join('')}
            </ul>
        `;
    };

    const renderMenuItemsListHTML = () => {
        if (!currentMenuItems || currentMenuItems.length === 0) {
            return `
                <div style="text-align:center;padding:3rem 1.5rem;color:var(--text-muted);border:2px dashed var(--border-color);border-radius:6px;background:rgba(255,255,255,0.01);">
                    <i class="fa-solid fa-list-ul" style="font-size:1.75rem;margin-bottom:0.75rem;opacity:0.5;"></i>
                    <p style="margin:0 0 0.5rem;font-weight:600;font-size:0.95rem;">This menu is empty.</p>
                    <p style="margin:0;font-size:0.8rem;">Add items from the column on the left (Pages, Custom Links, Sections) to build your structure.</p>
                </div>
            `;
        }

        computeDepths(currentMenuItems);

        return currentMenuItems.map((item, index) => {
            const isSubItem = (item.depth || 0) > 0;
            const indentPixels = (item.depth || 0) * 30;
            const isOpen = openItemIds.has(item.id);

            return `
                <div class="wp-menu-item-card ${isSubItem ? 'wp-menu-sub-item' : ''}" 
                     id="menu-item-row-${item.id}"
                     data-id="${item.id}" 
                     data-index="${index}"
                     style="margin-left: ${indentPixels}px;"
                     draggable="true">
                    
                    <div class="wp-menu-item-handle" data-index="${index}">
                        <div class="wp-menu-item-title-wrap">
                            ${bulkSelectActive ? `
                                <input type="checkbox" class="cb-menu-bulk-item" data-id="${item.id}" style="margin-right:0.4rem;">
                            ` : ''}
                            <span class="wp-menu-item-title">${item.title || '(No title)'}</span>
                            ${isSubItem ? `<span class="wp-sub-item-badge">sub item</span>` : ''}
                        </div>
                        <div class="wp-menu-item-controls">
                            <span class="wp-item-type">${item.type || 'Custom Link'}</span>
                            <button class="wp-item-toggle-btn" onclick="window.MenuManager.toggleItemSettings('${item.id}', event)">
                                <i class="fa-solid ${isOpen ? 'fa-caret-up' : 'fa-caret-down'}"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Dropdown settings panel for this item -->
                    <div class="wp-menu-item-settings" id="item-settings-${item.id}" style="display: ${isOpen ? 'block' : 'none'};">
                        <div class="wp-settings-field">
                            <label>Navigation Label</label>
                            <input class="form-input" type="text" value="${item.title || ''}" oninput="window.MenuManager.updateItemTitle('${item.id}', this.value)">
                        </div>
                        <div class="wp-settings-field">
                            <label>URL</label>
                            <input class="form-input" type="text" value="${item.url || ''}" oninput="window.MenuManager.updateItemUrl('${item.id}', this.value)">
                        </div>
                        <div class="wp-settings-field" style="margin-top:0.4rem;">
                            <label style="display:flex;align-items:center;gap:0.35rem;font-weight:normal;cursor:pointer;">
                                <input type="checkbox" ${item.isExternal ? 'checked' : ''} onchange="window.MenuManager.updateItemExternal('${item.id}', this.checked)">
                                Open link in a new tab
                            </label>
                        </div>
                        <div class="wp-item-actions-bar">
                            <div class="wp-move-links">
                                <span style="color:var(--text-muted);">Move:</span>
                                ${index > 0 ? `<a href="#" onclick="window.MenuManager.moveSubtree(${index}, ${index - 1}, event)">Up</a> | ` : ''}
                                ${index < currentMenuItems.length - 1 ? `<a href="#" onclick="window.MenuManager.moveSubtree(${index}, ${index + 2}, event)">Down</a> | ` : ''}
                                ${canIndent(index) ? `<a href="#" onclick="window.MenuManager.indentItem(${index}, event)">Under ${currentMenuItems[index - 1].title}</a> | ` : ''}
                                ${item.depth > 0 ? `<a href="#" onclick="window.MenuManager.outdentItem(${index}, event)">Out one level</a>` : ''}
                            </div>
                            <button class="wp-btn-remove-item" onclick="window.MenuManager.removeItem('${item.id}')">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const canIndent = (index) => {
        if (index <= 0) return false;
        const prevItem = currentMenuItems[index - 1];
        const curItem = currentMenuItems[index];
        return (curItem.depth || 0) <= (prevItem.depth || 0);
    };

    // ─── Drag & Drop Hierarchy Event Listeners ─────────────────────────────
    const attachDragAndDropHandlers = () => {
        const container = document.getElementById('menu-items-container');
        if (!container) return;

        const cards = container.querySelectorAll('.wp-menu-item-card');

        cards.forEach((card) => {
            card.addEventListener('dragstart', (e) => {
                isDragging = true;
                dragStartIndex = parseInt(card.dataset.index, 10);
                draggedSubtree = getSubtreeIndices(dragStartIndex, currentMenuItems);

                card.classList.add('is-dragging');
                draggedSubtree.forEach((idx) => {
                    const row = container.querySelector(`[data-index="${idx}"]`);
                    if (row) row.classList.add('is-dragging-subtree');
                });

                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', dragStartIndex);
            });

            card.addEventListener('dragend', () => {
                isDragging = false;
                card.classList.remove('is-dragging');
                container.querySelectorAll('.is-dragging-subtree').forEach(el => el.classList.remove('is-dragging-subtree'));
                
                if (placeholderEl && placeholderEl.parentNode) {
                    placeholderEl.parentNode.removeChild(placeholderEl);
                }

                if (dropTargetIndex !== null && dropTargetIndex !== dragStartIndex) {
                    applyDragDropReorder(dragStartIndex, dropTargetIndex, dropTargetDepth);
                }

                dragStartIndex = null;
                dropTargetIndex = null;
                dropTargetDepth = 0;
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const targetIdx = parseInt(card.dataset.index, 10);
                if (draggedSubtree.includes(targetIdx)) return;

                const rect = card.getBoundingClientRect();
                const relY = e.clientY - rect.top;
                const isAfter = relY > rect.height / 2;

                const relX = e.clientX - rect.left;
                let calculatedDepth = 0;
                if (relX > 40) {
                    calculatedDepth = 1;
                }

                dropTargetIndex = isAfter ? targetIdx + 1 : targetIdx;
                dropTargetDepth = calculatedDepth;

                if (!placeholderEl) {
                    placeholderEl = document.createElement('div');
                    placeholderEl.className = 'wp-menu-drop-placeholder';
                    placeholderEl.style.height = '42px';
                    placeholderEl.style.border = '2px dashed #2271b1';
                    placeholderEl.style.background = 'rgba(34, 113, 177, 0.08)';
                    placeholderEl.style.borderRadius = '4px';
                    placeholderEl.style.margin = '4px 0';
                }

                placeholderEl.style.marginLeft = `${dropTargetDepth * 30}px`;

                if (isAfter) {
                    card.after(placeholderEl);
                } else {
                    card.before(placeholderEl);
                }
            });
        });
    };

    const applyDragDropReorder = (fromIdx, toIdx, targetDepth) => {
        const subtreeIndices = getSubtreeIndices(fromIdx, currentMenuItems);
        const movingItems = subtreeIndices.map(i => currentMenuItems[i]);

        const remainingItems = currentMenuItems.filter((_, idx) => !subtreeIndices.includes(idx));

        let adjustedToIdx = toIdx;
        if (fromIdx < toIdx) {
            adjustedToIdx = toIdx - movingItems.length;
        }
        adjustedToIdx = Math.max(0, Math.min(adjustedToIdx, remainingItems.length));

        const rootMovingItem = movingItems[0];
        const oldRootDepth = rootMovingItem.depth || 0;

        let newParentId = null;
        if (targetDepth > 0 && adjustedToIdx > 0) {
            const aboveItem = remainingItems[adjustedToIdx - 1];
            newParentId = aboveItem.id;
            rootMovingItem.depth = (aboveItem.depth || 0) + 1;
        } else {
            rootMovingItem.depth = 0;
        }
        rootMovingItem.parentId = newParentId;

        const depthDiff = (rootMovingItem.depth || 0) - oldRootDepth;
        for (let i = 1; i < movingItems.length; i++) {
            movingItems[i].depth = Math.max(0, (movingItems[i].depth || 0) + depthDiff);
        }

        remainingItems.splice(adjustedToIdx, 0, ...movingItems);
        currentMenuItems = remainingItems;

        computeDepths(currentMenuItems);
        refreshMenuCanvas();
    };

    const refreshMenuCanvas = () => {
        const container = document.getElementById('menu-items-container');
        if (container) {
            container.innerHTML = renderMenuItemsListHTML();
            attachDragAndDropHandlers();
        }
    };

    // ─── Multi-Menu Switcher and Creation Handlers ─────────────────────────
    const switchMenu = async () => {
        const sel = document.getElementById('select-active-menu');
        if (!sel || !sel.value) return;

        const targetId = sel.value;
        if (targetId === activeMenuId) return;

        activeMenuId = targetId;
        await loadMenuDetails(targetId);
    };

    const promptCreateMenu = (e) => {
        if (e) e.preventDefault();

        const formHTML = `
            <div style="padding:0.5rem 0;">
                <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:1.25rem;">
                    Create a distinct navigation menu with its own custom name, links, and display location.
                </p>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label class="form-label" for="new-menu-name">Menu Name</label>
                    <input class="form-input" id="new-menu-name" placeholder="e.g. Footer Menu, Mobile Navigation, Secondary Links" style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1.25rem;">
                    <label class="form-label" for="new-menu-location">Display Location (Optional)</label>
                    <select class="form-select" id="new-menu-location" style="width:100%;">
                        <option value="">None / Custom Placement</option>
                        <option value="header">Header Navigation Menu (Primary Topbar)</option>
                        <option value="footer">Footer Navigation Menu (Footer Links)</option>
                        <option value="secondary">Secondary / Mobile Drawer Menu</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" type="button" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
                    <button class="btn-save" type="button" id="btn-submit-create-menu" style="background:#2271b1;">
                        <i class="fa-solid fa-plus"></i> Create Menu
                    </button>
                </div>
            </div>
        `;

        openModal('Create New Navigation Menu', formHTML);

        document.getElementById('btn-submit-create-menu')?.addEventListener('click', async () => {
            const name = document.getElementById('new-menu-name')?.value?.trim();
            const location = document.getElementById('new-menu-location')?.value?.trim() || null;

            if (!name) {
                showToast?.('Please enter a valid menu name.', 'error');
                return;
            }

            try {
                const res = await APIs.MenusAPI.create({
                    name,
                    location,
                    isPrimary: location === 'header'
                });

                if (closeModal) closeModal();
                else document.getElementById('modal-overlay')?.classList.remove('open');

                showToast?.(`Navigation menu '${name}' created successfully!`, 'success');

                const newMenu = res?.data;
                await loadMenuItems(newMenu?.id);
            } catch (err) {
                showToast?.(`Failed to create menu: ${err.message}`, 'error');
            }
        });
    };

    const deleteCurrentMenu = async () => {
        if (!activeMenuId) return;
        const name = activeMenu?.name || 'this menu';

        if (!confirm(`Are you sure you want to permanently delete '${name}' and all its items?`)) {
            return;
        }

        try {
            await APIs.MenusAPI.delete(activeMenuId);
            showToast?.(`Menu '${name}' deleted successfully!`, 'success');
            await loadMenuItems();
        } catch (err) {
            showToast?.(`Error deleting menu: ${err.message}`, 'error');
        }
    };

    // ─── Accordion Toggles ────────────────────────────────────────────────
    const togglePagesBox = () => {
        pagesAccordionOpen = !pagesAccordionOpen;
        const body = document.getElementById('body-box-pages');
        const arrow = document.getElementById('arrow-box-pages');
        if (body) body.style.display = pagesAccordionOpen ? 'block' : 'none';
        if (arrow) arrow.className = `fa-solid ${pagesAccordionOpen ? 'fa-caret-up' : 'fa-caret-down'}`;
    };

    const toggleCustomLinksBox = () => {
        customLinksAccordionOpen = !customLinksAccordionOpen;
        const body = document.getElementById('body-box-custom');
        const arrow = document.getElementById('arrow-box-custom');
        if (body) body.style.display = customLinksAccordionOpen ? 'block' : 'none';
        if (arrow) arrow.className = `fa-solid ${customLinksAccordionOpen ? 'fa-caret-up' : 'fa-caret-down'}`;
    };

    const toggleSectionsBox = () => {
        sectionsAccordionOpen = !sectionsAccordionOpen;
        const body = document.getElementById('body-box-sections');
        const arrow = document.getElementById('arrow-box-sections');
        if (body) body.style.display = sectionsAccordionOpen ? 'block' : 'none';
        if (arrow) arrow.className = `fa-solid ${sectionsAccordionOpen ? 'fa-caret-up' : 'fa-caret-down'}`;
    };

    const setPagesTab = (tab, e) => {
        if (e) e.preventDefault();
        activePagesTab = tab;
        const tabContainer = document.querySelector('.wp-meta-box-tabs');
        if (tabContainer) {
            tabContainer.querySelectorAll('.wp-meta-tab').forEach(t => t.classList.remove('active'));
            const clicked = tabContainer.querySelector(`[onclick*="'${tab}'"]`);
            if (clicked) clicked.classList.add('active');
        }
        const content = document.querySelector('#body-box-pages .wp-meta-tab-content');
        if (content) {
            content.innerHTML = renderPagesTabContent();
        }
    };

    const filterPagesSearch = (query) => {
        const q = (query || '').toLowerCase().trim();
        const list = document.getElementById('pages-search-list');
        if (!list) return;
        const items = list.querySelectorAll('li');
        items.forEach(li => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(q) ? 'block' : 'none';
        });
    };

    const toggleSelectAllPages = (checked) => {
        document.querySelectorAll('#body-box-pages .cb-page-item').forEach(cb => {
            cb.checked = checked;
        });
    };

    // ─── Add Items into Active Menu ───────────────────────────────────────
    const addSelectedPagesToMenu = () => {
        const checkedBoxes = document.querySelectorAll('#body-box-pages .cb-page-item:checked');
        if (!checkedBoxes.length) {
            showToast?.('Please select at least one page to add.', 'warning');
            return;
        }

        checkedBoxes.forEach(cb => {
            const title = cb.dataset.title || 'Page Item';
            const url = cb.dataset.url || '#';
            currentMenuItems.push({
                id: generateUUID(),
                title: title.split(' — ')[0],
                url: url,
                type: 'Page',
                isVisible: true,
                isExternal: false,
                parentId: null,
                depth: 0
            });
            cb.checked = false;
        });

        const selectAllCb = document.getElementById('cb-select-all-pages');
        if (selectAllCb) selectAllCb.checked = false;

        refreshMenuCanvas();
        showToast?.(`Added ${checkedBoxes.length} page(s) to the menu. Click "Save Menu" to commit.`);
    };

    const addCustomLinkToMenu = () => {
        const urlInput = document.getElementById('custom-link-url');
        const textInput = document.getElementById('custom-link-text');
        const url = urlInput?.value?.trim();
        const text = textInput?.value?.trim();

        if (!text) {
            showToast?.('Please enter Link Text for the custom link.', 'warning');
            return;
        }

        currentMenuItems.push({
            id: generateUUID(),
            title: text,
            url: url || '#',
            type: 'Custom Link',
            isVisible: true,
            isExternal: url?.startsWith('http') || false,
            parentId: null,
            depth: 0
        });

        if (urlInput) urlInput.value = 'https://';
        if (textInput) textInput.value = '';

        refreshMenuCanvas();
        showToast?.(`Added '${text}' to the menu. Click "Save Menu" to commit.`);
    };

    const addSelectedSectionsToMenu = () => {
        const checked = document.querySelectorAll('.cb-section-item:checked');
        if (!checked.length) {
            showToast?.('Please select at least one section.', 'warning');
            return;
        }

        checked.forEach(cb => {
            const sec = PRESET_SECTIONS[parseInt(cb.value, 10)];
            if (sec) {
                currentMenuItems.push({
                    id: generateUUID(),
                    title: sec.title.replace(' Section', ''),
                    url: sec.url,
                    type: 'Section',
                    isVisible: true,
                    isExternal: false,
                    parentId: null,
                    depth: 0
                });
            }
            cb.checked = false;
        });

        refreshMenuCanvas();
        showToast?.(`Added ${checked.length} section(s) to the menu. Click "Save Menu" to commit.`);
    };

    // ─── Individual Item Controls ─────────────────────────────────────────
    const toggleItemSettings = (id, e) => {
        if (e) e.stopPropagation();
        if (openItemIds.has(id)) {
            openItemIds.delete(id);
        } else {
            openItemIds.add(id);
        }
        const panel = document.getElementById(`item-settings-${id}`);
        const btn = document.querySelector(`#menu-item-row-${id} .wp-item-toggle-btn i`);
        if (panel) panel.style.display = openItemIds.has(id) ? 'block' : 'none';
        if (btn) btn.className = `fa-solid ${openItemIds.has(id) ? 'fa-caret-up' : 'fa-caret-down'}`;
    };

    const updateItemTitle = (id, title) => {
        const item = currentMenuItems.find(i => i.id === id);
        if (item) {
            item.title = title;
            const titleEl = document.querySelector(`#menu-item-row-${id} .wp-menu-item-title`);
            if (titleEl) titleEl.textContent = title || '(No title)';
        }
    };

    const updateItemUrl = (id, url) => {
        const item = currentMenuItems.find(i => i.id === id);
        if (item) item.url = url;
    };

    const updateItemExternal = (id, isExternal) => {
        const item = currentMenuItems.find(i => i.id === id);
        if (item) item.isExternal = isExternal;
    };

    const moveSubtree = (startIndex, targetIndex, e) => {
        if (e) e.preventDefault();
        applyDragDropReorder(startIndex, targetIndex, 0);
    };

    const indentItem = (index, e) => {
        if (e) e.preventDefault();
        if (index <= 0) return;
        const prevItem = currentMenuItems[index - 1];
        const curItem = currentMenuItems[index];

        curItem.parentId = prevItem.id;
        curItem.depth = (prevItem.depth || 0) + 1;
        computeDepths(currentMenuItems);
        refreshMenuCanvas();
    };

    const outdentItem = (index, e) => {
        if (e) e.preventDefault();
        const curItem = currentMenuItems[index];
        if (!curItem || (curItem.depth || 0) <= 0) return;

        const currentParent = currentMenuItems.find(i => i.id === curItem.parentId);
        curItem.parentId = currentParent ? currentParent.parentId : null;
        computeDepths(currentMenuItems);
        refreshMenuCanvas();
    };

    const removeItem = (id) => {
        const itemToRemove = currentMenuItems.find(i => i.id === id);
        if (!itemToRemove) return;

        // Reassign orphaned direct children to parent of removed item
        currentMenuItems.forEach(item => {
            if (item.parentId === id) {
                item.parentId = itemToRemove.parentId;
            }
        });

        currentMenuItems = currentMenuItems.filter(i => i.id !== id);
        openItemIds.delete(id);
        computeDepths(currentMenuItems);
        refreshMenuCanvas();
    };

    const toggleBulkSelect = (active) => {
        bulkSelectActive = active;
        refreshMenuCanvas();
    };

    const deleteSelectedMenuItems = () => {
        const checked = document.querySelectorAll('.cb-menu-bulk-item:checked');
        if (!checked.length) {
            showToast?.('No items selected for deletion.', 'warning');
            return;
        }

        const idsToDelete = new Set(Array.from(checked).map(c => c.dataset.id));
        currentMenuItems = currentMenuItems.filter(i => !idsToDelete.has(i.id));

        computeDepths(currentMenuItems);
        refreshMenuCanvas();
        showToast?.(`Deleted ${idsToDelete.size} selected item(s). Click "Save Menu" to commit.`);
    };

    const resetToDefaults = () => {
        currentMenuItems = [
            { id: generateUUID(), title: 'Home',       url: '#hero',       type: 'Section', isVisible: true, isExternal: false, parentId: null, depth: 0 },
            { id: generateUUID(), title: 'Services',   url: '#services',   type: 'Section', isVisible: true, isExternal: false, parentId: null, depth: 0 },
            { id: generateUUID(), title: 'Projects',   url: '#projects',   type: 'Section', isVisible: true, isExternal: false, parentId: null, depth: 0 },
            { id: generateUUID(), title: 'Skills',     url: '#skills',     type: 'Section', isVisible: true, isExternal: false, parentId: null, depth: 0 },
            { id: generateUUID(), title: 'Experience', url: '#experience', type: 'Section', isVisible: true, isExternal: false, parentId: null, depth: 0 },
            { id: generateUUID(), title: 'Contact',    url: '#contact',    type: 'Section', isVisible: true, isExternal: false, parentId: null, depth: 0 }
        ];
        refreshMenuCanvas();
        showToast?.('Reset menu structure to standard defaults. Click "Save Menu" to commit.', 'info');
    };

    // ─── Save Active Menu ─────────────────────────────────────────────────
    const saveMenu = async () => {
        if (!activeMenuId) {
            showToast?.('No active menu selected to save.', 'error');
            return;
        }

        const btnTop = document.getElementById('btn-save-menu-top');
        const btnBottom = document.getElementById('btn-save-menu-bottom');
        const menuNameInput = document.getElementById('wp-menu-name-input');
        const newName = menuNameInput?.value?.trim() || activeMenu?.name || 'Navigation Menu';

        const isHeader = document.getElementById('loc-header')?.checked || false;
        const isFooter = document.getElementById('loc-footer')?.checked || false;
        const isSecondary = document.getElementById('loc-secondary')?.checked || false;

        let targetLocation = isHeader ? 'header' : (isFooter ? 'footer' : (isSecondary ? 'secondary' : null));

        try {
            if (btnTop) { btnTop.disabled = true; btnTop.innerHTML = '<span class="spinner"></span> Saving…'; }
            if (btnBottom) { btnBottom.disabled = true; btnBottom.innerHTML = '<span class="spinner"></span> Saving…'; }

            computeDepths(currentMenuItems);

            // 1. Update Menu Metadata
            await APIs.MenusAPI.update(activeMenuId, {
                name: newName,
                location: targetLocation,
                isPrimary: isHeader
            });

            // 2. Batch Save Hierarchical Items
            const payload = currentMenuItems.map((m, idx) => ({
                id: (m.id && m.id.length === 36) ? m.id : generateUUID(),
                title: m.title,
                url: m.url,
                order: idx + 1,
                isVisible: m.isVisible !== false,
                isExternal: !!m.isExternal,
                parentId: m.parentId || null
            }));

            await APIs.MenusAPI.batchSaveItems(activeMenuId, payload);

            // Clear cache for immediate live reflection
            try { localStorage.removeItem('cached_portfolio_data'); } catch {}

            showToast?.(`Navigation Menu '${newName}' saved successfully!`, 'success');
            await loadMenuItems(activeMenuId);
        } catch (e) {
            console.error('Menu save error:', e);
            showToast?.(`Failed to save menu: ${e.message}`, 'error');
        } finally {
            if (btnTop) { btnTop.disabled = false; btnTop.innerHTML = 'Save Menu'; }
            if (btnBottom) { btnBottom.disabled = false; btnBottom.innerHTML = 'Save Menu'; }
        }
    };

    // ─── Load Menu Details ────────────────────────────────────────────────
    const loadMenuDetails = async (menuId) => {
        try {
            const res = await APIs.MenusAPI.getById(menuId);
            activeMenu = res?.data;
            if (activeMenu) {
                activeMenuId = activeMenu.id;
                currentMenuItems = (activeMenu.items || []).map(item => ({
                    ...item,
                    type: item.url?.startsWith('http') ? 'Custom Link' : (item.url?.startsWith('#') ? 'Section' : 'Page')
                }));
            }
            const container = document.getElementById('panel-menuitems');
            if (container) {
                container.innerHTML = renderPanelHTML();
                attachDragAndDropHandlers();
            }
        } catch (err) {
            console.error('Failed to load menu details:', err);
            showToast?.(`Failed to load menu: ${err.message}`, 'error');
        }
    };

    const loadMenuItems = async (preferredMenuId = null) => {
        const container = document.getElementById('panel-menuitems');
        if (!container) return;

        container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted);"><span class="spinner"></span> Loading navigation menus...</div>`;

        try {
            const res = await APIs.MenusAPI.getAll();
            allMenus = res?.data || [];

            if (!allMenus.length) {
                // Should not happen as backend auto-seeds, but safe fallback
                allMenus = [{ id: generateUUID(), name: 'Primary Navigation Menu', isPrimary: true, location: 'header' }];
            }

            // Pick preferredMenuId or activeMenuId or Primary Menu or first menu
            const targetMenu = (preferredMenuId && allMenus.find(m => m.id === preferredMenuId))
                || (activeMenuId && allMenus.find(m => m.id === activeMenuId))
                || allMenus.find(m => m.isPrimary)
                || allMenus[0];

            activeMenuId = targetMenu.id;
            await loadMenuDetails(activeMenuId);
        } catch (e) {
            console.warn('Load menu items error:', e);
            container.innerHTML = `<div style="text-align:center;padding:3rem;color:hsl(0,70%,65%);">Error loading menus: ${e.message}</div>`;
        }
    };

    const init = (config = {}) => {
        APIs = {
            MenusAPI: config.MenusAPI || window.API?.MenusAPI,
            MenuItemsAPI: config.MenuItemsAPI || window.API?.MenuItemsAPI
        };
        showToast = config.toast || window.toast;
        openModal = config.openModal || window.openModal;
        closeModal = config.closeModal || window.closeModal;
    };

    return {
        init,
        loadMenuItems,
        switchMenu,
        promptCreateMenu,
        deleteCurrentMenu,
        togglePagesBox,
        toggleCustomLinksBox,
        toggleSectionsBox,
        setPagesTab,
        filterPagesSearch,
        toggleSelectAllPages,
        addSelectedPagesToMenu,
        addCustomLinkToMenu,
        addSelectedSectionsToMenu,
        toggleItemSettings,
        updateItemTitle,
        updateItemUrl,
        updateItemExternal,
        moveSubtree,
        indentItem,
        outdentItem,
        removeItem,
        toggleBulkSelect,
        deleteSelectedMenuItems,
        resetToDefaults,
        saveMenu
    };
})();
