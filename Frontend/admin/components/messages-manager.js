/**
 * MessagesManager Component
 * Modular component for managing Inbox Contact Messages from website visitors.
 */

window.MessagesManager = (() => {
    let ContactAPI = null;
    let showToast = null;

    const renderPanelHTML = () => `
        <div class="section-hdr">
            <div>
                <h2>Messages Inbox</h2>
                <p>View and manage contact form submissions sent from your public portfolio.</p>
            </div>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Sender Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Date Received</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tbl-messages"></tbody>
            </table>
        </div>
    `;

    const loadMessages = async () => {
        const tbody = document.getElementById('tbl-messages');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);"><span class="spinner"></span> Loading messages...</td></tr>`;

        try {
            const res = await ContactAPI.getAll();
            const items = res?.data || [];

            const unreadBadge = document.getElementById('unread-badge');
            const unreadCount = items.filter(m => !m.isRead).length;
            if (unreadBadge) {
                unreadBadge.textContent = unreadCount;
                unreadBadge.style.display = unreadCount ? 'inline-block' : 'none';
            }

            if (!items.length) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No messages found. Incoming contact requests will appear here.</td></tr>`;
                return;
            }

            const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
            const trunc = (txt, n = 30) => (txt && txt.length > n) ? txt.slice(0, n) + '...' : (txt || '—');

            tbody.innerHTML = items.map(m => `
                <tr>
                    <td class="${m.isRead ? 'msg-read' : 'msg-unread'}"><strong>${m.name}</strong></td>
                    <td>${m.email}</td>
                    <td>${trunc(m.subject, 30)}</td>
                    <td>${fmtDate(m.createdAt)}</td>
                    <td>${m.isRead ? '<span class="tag">Read</span>' : '<span class="tag tag-green">New</span>'}</td>
                    <td style="display:flex;gap:0.4rem;">
                        ${!m.isRead ? `<button class="btn-sm btn-edit" onclick="window.MessagesManager.markRead('${m.id}')">Mark Read</button>` : ''}
                        <button class="btn-sm btn-delete" onclick="window.MessagesManager.deleteMessage('${m.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:hsl(0,70%,65%);">Error loading messages: ${err.message}</td></tr>`;
        }
    };

    const markRead = async (id) => {
        try {
            await ContactAPI.markRead(id);
            if (showToast) showToast('Marked message as read.');
            loadMessages();
        } catch (err) {
            if (showToast) showToast(`Error: ${err.message}`, 'error');
        }
    };

    const deleteMessage = (id) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        (async () => {
            try {
                await ContactAPI.delete(id);
                if (showToast) showToast('Message deleted!');
                loadMessages();
            } catch (err) {
                if (showToast) showToast(`Delete error: ${err.message}`, 'error');
            }
        })();
    };

    const init = (config = {}) => {
        ContactAPI = config.ContactAPI || window.API?.ContactAPI;
        showToast  = config.toast || window.toast;

        const container = document.getElementById('panel-messages');
        if (container && !container.children.length) {
            container.innerHTML = renderPanelHTML();
        }
    };

    return {
        init,
        renderPanelHTML,
        loadMessages,
        markRead,
        deleteMessage
    };
})();
