/**
 * ImageUploader Component
 * Modular File/Media selector component integrated with the Elementor-style MediaPicker modal,
 * drag-and-drop file upload, thumbnail preview, and URL data binding.
 */

window.ImageUploader = (() => {
    const isImage = (url = '') => {
        const ext = url.split('.').pop().toLowerCase().split('?')[0];
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
    };

    const isVideo = (url = '') => {
        const ext = url.split('.').pop().toLowerCase().split('?')[0];
        return ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv'].includes(ext);
    };

    const isPdf = (url = '') => {
        const ext = url.split('.').pop().toLowerCase().split('?')[0];
        return ext === 'pdf';
    };

    const getPreviewHtml = (url) => {
        if (!url) return '';
        if (isImage(url)) {
            return `<img id="preview-img-tag" src="${url}" alt="Uploaded Preview" style="max-height: 140px; max-width: 100%; object-fit: contain; border-radius: var(--radius-sm, 6px);" onerror="this.src='../../assets/images/placeholder.png';" />`;
        }
        if (isVideo(url)) {
            return `<video src="${url}" controls style="max-height: 140px; max-width: 100%; border-radius: var(--radius-sm, 6px);"></video>`;
        }
        if (isPdf(url)) {
            return `<div style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 1rem; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color);"><i class="fa-solid fa-file-pdf" style="color:#ef4444; font-size:2rem;"></i> <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary); word-break:break-all;">${url.split('/').pop()}</span></div>`;
        }
        return `<div style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 1rem; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color);"><i class="fa-solid fa-file" style="color:var(--accent); font-size:2rem;"></i> <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary); word-break:break-all;">${url.split('/').pop()}</span></div>`;
    };

    /**
     * Renders the modular uploader UI
     */
    const renderHTML = (targetInputId, currentUrl = '', label = 'Media File / Image', allowedTypes = 'all') => {
        const previewStyle = currentUrl ? 'display: flex;' : 'display: none;';
        const dropzoneStyle = currentUrl ? 'display: none;' : 'display: flex;';

        return `
            <div class="image-uploader-field" data-target-id="${targetInputId}" data-allowed-types="${allowedTypes}">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.35rem;">
                    <label class="form-label" style="margin-bottom:0;">${label}</label>
                    <button type="button" class="btn-sm btn-edit" style="font-size:0.75rem; padding:0.25rem 0.6rem;" onclick="window.ImageUploader.openMediaPicker('${targetInputId}', '${allowedTypes}')">
                        <i class="fa-solid fa-photo-film"></i> Choose from Media Library
                    </button>
                </div>
                
                <input type="hidden" id="${targetInputId}" value="${currentUrl || ''}">

                <div class="uploader-preview-box" id="${targetInputId}-preview-box" style="${previewStyle}">
                    <div id="${targetInputId}-preview-content" style="width:100%; display:flex; justify-content:center; align-items:center;">
                        ${getPreviewHtml(currentUrl)}
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
                        <button type="button" class="btn-sm btn-edit" onclick="window.ImageUploader.openMediaPicker('${targetInputId}', '${allowedTypes}')">
                            <i class="fa-solid fa-pen-to-square"></i> Replace Media
                        </button>
                        <button type="button" class="btn-sm btn-delete uploader-remove-btn" onclick="window.ImageUploader.removeImage('${targetInputId}')">
                            <i class="fa-solid fa-trash-can"></i> Remove
                        </button>
                    </div>
                </div>

                <div class="uploader-dropzone" id="${targetInputId}-dropzone" style="${dropzoneStyle}">
                    <input type="file" id="${targetInputId}-file-input" style="display:none;" onchange="window.ImageUploader.handleFileSelect(event, '${targetInputId}')">
                    <div class="dropzone-content" onclick="window.ImageUploader.openMediaPicker('${targetInputId}', '${allowedTypes}')">
                        <div class="dropzone-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                        <div class="dropzone-title">Click to open <span>Media Library</span> or drop files here</div>
                        <div class="dropzone-hint">Supports Images, Videos, PDFs & Documents (Max 25MB)</div>
                    </div>
                </div>

                <div class="uploader-progress" id="${targetInputId}-progress" style="display:none; align-items:center; gap:0.5rem; margin-top:0.5rem; font-size:0.85rem; color:var(--text-secondary);">
                    <span class="spinner"></span> <span>Uploading media...</span>
                </div>
            </div>
        `;
    };

    const openMediaPicker = (targetInputId, allowedTypes = 'all') => {
        const input = document.getElementById(targetInputId);
        const currentUrl = input ? input.value : '';

        if (window.MediaPicker && typeof window.MediaPicker.open === 'function') {
            window.MediaPicker.open({
                title: 'Select Media',
                currentUrl: currentUrl,
                allowedTypes: allowedTypes,
                onSelect: (selected) => {
                    setValue(targetInputId, selected.url);
                }
            });
        } else {
            // Fallback to native file input if modal not available
            document.getElementById(`${targetInputId}-file-input`)?.click();
        }
    };

    const setValue = (targetInputId, url) => {
        const input = document.getElementById(targetInputId);
        const dropzone = document.getElementById(`${targetInputId}-dropzone`);
        const previewBox = document.getElementById(`${targetInputId}-preview-box`);
        const previewContent = document.getElementById(`${targetInputId}-preview-content`);

        if (input) input.value = url || '';
        if (previewContent) previewContent.innerHTML = getPreviewHtml(url);

        if (url) {
            if (dropzone) dropzone.style.display = 'none';
            if (previewBox) previewBox.style.display = 'flex';
        } else {
            if (previewBox) previewBox.style.display = 'none';
            if (dropzone) dropzone.style.display = 'flex';
        }
    };

    const attachDragEvents = (targetInputId) => {
        const dropzone = document.getElementById(`${targetInputId}-dropzone`);
        if (!dropzone) return;

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
            const files = dt.files;
            if (files && files.length > 0) {
                uploadFile(files[0], targetInputId);
            }
        });
    };

    const handleFileSelect = (event, targetInputId) => {
        const file = event.target.files[0];
        if (file) {
            uploadFile(file, targetInputId);
        }
    };

    const uploadFile = async (file, targetInputId) => {
        const dropzone = document.getElementById(`${targetInputId}-dropzone`);
        const progress = document.getElementById(`${targetInputId}-progress`);
        const { UploadAPI } = window.API || {};

        if (!UploadAPI) {
            if (window.toast) window.toast('Upload service unavailable.', 'error');
            return;
        }

        if (dropzone) dropzone.style.display = 'none';
        if (progress) progress.style.display = 'flex';

        try {
            const response = await UploadAPI.uploadMedia(file);
            const relativeUrl = response?.data?.url;
            if (relativeUrl) {
                setValue(targetInputId, relativeUrl);
                if (window.toast) window.toast('File uploaded successfully!');
            }
        } catch (err) {
            if (dropzone) dropzone.style.display = 'flex';
            if (window.toast) window.toast(err.message || 'File upload failed.', 'error');
        } finally {
            if (progress) progress.style.display = 'none';
        }
    };

    const removeImage = (targetInputId) => {
        setValue(targetInputId, '');
    };

    return {
        renderHTML,
        openMediaPicker,
        setValue,
        attachDragEvents,
        handleFileSelect,
        removeImage
    };
})();
