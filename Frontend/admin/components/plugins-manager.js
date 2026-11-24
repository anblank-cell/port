/**
 * PluginsManager Component
 * Modular component for managing custom plugins.
 */

window.PluginsManager = (() => {
    let PluginsAPI = null;
    let showToast = null;
    let openModal = null;
    let availablePlugins = [];
    let installedPlugins = [];
    let searchQuery = '';
    let isAddPluginMode = false;
    let currentTab = 'featured';

    const renderPanelHTML = () => `
        <div class="section-hdr" style="margin-bottom: ${isAddPluginMode ? '0' : '2rem'};">
            <div>
                <h2 id="plugins-title" style="display:flex;align-items:center;gap:1rem;">
                    ${isAddPluginMode ? 'Add Plugins' : 'Installed Plugins'}
                    <button class="btn-sm" id="btn-toggle-view" style="font-size:0.9rem;border:1px solid var(--border-color);background:transparent;">
                        ${isAddPluginMode ? 'View Installed' : 'Add New'}
                    </button>
                </h2>
                <p id="plugins-desc" style="display:none;">Manage your currently installed plugins.</p>
            </div>
            ${!isAddPluginMode ? `
            <div style="display:flex;gap:1rem;align-items:center;" id="installed-search-container">
                <div style="position:relative;">
                    <i class="fa-solid fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.9rem;"></i>
                    <input type="text" id="plugin-search-installed" placeholder="Search installed plugins..." class="form-control" style="width:250px; padding: 0.5rem 0.8rem 0.5rem 2.2rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-element); color: var(--text-primary); outline: none; transition: border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--accent)'; this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
                </div>
            </div>
            ` : ''}
        </div>

        <div id="plugin-repo-header" style="display: ${isAddPluginMode ? 'block' : 'none'}; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1.5rem; margin-top:1rem;">
            <p style="margin-bottom:1.5rem;color:var(--text-muted);font-size:0.95rem;">
                Plugins extend and expand the functionality of your Portfolio CMS. You may install plugins right on this page.
            </p>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div style="display:flex; gap:1.5rem; font-size:0.9rem;" class="wp-tabs">
                    <span class="wp-tab ${currentTab === 'featured' ? 'active' : ''}" onclick="window.PluginsManager.setTab('featured')">Featured</span>
                    <span class="wp-tab ${currentTab === 'popular' ? 'active' : ''}" onclick="window.PluginsManager.setTab('popular')">Popular</span>
                    <span class="wp-tab ${currentTab === 'recommended' ? 'active' : ''}" onclick="window.PluginsManager.setTab('recommended')">Recommended</span>
                    <span class="wp-tab ${currentTab === 'favorites' ? 'active' : ''}" onclick="window.PluginsManager.setTab('favorites')">Favorites</span>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <span style="font-size:0.9rem;color:var(--text-muted);">Search Plugins</span>
                    <div style="position:relative;">
                        <i class="fa-solid fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.9rem;"></i>
                        <input type="text" id="plugin-search-repo" placeholder="Keyword..." class="form-control" style="width:250px; padding: 0.5rem 0.8rem 0.5rem 2.2rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-element); color: var(--text-primary); outline: none; transition: border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--accent)'; this.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
                    </div>
                </div>
            </div>
        </div>

        <div id="plugins-content"></div>
    `;

    const getPluginsState = () => JSON.parse(localStorage.getItem('admin_plugins') || '{}');
    const setPluginState = (id, isActive) => {
        const state = getPluginsState();
        state[id] = isActive;
        localStorage.setItem('admin_plugins', JSON.stringify(state));
        if (window.refreshPlugins) window.refreshPlugins();
    };

    const loadPlugins = async () => {
        try {
            const res = await PluginsAPI.getAvailable();
            availablePlugins = res.data || [];
            installedPlugins = availablePlugins.filter(p => p.isInstalled);
            renderContent();
        } catch (err) {
            if (showToast) showToast('Failed to load plugins.', 'error');
        }
    };

    const setTab = (tab) => {
        currentTab = tab;
        document.querySelectorAll('.wp-tab').forEach(t => {
            t.classList.toggle('active', t.textContent.toLowerCase() === tab);
        });
        // In a real app this would filter by category, we'll just re-render
        renderContent();
    };

    const renderContent = () => {
        const container = document.getElementById('plugins-content');
        if (!container) return;
        
        const state = getPluginsState();

        if (!isAddPluginMode) {
            // TABLE VIEW (Installed)
            const filteredList = installedPlugins.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            
            let html = `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Plugin Name</th>
                            <th>Description</th>
                            <th>Version</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            if (filteredList.length === 0) {
                html += `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No installed plugins found.</td></tr>`;
            } else {
                html += filteredList.map(p => {
                    const isActive = state[p.id] === true;
                    return `
                        <tr>
                            <td><strong><i class="${p.icon || 'fa-solid fa-puzzle-piece'}" style="margin-right:8px;color:var(--text-muted);"></i> ${p.name}</strong></td>
                            <td><span style="color:var(--text-muted);font-size:0.9rem;">${p.description}</span></td>
                            <td>${p.version}</td>
                            <td><span class="tag" style="background:${isActive ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)'};color:${isActive ? '#2ecc71' : '#e74c3c'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                            <td style="display:flex;gap:0.4rem;">
                                <button class="btn-sm" style="background:var(--bg-card-hover);color:var(--text-primary);" onclick="window.PluginsManager.togglePlugin('${p.id}')">${isActive ? 'Deactivate' : 'Activate'}</button>
                                <button class="btn-sm btn-delete" onclick="window.PluginsManager.deletePlugin('${p.id}')">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
            html += `</tbody></table></div>`;
            container.innerHTML = html;

        } else {
            // GRID VIEW (Repository - WordPress Style)
            // Add custom inline styles for WP-like UI if not present
            if (!document.getElementById('wp-plugin-styles')) {
                const style = document.createElement('style');
                style.id = 'wp-plugin-styles';
                style.innerHTML = `
                    .wp-tabs { border-bottom: none; }
                    .wp-tab { cursor: pointer; padding-bottom: 0.5rem; border-bottom: 2px solid transparent; }
                    .wp-tab.active { font-weight: 600; color: var(--accent); border-bottom: 2px solid var(--accent); }
                    .wp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
                    .wp-card { background: #fff; border: 1px solid #ddd; display: flex; flex-direction: column; color: #333; }
                    .wp-card-main { padding: 1.25rem; display: flex; gap: 1rem; flex: 1; }
                    .wp-card-icon { width: 100px; height: 100px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #007cba; color: #fff; font-size: 2.5rem; border-radius: 4px; }
                    .wp-card-content { flex: 1; }
                    .wp-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
                    .wp-card-title { font-weight: 600; font-size: 1.1rem; color: #007cba; margin: 0; }
                    .wp-card-btn { background: #f6f7f7; border: 1px solid #2271b1; color: #2271b1; padding: 0.3rem 0.8rem; border-radius: 3px; font-weight: 500; cursor: pointer; font-size: 0.85rem; }
                    .wp-card-btn:hover { background: #f0f0f1; border-color: #0a4b78; color: #0a4b78; }
                    .wp-card-btn.installed { background: #fff; border: 1px solid #ddd; color: #50575e; cursor: default; }
                    .wp-card-desc { font-size: 0.85rem; color: #50575e; margin-bottom: 1rem; line-height: 1.4; }
                    .wp-card-author { font-size: 0.8rem; color: #50575e; font-style: italic; }
                    .wp-card-author span { font-style: normal; font-weight: 500; color: #007cba; }
                    .wp-card-footer { border-top: 1px solid #eee; padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; font-size: 0.75rem; color: #50575e; background: #fafafa; }
                    .wp-stars { color: #f5c800; letter-spacing: 2px; }
                    .wp-check { color: #00a32a; font-weight: 600; }
                `;
                document.head.appendChild(style);
            }

            const uninstalledList = availablePlugins; // Show all in repo, but change button if installed
            const filteredList = uninstalledList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

            if (filteredList.length === 0) {
                container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted);">No plugins match your search.</div>`;
                return;
            }

            let html = `<div class="wp-grid">`;
            html += filteredList.map(p => {
                const isInstalled = p.isInstalled;
                const iconClass = p.icon || 'fa-solid fa-puzzle-piece';
                // Pick a deterministic color based on name length
                const colors = ['#007cba', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e'];
                const color = colors[p.name.length % colors.length];

                return `
                    <div class="wp-card">
                        <div class="wp-card-main">
                            <div class="wp-card-icon" style="background:${color};">
                                <i class="${iconClass}"></i>
                            </div>
                            <div class="wp-card-content">
                                <div class="wp-card-header">
                                    <h4 class="wp-card-title">${p.name}</h4>
                                    <div style="text-align:right;">
                                        ${isInstalled 
                                            ? `<button class="wp-card-btn installed" disabled>Installed</button>`
                                            : `<button class="wp-card-btn" onclick="window.PluginsManager.installPlugin('${p.id}')">Install Now</button>`
                                        }
                                        <div style="margin-top:0.4rem;font-size:0.8rem;"><a href="#" style="color:#007cba;text-decoration:none;">More Details</a></div>
                                    </div>
                                </div>
                                <div class="wp-card-desc">${p.description}</div>
                                <div class="wp-card-author">By <span>Portfolio Team</span></div>
                            </div>
                        </div>
                        <div class="wp-card-footer">
                            <div>
                                <div class="wp-stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i> (42)</div>
                                <div style="margin-top:0.3rem;">10,000+ Active Installations</div>
                            </div>
                            <div style="text-align:right;">
                                <div>Last Updated: <strong>2 days ago</strong></div>
                                <div style="margin-top:0.3rem;"><span class="wp-check">✓</span> Compatible with your version</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            html += `</div>`;
            container.innerHTML = html;
        }
    };

    const togglePlugin = (id) => {
        const state = getPluginsState();
        const isActive = state[id] === true;
        setPluginState(id, !isActive);
        if (showToast) showToast(`Plugin ${!isActive ? 'activated' : 'deactivated'}!`, 'success');
        
        if (isActive && document.getElementById(`panel-${id}`)?.classList.contains('active')) {
            if (window.switchAdminPanel) window.switchAdminPanel('overview');
        }
        renderContent();
    };

    const installPlugin = async (id) => {
        try {
            await PluginsAPI.install(id);
            if (showToast) showToast('Plugin installed successfully!', 'success');
            await loadPlugins();
        } catch (err) {
            if (showToast) showToast('Failed to install plugin.', 'error');
        }
    };

    const deletePlugin = async (id) => {
        if (!confirm('Are you sure you want to completely delete this plugin from the project?')) return;
        try {
            await PluginsAPI.delete(id);
            setPluginState(id, false);
            if (showToast) showToast('Plugin completely deleted.', 'success');
            await loadPlugins();
            if (document.getElementById(`panel-${id}`)?.classList.contains('active')) {
                if (window.switchAdminPanel) window.switchAdminPanel('overview');
            }
        } catch (err) {
            if (showToast) showToast('Failed to delete plugin.', 'error');
        }
    };

    const init = (config = {}) => {
        PluginsAPI = config.PluginsAPI || PluginsAPI;
        showToast = config.toast || showToast;
        openModal = config.openModal || openModal;
        isAddPluginMode = config.mode === 'add';
        searchQuery = '';
        currentTab = 'featured';

        const container = document.getElementById('panel-plugins');
        if (container) {
            container.innerHTML = renderPanelHTML();
            
            const btnToggle = document.getElementById('btn-toggle-view');
            if (btnToggle) {
                btnToggle.addEventListener('click', () => {
                    if (isAddPluginMode) {
                        if (window.switchAdminPanel) window.switchAdminPanel('plugins-installed');
                    } else {
                        if (window.switchAdminPanel) window.switchAdminPanel('plugins-add');
                    }
                });
            }
            
            const searchInputInstalled = document.getElementById('plugin-search-installed');
            if (searchInputInstalled) {
                searchInputInstalled.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    renderContent();
                });
            }
            
            const searchInputRepo = document.getElementById('plugin-search-repo');
            if (searchInputRepo) {
                searchInputRepo.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    renderContent();
                });
            }
            
            loadPlugins();
        }
    };

    return {
        init,
        renderPanelHTML,
        togglePlugin,
        deletePlugin,
        installPlugin,
        setTab
    };
})();
