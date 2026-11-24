/**
 * WordPress Duplicator Component for Portfolio CMS Admin Dashboard
 * Handles full site duplication, snapshot archiving, entity cloning, and WordPress importing.
 * Primary Theme: #0F0E0C (Canvas), #E96B02 (Primary Accent)
 */

window.DuplicatorManager = (function () {
    const API_BASE = '/api/duplicator';

    let currentStatus = null;
    let packages = [];

    async function init() {
        console.log('[Duplicator] Initializing WordPress Duplicator Manager...');
        renderContainer();
        await loadStatus();
        await loadPackages();
        attachEventListeners();
    }

    function renderContainer() {
        const panel = document.getElementById('panel-duplicator');
        if (!panel) return;

        panel.innerHTML = `
            <div class="duplicator-wrap" style="color: #FAF9F6; font-family: var(--font-body, sans-serif);">
                <!-- Header Banner -->
                <div style="display:flex; justify-content:space-between; align-items:center; background: #0F0E0C; border: 1px solid rgba(233,107,2,0.25); border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
                    <div>
                        <div style="display:flex; align-items:center; gap: 12px;">
                            <div style="background:#E96B02; color:#0F0E0C; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold;">
                                <i class="fa-solid fa-clone"></i>
                            </div>
                            <h2 style="font-size: 22px; font-weight:700; color: #FAF9F6; margin:0;">WordPress Duplicator & Cloner</h2>
                        </div>
                        <p style="color: #A8A29E; margin: 8px 0 0 0; font-size: 14px;">
                            Backup, clone, duplicate site content, and import WordPress posts into your portfolio CMS.
                        </p>
                    </div>
                    <button id="btn-create-package" style="background:#E96B02; color:#0F0E0C; border:none; padding: 12px 20px; border-radius:8px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px; transition:0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">
                        <i class="fa-solid fa-box-archive"></i> Create Duplicate Package
                    </button>
                </div>

                <!-- Stats Grid -->
                <div id="duplicator-stats" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div style="background:#171512; border: 1px solid rgba(233,107,2,0.15); border-radius: 10px; padding: 16px; text-align:center;">
                        <span style="font-size:12px; color:#A8A29E; text-transform:uppercase; letter-spacing:1px;">Projects</span>
                        <div id="stat-projects" style="font-size:28px; font-weight:800; color:#E96B02; margin-top:4px;">-</div>
                    </div>
                    <div style="background:#171512; border: 1px solid rgba(233,107,2,0.15); border-radius: 10px; padding: 16px; text-align:center;">
                        <span style="font-size:12px; color:#A8A29E; text-transform:uppercase; letter-spacing:1px;">Skills</span>
                        <div id="stat-skills" style="font-size:28px; font-weight:800; color:#E96B02; margin-top:4px;">-</div>
                    </div>
                    <div style="background:#171512; border: 1px solid rgba(233,107,2,0.15); border-radius: 10px; padding: 16px; text-align:center;">
                        <span style="font-size:12px; color:#A8A29E; text-transform:uppercase; letter-spacing:1px;">Services</span>
                        <div id="stat-services" style="font-size:28px; font-weight:800; color:#E96B02; margin-top:4px;">-</div>
                    </div>
                    <div style="background:#171512; border: 1px solid rgba(233,107,2,0.15); border-radius: 10px; padding: 16px; text-align:center;">
                        <span style="font-size:12px; color:#A8A29E; text-transform:uppercase; letter-spacing:1px;">Packages</span>
                        <div id="stat-packages" style="font-size:28px; font-weight:800; color:#E96B02; margin-top:4px;">-</div>
                    </div>
                </div>

                <!-- Tabs: Packages | WordPress Importer | Clone Tool -->
                <div style="display:flex; gap:12px; border-bottom: 1px solid rgba(233,107,2,0.2); margin-bottom: 20px;">
                    <button class="dup-tab active" data-tab="packages" style="background:none; border:none; padding:10px 16px; color:#E96B02; border-bottom: 2px solid #E96B02; font-weight:600; cursor:pointer;">
                        <i class="fa-solid fa-box"></i> Duplicate Packages
                    </button>
                    <button class="dup-tab" data-tab="wp-import" style="background:none; border:none; padding:10px 16px; color:#A8A29E; font-weight:600; cursor:pointer;">
                        <i class="fa-brands fa-wordpress"></i> WordPress Importer
                    </button>
                    <button class="dup-tab" data-tab="quick-clone" style="background:none; border:none; padding:10px 16px; color:#A8A29E; font-weight:600; cursor:pointer;">
                        <i class="fa-solid fa-copy"></i> Instant Cloner
                    </button>
                </div>

                <!-- Tab 1: Packages List -->
                <div id="tab-content-packages" class="dup-tab-pane">
                    <div id="packages-list" style="display:flex; flex-direction:column; gap: 12px;">
                        <div style="text-align:center; padding: 40px; color:#78716C;">Loading duplicate packages...</div>
                    </div>
                </div>

                <!-- Tab 2: WordPress Importer -->
                <div id="tab-content-wp-import" class="dup-tab-pane" style="display:none;">
                    <div style="background:#171512; border:1px solid rgba(233,107,2,0.2); border-radius:12px; padding:24px;">
                        <h3 style="color:#FAF9F6; margin-top:0;"><i class="fa-brands fa-wordpress" style="color:#E96B02;"></i> Import / Duplicate WordPress Content</h3>
                        <p style="color:#A8A29E; font-size:14px;">Paste WordPress REST API post items or sample articles to duplicate directly into the Portfolio Projects database.</p>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display:block; margin-bottom:6px; color:#FAF9F6; font-size:13px; font-weight:600;">Sample WordPress Payload (or custom JSON):</label>
                            <textarea id="wp-import-json" style="width:100%; height:160px; background:#0F0E0C; color:#FAF9F6; border:1px solid rgba(233,107,2,0.3); border-radius:8px; padding:12px; font-family:monospace; font-size:12px; box-sizing:border-box;">[
  {
    "title": "Modern Headless eCommerce Showcase",
    "slug": "headless-ecommerce",
    "excerpt": "A lightning-fast eCommerce showcase migrated from WordPress WooCommerce.",
    "content": "Built with ultra-performant static architecture and real-time backend APIs.",
    "imageUrl": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    "categories": ["eCommerce", "Featured"]
  },
  {
    "title": "Creative Agency Digital Experience",
    "slug": "creative-agency",
    "excerpt": "Interactive 3D storytelling site cloned from high-end WordPress theme.",
    "content": "Award-winning typography, high contrast aesthetic with #E96B02 primary accenting.",
    "imageUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    "categories": ["Case Study", "Design"]
  }
]</textarea>
                        </div>
                        <button id="btn-run-wp-import" style="background:#E96B02; color:#0F0E0C; border:none; padding:12px 24px; border-radius:8px; font-weight:700; cursor:pointer;">
                            <i class="fa-solid fa-file-import"></i> Execute WordPress Duplication
                        </button>
                    </div>
                </div>

                <!-- Tab 3: Quick Cloner -->
                <div id="tab-content-quick-clone" class="dup-tab-pane" style="display:none;">
                    <div style="background:#171512; border:1px solid rgba(233,107,2,0.2); border-radius:12px; padding:24px;">
                        <h3 style="color:#FAF9F6; margin-top:0;"><i class="fa-solid fa-copy" style="color:#E96B02;"></i> Instant 1-Click Entity Duplication</h3>
                        <p style="color:#A8A29E; font-size:14px;">Select any project or record to generate an instant clone with updated slugs and duplicate tracking.</p>
                        
                        <div id="clone-project-list" style="margin-top:16px;">
                            <div style="color:#78716C;">Fetching available projects for duplication...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function loadStatus() {
        try {
            const res = await fetch(`${API_BASE}/status`);
            const data = await res.json();
            if (data && data.success && data.data) {
                currentStatus = data.data;
                document.getElementById('stat-projects').textContent = currentStatus.projectsCount;
                document.getElementById('stat-skills').textContent = currentStatus.skillsCount;
                document.getElementById('stat-services').textContent = currentStatus.servicesCount;
                document.getElementById('stat-packages').textContent = currentStatus.packagesCount;
            }
        } catch (err) {
            console.error('[Duplicator] Error loading status:', err);
        }
    }

    async function loadPackages() {
        try {
            const res = await fetch(`${API_BASE}/packages`);
            const data = await res.json();
            const listEl = document.getElementById('packages-list');
            if (!listEl) return;

            if (data && data.success && data.data && data.data.length > 0) {
                packages = data.data;
                listEl.innerHTML = packages.map(pkg => `
                    <div style="background:#171512; border: 1px solid rgba(233,107,2,0.2); border-radius:10px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:700; font-size:15px; color:#FAF9F6;">
                                <i class="fa-solid fa-box-archive" style="color:#E96B02; margin-right:8px;"></i> ${pkg.packageName}
                            </div>
                            <div style="font-size:12px; color:#A8A29E; margin-top:4px;">
                                File: <code style="color:#E96B02;">${pkg.fileName}</code> • Total Entities: <strong>${pkg.totalEntities}</strong> • Size: ${(pkg.fileSizeBytes / 1024).toFixed(1)} KB
                            </div>
                            <div style="font-size:11px; color:#78716C; margin-top:2px;">
                                Created: ${new Date(pkg.createdAtUtc).toLocaleString()}
                            </div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <a href="${API_BASE}/package/download/${pkg.fileName}" download class="btn-dl" style="background:#0F0E0C; border:1px solid rgba(233,107,2,0.4); color:#FAF9F6; padding:8px 12px; border-radius:6px; font-weight:600; text-decoration:none; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-solid fa-download" style="color:#E96B02;"></i> JSON
                            </a>
                            <button onclick="DuplicatorManager.exportZip('${pkg.fileName}')" style="background:#0F0E0C; border:1px solid #E96B02; color:#E96B02; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-solid fa-file-zipper"></i> Export ZIP
                            </button>
                            <button onclick="DuplicatorManager.restorePackage('${pkg.fileName}')" style="background:#E96B02; border:none; color:#0F0E0C; padding:8px 14px; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-solid fa-rotate-left"></i> Restore
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                listEl.innerHTML = `
                    <div style="text-align:center; padding: 40px; background:#171512; border:1px dashed rgba(233,107,2,0.3); border-radius:12px;">
                        <i class="fa-solid fa-box-open" style="font-size:36px; color:#E96B02; margin-bottom:12px;"></i>
                        <p style="color:#FAF9F6; font-size:15px; font-weight:600; margin:0;">No Duplicator Packages Found</p>
                        <p style="color:#A8A29E; font-size:13px; margin:4px 0 16px 0;">Create your first snapshot package to clone or backup your site.</p>
                        <button onclick="DuplicatorManager.createPackage()" style="background:#E96B02; color:#0F0E0C; border:none; padding:10px 18px; border-radius:6px; font-weight:700; cursor:pointer;">
                            <i class="fa-solid fa-plus"></i> Create Package Now
                        </button>
                    </div>
                `;
            }
        } catch (err) {
            console.error('[Duplicator] Error loading packages:', err);
        }
    }

    async function loadProjectsForCloning() {
        try {
            const listEl = document.getElementById('clone-project-list');
            if (!listEl) return;
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (data && data.success && data.data && data.data.length > 0) {
                listEl.innerHTML = data.data.slice(0, 10).map(p => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#0F0E0C; border:1px solid rgba(233,107,2,0.15); padding:12px 16px; border-radius:8px; margin-bottom:8px;">
                        <div>
                            <strong style="color:#FAF9F6;">${p.title}</strong>
                            <div style="font-size:12px; color:#A8A29E;">Category: ${p.category || 'General'} | Slug: ${p.slug}</div>
                        </div>
                        <button onclick="DuplicatorManager.cloneProject('${p.id}')" style="background:#E96B02; color:#0F0E0C; border:none; padding:6px 14px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer;">
                            <i class="fa-solid fa-clone"></i> Duplicate
                        </button>
                    </div>
                `).join('');
            } else {
                listEl.innerHTML = `<div style="color:#78716C;">No projects currently available to duplicate.</div>`;
            }
        } catch (err) {
            console.error('[Duplicator] Error loading projects for clone:', err);
        }
    }

    async function createPackage() {
        const name = prompt('Enter a name for this Duplicator Package:', `WordPress_Clone_${new Date().toISOString().slice(0,10)}`);
        if (!name) return;

        try {
            const btn = document.getElementById('btn-create-package');
            if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating Package...`;

            const res = await fetch(`${API_BASE}/package/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageName: name, notes: 'Created via WordPress Duplicator' })
            });

            const data = await res.json();
            if (data && data.success) {
                alert(`Package "${name}" created successfully with ${data.data.totalEntities} entities!`);
                await loadStatus();
                await loadPackages();
            } else {
                alert(data?.message || 'Failed to create package');
            }
        } catch (err) {
            alert('Error creating package: ' + err.message);
        } finally {
            const btn = document.getElementById('btn-create-package');
            if (btn) btn.innerHTML = `<i class="fa-solid fa-box-archive"></i> Create Duplicate Package`;
        }
    }

    async function restorePackage(fileName) {
        if (!confirm(`Are you sure you want to restore / duplicate data from "${fileName}"? Existing entities will not be deleted, new ones will be cloned.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/package/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName })
            });
            const data = await res.json();
            if (data && data.success) {
                alert(data.data || 'Restore complete!');
                await loadStatus();
            } else {
                alert(data?.message || 'Restore failed.');
            }
        } catch (err) {
            alert('Error restoring package: ' + err.message);
        }
    }

    async function exportZip(fileName) {
        try {
            const res = await fetch(`${API_BASE}/package/export-zip/${fileName}`, { method: 'POST' });
            const data = await res.json();
            if (data && data.success) {
                const zipFileName = data.data;
                const dl = confirm(`Portable ZIP package "${zipFileName}" generated successfully!\n\nWould you like to download it now?`);
                if (dl) {
                    window.location.href = `${API_BASE}/package/download/${zipFileName}`;
                }
            } else {
                alert(data?.message || 'Failed to export ZIP package.');
            }
        } catch (err) {
            alert('Error generating ZIP: ' + err.message);
        }
    }

    async function cloneProject(id) {
        try {
            const res = await fetch(`${API_BASE}/clone-project/${id}`, { method: 'POST' });
            const data = await res.json();
            if (data && data.success) {
                alert(`Duplicated: "${data.data.title}" successfully created!`);
                await loadStatus();
                await loadProjectsForCloning();
            } else {
                alert(data?.message || 'Failed to duplicate project.');
            }
        } catch (err) {
            alert('Error duplicating project: ' + err.message);
        }
    }

    async function runWordPressImport() {
        try {
            const raw = document.getElementById('wp-import-json').value;
            const posts = JSON.parse(raw);
            const btn = document.getElementById('btn-run-wp-import');
            if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Duplicating...`;

            const res = await fetch(`${API_BASE}/import-wordpress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ posts })
            });

            const data = await res.json();
            if (data && data.success) {
                alert(data.message || 'WordPress items successfully duplicated!');
                await loadStatus();
                await loadPackages();
            } else {
                alert(data?.message || 'WordPress import failed');
            }
        } catch (err) {
            alert('Error executing WordPress import: ' + err.message);
        } finally {
            const btn = document.getElementById('btn-run-wp-import');
            if (btn) btn.innerHTML = `<i class="fa-solid fa-file-import"></i> Execute WordPress Duplication`;
        }
    }

    function attachEventListeners() {
        const btnCreate = document.getElementById('btn-create-package');
        if (btnCreate) btnCreate.onclick = createPackage;

        const btnImport = document.getElementById('btn-run-wp-import');
        if (btnImport) btnImport.onclick = runWordPressImport;

        // Tabs
        document.querySelectorAll('.dup-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.dup-tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.color = '#A8A29E';
                    t.style.borderBottom = 'none';
                });
                tab.classList.add('active');
                tab.style.color = '#E96B02';
                tab.style.borderBottom = '2px solid #E96B02';

                const target = tab.dataset.tab;
                document.querySelectorAll('.dup-tab-pane').forEach(p => p.style.display = 'none');
                const targetPane = document.getElementById(`tab-content-${target}`);
                if (targetPane) targetPane.style.display = 'block';

                if (target === 'quick-clone') {
                    loadProjectsForCloning();
                }
            };
        });
    }

    return {
        init,
        createPackage,
        restorePackage,
        exportZip,
        cloneProject
    };
})();
