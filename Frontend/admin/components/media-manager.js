/**
 * MediaManager Component
 * Modular component for managing uploaded media files, images, PDFs, and documents.
 */

window.MediaManager = (() => {
    let UploadAPI = null;
    let showToast = null;
    let openModal = null;
    let closeModal = null;
    let mediaFiles = [];
    let currentView = 'grid'; // 'grid' or 'list'

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const isImage = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'pdf': return '<i class="fa-solid fa-file-pdf" style="color:#ff5722;"></i>';
            case 'doc':
            case 'docx': return '<i class="fa-solid fa-file-word" style="color:#2196f3;"></i>';
            case 'xls':
            case 'xlsx': return '<i class="fa-solid fa-file-excel" style="color:#4caf50;"></i>';
            case 'zip':
            case 'rar': return '<i class="fa-solid fa-file-zipper" style="color:#ffeb3b;"></i>';
            case 'txt': return '<i class="fa-solid fa-file-lines" style="color:#9e9e9e;"></i>';
            default: return '<i class="fa-solid fa-file" style="color:#607d8b;"></i>';
        }
    };

    const renderPanelHTML = () => `
        <div class="section-hdr" style="margin-bottom: 1.5rem;">
            <div>
                <h2>Media Library</h2>
                <p>Upload, browse, search, and manage your portfolio assets and documents.</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn-add" id="btn-upload-media" onclick="window.MediaPicker.open()">
                    <i class="fa-solid fa-cloud-arrow-up"></i> Add Media File
                </button>
            </div>
        </div>

        <!-- Toolbar controls matching the mockup -->
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem 1rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
            <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                <div style="display:flex; border:1px solid var(--border-color); border-radius:var(--radius-sm); overflow:hidden; background:var(--bg-input);">
                    <button id="view-grid-btn" style="background:none; border:none; color:var(--text-primary); padding:0.4rem 0.6rem; cursor:pointer;" title="Grid View"><i class="fa-solid fa-table-cells-large"></i></button>
                    <button id="view-list-btn" style="background:none; border:none; color:var(--text-muted); padding:0.4rem 0.6rem; cursor:pointer;" title="List View"><i class="fa-solid fa-list"></i></button>
                </div>

                <select id="filter-type" class="form-select" style="width:auto; padding:0.35rem 1.5rem 0.35rem 0.75rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); cursor:pointer;">
                    <option value="all">All media items</option>
                    <option value="images">Images</option>
                    <option value="documents">Documents</option>
                </select>

                <select id="filter-date" class="form-select" style="width:auto; padding:0.35rem 1.5rem 0.35rem 0.75rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); cursor:pointer;">
                    <option value="all">All dates</option>
                </select>

                <button class="btn-sm btn-edit" style="font-weight:600; padding:0.4rem 0.8rem;" id="btn-bulk-select">Bulk select</button>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; min-width:260px;">
                <span style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">Search media</span>
                <input type="text" id="search-media-input" placeholder="Search filenames..." style="flex:1; padding:0.4rem 0.75rem; font-size:0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary); outline:none;">
            </div>
        </div>

        <!-- Render container -->
        <div id="media-content-area" style="min-height:200px;"></div>
    `;

    const renderMediaList = (files) => {
        if (!files.length) {
            return `<div style="text-align:center; padding:3rem; color:var(--text-muted);">No matching media items found.</div>`;
        }

        if (currentView === 'list') {
            return `
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:60px;">Preview</th>
                                <th>File Name</th>
                                <th>Size</th>
                                <th>Date Uploaded</th>
                                <th style="width:100px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${files.map(f => {
                                const previewHtml = isImage(f.fileName) 
                                    ? `<img src="${f.url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid var(--border-color);">`
                                    : `<div style="width:40px; height:40px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">${getFileIcon(f.fileName)}</div>`;
                                return `
                                    <tr style="cursor:pointer;" onclick="window.MediaManager.showDetails('${f.fileName}')">
                                        <td>${previewHtml}</td>
                                        <td><strong style="color:var(--text-primary); font-size:0.85rem;">${f.fileName}</strong></td>
                                        <td>${formatBytes(f.fileSize)}</td>
                                        <td>${formatDate(f.createdAt)}</td>
                                        <td style="display:flex; gap:0.25rem;">
                                            <button class="btn-sm btn-edit" onclick="event.stopPropagation(); window.MediaManager.copyLink('${f.url}')">Copy Link</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            return `
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:1rem;">
                    ${files.map(f => {
                        const previewHtml = isImage(f.fileName)
                            ? `<img src="${f.url}" style="width:100%; height:110px; object-fit:cover;" onerror="this.src='../../assets/images/placeholder.png'">`
                            : `<div style="width:100%; height:110px; background:var(--bg-secondary); display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:2.5rem; border-bottom:1px solid var(--border-color);">${getFileIcon(f.fileName)}</div>`;
                        return `
                            <div class="premium-card" style="padding:0; overflow:hidden; border-radius:8px; display:flex; flex-direction:column; cursor:pointer;" onclick="window.MediaManager.showDetails('${f.fileName}')">
                                <div style="flex:1; border-bottom:1px solid var(--border-color); overflow:hidden; display:flex; align-items:center; justify-content:center; background:hsl(240,6%,5%);">
                                    ${previewHtml}
                                </div>
                                <div style="padding:0.5rem; font-size:0.725rem; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; text-align:center; background:var(--bg-secondary);" title="${f.fileName}">
                                    ${f.fileName}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    };

    const applyFiltersAndRender = () => {
        const typeFilter = document.getElementById('filter-type')?.value || 'all';
        const dateFilter = document.getElementById('filter-date')?.value || 'all';
        const searchVal  = document.getElementById('search-media-input')?.value.toLowerCase().trim() || '';

        let filtered = [...mediaFiles];

        if (searchVal) {
            filtered = filtered.filter(f => f.fileName.toLowerCase().includes(searchVal));
        }

        if (typeFilter === 'images') {
            filtered = filtered.filter(f => isImage(f.fileName));
        } else if (typeFilter === 'documents') {
            filtered = filtered.filter(f => !isImage(f.fileName));
        }

        if (dateFilter !== 'all') {
            filtered = filtered.filter(f => {
                const date = new Date(f.createdAt);
                const filterKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return filterKey === dateFilter;
            });
        }

        const container = document.getElementById('media-content-area');
        if (container) {
            container.innerHTML = renderMediaList(filtered);
        }
    };

    const populateDateFilter = () => {
        const dateDropdown = document.getElementById('filter-date');
        if (!dateDropdown) return;

        // Group dates by year and month
        const uniqueMonths = new Map();
        mediaFiles.forEach(f => {
            const date = new Date(f.createdAt);
            const year = date.getFullYear();
            const monthName = date.toLocaleString(undefined, { month: 'long' });
            const monthVal = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthVal}`;
            const label = `${monthName} ${year}`;
            uniqueMonths.set(key, label);
        });

        let dropdownHtml = '<option value="all">All dates</option>';
        for (const [key, label] of uniqueMonths.entries()) {
            dropdownHtml += `<option value="${key}">${label}</option>`;
        }
        dateDropdown.innerHTML = dropdownHtml;
    };

    const loadMedia = async () => {
        const container = document.getElementById('media-content-area');
        if (container) {
            container.innerHTML = `<div style="text-align:center; padding:3rem;"><span class="spinner"></span> Loading media library...</div>`;
        }

        try {
            const res = await UploadAPI.getAll();
            mediaFiles = res?.data || [];
            populateDateFilter();
            applyFiltersAndRender();
        } catch (e) {
            if (container) {
                container.innerHTML = `<div style="text-align:center; padding:3rem; color:hsl(0,70%,65%);">Error loading media library: ${e.message}</div>`;
            }
        }
    };

    const handleUpload = async (files) => {
        if (!files.length) return;
        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            try {
                await UploadAPI.uploadFile(file);
                successCount++;
            } catch (e) {
                failCount++;
            }
        }

        if (successCount) showToast(`Successfully uploaded ${successCount} file(s).`);
        if (failCount) showToast(`Failed to upload ${failCount} file(s).`, 'error');

        loadMedia();
    };

    const init = (config = {}) => {
        UploadAPI = config.UploadAPI || window.API?.UploadAPI;
        showToast = config.toast || window.toast;
        openModal = config.openModal || window.openModal;
        closeModal = config.closeModal || window.closeModal;

        const container = document.getElementById('panel-media');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }

        // Attach layout actions
        const fileInput = document.getElementById('media-upload-input');
        document.getElementById('btn-upload-media')?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => handleUpload(e.target.files));

        const viewGrid = document.getElementById('view-grid-btn');
        const viewList = document.getElementById('view-list-btn');

        viewGrid?.addEventListener('click', () => {
            currentView = 'grid';
            viewGrid.style.color = 'var(--text-primary)';
            if (viewList) viewList.style.color = 'var(--text-muted)';
            applyFiltersAndRender();
        });

        viewList?.addEventListener('click', () => {
            currentView = 'list';
            if (viewGrid) viewGrid.style.color = 'var(--text-muted)';
            viewList.style.color = 'var(--text-primary)';
            applyFiltersAndRender();
        });

        document.getElementById('filter-type')?.addEventListener('change', applyFiltersAndRender);
        document.getElementById('filter-date')?.addEventListener('change', applyFiltersAndRender);
        document.getElementById('search-media-input')?.addEventListener('input', applyFiltersAndRender);

        document.getElementById('btn-bulk-select')?.addEventListener('click', () => {
            showToast('Bulk selection is not implemented yet.', 'error');
        });
    };

    const showDetails = (fileName) => {
        const file = mediaFiles.find(f => f.fileName === fileName);
        if (!file) return;

        if (window.MediaPicker) {
            window.MediaPicker.open({ currentUrl: file.url });
            return;
        }

        const detailHtml = `
            <div style="display:flex; flex-direction:column; gap:1.25rem; align-items:center; text-align:center;">
                <div style="width:100%; max-height:260px; background:hsl(240,6%,5%); border:1px solid var(--border-color); border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:1rem;">
                    ${isImage(file.fileName)
                        ? `<img src="${file.url}" style="max-width:100%; max-height:240px; object-fit:contain;">`
                        : `<div style="font-size:5rem;">${getFileIcon(file.fileName)}</div>`
                    }
                </div>
                <div style="width:100%; text-align:left;">
                    <div style="margin-bottom:0.75rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">File Name</span>
                        <div style="font-size:0.875rem; font-weight:600; color:var(--text-primary); word-break:break-all;">${file.fileName}</div>
                    </div>
                    <div style="margin-bottom:0.75rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">File Size</span>
                        <div style="font-size:0.875rem; font-weight:600; color:var(--text-primary);">${formatBytes(file.fileSize)}</div>
                    </div>
                    <div style="margin-bottom:0.75rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Upload Date & Time</span>
                        <div style="font-size:0.875rem; font-weight:600; color:var(--text-primary);">${formatDate(file.createdAt)}</div>
                    </div>
                    <div style="margin-bottom:1.25rem;">
                        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">File URL</span>
                        <div style="font-size:0.825rem; font-weight:500; color:var(--accent); word-break:break-all; cursor:pointer;" onclick="window.MediaManager.copyLink('${file.url}')">${window.location.origin}${file.url}</div>
                    </div>
                </div>
                <div class="modal-actions" style="width:100%; margin-top:0;">
                    <button class="btn-cancel" style="flex:1;" type="button" onclick="window.closeModal()">Close</button>
                    <button class="btn-save" style="background:hsl(0, 70%, 50%); color:#fff; flex:1;" type="button" onclick="window.MediaManager.copyLink('${file.url}')"><i class="fa-solid fa-copy"></i> Copy URL</button>
                </div>
            </div>
        `;

        openModal('File Details', detailHtml, null);
    };

    const copyLink = (relativeUrl) => {
        const fullUrl = `${window.location.origin}${relativeUrl}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast('Copied link to clipboard!');
        }).catch(() => {
            showToast('Copy failed.', 'error');
        });
    };

    return {
        init,
        renderPanelHTML,
        loadMedia,
        showDetails,
        copyLink
    };
})();
