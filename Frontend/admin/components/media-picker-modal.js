/**
 * MediaPickerModal Component
 * Elementor & WordPress-style Insert Media Modal with left sidebar actions,
 * tabs (Upload files / Media Library), responsive media grid with selection outlines,
 * right sidebar attachment details (preview, dimensions, metadata, fields, delete),
 * and insert selection flow.
 */

window.MediaPicker = (() => {
    let activeOptions = null;
    let mediaFiles = [];
    let selectedFile = null;
    let currentLeftAction = 'insert-media'; // 'insert-media' | 'insert-url'
    let currentTab = 'library'; // 'upload' | 'library'
    let searchQuery = '';

    const isImage = (fileName = '') => {
        const ext = fileName.split('.').pop().toLowerCase().split('?')[0];
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
    };

    const isVideo = (fileName = '') => {
        const ext = fileName.split('.').pop().toLowerCase().split('?')[0];
        return ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv'].includes(ext);
    };

    const isPdf = (fileName = '') => {
        const ext = fileName.split('.').pop().toLowerCase().split('?')[0];
        return ext === 'pdf';
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFileIcon = (fileName = '') => {
        const ext = fileName.split('.').pop().toLowerCase().split('?')[0];
        if (isPdf(fileName)) return '<i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i>';
        if (isVideo(fileName)) return '<i class="fa-solid fa-file-video" style="color:#8b5cf6;"></i>';
        if (['doc', 'docx'].includes(ext)) return '<i class="fa-solid fa-file-word" style="color:#3b82f6;"></i>';
        if (['xls', 'xlsx'].includes(ext)) return '<i class="fa-solid fa-file-excel" style="color:#10b981;"></i>';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '<i class="fa-solid fa-file-zipper" style="color:#f59e0b;"></i>';
        if (['mp3', 'wav', 'ogg'].includes(ext)) return '<i class="fa-solid fa-file-audio" style="color:#ec4899;"></i>';
        if (['txt', 'md', 'json'].includes(ext)) return '<i class="fa-solid fa-file-lines" style="color:#6b7280;"></i>';
        return '<i class="fa-solid fa-file" style="color:#6b7280;"></i>';
    };

    const renderModalHTML = () => `
        <div class="media-modal-backdrop" id="media-modal-backdrop">
            <div class="media-modal-window" id="media-modal-window" role="dialog" aria-modal="true">
                <!-- Modal Header -->
                <div class="media-modal-header">
                    <h2 class="media-modal-title" id="media-modal-title">Insert Media</h2>
                    <button type="button" class="media-modal-close" id="media-modal-close-btn" aria-label="Close modal">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Modal Body: Left Sidebar + Center Content + Right Sidebar -->
                <div class="media-modal-body">
                    
                    <!-- Left Sidebar Navigation -->
                    <aside class="media-modal-leftbar">
                        <div class="media-leftbar-section-title">Actions</div>
                        <ul class="media-leftbar-menu">
                            <li>
                                <button type="button" class="media-leftbar-item active" id="btn-left-insert-media">
                                    <i class="fa-regular fa-image"></i> Insert Media
                                </button>
                            </li>
                            <li>
                                <button type="button" class="media-leftbar-item" id="btn-left-insert-url">
                                    <i class="fa-solid fa-link"></i> Insert from URL
                                </button>
                            </li>
                        </ul>
                    </aside>

                    <!-- Center Area -->
                    <main class="media-modal-center" id="media-modal-center-area">
                        <!-- Top Bar: Tabs & Search -->
                        <div class="media-center-topbar" id="media-center-topbar">
                            <div class="media-tabs-nav">
                                <button type="button" class="media-tab-btn" id="tab-btn-upload">Upload files</button>
                                <button type="button" class="media-tab-btn active" id="tab-btn-library">Media Library</button>
                            </div>
                            <div class="media-search-wrapper" id="media-search-wrapper">
                                <label for="media-search-input" class="media-search-label">Search media</label>
                                <input type="text" id="media-search-input" class="media-search-field" placeholder="Search filenames..." />
                            </div>
                        </div>

                        <!-- Panel: Media Library (Grid) -->
                        <div class="media-panel-view active" id="media-view-library">
                            <div class="media-grid-container" id="media-grid-container">
                                <!-- Grid items rendered here -->
                            </div>
                        </div>

                        <!-- Panel: Upload Files -->
                        <div class="media-panel-view" id="media-view-upload">
                            <div class="media-upload-dropzone" id="media-upload-dropzone">
                                <input type="file" id="media-modal-file-input" style="display:none;" multiple />
                                <div class="dropzone-inner-content">
                                    <div class="dropzone-icon-large"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                                    <h3 class="dropzone-prompt">Drop files to upload</h3>
                                    <p class="dropzone-sub">or</p>
                                    <button type="button" class="btn btn-secondary btn-select-files" id="btn-browse-upload">
                                        Select Files
                                    </button>
                                    <div class="dropzone-max-size">Maximum upload file size: 25 MB. Supports Images, Videos, PDFs, and Documents.</div>
                                </div>
                                <div class="media-upload-progress" id="media-modal-upload-progress" style="display:none;">
                                    <div class="spinner"></div>
                                    <span id="media-upload-progress-text">Uploading files...</span>
                                </div>
                            </div>
                        </div>

                        <!-- Panel: Insert from URL -->
                        <div class="media-panel-view" id="media-view-url" style="display:none;">
                            <div class="media-url-insert-container">
                                <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--text-primary);">Insert Media from URL</h3>
                                <div class="form-group" style="margin-bottom:1.25rem;">
                                    <label class="form-label" for="media-url-input">Direct Media / Image / Video / PDF URL</label>
                                    <input type="url" id="media-url-input" class="form-input" placeholder="https://example.com/assets/banner.webp" />
                                </div>
                                <div class="media-url-preview-box" id="media-url-preview-box">
                                    <span style="color:var(--text-muted); font-size:0.85rem;">Enter a valid URL above to preview media</span>
                                </div>
                            </div>
                        </div>
                    </main>

                    <!-- Right Sidebar: Attachment Details -->
                    <aside class="media-modal-rightbar" id="media-modal-rightbar">
                        <div class="media-attachment-details" id="media-attachment-details">
                            <div class="attachment-details-header">ATTACHMENT DETAILS</div>
                            
                            <div id="attachment-details-content">
                                <div class="attachment-empty-state">
                                    <i class="fa-regular fa-image" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.4;"></i>
                                    <p>Select an item to view attachment details</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>

                <!-- Modal Footer -->
                <div class="media-modal-footer">
                    <div class="media-footer-left">
                        <span id="media-selection-count" style="font-size:0.85rem; color:var(--text-muted);"></span>
                    </div>
                    <div class="media-footer-right">
                        <button type="button" class="btn btn-secondary" id="media-modal-cancel-btn">Cancel</button>
                        <button type="button" class="btn btn-primary" id="media-modal-select-btn" disabled>
                            Select
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const ensureModalExists = () => {
        let backdrop = document.getElementById('media-modal-backdrop');
        if (!backdrop) {
            const div = document.createElement('div');
            div.innerHTML = renderModalHTML();
            document.body.appendChild(div.firstElementChild);
            backdrop = document.getElementById('media-modal-backdrop');
            bindEvents();
        }
        return backdrop;
    };

    const bindEvents = () => {
        // Close modal
        document.getElementById('media-modal-close-btn')?.addEventListener('click', close);
        document.getElementById('media-modal-cancel-btn')?.addEventListener('click', close);
        document.getElementById('media-modal-backdrop')?.addEventListener('click', (e) => {
            if (e.target.id === 'media-modal-backdrop') close();
        });

        // Left sidebar navigation
        document.getElementById('btn-left-insert-media')?.addEventListener('click', () => {
            setLeftAction('insert-media');
        });
        document.getElementById('btn-left-insert-url')?.addEventListener('click', () => {
            setLeftAction('insert-url');
        });

        // Tabs navigation
        document.getElementById('tab-btn-upload')?.addEventListener('click', () => {
            setTab('upload');
        });
        document.getElementById('tab-btn-library')?.addEventListener('click', () => {
            setTab('library');
        });

        // Search input
        document.getElementById('media-search-input')?.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderMediaGrid();
        });

        // File browse & drag and drop
        const browseBtn = document.getElementById('btn-browse-upload');
        const fileInput = document.getElementById('media-modal-file-input');
        const dropzone = document.getElementById('media-upload-dropzone');

        browseBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => handleUploadFiles(e.target.files));

        if (dropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add('drag-over');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove('drag-over');
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt.files && dt.files.length > 0) {
                    handleUploadFiles(dt.files);
                }
            });
        }

        // Insert from URL field change
        const urlInput = document.getElementById('media-url-input');
        urlInput?.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            const previewBox = document.getElementById('media-url-preview-box');
            const selectBtn = document.getElementById('media-modal-select-btn');

            if (url) {
                if (isImage(url)) {
                    previewBox.innerHTML = `<img src="${url}" alt="Preview" style="max-height:220px; max-width:100%; object-fit:contain; border-radius:6px;" onerror="this.parentElement.innerHTML='<span style=\\'color:hsl(0,70%,60%); font-size:0.85rem;\\'>Unable to load image from URL</span>';" />`;
                } else if (isVideo(url)) {
                    previewBox.innerHTML = `<video src="${url}" controls style="max-height:220px; max-width:100%; border-radius:6px;"></video>`;
                } else {
                    previewBox.innerHTML = `<div style="display:flex; align-items:center; gap:0.75rem; font-size:1rem; color:var(--text-primary);">${getFileIcon(url)} <span>${url.split('/').pop() || 'External File'}</span></div>`;
                }
                selectBtn.disabled = false;
                selectedFile = {
                    fileName: url.split('/').pop() || 'external-file',
                    url: url,
                    fileSize: 0,
                    createdAt: new Date().toISOString()
                };
                renderAttachmentDetails(selectedFile);
            } else {
                previewBox.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;">Enter a valid URL above to preview media</span>`;
                selectBtn.disabled = true;
                selectedFile = null;
                renderAttachmentDetails(null);
            }
        });

        // Select Button
        document.getElementById('media-modal-select-btn')?.addEventListener('click', () => {
            if (!selectedFile) return;

            const altVal = document.getElementById('att-field-alt')?.value || selectedFile.altText || '';
            const titleVal = document.getElementById('att-field-title')?.value || selectedFile.title || selectedFile.fileName;
            const captionVal = document.getElementById('att-field-caption')?.value || selectedFile.caption || '';
            const descVal = document.getElementById('att-field-desc')?.value || selectedFile.description || '';

            const result = {
                ...selectedFile,
                altText: altVal,
                title: titleVal,
                caption: captionVal,
                description: descVal
            };

            if (activeOptions && typeof activeOptions.onSelect === 'function') {
                activeOptions.onSelect(result);
            }
            close();
        });
    };

    const setLeftAction = (action) => {
        currentLeftAction = action;
        const insertMediaBtn = document.getElementById('btn-left-insert-media');
        const insertUrlBtn   = document.getElementById('btn-left-insert-url');
        const topbar         = document.getElementById('media-center-topbar');
        const viewLib        = document.getElementById('media-view-library');
        const viewUpload     = document.getElementById('media-view-upload');
        const viewUrl        = document.getElementById('media-view-url');
        const selectBtn      = document.getElementById('media-modal-select-btn');

        if (action === 'insert-media') {
            insertMediaBtn?.classList.add('active');
            insertUrlBtn?.classList.remove('active');
            if (topbar) topbar.style.display = 'flex';
            if (viewUrl) viewUrl.style.display = 'none';
            selectBtn.textContent = 'Select';
            setTab(currentTab);
        } else {
            insertMediaBtn?.classList.remove('active');
            insertUrlBtn?.classList.add('active');
            if (topbar) topbar.style.display = 'none';
            if (viewLib) { viewLib.classList.remove('active'); viewLib.style.display = 'none'; }
            if (viewUpload) { viewUpload.classList.remove('active'); viewUpload.style.display = 'none'; }
            if (viewUrl) { viewUrl.style.display = 'block'; viewUrl.classList.add('active'); }
            selectBtn.textContent = 'Insert from URL';
            const urlInput = document.getElementById('media-url-input');
            selectBtn.disabled = !urlInput?.value.trim();
        }
    };

    const setTab = (tab) => {
        currentTab = tab;
        const uploadBtn = document.getElementById('tab-btn-upload');
        const libraryBtn = document.getElementById('tab-btn-library');
        const searchWrap = document.getElementById('media-search-wrapper');
        const viewLib = document.getElementById('media-view-library');
        const viewUpload = document.getElementById('media-view-upload');

        if (tab === 'upload') {
            uploadBtn?.classList.add('active');
            libraryBtn?.classList.remove('active');
            if (searchWrap) searchWrap.style.display = 'none';
            if (viewLib) { viewLib.classList.remove('active'); viewLib.style.display = 'none'; }
            if (viewUpload) { viewUpload.classList.add('active'); viewUpload.style.display = 'flex'; }
        } else {
            uploadBtn?.classList.remove('active');
            libraryBtn?.classList.add('active');
            if (searchWrap) searchWrap.style.display = 'flex';
            if (viewUpload) { viewUpload.classList.remove('active'); viewUpload.style.display = 'none'; }
            if (viewLib) { viewLib.classList.add('active'); viewLib.style.display = 'block'; }
            renderMediaGrid();
        }
    };

    const loadMediaFiles = async () => {
        const grid = document.getElementById('media-grid-container');
        if (grid) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:3rem; color:var(--text-muted);"><span class="spinner"></span> Loading media library...</div>`;
        }

        try {
            const { UploadAPI } = window.API || {};
            if (UploadAPI) {
                const res = await UploadAPI.getAll();
                mediaFiles = res?.data || [];
            } else {
                mediaFiles = [];
            }
        } catch (e) {
            console.error('Failed to load media files:', e);
            mediaFiles = [];
        }

        renderMediaGrid();
    };

    const renderMediaGrid = () => {
        const grid = document.getElementById('media-grid-container');
        if (!grid) return;

        let list = [...mediaFiles];
        if (searchQuery) {
            list = list.filter(f => f.fileName.toLowerCase().includes(searchQuery));
        }

        if (activeOptions?.allowedTypes) {
            if (activeOptions.allowedTypes === 'image') {
                list = list.filter(f => isImage(f.fileName));
            } else if (activeOptions.allowedTypes === 'video') {
                list = list.filter(f => isVideo(f.fileName));
            } else if (activeOptions.allowedTypes === 'document') {
                list = list.filter(f => !isImage(f.fileName) && !isVideo(f.fileName));
            }
        }

        if (!list.length) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:4rem 1rem; color:var(--text-muted);">
                    <i class="fa-regular fa-folder-open" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.4;"></i>
                    <p style="font-size:0.95rem;">No media files found in library.</p>
                    <button type="button" class="btn btn-secondary btn-sm" style="margin-top:0.75rem;" onclick="window.MediaPicker.switchTab('upload')">
                        Upload your first file
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = list.map(f => {
            const isSelected = selectedFile && selectedFile.fileName === f.fileName;
            const isImg = isImage(f.fileName);
            const isVid = isVideo(f.fileName);

            let previewThumbnail;
            if (isImg) {
                previewThumbnail = `<img src="${f.url}" alt="${f.fileName}" class="media-card-img" loading="lazy" onerror="this.src='../../assets/images/placeholder.png';" />`;
            } else if (isVid) {
                previewThumbnail = `
                    <div class="media-card-icon-preview video-preview">
                        <i class="fa-solid fa-circle-play" style="color:var(--accent); font-size:2rem;"></i>
                    </div>
                `;
            } else {
                previewThumbnail = `
                    <div class="media-card-icon-preview doc-preview">
                        ${getFileIcon(f.fileName)}
                    </div>
                `;
            }

            return `
                <div class="media-grid-item ${isSelected ? 'selected' : ''}" 
                     data-filename="${f.fileName}" 
                     onclick="window.MediaPicker.selectFile('${encodeURIComponent(f.fileName)}')">
                    <div class="media-card-thumbnail">
                        ${previewThumbnail}
                        <div class="media-card-check-badge">
                            <i class="fa-solid fa-check"></i>
                        </div>
                    </div>
                    <div class="media-card-filename" title="${f.fileName}">
                        ${f.fileName}
                    </div>
                </div>
            `;
        }).join('');
    };

    const selectFile = (encodedFileName) => {
        const fileName = decodeURIComponent(encodedFileName);
        const file = mediaFiles.find(f => f.fileName === fileName);
        if (!file) return;

        selectedFile = file;

        // Update UI selection state in grid
        document.querySelectorAll('.media-grid-item').forEach(el => {
            if (el.getAttribute('data-filename') === fileName) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });

        // Enable select button
        const selectBtn = document.getElementById('media-modal-select-btn');
        if (selectBtn) selectBtn.disabled = false;

        // Render right sidebar details
        renderAttachmentDetails(file);
    };

    const renderAttachmentDetails = (file) => {
        const container = document.getElementById('attachment-details-content');
        if (!container) return;

        if (!file) {
            container.innerHTML = `
                <div class="attachment-empty-state">
                    <i class="fa-regular fa-image" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.4;"></i>
                    <p>Select an item to view attachment details</p>
                </div>
            `;
            return;
        }

        const isImg = isImage(file.fileName);
        const isVid = isVideo(file.fileName);

        let previewHtml;
        if (isImg) {
            previewHtml = `<img id="att-preview-img-tag" src="${file.url}" alt="${file.fileName}" class="attachment-details-preview-img" />`;
        } else if (isVid) {
            previewHtml = `<video src="${file.url}" controls class="attachment-details-preview-video"></video>`;
        } else {
            previewHtml = `<div class="attachment-details-preview-icon">${getFileIcon(file.fileName)}<span style="font-size:0.8rem; margin-top:0.5rem; color:var(--text-muted);">${file.fileName.split('.').pop().toUpperCase()}</span></div>`;
        }

        // Clean title suggestion
        const cleanTitle = (file.fileName || '')
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, l => l.toUpperCase());

        container.innerHTML = `
            <div class="attachment-details-preview-wrapper">
                ${previewHtml}
            </div>

            <div class="attachment-metadata-block">
                <div class="attachment-meta-filename">${file.fileName}</div>
                <div class="attachment-meta-date">${formatDate(file.createdAt)}</div>
                <div class="attachment-meta-size" id="att-meta-size-dim">
                    ${formatBytes(file.fileSize)}
                    ${isImg ? '<span id="att-dimensions-span" style="color:var(--text-muted); font-size:0.78rem;"></span>' : ''}
                </div>
                
                <div class="attachment-actions-links">
                    ${isImg ? `<button type="button" class="link-btn" onclick="window.MediaPicker.editImagePreview('${file.url}')">Edit Image</button> <span class="sep">|</span>` : ''}
                    <button type="button" class="link-btn link-delete" onclick="window.MediaPicker.deleteCurrentFile('${encodeURIComponent(file.fileName)}')">Delete permanently</button>
                </div>
            </div>

            <hr class="attachment-divider" />

            <div class="attachment-form-fields">
                <div class="att-field-row">
                    <label class="att-field-label" for="att-field-alt">Alt Text</label>
                    <div class="att-field-control">
                        <textarea id="att-field-alt" class="att-input att-textarea" rows="2" placeholder="Image description for accessibility..."></textarea>
                        <div class="att-field-helper">
                            <a href="https://www.w3.org/WAI/tutorials/images/decision-tree/" target="_blank" rel="noopener">Learn how to describe the purpose of the image <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.7rem;"></i></a>
                            <br/>Leave empty if the image is purely decorative.
                        </div>
                    </div>
                </div>

                <div class="att-field-row">
                    <label class="att-field-label" for="att-field-title">Title</label>
                    <div class="att-field-control">
                        <input type="text" id="att-field-title" class="att-input" value="${cleanTitle}" />
                    </div>
                </div>

                <div class="att-field-row">
                    <label class="att-field-label" for="att-field-caption">Caption</label>
                    <div class="att-field-control">
                        <textarea id="att-field-caption" class="att-input att-textarea" rows="2" placeholder="Optional caption"></textarea>
                    </div>
                </div>

                <div class="att-field-row">
                    <label class="att-field-label" for="att-field-desc">Description</label>
                    <div class="att-field-control">
                        <textarea id="att-field-desc" class="att-input att-textarea" rows="2" placeholder="Detailed file description"></textarea>
                    </div>
                </div>

                <div class="att-field-row">
                    <label class="att-field-label" for="att-field-url">File URL</label>
                    <div class="att-field-control" style="display:flex; gap:0.4rem;">
                        <input type="text" id="att-field-url" class="att-input" value="${window.location.origin}${file.url}" readonly />
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.MediaPicker.copyUrl('${file.url}')" title="Copy URL">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // If image, calculate natural dimensions
        if (isImg) {
            const img = new Image();
            img.src = file.url;
            img.onload = () => {
                const dimSpan = document.getElementById('att-dimensions-span');
                if (dimSpan) {
                    dimSpan.textContent = ` • ${img.naturalWidth} by ${img.naturalHeight} pixels`;
                }
            };
        }
    };

    const handleUploadFiles = async (files) => {
        if (!files || !files.length) return;

        const progressBox = document.getElementById('media-modal-upload-progress');
        const progressText = document.getElementById('media-upload-progress-text');
        const { UploadAPI } = window.API || {};

        if (!UploadAPI) {
            if (window.toast) window.toast('Upload service is currently unavailable.', 'error');
            return;
        }

        if (progressBox) progressBox.style.display = 'flex';
        let uploadedFileObj = null;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (progressText) progressText.textContent = `Uploading ${file.name} (${i + 1}/${files.length})...`;
            try {
                const res = await UploadAPI.uploadMedia(file);
                if (res?.data) {
                    uploadedFileObj = {
                        fileName: res.data.fileName,
                        url: res.data.url,
                        fileSize: res.data.fileSize,
                        createdAt: new Date().toISOString()
                    };
                }
            } catch (err) {
                if (window.toast) window.toast(`Failed to upload ${file.name}: ${err.message}`, 'error');
            }
        }

        if (progressBox) progressBox.style.display = 'none';

        if (uploadedFileObj) {
            if (window.toast) window.toast('File(s) uploaded successfully!');
            await loadMediaFiles();
            setTab('library');
            selectFile(uploadedFileObj.fileName);
        }
    };

    const deleteCurrentFile = async (encodedFileName) => {
        const fileName = decodeURIComponent(encodedFileName);
        if (!confirm(`Are you sure you want to permanently delete "${fileName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const { UploadAPI } = window.API || {};
            if (UploadAPI && UploadAPI.delete) {
                await UploadAPI.delete(fileName);
            }
            if (window.toast) window.toast(`Deleted ${fileName}`);
            selectedFile = null;
            renderAttachmentDetails(null);
            document.getElementById('media-modal-select-btn').disabled = true;
            await loadMediaFiles();
        } catch (err) {
            if (window.toast) window.toast(`Delete failed: ${err.message}`, 'error');
        }
    };

    const copyUrl = (relativeUrl) => {
        const fullUrl = `${window.location.origin}${relativeUrl}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            if (window.toast) window.toast('File URL copied to clipboard!');
        }).catch(() => {
            if (window.toast) window.toast('Failed to copy URL.', 'error');
        });
    };

    const editImagePreview = (url) => {
        window.open(url, '_blank');
    };

    const open = (options = {}) => {
        activeOptions = options;
        const backdrop = ensureModalExists();

        // Custom modal title if provided
        const titleEl = document.getElementById('media-modal-title');
        if (titleEl) titleEl.textContent = options.title || 'Insert Media';

        // Reset state
        searchQuery = '';
        const searchInput = document.getElementById('media-search-input');
        if (searchInput) searchInput.value = '';

        setLeftAction('insert-media');
        setTab('library');

        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';

        loadMediaFiles().then(() => {
            if (options.currentUrl) {
                const matched = mediaFiles.find(f => f.url === options.currentUrl || f.fileName === options.currentUrl.split('/').pop());
                if (matched) {
                    selectFile(matched.fileName);
                }
            }
        });
    };

    const close = () => {
        const backdrop = document.getElementById('media-modal-backdrop');
        if (backdrop) {
            backdrop.classList.remove('open');
        }
        document.body.style.overflow = '';
        activeOptions = null;
        selectedFile = null;
    };

    return {
        open,
        close,
        selectFile,
        switchTab: setTab,
        deleteCurrentFile,
        copyUrl,
        editImagePreview,
        formatBytes,
        formatDate,
        getFileIcon
    };
})();
