/**
 * pending_images.js — Auto-save & Review pasted images
 * Lưu ảnh vào IndexedDB ngay khi dán/thả vào modal nhập dữ liệu.
 * Buổi tối mở panel duyệt từng cái: Duyệt (giữ) hoặc Xoá.
 */

(function () {
    'use strict';

    const DB_NAME = 'theHarvest7_PendingImages';
    const DB_VERSION = 1;
    const STORE_NAME = 'pending';

    // ─── IndexedDB helpers ───────────────────────────────────────────────────

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('savedAt', 'savedAt', { unique: false });
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function dbAdd(db, record) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    function dbGetAll(db) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function dbDelete(db, id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    function dbClear(db) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    // ─── Core: auto-save an image ────────────────────────────────────────────

    /**
     * Tự động lưu ảnh vào hàng chờ (IndexedDB).
     * @param {{ id: string, name: string, mimeType: string, base64Data: string, previewUrl: string }} imgObj
     */
    async function autoSavePendingImage(imgObj) {
        try {
            const db = await openDB();
            const record = {
                id: imgObj.id,
                name: imgObj.name,
                mimeType: imgObj.mimeType,
                base64Data: imgObj.base64Data,
                previewUrl: imgObj.previewUrl,
                savedAt: new Date().toISOString(),
                reviewed: false
            };
            await dbAdd(db, record);
            db.close();
            await refreshBadge();
            showAutoSaveToast(imgObj.name);
        } catch (err) {
            console.warn('[PendingImages] Lỗi lưu ảnh:', err);
        }
    }

    // expose globally so app.js hook can call it
    window.autoSavePendingImage = autoSavePendingImage;

    // ─── Badge counter ───────────────────────────────────────────────────────

    async function refreshBadge() {
        try {
            const db = await openDB();
            const all = await dbGetAll(db);
            db.close();
            const count = all.filter(r => !r.reviewed).length;
            const badge = document.getElementById('pending-images-badge');
            const btn = document.getElementById('btn-pending-images-review');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
            if (btn) {
                btn.style.display = count > 0 ? 'flex' : 'none';
            }
        } catch (err) {
            console.warn('[PendingImages] refreshBadge error:', err);
        }
    }

    // ─── Toast notification ───────────────────────────────────────────────────

    function showAutoSaveToast(name) {
        let toast = document.getElementById('pi-autosave-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'pi-autosave-toast';
            toast.style.cssText = `
                position:fixed; bottom:80px; right:20px; z-index:99999;
                background:linear-gradient(135deg,#10b981,#059669);
                color:white; padding:10px 16px; border-radius:12px;
                font-size:0.82rem; font-weight:700; box-shadow:0 4px 16px rgba(16,185,129,0.4);
                display:none; align-items:center; gap:8px; max-width:280px;
                transition:opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }
        toast.innerHTML = `💾 Đã lưu tự động: <span style="font-weight:400;opacity:0.9;">${name.length > 30 ? name.slice(0, 30) + '…' : name}</span>`;
        toast.style.display = 'flex';
        toast.style.opacity = '1';
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.style.display = 'none'; }, 300);
        }, 2500);
    }

    // ─── Review Modal ────────────────────────────────────────────────────────

    function buildReviewModal() {
        if (document.getElementById('pi-review-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'pi-review-modal';
        modal.style.cssText = `
            display:none; position:fixed; inset:0; background:rgba(0,0,0,0.55);
            backdrop-filter:blur(6px); z-index:99998;
            align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="background:white; border-radius:20px; width:min(96vw,900px);
                        max-height:88vh; display:flex; flex-direction:column;
                        box-shadow:0 20px 60px rgba(0,0,0,0.25); overflow:hidden;">
                <!-- Header -->
                <div style="display:flex; align-items:center; justify-content:space-between;
                            padding:18px 24px; border-bottom:1px solid #e2e8f0;
                            background:linear-gradient(135deg,#6366f1,#4f46e5); color:white; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.3rem;">🖼️</span>
                        <div>
                            <div style="font-size:1.1rem; font-weight:800;">Duyệt Ảnh Đã Lưu</div>
                            <div id="pi-review-subtitle" style="font-size:0.78rem; opacity:0.85; font-weight:500;">Xem xét và duyệt từng ảnh</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button id="pi-btn-delete-all" onclick="window._piDeleteAll()"
                            style="font-size:0.78rem; padding:6px 14px; border-radius:8px; border:none;
                                   background:rgba(239,68,68,0.2); color:#fecaca; font-weight:700; cursor:pointer;">
                            🗑️ Xoá tất cả
                        </button>
                        <button onclick="window._piCloseReview()"
                            style="background:rgba(255,255,255,0.15); border:none; color:white; width:32px; height:32px;
                                   border-radius:50%; cursor:pointer; font-size:1.1rem; display:flex; align-items:center; justify-content:center;">
                            ✕
                        </button>
                    </div>
                </div>
                <!-- Grid -->
                <div id="pi-review-grid" style="flex:1; overflow-y:auto; padding:20px;
                     display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px;">
                </div>
                <!-- Footer -->
                <div style="padding:14px 24px; border-top:1px solid #e2e8f0; display:flex;
                            justify-content:flex-end; gap:10px; background:#f8fafc; flex-shrink:0;">
                    <button onclick="window._piCloseReview()"
                        style="padding:10px 24px; border-radius:10px; border:none;
                               background:#e2e8f0; color:#475569; font-weight:700; cursor:pointer; font-size:0.9rem;">
                        Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close on backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window._piCloseReview();
        });
    }

    window._piCloseReview = function () {
        const modal = document.getElementById('pi-review-modal');
        if (modal) modal.style.display = 'none';
    };

    window._piDeleteAll = async function () {
        if (!confirm('Xoá tất cả ảnh đang chờ duyệt?')) return;
        try {
            const db = await openDB();
            await dbClear(db);
            db.close();
            await loadReviewGrid();
            await refreshBadge();
        } catch (err) {
            console.warn('[PendingImages] deleteAll error:', err);
        }
    };

    window._piApprove = async function (id) {
        // "Approve" = mark as reviewed (keep in DB for record but remove from pending view)
        try {
            const db = await openDB();
            const all = await dbGetAll(db);
            const record = all.find(r => r.id === id);
            if (record) {
                record.reviewed = true;
                await dbAdd(db, record);
            }
            db.close();
            await loadReviewGrid();
            await refreshBadge();
        } catch (err) {
            console.warn('[PendingImages] approve error:', err);
        }
    };

    window._piDelete = async function (id) {
        try {
            const db = await openDB();
            await dbDelete(db, id);
            db.close();
            await loadReviewGrid();
            await refreshBadge();
        } catch (err) {
            console.warn('[PendingImages] delete error:', err);
        }
    };

    async function loadReviewGrid() {
        const grid = document.getElementById('pi-review-grid');
        const subtitle = document.getElementById('pi-review-subtitle');
        if (!grid) return;

        try {
            const db = await openDB();
            const all = await dbGetAll(db);
            db.close();

            // Show unreviewed first, then reviewed
            const pending = all.filter(r => !r.reviewed).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
            const reviewed = all.filter(r => r.reviewed).sort((a, b) => b.savedAt.localeCompare(a.savedAt));

            if (subtitle) {
                subtitle.textContent = pending.length > 0
                    ? `${pending.length} ảnh chờ duyệt · ${reviewed.length} đã duyệt`
                    : reviewed.length > 0
                        ? `Tất cả đã duyệt (${reviewed.length} ảnh)`
                        : 'Chưa có ảnh nào được lưu';
            }

            if (all.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#94a3b8;">
                        <div style="font-size:3rem; margin-bottom:12px;">📭</div>
                        <div style="font-size:1rem; font-weight:600;">Chưa có ảnh nào được lưu tự động</div>
                        <div style="font-size:0.82rem; margin-top:6px;">Dán (Ctrl+V) hoặc kéo thả ảnh vào modal nhập dữ liệu</div>
                    </div>`;
                return;
            }

            const renderCard = (imgObj, isDone) => {
                const time = new Date(imgObj.savedAt).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                return `
                    <div id="pi-card-${imgObj.id}" style="
                        border-radius:14px; overflow:hidden; border:2px solid ${isDone ? '#bbf7d0' : '#e0e7ff'};
                        background:${isDone ? '#f0fdf4' : 'white'};
                        box-shadow:0 2px 10px rgba(0,0,0,0.07); display:flex; flex-direction:column;
                        opacity:${isDone ? '0.65' : '1'}; transition:all 0.2s;">
                        <!-- Image -->
                        <div style="position:relative; height:160px; background:#f1f5f9; overflow:hidden; cursor:pointer;"
                             onclick="window._piZoom('${imgObj.id}')">
                            <img src="${imgObj.previewUrl}" alt="${imgObj.name}"
                                 style="width:100%; height:100%; object-fit:cover;" loading="lazy" />
                            ${isDone ? '<div style="position:absolute;inset:0;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;"><span style="font-size:2rem;">✅</span></div>' : ''}
                            <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.5);color:white;
                                        font-size:0.65rem;padding:2px 6px;border-radius:6px;">
                                🔍 Xem
                            </div>
                        </div>
                        <!-- Info -->
                        <div style="padding:10px 12px; flex:1;">
                            <div style="font-size:0.78rem; font-weight:700; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${imgObj.name}">
                                ${imgObj.name}
                            </div>
                            <div style="font-size:0.72rem; color:#94a3b8; margin-top:3px;">📅 ${time}</div>
                            ${isDone ? '<div style="font-size:0.72rem;color:#10b981;font-weight:700;margin-top:3px;">✅ Đã duyệt</div>' : ''}
                        </div>
                        <!-- Actions -->
                        ${!isDone ? `
                        <div style="display:flex; gap:6px; padding:8px 12px; border-top:1px solid #f1f5f9;">
                            <button onclick="window._piApprove('${imgObj.id}')"
                                style="flex:1; padding:7px; border-radius:8px; border:none;
                                       background:linear-gradient(135deg,#10b981,#059669); color:white;
                                       font-weight:700; font-size:0.78rem; cursor:pointer;">
                                ✅ Duyệt
                            </button>
                            <button onclick="window._piDelete('${imgObj.id}')"
                                style="padding:7px 10px; border-radius:8px; border:none;
                                       background:#fef2f2; color:#ef4444;
                                       font-weight:700; font-size:0.78rem; cursor:pointer;">
                                🗑️
                            </button>
                        </div>` : `
                        <div style="display:flex; gap:6px; padding:8px 12px; border-top:1px solid #f1f5f9;">
                            <button onclick="window._piDelete('${imgObj.id}')"
                                style="flex:1; padding:7px; border-radius:8px; border:none;
                                       background:#fef2f2; color:#ef4444;
                                       font-weight:700; font-size:0.78rem; cursor:pointer;">
                                🗑️ Xoá
                            </button>
                        </div>`}
                    </div>`;
            };

            let html = '';
            if (pending.length > 0) {
                html += `<div style="grid-column:1/-1; font-size:0.82rem; font-weight:800; color:#6366f1; padding:4px 0 0;">
                    ⏳ Chờ duyệt (${pending.length})</div>`;
                html += pending.map(r => renderCard(r, false)).join('');
            }
            if (reviewed.length > 0) {
                html += `<div style="grid-column:1/-1; font-size:0.82rem; font-weight:800; color:#10b981; padding:12px 0 0;">
                    ✅ Đã duyệt (${reviewed.length})</div>`;
                html += reviewed.map(r => renderCard(r, true)).join('');
            }
            grid.innerHTML = html;
        } catch (err) {
            grid.innerHTML = `<div style="grid-column:1/-1; color:#ef4444; padding:40px; text-align:center;">Lỗi tải dữ liệu: ${err.message}</div>`;
        }
    }

    // ─── Zoom / lightbox ─────────────────────────────────────────────────────

    window._piZoom = function (id) {
        let lb = document.getElementById('pi-lightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'pi-lightbox';
            lb.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;
                display:none;align-items:center;justify-content:center;cursor:zoom-out;`;
            lb.innerHTML = `<img id="pi-lightbox-img" style="max-width:95vw;max-height:92vh;border-radius:12px;box-shadow:0 0 60px rgba(0,0,0,0.5);" />`;
            lb.addEventListener('click', () => { lb.style.display = 'none'; });
            document.body.appendChild(lb);
        }
        // Find image in grid
        const card = document.getElementById('pi-card-' + id);
        if (card) {
            const img = card.querySelector('img');
            if (img) {
                document.getElementById('pi-lightbox-img').src = img.src;
                lb.style.display = 'flex';
            }
        }
    };

    // ─── Open review panel ───────────────────────────────────────────────────

    async function openReviewPanel() {
        buildReviewModal();
        await loadReviewGrid();
        const modal = document.getElementById('pi-review-modal');
        if (modal) modal.style.display = 'flex';
    }
    window.openPendingImagesReview = openReviewPanel;

    // ─── Floating Review Button ──────────────────────────────────────────────

    function injectReviewButton() {
        if (document.getElementById('btn-pending-images-review')) return;

        const btn = document.createElement('button');
        btn.id = 'btn-pending-images-review';
        btn.title = 'Duyệt ảnh đã lưu tự động';
        btn.style.cssText = `
            position:fixed; bottom:20px; right:20px; z-index:9990;
            background:linear-gradient(135deg,#6366f1,#4f46e5);
            color:white; border:none; border-radius:50px;
            padding:12px 18px; font-size:0.85rem; font-weight:800;
            cursor:pointer; display:none; align-items:center; gap:8px;
            box-shadow:0 4px 20px rgba(99,102,241,0.45);
            transition:transform 0.15s, box-shadow 0.15s;
        `;
        btn.innerHTML = `
            🖼️ Duyệt ảnh
            <span id="pending-images-badge" style="
                display:none; background:#ef4444; color:white;
                border-radius:50%; width:20px; height:20px; font-size:0.7rem;
                align-items:center; justify-content:center; font-weight:900;
            ">0</span>`;
        btn.addEventListener('click', openReviewPanel);
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; btn.style.boxShadow = '0 4px 20px rgba(99,102,241,0.45)'; });
        document.body.appendChild(btn);
    }

    // ─── Hook into app.js image pipeline ────────────────────────────────────
    // We wait for app.js to fully load, then patch the paste event listener
    // by listening globally BEFORE the modal check (we intercept with low priority).

    function hookPasteEvent() {
        document.addEventListener('paste', async (e) => {
            // Only fire if import-text-modal is open AND we're on image tab
            const importModal = document.getElementById('import-text-modal');
            if (!importModal || importModal.style.display !== 'flex') return;

            // Check active tab — look for the image tab being active
            const imgTab = document.getElementById('tab-import-image');
            if (!imgTab) return;
            // Active tab has border-bottom set
            const isImageTab = imgTab.style.borderBottom && imgTab.style.borderBottom.includes('solid');
            if (!isImageTab) return;

            const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    if (!blob) continue;
                    const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i;
                    const name = `Screenshot_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}_${i}.png`;

                    // Read as base64 and auto-save
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        const previewUrl = ev.target.result;
                        const base64Data = previewUrl.split(',')[1];
                        await autoSavePendingImage({ id, name, mimeType: blob.type || 'image/png', base64Data, previewUrl });
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }, true); // useCapture = true → fires before app.js listener
    }

    // Also hook drop event on the dropzone
    function hookDropEvent() {
        // We use event delegation on document
        document.addEventListener('drop', async (e) => {
            const importModal = document.getElementById('import-text-modal');
            if (!importModal || importModal.style.display !== 'flex') return;
            const imgTab = document.getElementById('tab-import-image');
            if (!imgTab) return;
            const isImageTab = imgTab.style.borderBottom && imgTab.style.borderBottom.includes('solid');
            if (!isImageTab) return;

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;
                const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const previewUrl = ev.target.result;
                    const base64Data = previewUrl.split(',')[1];
                    await autoSavePendingImage({
                        id, name: file.name || `Ảnh_${id}.png`,
                        mimeType: file.type, base64Data, previewUrl
                    });
                };
                reader.readAsDataURL(file);
            }
        }, true);
    }

    // Also hook file input change
    function hookFileInput() {
        document.addEventListener('change', async (e) => {
            const importModal = document.getElementById('import-text-modal');
            if (!importModal || importModal.style.display !== 'flex') return;
            if (e.target && e.target.id === 'import-image-file') {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (!file.type.startsWith('image/')) continue;
                    const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        const previewUrl = ev.target.result;
                        const base64Data = previewUrl.split(',')[1];
                        await autoSavePendingImage({
                            id, name: file.name || `Ảnh_${id}.png`,
                            mimeType: file.type, base64Data, previewUrl
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        }, true);
    }

    // ─── Init ────────────────────────────────────────────────────────────────

    async function init() {
        injectReviewButton();
        await refreshBadge();
        hookPasteEvent();
        hookDropEvent();
        hookFileInput();
        console.log('[PendingImages] ✅ Auto-save & review initialized');
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
