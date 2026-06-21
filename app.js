// CONFIGURATION UTILITIES
var getRole = () => sessionStorage.getItem("user-role");
var getUserName = () => sessionStorage.getItem("user-name");
var getToken = () => sessionStorage.getItem("user-token");
var isConfigured = () => {
    return typeof CONFIG !== 'undefined' && CONFIG.WEB_APP_URL && CONFIG.WEB_APP_URL !== "" && CONFIG.WEB_APP_URL !== "YOUR_WEB_APP_URL_HERE" && CONFIG.WEB_APP_URL !== "NOT_CONFIGURED";
};

function getTodayStr() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function formatNumber(num) {
    if (!num) return "0";
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num);
}

function formatCurrency(number) {
    if (!number && number !== 0) return "0 ₫";
    if (number < 0) {
        return `(-${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(number))})`;
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

function parseMoney(val) {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d]/g, '')) || 0;
}

function parseSignedMoney(val) {
    if (!val) return 0;
    // Xoá tất cả trừ số và dấu trừ
    const clean = String(val).replace(/[^\d-]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
}

function formatMoneyStr(num) {
    if (num === 0) return "0";
    if (!num && num !== 0) return "";
    return new Intl.NumberFormat('vi-VN').format(num);
}

function formatSignedMoneyStr(num) {
    if (num === 0) return "0 ₫";
    const sign = num > 0 ? "+" : "";
    return sign + new Intl.NumberFormat('vi-VN').format(num) + " ₫";
}

function formatShorthandCurrency(num, isSigned = false) {
    if (num === 0) return "0đ";
    const absNum = Math.round(Math.abs(num));
    let formatted = "";

    if (absNum >= 1000000) {
        const tr = Math.floor(absNum / 1000000);
        const k = Math.floor((absNum % 1000000) / 1000);
        formatted = k > 0 ? `${tr}tr${k}k` : `${tr}tr`;
    } else if (absNum >= 1000) {
        formatted = Math.floor(absNum / 1000) + "k";
    } else {
        return isSigned ? formatSignedMoneyStr(num) : formatCurrency(num);
    }

    if (isSigned) {
        return (num > 0 ? "+" : "-") + formatted;
    } else if (num < 0) {
        return "-" + formatted;
    }
    return formatted;
}

// Global expose
window.getRole = getRole;
window.getToken = getToken;
window.getTodayStr = getTodayStr;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.parseMoney = parseMoney;
window.formatSignedMoneyStr = formatSignedMoneyStr;
window.formatShorthandCurrency = formatShorthandCurrency;

document.addEventListener("DOMContentLoaded", () => {
    // 0. Internal Access Control (Server-side validation)
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const appContainer = document.querySelector(".app-container");
    const usernameInput = document.getElementById("admin-username");
    const passwordInput = document.getElementById("admin-password");
    const loginError = document.getElementById("login-error");
    const togglePasswordBtn = document.getElementById("toggle-password-btn");
    const chatbotContainer = document.getElementById("chatbot-container");

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";

            // Switch icon and state
            const icon = togglePasswordBtn.querySelector("i");
            if (isPassword) {
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
                togglePasswordBtn.classList.add("active");
                togglePasswordBtn.title = "Ẩn mật khẩu";
            } else {
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
                togglePasswordBtn.classList.remove("active");
                togglePasswordBtn.title = "Hiện mật khẩu";
            }
        });
    }

    // Safety check for CONFIG
    if (typeof CONFIG === 'undefined') {
        console.error("CRITICAL: config.js is missing or failed to load!");
        window.CONFIG = { WEB_APP_URL: "NOT_CONFIGURED", USERS: {} };
    }

    // Utilities moved to global scope above
    const updateUserProfile = () => {
        const name = getUserName() || "Người dùng";
        const role = getRole();
        const displayNameEl = document.getElementById("user-display-name");
        const avatarEl = document.getElementById("user-avatar");
        const roleBadgeEl = document.getElementById("user-role-badge");

        if (displayNameEl) displayNameEl.innerText = name;
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;

        if (roleBadgeEl) {
            roleBadgeEl.className = 'role-badge'; // reset
            if (role === 'ADMIN') {
                roleBadgeEl.innerText = 'ADMIN';
                roleBadgeEl.classList.add('admin');
                roleBadgeEl.style.background = 'rgba(99, 102, 241, 0.1)';
                roleBadgeEl.style.color = '#6366f1';
            } else if (role === 'EMP_LV1') {
                roleBadgeEl.innerText = 'Bậc 1';
                roleBadgeEl.classList.add('emp1');
                roleBadgeEl.style.background = 'rgba(16, 185, 129, 0.1)';
                roleBadgeEl.style.color = '#10b981';
            } else if (role === 'EMP_LV2') {
                roleBadgeEl.innerText = 'Bậc 2';
                roleBadgeEl.classList.add('emp2');
                roleBadgeEl.style.background = 'rgba(245, 158, 11, 0.1)';
                roleBadgeEl.style.color = '#f59e0b';
            } else {
                roleBadgeEl.innerText = 'Guest';
                roleBadgeEl.style.background = 'rgba(148, 163, 184, 0.1)';
                roleBadgeEl.style.color = '#64748b';
            }
        }
    };

    // Auto-update on load
    updateUserProfile();

    // User Profile Dropdown Logic
    const userTrigger = document.getElementById("user-avatar-trigger");
    const userDropdown = document.getElementById("user-dropdown");
    if (userTrigger && userDropdown) {
        userTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("active");
            
            const notifDropdown = document.getElementById("admin-notifications-dropdown");
            if (notifDropdown) notifDropdown.style.display = "none";
        });

        document.addEventListener("click", () => {
            userDropdown.classList.remove("active");
        });
    }

    // ── STACKED NOTIFICATIONS PANEL ────────────────────────────────
    const notifBtn      = document.getElementById("admin-notifications-btn");
    const notifDropdown = document.getElementById("admin-notifications-dropdown");
    const refreshBtn    = document.getElementById("btn-refresh-requests");
    const markAllBtn    = document.getElementById("btn-notif-mark-all");

    // In-memory notification store  { id, category, icon, label, text, time, unread }
    let notificationsStore = [];
    let activeTab = "all";

    // ── Toggle panel open/close ──
    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = notifDropdown.style.display === "flex";
            notifDropdown.style.display = isOpen ? "none" : "flex";
            notifDropdown.style.flexDirection = "column";
            if (!isOpen) loadAllNotifications();
            if (userDropdown) userDropdown.classList.remove("active");
        });

        document.addEventListener("click", (e) => {
            if (!notifDropdown.contains(e.target) && e.target !== notifBtn && !notifBtn.contains(e.target)) {
                notifDropdown.style.display = "none";
            }
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            loadAllNotifications();
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notificationsStore.forEach(n => n.unread = false);
            renderNotifications();
            updateNotifBadges();
        });
    }

    // ── Tab switching ──
    const notifTabBtns = document.querySelectorAll(".notif-tab-btn");
    notifTabBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            activeTab = btn.dataset.tab;
            notifTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderNotifications();
        });
    });

    // ── Load all notifications (pending users + placeholder system notifs) ──
    async function loadAllNotifications() {
        const list = document.getElementById("admin-requests-list");
        if (list) list.innerHTML = `<div class="notif-empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Đang tải...</p></div>`;

        // Reset store but keep any previously synthesized non-task notifs
        notificationsStore = notificationsStore.filter(n => n.category !== "task");

        // --- Load pending user requests → task category ---
        if (!isConfigured()) {
            const customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
            const pending = [];
            for (let k in customUsers) {
                if (customUsers[k] && customUsers[k].status === "PENDING") pending.push(customUsers[k]);
            }
            injectTaskNotifications(pending);
        } else {
            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "get_pending_users", token: getToken() }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status === "success" && result.pending) {
                    injectTaskNotifications(result.pending);
                }
            } catch (e) {
                console.warn("Failed to load pending users for notifications:", e);
            }
        }

        renderNotifications();
        updateNotifBadges();
    }

    // ── Build task-category notifications from BOTH pending users AND todo reminders ──
    function injectTaskNotifications(pendingUsers) {
        const existingIds = new Set(notificationsStore.filter(n => n.category === "task").map(n => n.id));

        // 1. Pending account-approval cards (for ADMIN)
        pendingUsers.forEach(req => {
            const id = "task_user_" + req.username;
            if (!existingIds.has(id)) {
                notificationsStore.push({
                    id,
                    category: "task",
                    icon: "fa-solid fa-user-clock",
                    label: "Phê duyệt tài khoản",
                    text: `Yêu cầu đăng ký của <strong>${req.username}</strong> (${req.name}) đang chờ phê duyệt.`,
                    time: "Vừa xong",
                    unread: true,
                    username: req.username
                });
            }
        });

        // 2. Pull from todoCache (the global from todo_v2.js)
        if (typeof todoCache === "undefined" || !Array.isArray(todoCache)) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const priorityIcon = {
            "Khẩn cấp": "fa-solid fa-fire",
            "Cao":       "fa-solid fa-circle-exclamation",
            "Trung bình":"fa-solid fa-circle-dot",
            "Thấp":      "fa-regular fa-circle"
        };
        const priorityLabel = {
            "Khẩn cấp": "🔴 Khẩn cấp",
            "Cao":       "🟠 Ưu tiên cao",
            "Trung bình":"🟡 Trung bình",
            "Thấp":      "⚪ Thấp"
        };

        function parseDate(d) {
            if (!d) return null;
            if (d instanceof Date) return d;
            const p = String(d).split(/[-/]/);
            if (p.length === 3) {
                const y = parseInt(p[0]), m = parseInt(p[1]) - 1, day = parseInt(p[2]);
                if (!isNaN(y) && !isNaN(m) && !isNaN(day)) return new Date(y, m, day);
            }
            return new Date(d);
        }

        function daysDiff(dl) {
            return Math.round((dl.getTime() - today.getTime()) / 86400000);
        }

        // Priority sort weight
        const pw = { "Khẩn cấp": 1, "Cao": 2, "Trung bình": 3, "Thấp": 4 };

        // Gather tasks by urgency bucket
        const overdueList   = [];
        const todayList     = [];
        const upcomingList  = []; // 1–3 days
        const inProgressList = [];

        todoCache.forEach(t => {
            const isDone = t.status === "Hoàn thành" || t.status === "Hủy bỏ";
            if (isDone) return;

            const dl = parseDate(t.deadlineDate || t.deadline);
            const diff = dl ? daysDiff(dl) : null;

            if (dl && diff < 0)      overdueList.push({ ...t, _diff: diff });
            else if (dl && diff === 0) todayList.push({ ...t, _diff: 0 });
            else if (dl && diff > 0 && diff <= 3) upcomingList.push({ ...t, _diff: diff });

            if (t.status === "Đang thực hiện") inProgressList.push({ ...t, _diff: diff });
        });

        // Sort each list by priority then deadline
        const sortTasks = arr => arr.sort((a, b) =>
            (pw[a.priority] || 9) - (pw[b.priority] || 9) || (a._diff ?? 99) - (b._diff ?? 99)
        );

        // ── Overdue tasks ──
        sortTasks(overdueList).forEach(t => {
            const id = "task_overdue_" + t.id;
            if (existingIds.has(id)) return;
            const days = Math.abs(t._diff);
            notificationsStore.push({
                id, category: "task",
                icon: "fa-solid fa-triangle-exclamation",
                label: `Trễ hạn — ${priorityLabel[t.priority] || t.priority}`,
                text: `<strong>${t.task}</strong> đã quá hạn <strong>${days} ngày</strong>${t.category ? ` · ${t.category}` : ""}.`,
                time: `Hạn: ${t.deadline || "?"}`,
                unread: true, priority: t.priority
            });
        });

        // ── Today's tasks ──
        sortTasks(todayList).forEach(t => {
            const id = "task_today_" + t.id;
            if (existingIds.has(id)) return;
            notificationsStore.push({
                id, category: "task",
                icon: priorityIcon[t.priority] || "fa-solid fa-calendar-day",
                label: `Hôm nay — ${priorityLabel[t.priority] || t.priority}`,
                text: `<strong>${t.task}</strong> đến hạn hôm nay${t.note ? `<br><span style="color:#94a3b8;font-size:0.75rem">${t.note}</span>` : ""}.`,
                time: `Trạng thái: ${t.status}`,
                unread: true, priority: t.priority
            });
        });

        // ── Upcoming 1–3 days ──
        sortTasks(upcomingList).forEach(t => {
            const id = "task_upcoming_" + t.id;
            if (existingIds.has(id)) return;
            // Skip if already listed as today
            if (todayList.some(x => x.id === t.id)) return;
            notificationsStore.push({
                id, category: "task",
                icon: "fa-solid fa-clock",
                label: `Sắp đến hạn — ${priorityLabel[t.priority] || t.priority}`,
                text: `<strong>${t.task}</strong> còn <strong>${t._diff} ngày</strong> nữa đến hạn${t.category ? ` · ${t.category}` : ""}.`,
                time: `Hạn: ${t.deadline}`,
                unread: t.priority === "Khẩn cấp" || t.priority === "Cao",
                priority: t.priority
            });
        });

        // ── In-progress (not yet captured above) ──
        sortTasks(inProgressList).slice(0, 5).forEach(t => {
            // only inject if not already covered by today/overdue/upcoming
            const alreadyCovered =
                overdueList.some(x => x.id === t.id) ||
                todayList.some(x => x.id === t.id)   ||
                upcomingList.some(x => x.id === t.id);
            if (alreadyCovered) return;
            const id = "task_inprogress_" + t.id;
            if (existingIds.has(id)) return;
            notificationsStore.push({
                id, category: "task",
                icon: "fa-solid fa-spinner",
                label: "Đang thực hiện",
                text: `<strong>${t.task}</strong>${t.category ? ` · ${t.category}` : ""}${t._diff !== null && t._diff !== undefined ? ` · còn ${t._diff} ngày` : ""}.`,
                time: t.deadline ? `Hạn: ${t.deadline}` : "Không có hạn",
                unread: false, priority: t.priority
            });
        });
    }


    // ── Render cards for current active tab ──
    function renderNotifications() {
        const list = document.getElementById("admin-requests-list");
        if (!list) return;

        const filtered = activeTab === "all"
            ? notificationsStore
            : notificationsStore.filter(n => n.category === activeTab);

        if (filtered.length === 0) {
            const labels = { all: "thông báo", payment: "thanh toán", entry: "nhập đơn", task: "công việc" };
            list.innerHTML = `
                <div class="notif-empty-state">
                    <i class="fa-regular fa-bell-slash"></i>
                    <p>Không có ${labels[activeTab] || "thông báo"} nào.</p>
                </div>`;
            return;
        }

        const categoryMeta = {
            payment: { icon: "fa-solid fa-money-bill-transfer", label: "Thanh toán" },
            entry:   { icon: "fa-solid fa-file-circle-plus",   label: "Nhập đơn" },
            task:    { icon: "fa-solid fa-list-check",          label: "Công việc" }
        };

        // Urgency subtype derived from notification id prefix
        function getTaskSubtype(id) {
            if (id.startsWith("task_overdue_"))    return "overdue";
            if (id.startsWith("task_today_"))      return "today";
            if (id.startsWith("task_upcoming_"))   return "upcoming";
            if (id.startsWith("task_inprogress_")) return "inprogress";
            if (id.startsWith("task_user_"))       return "approval";
            return "";
        }

        // Helper: extract todo task id from notification id
        function extractTaskId(notifId) {
            const prefixes = ["task_overdue_", "task_today_", "task_upcoming_", "task_inprogress_"];
            for (const p of prefixes) {
                if (notifId.startsWith(p)) return notifId.slice(p.length);
            }
            return null;
        }

        list.innerHTML = filtered.map(n => {
            const meta = categoryMeta[n.category] || {};
            const unreadClass = n.unread ? "unread" : "";
            const subtype = n.category === "task" ? getTaskSubtype(n.id) : "";
            const subtypeClass = subtype ? `task-${subtype}` : "";
            const taskId = n.category === "task" ? extractTaskId(n.id) : null;
            // clickable class for cursor + hover-lift if it has a linked task
            const clickableClass = taskId ? "notif-card-clickable" : "";

            const actionBtns = (n.category === "task" && n.username) ? `
                <div class="notif-card-actions">
                    <button class="btn-notif-approve" onclick="event.stopPropagation(); approveUser('${n.username}'); this.closest('.notif-card').remove(); updateNotifBadgesGlobal();">
                        <i class="fa-solid fa-check"></i> Duyệt
                    </button>
                    <button class="btn-notif-reject" onclick="event.stopPropagation(); rejectUser('${n.username}'); this.closest('.notif-card').remove(); updateNotifBadgesGlobal();">
                        <i class="fa-solid fa-xmark"></i> Từ chối
                    </button>
                </div>` : "";

            const openHint = taskId
                ? `<span class="notif-open-hint"><i class="fa-solid fa-arrow-up-right-from-square"></i> Nhấn để mở</span>`
                : "";

            return `
                <div class="notif-card ${n.category} ${subtypeClass} ${unreadClass} ${clickableClass}" data-id="${n.id}" data-task-id="${taskId || ""}">
                    <div class="notif-card-icon">
                        <i class="${n.icon || meta.icon}"></i>
                    </div>
                    <div class="notif-card-body">
                        <div class="notif-card-label">
                            <i class="${n.icon || meta.icon}"></i> ${n.label || meta.label}
                        </div>
                        <p class="notif-card-text">${n.text}</p>
                        <span class="notif-card-time">${n.time}</span>
                        ${openHint}
                        ${actionBtns}
                    </div>
                </div>`;
        }).join("");

        // Click handler: mark as read + navigate to task if applicable
        list.querySelectorAll(".notif-card").forEach(card => {
            card.addEventListener("click", () => {
                const notifId = card.dataset.id;
                const taskId  = card.dataset.taskId;

                // Mark as read
                const notif = notificationsStore.find(n => n.id === notifId);
                if (notif) notif.unread = false;
                card.classList.remove("unread");
                updateNotifBadges();

                // Navigate to todo view and open edit modal
                if (taskId) {
                    // Close the notification dropdown
                    if (notifDropdown) notifDropdown.style.display = "none";

                    // Switch to todo view (calls renderFocus internally)
                    if (typeof window.switchView === "function") {
                        window.switchView("todo");
                    } else {
                        // Fallback: click menu-todo
                        const menuTodoBtn = document.getElementById("menu-todo");
                        if (menuTodoBtn) menuTodoBtn.click();
                    }

                    // Open edit modal after view transition settles
                    setTimeout(() => {
                        if (typeof window.editTask === "function") {
                            window.editTask(taskId);
                        }
                    }, 250);
                }
            });
        });

    }

    // ── Update all tab badge counts + main bell badge ──
    function updateNotifBadges() {
        const countEl = document.getElementById("admin-notifications-count");
        const counts = { all: 0, payment: 0, entry: 0, task: 0 };

        notificationsStore.forEach(n => {
            if (n.unread) {
                counts.all++;
                if (counts[n.category] !== undefined) counts[n.category]++;
            }
        });

        ["all", "payment", "entry", "task"].forEach(cat => {
            const badge = document.getElementById("badge-" + cat);
            if (badge) badge.textContent = counts[cat];
        });

        if (countEl) {
            if (counts.all > 0) {
                countEl.textContent = counts.all;
                countEl.style.display = "flex";
            } else {
                countEl.style.display = "none";
            }
        }
    }

    // Expose globally so inline onclick handlers can call it
    window.updateNotifBadgesGlobal = () => {
        notificationsStore = notificationsStore.filter(n => {
            // re-check if removed via approve/reject
            return document.querySelector(`[data-id="${n.id}"]`) !== null || true;
        });
        updateNotifBadges();
        renderNotifications();
    };

    async function fetchSystemConfig() {

        if (!isConfigured()) return;
        try {
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "get_config", token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();
            if (result.status === "success" && result.config) {
                sessionStorage.setItem("system-config", JSON.stringify(result.config));
                Object.assign(CONFIG, result.config);
                const role = getRole();
                if (role) applyRolePermissions(role);
            }
        } catch (e) {
            console.warn("Failed to fetch dynamic configuration:", e);
        }
    }

    function hasPermission(permissionName) {
        const role = getRole();
        if (!role) return false;
        if (role === 'ADMIN') return true;
        
        if (CONFIG.role_permissions) {
            try {
                const perms = typeof CONFIG.role_permissions === 'string' 
                    ? JSON.parse(CONFIG.role_permissions) 
                    : CONFIG.role_permissions;
                    
                if (perms[role]) {
                    if (perms[role] === '*') return true;
                    if (Array.isArray(perms[role])) {
                        return perms[role].includes(permissionName);
                    }
                }
            } catch (e) {
                console.error("Error parsing role_permissions config:", e);
            }
        }
        
        // Fallback default permissions
        if (role === 'EMP_LV1') {
            return ['sync', 'entry', 'delete', 'debt', 'chatbot', 'formulas'].includes(permissionName);
        }
        if (role === 'EMP_LV2') {
            return ['sync', 'chatbot', 'formulas'].includes(permissionName);
        }
        return false;
    }
    window.hasPermission = hasPermission;


    async function approveUser(username) {
        if (!confirm(`Bạn có chắc chắn muốn DUYỆT tài khoản "${username}" không?`)) return;
        
        if (!isConfigured()) {
            let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
            if (customUsers[username]) {
                customUsers[username].status = "ACTIVE";
                localStorage.setItem("custom_users", JSON.stringify(customUsers));
                showToast(`Đã duyệt tài khoản "${username}" thành công!`, "success");
                loadAllNotifications();
            }
            return;
        }
        
        try {
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "approve_user", username: username, approve: true, token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();
            if (result.status === "success") {
                showToast(`Đã duyệt tài khoản "${username}" thành công!`, "success");
                loadAllNotifications();
            } else {
                alert(result.message || "Lỗi phê duyệt tài khoản");
            }
        } catch (e) {
            alert("Lỗi kết nối máy chủ");
        }
    }

    async function rejectUser(username) {
        if (!confirm(`Bạn có chắc chắn muốn TỪ CHỐI/XÓA yêu cầu của "${username}" không?`)) return;
        
        if (!isConfigured()) {
            let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
            if (customUsers[username]) {
                delete customUsers[username];
                localStorage.setItem("custom_users", JSON.stringify(customUsers));
                showToast(`Đã từ chối/xóa tài khoản "${username}"!`, "warning");
                loadAllNotifications();
            }
            return;
        }
        
        try {
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "approve_user", username: username, approve: false, token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();
            if (result.status === "success") {
                showToast(`Đã từ chối yêu cầu của "${username}"!`, "warning");
                loadAllNotifications();
            } else {
                alert(result.message || "Lỗi từ chối tài khoản");
            }
        } catch (e) {
            alert("Lỗi kết nối máy chủ");
        }
    }

    window.approveUser = approveUser;
    window.rejectUser = rejectUser;

    const checkAuth = () => {
        const role = getRole();
        if (role) {
            loginOverlay.style.display = "none";
            appContainer.style.display = "flex";
            if (chatbotContainer) chatbotContainer.style.display = "flex";
            
            try {
                const cachedConfig = sessionStorage.getItem("system-config");
                if (cachedConfig) {
                    Object.assign(CONFIG, JSON.parse(cachedConfig));
                }
            } catch (e) {}
            
            applyRolePermissions(role);
            updateUserProfile();
            fetchSystemConfig();
            
            const notifWrapper = document.getElementById("admin-notifications-wrapper");
            if (notifWrapper) {
                // Show bell for all roles — todos show for everyone, pending approvals only come back for ADMIN
                notifWrapper.style.display = "flex";
                // Delay so todoCache has time to load from localStorage
                setTimeout(() => loadAllNotifications(), 800);
            }
            return true;
        }
        return false;
    };

    function applyRolePermissions(role) {
        const syncBtn = document.getElementById('sync-gsheet-btn');
        const entryCard = document.querySelector('.card:has(#dataEntryForm)');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const debtActionBox = document.querySelector('.invoice-footer-actions');
        const btnAddInv = document.getElementById('btn-add-investment');
        const menuInvestment = document.getElementById('menu-investment');
        const mobileInvestment = document.querySelector('.mobile-nav-item[data-view="investment"]');

        if (syncBtn) syncBtn.style.display = hasPermission('sync') ? '' : 'none';
        if (entryCard) entryCard.style.display = hasPermission('entry') ? '' : 'none';
        // Không tự hiện bulk-delete-btn ở đây — updateBulkDeleteUI quản lý việc hiện/ẩn
        // Chỉ ẩn hẳn nếu không có quyền delete
        if (bulkDeleteBtn) {
            if (!hasPermission('delete')) {
                bulkDeleteBtn.style.display = 'none';
                bulkDeleteBtn.dataset.noPermission = 'true';
            } else {
                bulkDeleteBtn.dataset.noPermission = 'false';
                // Giữ ẩn — updateBulkDeleteUI sẽ hiện khi có hàng được chọn
            }
        }
        if (debtActionBox) debtActionBox.style.display = hasPermission('debt') ? '' : 'none';
        if (menuInvestment) menuInvestment.style.display = hasPermission('investment') ? '' : 'none';
        if (mobileInvestment) mobileInvestment.style.display = hasPermission('investment') ? '' : 'none';
    }

    const canMutate = () => {
        return hasPermission('entry');
    };

    const isAuthorizedForSync = () => hasPermission('sync');
    const isAuthorizedForEntry = () => hasPermission('entry');
    const isAuthorizedForDebt = () => hasPermission('debt');

    // AUTO-SYNC DATA ON STARTUP
    if (checkAuth()) {
        setTimeout(() => {
            if (typeof syncData === 'function') {
                console.log("Startup: Auto-fetching farm data...");
                syncData();
            }
            if (typeof renderFocusView === 'function') {
                renderFocusView();
            }
        }, 1000);
    }

    // CHECK LOGIN LOCK
    const checkLoginBlock = () => {
        const blockUntil = localStorage.getItem("login-block-until");
        if (blockUntil) {
            const remaining = parseInt(blockUntil) - Date.now();
            if (remaining > 0) {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;
                if (usernameInput) usernameInput.disabled = true;
                if (passwordInput) passwordInput.disabled = true;
                if (loginError) {
                    loginError.style.display = "block";
                    const minutes = Math.floor(remaining / 60000);
                    const seconds = Math.ceil((remaining % 60000) / 1000);
                    loginError.innerText = `Bạn đã nhập sai quá 5 lần. Thiết bị tạm khóa. Thử lại sau ${minutes} phút ${seconds} giây.`;
                }
                setTimeout(checkLoginBlock, 1000);
                return true;
            } else {
                localStorage.removeItem("login-block-until");
                localStorage.setItem("failed-login-attempts", "0");
                if (usernameInput) usernameInput.disabled = false;
                if (passwordInput) passwordInput.disabled = false;
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = false;
                if (loginError) {
                    loginError.style.display = "none";
                    loginError.innerText = "";
                }
            }
        }
        return false;
    };

    // Registration Toggle Logic
    const loginCard = document.getElementById("login-card");
    const registerCard = document.getElementById("register-card");
    const goToRegisterBtn = document.getElementById("go-to-register");
    const goToLoginBtn = document.getElementById("go-to-login");
    const registerForm = document.getElementById("register-form");
    const registerErrorMsg = document.getElementById("register-error");
    const registerSuccessMsg = document.getElementById("register-success");

    if (goToRegisterBtn && loginCard && registerCard) {
        goToRegisterBtn.addEventListener("click", (e) => {
            e.preventDefault();
            loginCard.style.display = "none";
            registerCard.style.display = "block";
            if (registerErrorMsg) registerErrorMsg.style.display = "none";
            if (registerSuccessMsg) registerSuccessMsg.style.display = "none";
        });
    }

    if (goToLoginBtn && loginCard && registerCard) {
        goToLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            registerCard.style.display = "none";
            loginCard.style.display = "block";
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("register-username").value.trim();
            const name = document.getElementById("register-name").value.trim();
            const password = document.getElementById("register-password").value;
            const role = document.getElementById("register-role").value;
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
            submitBtn.disabled = true;
            
            if (registerErrorMsg) registerErrorMsg.style.display = "none";
            if (registerSuccessMsg) registerSuccessMsg.style.display = "none";
            
            if (!isConfigured()) {
                try {
                    let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                    if (customUsers[username]) {
                        throw new Error("Tài khoản đã tồn tại ngoại tuyến!");
                    }
                    customUsers[username] = {
                        name: name,
                        role: role,
                        username: username,
                        password: password,
                        status: "PENDING"
                    };
                    localStorage.setItem("custom_users", JSON.stringify(customUsers));
                    if (registerSuccessMsg) {
                        registerSuccessMsg.innerText = "Đã gửi yêu cầu đăng ký (Ngoại tuyến). Vui lòng đợi Admin phê duyệt!";
                        registerSuccessMsg.style.display = "block";
                        registerForm.reset();
                    }
                } catch(err) {
                    if (registerErrorMsg) {
                        registerErrorMsg.innerText = err.message;
                        registerErrorMsg.style.display = "block";
                    }
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                }
                return;
            }
            
            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "register",
                        username: username,
                        name: name,
                        password: password,
                        role: role
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                
                const result = await response.json();
                if (result.status === "success") {
                    if (registerSuccessMsg) {
                        registerSuccessMsg.innerText = result.message || "Đăng ký thành công!";
                        registerSuccessMsg.style.display = "block";
                        registerForm.reset();
                    }
                } else {
                    if (registerErrorMsg) {
                        registerErrorMsg.innerText = result.message || "Đã xảy ra lỗi!";
                        registerErrorMsg.style.display = "block";
                    }
                }
            } catch (err) {
                if (registerErrorMsg) {
                    registerErrorMsg.innerText = "Lỗi kết nối server!";
                    registerErrorMsg.style.display = "block";
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        });
    }

    if (!checkAuth()) {
        checkLoginBlock();

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (checkLoginBlock()) return;

            const user = usernameInput ? usernameInput.value.trim() : "";
            const pw = passwordInput.value;
            if (!user || !pw) return;

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            const originalText = submitBtn.innerText;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
            submitBtn.disabled = true;

            // Offline/Local Auth Fallback if WEB_APP_URL is not configured
            if (!isConfigured()) {
                const customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                const defaultUsers = (typeof CONFIG !== 'undefined' && CONFIG.USERS && Object.keys(CONFIG.USERS).length > 0) ? CONFIG.USERS : {
                    "admin": { name: "Huy Trần", role: "ADMIN", password: "huytran97" },
                    "emp1": { name: "Nhân viên 1", role: "EMP_LV1", password: "nth66" },
                    "emp2": { name: "Nhân viên 2", role: "EMP_LV2", password: "haitran63" }
                };
                
                let userConfig = null;
                
                // 1. Check in customUsers by username (dynamic offline users)
                if (customUsers[user] && customUsers[user].password === pw) {
                    userConfig = customUsers[user];
                }
                
                // 2. Check in defaultUsers (config.js users)
                if (!userConfig) {
                    const defaultUser = defaultUsers[user];
                    if (defaultUser && defaultUser.password === pw) {
                        userConfig = {
                            role: defaultUser.role,
                            name: defaultUser.name,
                            username: user,
                            password: pw
                        };
                    }
                }
                
                // 3. Fallback check by matching username within customUsers (legacy compatibility)
                if (!userConfig) {
                    for (const key in customUsers) {
                        const uObj = customUsers[key];
                        if (uObj && uObj.username === user && uObj.password === pw) {
                            userConfig = uObj;
                            break;
                        }
                    }
                }
                
                if (userConfig) {
                    localStorage.setItem("failed-login-attempts", "0");
                    localStorage.removeItem("login-block-until");
                    sessionStorage.setItem("user-role", userConfig.role);
                    sessionStorage.setItem("user-name", userConfig.name);
                    sessionStorage.setItem("user-token", userConfig.username + ":" + userConfig.password); // Use username:password as token
 
                    loginOverlay.style.display = "none";
                    appContainer.style.display = "flex";
                    if (chatbotContainer) chatbotContainer.style.display = "flex";
                    applyRolePermissions(userConfig.role);
                    updateUserProfile();
                    if (typeof initDashboard === "function") initDashboard();
                    setTimeout(() => location.reload(), 500);
                    return;
                } else {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                    let attempts = parseInt(localStorage.getItem("failed-login-attempts") || "0") + 1;
                    localStorage.setItem("failed-login-attempts", attempts);
                    if (attempts >= 5) {
                        const blockTime = Date.now() + 15 * 60 * 1000;
                        localStorage.setItem("login-block-until", blockTime.toString());
                        checkLoginBlock();
                    } else {
                        loginError.style.display = "block";
                        loginError.innerText = `Tên đăng nhập hoặc mật khẩu không đúng! (Còn ${5 - attempts} lần thử)`;
                        passwordInput.value = "";
                        passwordInput.focus();
                    }
                    return;
                }
            }

            try {
                // Gửi mật khẩu lên Apps Script để kiểm tra
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "login", username: user, password: pw }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();

                if (result.status === "success") {
                    localStorage.setItem("failed-login-attempts", "0");
                    localStorage.removeItem("login-block-until");

                    const userName = result.userName || "Người dùng";

                    sessionStorage.setItem("user-role", result.role);
                    sessionStorage.setItem("user-name", userName);
                    sessionStorage.setItem("user-token", result.userLogin + ":" + pw); // Dùng username:password làm token

                    // Cache credentials in local storage for offline fallback use
                    try {
                        const customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                        customUsers[result.userLogin] = {
                            name: userName,
                            role: result.role,
                            username: result.userLogin,
                            password: pw
                        };
                        localStorage.setItem("custom_users", JSON.stringify(customUsers));
                    } catch (e) {
                        console.error("Failed to cache credentials for offline use:", e);
                    }

                    loginOverlay.style.display = "none";
                    appContainer.style.display = "flex";
                    if (chatbotContainer) chatbotContainer.style.display = "flex";
                    applyRolePermissions(result.role);
                    updateUserProfile();

                    if (typeof initDashboard === "function") initDashboard();

                    // Thông báo thành công mượt mà
                    setTimeout(() => location.reload(), 500);
                } else {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;

                    let attempts = parseInt(localStorage.getItem("failed-login-attempts") || "0") + 1;
                    localStorage.setItem("failed-login-attempts", attempts);

                    if (attempts >= 5) {
                        const blockTime = Date.now() + 15 * 60 * 1000; // block for 15 minutes
                        localStorage.setItem("login-block-until", blockTime.toString());
                        checkLoginBlock();
                    } else {
                        loginError.style.display = "block";
                        loginError.innerText = (result.message || "Tên đăng nhập hoặc mật khẩu không đúng!") + ` (Còn ${5 - attempts} lần thử)`;
                        passwordInput.value = "";
                        passwordInput.focus();
                    }
                }
            } catch (err) {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                console.error(err);
                alert("Lỗi kết nối Server! Vui lòng kiểm tra lại Google Apps Script.");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("user-role");
            sessionStorage.removeItem("user-name");
            sessionStorage.removeItem("user-token");
            location.reload();
        });
    }

    // 1. Data Initialization & Utility Functions
    let farmData = window.farmData || [];
    window.getFarmData = () => farmData;
    let sortState = { column: 'Ngày', direction: 'desc' };
    let currentTableTab = 'today';
    let currentLimit = 20;
    let dataToRenderRef = []; // module-level ref for deleteRowByIndex
    let annualQtyChartInstance = null;
    let annualRevProfitChartInstance = null;
    let annualExpenseChartInstance = null;
    let monthlyCombinedChartInstance = null;
    let financialGrowthChartInstance = null;
    let expenseDistributionChartInstance = null;
    let cashflowExpenseChartInstance = null;
    let currentCashflowStatement = null;
    let currentEditRowData = null; // Track row being edited
    let activeTypeInput = null; // Track currently focused flower type input

    // Convert Excel Serial Date to JS Date Object
    function excelToJsDate(serial) {
        if (!serial) return new Date();
        const epoch = new Date(1899, 11, 30);
        const days = serial;
        return new Date(epoch.getTime() + days * 86400000);
    }

    // Convert JS Date to DD/MM/YYYY format
    function formatDateVietnamese(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    // Convert JS Date to YYYY-MM-DD for HTML inputs
    function formatDateInput(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${yyyy}-${mm}-${dd}`; // Phải để YYYY-MM-DD cho ô Input
    }

    function formatDateVN(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    function getTodayStr() {
        return formatDateVN(new Date());
    }

    // Utilities moved to global scope above
    function updateBuyerSuggestions(data) {
        if (!data || !Array.isArray(data) || data.length === 0) return;

        // Cố gắng tìm tên khách hàng từ tất cả các biến thể tên cột có thể có
        const buyers = data
            .map(row => {
                // Kiểm tra tất cả các kiểu đặt tên phổ biến (bao gồm cả Người Mua viết hoa)
                const name = row["Người Mua"] || row["Người mua"] || row["Khách Hàng"] || row["Khách hàng"] || row["Khách"];
                return name ? String(name).trim() : null;
            })
            .filter(name => name && name !== "" && name !== "Nông Trại" && name !== "undefined" && name !== "null")
            .reverse();

        // Lấy 10 tên khách hàng duy nhất (tăng lên 10 để bạn có nhiều lựa chọn hơn)
        const uniqueRecentBuyers = [];
        for (const name of buyers) {
            if (!uniqueRecentBuyers.includes(name)) {
                uniqueRecentBuyers.push(name);
            }
            if (uniqueRecentBuyers.length >= 10) break;
        }

        const datalist = document.getElementById('buyer-suggestions');
        if (datalist) {
            datalist.innerHTML = uniqueRecentBuyers
                .map(name => `<option value="${name}"></option>`)
                .join('');
        }
    }

    // Process initial data: normalize dates
    farmData = farmData.map(item => {
        return {
            ...item,
            parsedDate: excelToJsDate(item["Ngày"]),
            "Status": (item["Status"] && item["Status"].trim() !== "") ? item["Status"].trim() : "Chưa Xong"
        };
    });

    updateBuyerSuggestions(farmData); // Call on startup

    // 2. DOM Elements
    const tableBody = document.getElementById('table-body');
    const searchBuyerInput = document.getElementById('search-buyer');
    const filterStatusSelect = document.getElementById('transaction-filter-status');
    const headers = document.querySelectorAll('th[data-sort]');

    const form = document.getElementById('dataEntryForm');
    const qtyInput = document.getElementById('qty-input');
    const priceInput = document.getElementById('price-input');
    const revenueInput = document.getElementById('revenue-input');

    // Vua UI Elements
    const entryTypeSelect = document.getElementById('entry-type');
    const farmFields = document.getElementById('farm-fields');
    const vuaFields = document.getElementById('vua-fields');
    const labelBuyerInput = document.getElementById('label-buyer-input');
    const addFlowerBtn = document.getElementById('add-flower-btn');
    const flowerItemsContainer = document.getElementById('flower-items-container');
    const vuaShipCostInput = document.getElementById('vua-shipping-cost');
    const vuaVattuCostInput = document.getElementById('vua-vattu-cost');
    const vuaPackCostInput = document.getElementById('vua-packing-cost');
    const vuaTotalCostInput = document.getElementById('vua-total-cost');
    const vuaTotalCollectInput = document.getElementById('vua-total-collect');

    const expenseFields = document.getElementById('expense-fields');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseItemsContainer = document.getElementById('expense-items-container');


    // --- UTILS FOR MONEY INPUTS ---
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('money-input')) {
            const input = e.target;
            const originalValue = input.value;
            const selectionStart = input.selectionStart;

            // Đếm số lượng chữ số nằm trước con trỏ trước khi format
            const valBeforeCursor = originalValue.substring(0, selectionStart);
            const digitsBeforeCursor = valBeforeCursor.replace(/[^\d]/g, '').length;

            const val = parseMoney(originalValue);
            const formatted = val === 0 ? "0" : formatMoneyStr(val);

            input.value = formatted;

            // Định vị lại con trỏ chuột dựa vào số lượng chữ số đã đếm
            try {
                if (input.setSelectionRange) {
                    let newCursorPosition = 0;
                    let digitCount = 0;
                    for (let i = 0; i < formatted.length; i++) {
                        if (/\d/.test(formatted[i])) {
                            digitCount++;
                        }
                        newCursorPosition = i + 1;
                        if (digitCount === digitsBeforeCursor) {
                            break;
                        }
                    }
                    if (digitsBeforeCursor === 0) {
                        newCursorPosition = formatted.startsWith('0') ? 1 : 0;
                    }
                    input.setSelectionRange(newCursorPosition, newCursorPosition);
                }
            } catch (err) {
                console.warn("setSelectionRange error:", err);
            }
        }

        if (e.target.classList.contains('money-input-signed')) {
            const input = e.target;
            const originalValue = input.value.trim();
            const selectionStart = input.selectionStart;

            // Đếm chữ số và ký tự dấu (+/-) trước con trỏ
            const valBeforeCursor = originalValue.substring(0, selectionStart);
            const digitsBeforeCursor = valBeforeCursor.replace(/[^\d]/g, '').length;
            const hasSignBeforeCursor = valBeforeCursor.startsWith('+') || valBeforeCursor.startsWith('-');

            let sign = "";
            if (originalValue.startsWith('+')) sign = "+";
            else if (originalValue.startsWith('-')) sign = "-";

            const numStr = originalValue.replace(/[^\d]/g, '');
            const num = parseFloat(numStr) || 0;

            let formatted = "";
            if (numStr === "" && sign !== "") {
                formatted = sign;
            } else if (numStr === "" && sign === "") {
                formatted = "";
            } else {
                formatted = sign + new Intl.NumberFormat('vi-VN').format(num);
            }

            input.value = formatted;

            // Định vị lại con trỏ chuột
            try {
                if (input.setSelectionRange) {
                    let newCursorPosition = 0;
                    let digitCount = 0;
                    for (let i = 0; i < formatted.length; i++) {
                        if (/\d/.test(formatted[i])) {
                            digitCount++;
                        }
                        newCursorPosition = i + 1;
                        if (digitCount === digitsBeforeCursor) {
                            break;
                        }
                    }
                    if (hasSignBeforeCursor && newCursorPosition === 0) {
                        newCursorPosition = 1;
                    }
                    input.setSelectionRange(newCursorPosition, newCursorPosition);
                }
            } catch (err) {
                console.warn("setSelectionRange error:", err);
            }
        }
    });

    // --- GLOBAL KEYBOARD LISTENERS ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            let handled = false;

            // 1. Close Receipt Modal
            const receiptModal = document.getElementById('receipt-modal');
            if (receiptModal && (receiptModal.style.display === 'flex' || receiptModal.style.display === 'block')) {
                if (typeof window.closeReceipt === 'function') window.closeReceipt();
                else receiptModal.style.display = 'none';
                handled = true;
            }

            // 2. Close Partial Payment Modal
            if (!handled) {
                const partialPayModal = document.getElementById('modal-partial-pay');
                if (partialPayModal && (partialPayModal.style.display === 'flex' || partialPayModal.style.display === 'block')) {
                    partialPayModal.style.display = 'none';
                    handled = true;
                }
            }

            // 3. Close Cash Adjustment Modal
            if (!handled) {
                const adjustModal = document.getElementById('modal-adjust-cash');
                if (adjustModal && (adjustModal.style.display === 'flex' || adjustModal.style.display === 'block')) {
                    adjustModal.style.display = 'none';
                    handled = true;
                }
            }

            // 4. Close Todo Modal
            if (!handled) {
                const todoModal = document.getElementById('todo-modal');
                if (todoModal && (todoModal.style.display === 'flex' || todoModal.style.display === 'block')) {
                    todoModal.style.display = 'none';
                    handled = true;
                }
            }

            // 5. Back from Debt Detail View to Master List
            if (!handled) {
                const detailView = document.getElementById('debt-detail-view');
                if (detailView && detailView.style.display === 'block') {
                    const btnBack = document.getElementById('btn-back-to-master');
                    if (btnBack) btnBack.click();
                    handled = true;
                }
            }
        }
    });

    // --- FORM UI LOGIC ---
    if (entryTypeSelect) {
        entryTypeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            if (form) {
                form.dataset.theme = type;
            }
            const buyerInput = document.getElementById('buyer-input');
            const statusInput = document.getElementById('status-input');
            const statusGroup = statusInput ? statusInput.closest('.form-group') : null;
            const buyerGroup = buyerInput ? buyerInput.closest('.form-group') : null;

            const flowerContainerBlock = document.querySelector('.span-full:has(#add-flower-btn)');
            const flowerListBlock = document.getElementById('flower-items-container');
            const flowerDivider = flowerListBlock ? flowerListBlock.nextElementSibling : null;
            const flowerPillsContainer = document.getElementById('flower-pills-container');

            const entryCard = document.querySelector('.entry-card');
            const entryTitle = entryCard ? entryCard.querySelector('h2') : null;
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

            const toggleFlowerReq = (isReq) => {
                if (flowerListBlock) {
                    flowerListBlock.querySelectorAll('input').forEach(i => i.required = isReq);
                }
            };
            const toggleExpenseReq = (isReq) => {
                if (expenseItemsContainer) {
                    expenseItemsContainer.querySelectorAll('input').forEach(i => i.required = isReq);
                }
            };

            if (type === "farm") {
                if (vuaFields) vuaFields.style.display = "none";
                if (expenseFields) expenseFields.style.display = "none";
                if (statusGroup) statusGroup.style.display = "block";
                if (buyerGroup) buyerGroup.style.display = "block";
                if (flowerContainerBlock) flowerContainerBlock.style.display = "flex";
                if (flowerListBlock) flowerListBlock.style.display = "flex";
                if (flowerDivider) flowerDivider.style.display = "block";
                if (flowerPillsContainer) flowerPillsContainer.style.display = "flex";
                if (labelBuyerInput) labelBuyerInput.innerText = "Khách Hàng (Tên Khách)";
                if (buyerInput) { buyerInput.value = ""; buyerInput.required = true; }
                if (vuaTotalCollectInput) vuaTotalCollectInput.required = false;
                toggleFlowerReq(true);
                toggleExpenseReq(false);

                // Premium visual styling
                if (entryCard) {
                    entryCard.style.borderTop = "6px solid #10b981";
                    entryCard.style.boxShadow = "0 20px 40px -15px rgba(16, 185, 129, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)";
                    entryCard.style.transition = "all 0.4s ease";
                }
                if (entryTitle) {
                    entryTitle.innerHTML = `<i class="fa-solid fa-seedling" style="color: #10b981; margin-right: 8px;"></i> Nhập Liệu Nhanh — Bán Buôn (Farm)`;
                }
                if (submitBtn) {
                    submitBtn.innerHTML = `<i class="fa-solid fa-leaf" style="margin-right: 6px;"></i> Lưu Dữ Liệu Farm`;
                    submitBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                    submitBtn.style.color = "#ffffff";
                    submitBtn.style.border = "none";
                    submitBtn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.25)";
                    submitBtn.style.transition = "all 0.3s ease";
                }
                if (entryTypeSelect) {
                    entryTypeSelect.style.background = "rgba(16, 185, 129, 0.15)";
                    entryTypeSelect.style.border = "1px solid #10b981";
                    entryTypeSelect.style.color = "#047857";
                    entryTypeSelect.style.transition = "all 0.3s ease";
                }
            } else if (type === "vua") {
                if (vuaFields) vuaFields.style.display = "grid";
                if (expenseFields) expenseFields.style.display = "none";
                if (statusGroup) statusGroup.style.display = "block";
                if (buyerGroup) buyerGroup.style.display = "block";
                if (flowerContainerBlock) flowerContainerBlock.style.display = "flex";
                if (flowerListBlock) flowerListBlock.style.display = "flex";
                if (flowerDivider) flowerDivider.style.display = "block";
                if (flowerPillsContainer) flowerPillsContainer.style.display = "flex";
                if (labelBuyerInput) labelBuyerInput.innerText = "Đối Soát Vựa (Tên Vựa)";
                if (buyerInput) { buyerInput.value = "Đoan CR"; buyerInput.required = true; }
                if (vuaTotalCollectInput) vuaTotalCollectInput.required = true;
                toggleFlowerReq(true);
                toggleExpenseReq(false);
                calculateVuaTotals();

                // Premium visual styling
                if (entryCard) {
                    entryCard.style.borderTop = "6px solid #3b82f6";
                    entryCard.style.boxShadow = "0 20px 40px -15px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)";
                    entryCard.style.transition = "all 0.4s ease";
                }
                if (entryTitle) {
                    entryTitle.innerHTML = `<i class="fa-solid fa-truck" style="color: #3b82f6; margin-right: 8px;"></i> Nhập Liệu Nhanh — Đối Soát Vựa`;
                }
                if (submitBtn) {
                    submitBtn.innerHTML = `<i class="fa-solid fa-calculator" style="margin-right: 6px;"></i> Nhập Lợi Nhuận Vựa`;
                    submitBtn.style.background = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
                    submitBtn.style.color = "#ffffff";
                    submitBtn.style.border = "none";
                    submitBtn.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.25)";
                    submitBtn.style.transition = "all 0.3s ease";
                }
                if (entryTypeSelect) {
                    entryTypeSelect.style.background = "rgba(59, 130, 246, 0.15)";
                    entryTypeSelect.style.border = "1px solid #3b82f6";
                    entryTypeSelect.style.color = "#1d4ed8";
                    entryTypeSelect.style.transition = "all 0.3s ease";
                }
            } else if (type === "expense") {
                if (vuaFields) vuaFields.style.display = "none";
                if (expenseFields) expenseFields.style.display = "flex";
                if (statusGroup) statusGroup.style.display = "none";
                if (buyerGroup) buyerGroup.style.display = "none";
                if (flowerContainerBlock) flowerContainerBlock.style.display = "none";
                if (flowerListBlock) flowerListBlock.style.display = "none";
                if (flowerDivider) flowerDivider.style.display = "none";
                if (flowerPillsContainer) flowerPillsContainer.style.display = "none";
                if (buyerInput) { buyerInput.value = ""; buyerInput.required = false; }
                if (vuaTotalCollectInput) vuaTotalCollectInput.required = false;
                toggleFlowerReq(false);
                toggleExpenseReq(true);

                // Premium visual styling
                if (entryCard) {
                    entryCard.style.borderTop = "6px solid #ef4444";
                    entryCard.style.boxShadow = "0 20px 40px -15px rgba(239, 68, 68, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)";
                    entryCard.style.transition = "all 0.4s ease";
                }
                if (entryTitle) {
                    entryTitle.innerHTML = `<i class="fa-solid fa-receipt" style="color: #ef4444; margin-right: 8px;"></i> Nhập Liệu Nhanh — Ghi Nhận Chi Phí`;
                }
                if (submitBtn) {
                    submitBtn.innerHTML = `<i class="fa-solid fa-save" style="margin-right: 6px;"></i> Ghi Nhận Chi Phí`;
                    submitBtn.style.background = "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)";
                    submitBtn.style.color = "#ffffff";
                    submitBtn.style.border = "none";
                    submitBtn.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.25)";
                    submitBtn.style.transition = "all 0.3s ease";
                }
                if (entryTypeSelect) {
                    entryTypeSelect.style.background = "rgba(239, 68, 68, 0.15)";
                    entryTypeSelect.style.border = "1px solid #ef4444";
                    entryTypeSelect.style.color = "#b91c1c";
                    entryTypeSelect.style.transition = "all 0.3s ease";
                }
            }

            // Auto-switch disabled to respect user's "Today" default tab
        });
    }

    function calculateVuaTotals() {
        let totalCost = 0;
        let totalSL = 0;
        let flowerNames = [];

        if (flowerItemsContainer) {
            flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const p = parseMoney(item.querySelector('.fw-price').value);
                const type = item.querySelector('.fw-type').value;

                totalCost += (q * p);
                totalSL += q;
                if (q > 0 && !flowerNames.includes(type)) flowerNames.push(type);
            });
        }

        // Update Dynamic Label for Giá vốn
        const labelTotalCost = document.getElementById('label-vua-total-cost');
        if (labelTotalCost) {
            const nameDisplay = flowerNames.length > 0 ? flowerNames.join(', ') : 'Bông';
            labelTotalCost.textContent = `💰 Giá vốn (${totalSL.toLocaleString('vi-VN')} ${nameDisplay})`;
        }

        if (vuaTotalCostInput) vuaTotalCostInput.value = formatCurrency(totalCost);

        const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
        const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");
        const packing = parseMoney(vuaPackCostInput ? vuaPackCostInput.value : "0");

        let totalCollect = totalCost + shipping + vattu + packing;

        if (vuaTotalCollectInput) {
            vuaTotalCollectInput.value = formatMoneyStr(totalCollect);
            calculateBundlesAndPrice(vuaTotalCollectInput.value);
        }
    }

    function calculateBundlesAndPrice(totalCollectStr) {
        let totalQty = 0;
        let sumCost = 0; // Cost of flowers
        if (flowerItemsContainer) {
            flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                totalQty += q;
                const p = parseMoney(item.querySelector('.fw-price').value);
                sumCost += (q * p);
            });
        }

        const totalBundles = totalQty / 50;
        const vuaTotalBundlesEl = document.getElementById('vua-total-bundles');
        if (vuaTotalBundlesEl) {
            vuaTotalBundlesEl.value = totalBundles > 0 ? parseFloat(totalBundles.toFixed(1)) : "0";
        }

        const vuaPricePerBundleEl = document.getElementById('vua-price-per-bundle');
        const suggestBox = document.getElementById('packing-suggest-box');
        const suggestBtn = document.getElementById('btn-apply-suggest');

        if (vuaPricePerBundleEl && totalBundles > 0) {
            const actualCollect = parseMoney(totalCollectStr);
            const pricePerBundle = actualCollect / totalBundles;
            vuaPricePerBundleEl.value = formatCurrency(pricePerBundle);

            // Suggest rounding to nearest 5000 (VND 5k) - e.g. 62->60, 63->65
            const roundedPrice = Math.round(pricePerBundle / 5000) * 5000;

            // Check if it's already perfectly rounded or diff is extremely small
            if (Math.abs(roundedPrice - pricePerBundle) < 100) {
                if (suggestBox) suggestBox.style.display = 'none';
            } else {
                const targetCollect = roundedPrice * totalBundles;
                const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
                const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");
                const newPacking = targetCollect - (sumCost + shipping + vattu);

                if (suggestBox && suggestBtn && newPacking >= 0) {
                    suggestBox.style.display = 'block';
                    suggestBtn.innerHTML = `💡 Gợi ý Lợi nhuận: ${formatCurrency(newPacking)} => Giá bó chẵn: ${formatCurrency(roundedPrice)}`;
                    suggestBtn.onclick = () => {
                        if (vuaPackCostInput) {
                            vuaPackCostInput.value = formatMoneyStr(newPacking);
                            calculateVuaTotals();
                        }
                    };
                } else if (suggestBox) {
                    suggestBox.style.display = 'none';
                }
            }
        } else {
            if (vuaPricePerBundleEl) vuaPricePerBundleEl.value = "0 ₫";
            if (suggestBox) suggestBox.style.display = 'none';
        }
    }

    function attachFlowerRowEvents(row) {
        const delBtn = row.querySelector('.del-flower-btn');
        const qtyInput = row.querySelector('.fw-qty');
        const typeInput = row.querySelector('.fw-type');
        const pInput = row.querySelector('.fw-price');
        const totalInput = row.querySelector('.fw-total');

        const updateRowTotal = () => {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseMoney(pInput.value);
            const total = qty * price;
            if (totalInput) totalInput.value = formatCurrency(total);
            calculateVuaTotals();
        };

        if (delBtn) {
            delBtn.addEventListener('click', () => {
                if (flowerItemsContainer.children.length > 1) {
                    row.remove();
                    calculateVuaTotals();
                } else {
                    alert('Phải có ít nhất 1 dòng Bông!');
                }
            });
        }

        if (qtyInput) qtyInput.addEventListener('input', updateRowTotal);
        if (pInput) pInput.addEventListener('input', updateRowTotal);

        // Keyboard navigation listeners
        if (qtyInput) {
            qtyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (pInput) pInput.focus();
                }
            });
        }

        if (typeInput) {
            typeInput.addEventListener('focus', () => {
                activeTypeInput = typeInput;
            });
            typeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (qtyInput) qtyInput.focus();
                }
            });
        }

        if (pInput) {
            pInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextRow = row.nextElementSibling;
                    if (nextRow && nextRow.classList.contains('flower-item')) {
                        const nextQty = nextRow.querySelector('.fw-qty');
                        if (nextQty) nextQty.focus();
                    } else {
                        if (addFlowerBtn) {
                            addFlowerBtn.click();
                            const newRow = flowerItemsContainer.lastElementChild;
                            if (newRow) {
                                const newQty = newRow.querySelector('.fw-qty');
                                if (newQty) {
                                    setTimeout(() => newQty.focus(), 10);
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    if (flowerItemsContainer) {
        attachFlowerRowEvents(flowerItemsContainer.querySelector('.flower-item'));
    }

    if (addFlowerBtn) {
        addFlowerBtn.addEventListener('click', () => {
            const item = document.createElement('div');
            item.className = 'flower-item';
            item.style.cssText = 'display: grid; grid-template-columns: 0.6fr 1.2fr 1.2fr 1.5fr 30px; gap: 10px; align-items: center;';
            item.innerHTML = `
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">SL</label>
                    <input type="number" placeholder="0" class="fw-qty" min="0" required>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Loại mặt hàng</label>
                    <input type="text" class="fw-type" list="flower-types" placeholder="Tên hoa..." required
                        style="width: 100%; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px;">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Đơn Giá</label>
                    <input type="text" placeholder="0" class="fw-price money-input" required>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Thành tiền</label>
                    <input type="text" placeholder="0" class="fw-total" readonly style="background: #f1f5f9; color: #0f172a; font-weight: 800; border: 1.5px solid #cbd5e1 !important;">
                </div>
                <button type="button" class="del-flower-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
            `;
            flowerItemsContainer.appendChild(item);
            attachFlowerRowEvents(item);
        });
    }

    // Flower pills quick select click handler
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('flower-pill-btn')) {
            e.preventDefault();
            const val = e.target.dataset.value;
            let targetInput = activeTypeInput;
            if (!targetInput || !document.body.contains(targetInput)) {
                const inputs = flowerItemsContainer ? flowerItemsContainer.querySelectorAll('.fw-type') : [];
                if (inputs.length > 0) {
                    targetInput = inputs[inputs.length - 1];
                }
            }
            if (targetInput) {
                targetInput.value = val;
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Auto focus nearest empty input in the same row (SL or Đơn giá)
                const row = targetInput.closest('.flower-item');
                if (row) {
                    const qtyInput = row.querySelector('.fw-qty');
                    const priceInput = row.querySelector('.fw-price');
                    if (qtyInput && (!qtyInput.value || qtyInput.value.trim() === '')) {
                        qtyInput.focus();
                    } else if (priceInput) {
                        priceInput.focus();
                    }
                }
            }
        }
    });

    if (vuaShipCostInput) vuaShipCostInput.addEventListener('input', calculateVuaTotals);
    if (vuaVattuCostInput) vuaVattuCostInput.addEventListener('input', calculateVuaTotals);
    if (vuaPackCostInput) vuaPackCostInput.addEventListener('input', calculateVuaTotals);
    if (vuaTotalCollectInput) vuaTotalCollectInput.addEventListener('input', () => {
        const userCollect = parseMoney(vuaTotalCollectInput.value);
        let sumCost = 0;
        flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
            const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
            const p = parseMoney(item.querySelector('.fw-price').value);
            sumCost += (q * p);
        });

        const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
        const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");

        // Auto update Packing Cost based on Total Collect changes
        const newPacking = userCollect - (sumCost + shipping + vattu);
        if (vuaPackCostInput) vuaPackCostInput.value = formatMoneyStr(Math.max(0, newPacking));

        calculateBundlesAndPrice(vuaTotalCollectInput.value);
    });


    // 3. Table Rendering Logic
    function renderTable(dataToRender) {
        dataToRenderRef = dataToRender; // expose to delete handler
        tableBody.innerHTML = '';

        // Cập nhật Header tiêu đề cột dựa trên Tab
        const thead = document.querySelector('#farm-data-table thead tr');
        if (thead) {
            if (currentTableTab === 'expense') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th>Phân Loại CP</th>
                    <th>Ghi Chú Chi Phí</th>
                    <th>Số tiền</th>
                    <th>Thao Tác</th>
                `;
            } else if (currentTableTab === 'vua') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Người Mua">Tên Vựa <i class="fa-solid fa-sort"></i></th>
                    <th>Phân Loại</th>
                    <th data-sort="Số lượng">SL <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Giá">Giá <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Chi Phí">Chi Phí <i class="fa-solid fa-sort"></i></th>
                    <th>Loại CP</th>
                    <th data-sort="Tiền Phải Thu">Phải Thu <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Doanh Thu Khác">Doanh Thu <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Đã Thu">Đã Thu <i class="fa-solid fa-sort"></i></th>
                    <th>Status</th>
                    <th>Ghi Chú</th>
                    <th>Thao Tác</th>
                `;
            } else if (currentTableTab === 'adjustment') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th>Số Tiền</th>
                    <th>Ghi Chú</th>
                    <th>Thao Tác</th>
                `;
            } else {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Người Mua">Người Mua <i class="fa-solid fa-sort"></i></th>
                    <th>Phân Loại</th>
                    <th data-sort="Số lượng">Số Lượng <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Giá">Giá <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Doanh Thu Bông">Doanh Thu Bông <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Đã Thu">Đã Thu <i class="fa-solid fa-sort"></i></th>
                    <th>Trạng Thái</th>
                    <th>Ghi Chú</th>
                    <th>Thao Tác</th>
                `;
            }

            // Re-attach select-all listener
            const newSelectAll = document.getElementById('select-all-checkbox');
            if (newSelectAll) {
                newSelectAll.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    tableBody.querySelectorAll('.row-checkbox:not(:disabled)').forEach(cb => {
                        cb.checked = isChecked;
                    });
                    updateBulkDeleteUI();
                });
            }
        }

        if (dataToRender.length === 0) {
            let colCount = 11;
            if (currentTableTab === 'expense') colCount = 6;
            else if (currentTableTab === 'vua') colCount = 14;
            else if (currentTableTab === 'adjustment') colCount = 5;
            tableBody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-light)">Không tìm thấy giao dịch nào.</td></tr>`;
            return;
        }

        const todayStr = formatDateInput(new Date());

        dataToRender.forEach((row, index) => {
            const tr = document.createElement('tr');
            const isDone = row["Status"] === "Xong";
            const statusClass = isDone ? "status-badge status-done" : "status-badge status-pending";

            const rowDateStr = formatDateInput(row.parsedDate);
            const isToday = rowDateStr === todayStr;
            const rowIndex = index; // use array index as stable reference
            const rowJson = JSON.stringify(row).replace(/'/g, "&apos;").replace(/"/g, "&quot;"); // kept for checkbox value only

            if (currentTableTab === 'expense') {
                const amount = parseFloat(String(row["Chi Phí"] || "0").replace(/,/g, ''));
                const isVuaShipping = (row["Loại CP"] === "Vận Chuyển");
                const opacity = isVuaShipping ? '0.5' : '1';
                const pointerEvents = isVuaShipping ? 'none' : 'auto';

                tr.style.opacity = opacity;

                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) && !isVuaShipping ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Loại CP" style="font-weight:600;">${row["Loại CP"] || 'Chi phí'}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || ''}">${(row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || '').substring(0, 30)}</td>
                    <td data-label="Số tiền" style="color:#ef4444; font-weight:700;">${formatCurrency(amount)}</td>
                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center; ${isVuaShipping ? 'filter: grayscale(1); opacity: 0.5;' : ''}">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" ${isVuaShipping ? 'disabled' : 'onclick="switchToInlineEdit(this)"'} title="${isVuaShipping ? 'Sửa trong tab Vựa' : 'Sửa'}" style="color:var(--primary-color); ${isVuaShipping ? 'cursor: not-allowed;' : ''}">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" ${isVuaShipping ? 'disabled' : 'onclick="deleteRowByIndex(this)"'} title="${isVuaShipping ? 'Xóa trong tab Vựa' : 'Xoá'}" style="${isVuaShipping ? 'cursor: not-allowed;' : ''}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                    </td>
                `;
            } else if (currentTableTab === 'vua') {
                const pt = parseFloat(String(row["Tiền Phải Thu"] || "0").replace(/[^\d]/g, '')) || 0;
                const dt = parseFloat(String(row["Doanh Thu Khác"] || "0").replace(/[^\d]/g, '')) || 0;
                const cp = parseFloat(String(row["Chi Phí"] || "0").replace(/[^\d]/g, '')) || 0;
                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Tên Vựa" style="font-weight:600;">${row["Người Mua"] || ''}</td>
                    <td data-label="Loại Bông">${row["Phân Loại Bông"] || ''}</td>
                    <td data-label="SL">${row["Số lượng"] ? row["Số lượng"].toLocaleString('vi-VN') : 0}</td>
                    <td data-label="Giá">${formatCurrency(row["Giá"])}</td>
                    <td data-label="Chi Phí" style="color:#ef4444; font-weight:600;">${formatCurrency(cp)}</td>
                    <td data-label="Loại CP">${row["Loại CP"] || ''}</td>
                    <td data-label="Phải Thu" style="color:var(--primary-color); font-weight:600;">${formatCurrency(pt)}</td>
                    <td data-label="Doanh Thu" style="color:#ec4899; font-weight:700;">${formatCurrency(dt)}</td>
                    <td data-label="Đã Thu" style="color:#10b981; font-weight:700;">${formatCurrency(parseFloat(String(row["Đã Thu"] || "0").replace(/[^\d]/g, '')) || 0)}</td>
                    <td data-label="Status">${row["Status"] ? `<span class="${statusClass}">${row["Status"]}</span>` : ''}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú"] || ''}">${(row["Ghi Chú"] || '').substring(0, 15)}${(row["Ghi Chú"] || '').length > 15 ? '...' : ''}</td>
                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="switchToInlineEdit(this)" title="Sửa" style="color:var(--primary-color);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="deleteRowByIndex(this)" title="Xoá">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                    </td>
                `;
            } else if (currentTableTab === 'adjustment') {
                const adjVal = parseSignedMoney(row["Khoản Thu Chi Bất Thường"]);
                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Số tiền" style="color:#f59e0b; font-weight:700;">${formatCurrency(adjVal)}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú Thu Chi Bất Thường"] || row["Ghi Chú"] || ''}">${(row["Ghi Chú Thu Chi Bất Thường"] || row["Ghi Chú"] || '').substring(0, 30)}</td>
                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="switchToInlineEdit(this)" title="Sửa" style="color:var(--primary-color);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="deleteRowByIndex(this)" title="Xoá">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Người Mua" style="font-weight:600;">${row["Người Mua"] || ''}</td>
                    <td data-label="Loại Bông">${row["Phân Loại Bông"] || ''}</td>
                    <td data-label="Số Lượng">${row["Số lượng"] ? row["Số lượng"].toLocaleString('vi-VN') : 0}</td>
                    <td data-label="Giá">${formatCurrency(row["Giá"])}</td>
                    <td data-label="Doanh Thu" style="color:var(--secondary-color); font-weight:600;">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                            ${(row["Doanh Thu Bông"] && row["Doanh Thu Bông"] != 0) ? `<span>${formatCurrency(row["Doanh Thu Bông"])}</span>` : ''}
                            ${(row["Khoản Thu Chi Bất Thường"] && row["Khoản Thu Chi Bất Thường"] != 0) ? `<span style="color:#f59e0b; font-size: 0.85rem;" title="Thu Chi Bất Thường">⚖ ${formatCurrency(row["Khoản Thu Chi Bất Thường"])}</span>` : ''}
                            ${(!row["Doanh Thu Bông"] && !row["Khoản Thu Chi Bất Thường"]) ? '0 ₫' : ''}
                        </div>
                    </td>
                    <td data-label="Đã Thu" style="color:#10b981; font-weight:700;">${formatCurrency(parseFloat(String(row["Đã Thu"] || "0").replace(/[^\d]/g, '')) || 0)}</td>

                    <td data-label="Status">${row["Status"] ? `<span class="status-badge ${statusClass}">${row["Status"]}</span>` : ''}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú"] || row["Ghi Chú Thu Chi Bất Thường"] || ''}">${(row["Ghi Chú"] || row["Ghi Chú Thu Chi Bất Thường"] || '').substring(0, 20)}${(row["Ghi Chú"] || row["Ghi Chú Thu Chi Bất Thường"] || '').length > 20 ? '...' : ''}</td>

                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="switchToInlineEdit(this)" title="Sửa" style="color:var(--primary-color);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="deleteRowByIndex(this)" title="Xoá">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                `;
            }
            tableBody.appendChild(tr);
        });

        // THÊM DÒNG TỔNG DOANH THU (Chỉ hiện khi có dữ liệu)
        if (dataToRender.length > 0) {
            let totalRevenue = 0;
            let totalPaid = 0;
            dataToRender.forEach(row => {
                const dtBong = parseFloat(String(row["Doanh Thu Bông"] || "0").replace(/[^\d]/g, '')) || 0;
                const dtKhac = parseFloat(String(row["Doanh Thu Khác"] || "0").replace(/[^\d]/g, '')) || 0;
                const daThu = parseFloat(String(row["Đã Thu"] || "0").replace(/[^\d]/g, '')) || 0;
                const adjVal = parseSignedMoney(row["Khoản Thu Chi Bất Thường"]);
                totalRevenue += (dtBong + dtKhac + adjVal);
                totalPaid += daThu;
            });

            const totalTr = document.createElement('tr');
            totalTr.className = 'total-row';
            totalTr.style.cssText = 'background: rgba(16, 185, 129, 0.05); border-top: 2px dashed var(--success); font-weight: 800;';

            let colCount = 11;
            if (currentTableTab === 'expense') colCount = 6;
            else if (currentTableTab === 'vua') colCount = 14;
            else if (currentTableTab === 'adjustment') colCount = 5;

            let cellsHtml = '';
            for (let i = 0; i < colCount; i++) {
                if (currentTableTab === 'adjustment') {
                    if (i === 1) {
                        cellsHtml += `<td style="text-align: right; color: var(--text-dark);">TỔNG CỘNG:</td>`;
                    } else if (i === 2) {
                        let totalAdj = 0;
                        dataToRender.forEach(r => {
                            totalAdj += parseSignedMoney(r["Khoản Thu Chi Bất Thường"]);
                        });
                        cellsHtml += `<td style="color: ${totalAdj < 0 ? '#ef4444' : '#f59e0b'}; font-size: 1.1rem;">${formatCurrency(totalAdj)}</td>`;
                    } else {
                        cellsHtml += `<td></td>`;
                    }
                } else {
                    if (i === 4) { // Cột Phân Loại / Số Lượng
                        cellsHtml += `<td style="text-align: right; color: var(--text-dark);">TỔNG CỘNG:</td>`;
                    } else if (i === 6 && currentTableTab === 'vua') { // Cột Chi Phí trong tab Vựa
                        let totalCP = 0;
                        dataToRender.forEach(r => totalCP += (parseFloat(String(r["Chi Phí"] || "0").replace(/[^\d]/g, '')) || 0));
                        cellsHtml += `<td style="color: #ef4444; font-size: 1.1rem;">${formatCurrency(totalCP)}</td>`;
                    } else if (i === 8 && currentTableTab === 'vua') { // Cột Phải Thu trong tab Vựa
                        let totalPT = 0;
                        dataToRender.forEach(r => totalPT += (parseFloat(String(r["Tiền Phải Thu"] || "0").replace(/[^\d]/g, '')) || 0));
                        cellsHtml += `<td style="color: var(--primary-color); font-size: 1.1rem;">${formatCurrency(totalPT)}</td>`;
                    } else if (i === 9 && currentTableTab === 'vua') { // Cột Doanh Thu trong tab Vựa
                        let totalDT = 0;
                        dataToRender.forEach(r => totalDT += (parseFloat(String(r["Doanh Thu Khác"] || "0").replace(/[^\d]/g, '')) || 0));
                        cellsHtml += `<td style="color: #ec4899; font-size: 1.1rem;">${formatCurrency(totalDT)}</td>`;
                    } else if (i === 10 && currentTableTab === 'vua') { // Cột Đã Thu trong tab Vựa
                        let totalPaid = 0;
                        dataToRender.forEach(r => totalPaid += (parseFloat(String(r["Đã Thu"] || "0").replace(/[^\d]/g, '')) || 0));
                        cellsHtml += `<td style="color: var(--success); font-size: 1.1rem;">${formatCurrency(totalPaid)}</td>`;
                    } else if (i === 6 && currentTableTab !== 'vua') { // Cột Doanh Thu (Farm)
                        cellsHtml += `<td style="color: var(--secondary-color); font-size: 1.1rem;">${formatCurrency(totalRevenue)}</td>`;
                    } else if (i === 7 && currentTableTab !== 'vua') { // Cột Đã Thu (Farm)
                        cellsHtml += `<td style="color: var(--success); font-size: 1.1rem;">${formatCurrency(totalPaid)}</td>`;
                    } else {
                        cellsHtml += `<td></td>`;
                    }
                }
            }
            totalTr.innerHTML = cellsHtml;
            tableBody.appendChild(totalTr);
        }

        if (typeof updateBulkDeleteUI === 'function') updateBulkDeleteUI();
    }

    // Strip client-side fields before sending to Apps Script for deletion
    // Apps Script uses getDisplayValues() so "Ngày" must be "DD/MM/YYYY" format
    function cleanRowForDelete(row) {
        const cleaned = { ...row };

        // Convert "Ngày" to DD/MM/YYYY — Apps Script reads display values from Sheet
        if (cleaned.parsedDate && !isNaN(cleaned.parsedDate.getTime())) {
            const d = cleaned.parsedDate;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            cleaned["Ngày"] = `${dd}/${mm}/${yyyy}`;
        }

        delete cleaned.parsedDate; // remove JS Date object — not in Sheet

        // Convert numeric fields back to String (Sheet stores as strings)
        const numFields = ["Số lượng", "Giá", "Doanh Thu Bông", "Chi Phí", "Tiền Phải Thu", "Doanh Thu Khác", "Đã Thu"];
        numFields.forEach(f => {
            if (cleaned[f] !== undefined && cleaned[f] !== "") {
                cleaned[f] = String(cleaned[f]);
            }
        });
        return cleaned;
    }

    // deleteRowByIndex: look up real object from dataToRender by index

    window.deleteRowByIndex = async function (btn) {
        if (!canMutate()) {
            alert("Bạn không có quyền xóa dữ liệu!");
            return;
        }
        const idx = parseInt(btn.getAttribute('data-row-index'));
        const rowData = dataToRenderRef[idx];
        if (!rowData) {
            alert("Không tìm thấy dữ liệu để xóa!");
            return;
        }
        const sheetRow = rowData._sheetRowNumber;
        if (!sheetRow) {
            alert("Dòng này chưa có số thứ tự Sheet — hãy đồng bộ lại dữ liệu từ Google Sheets.");
            return;
        }

        // Determine context based on current tab
        const context = currentTableTab === 'adjustment' ? 'adjustment' :
            (currentTableTab === 'expense' ? 'expense' : 'all');

        // Handle offline-added rows deletion
        if (typeof sheetRow === 'string' && sheetRow.startsWith('OFFLINE_')) {
            if (confirm("Xóa dòng lưu tạm offline này?")) {
                farmData.splice(farmData.indexOf(rowData), 1);
                let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
                queue = queue.filter(item => item.clientId !== sheetRow);
                localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));
                applyFiltersAndRender();
                if (typeof updateConnectionStatus === 'function') updateConnectionStatus();
                showToast("Đã xóa dòng lưu tạm!", "success");
            }
            return;
        }

        if (!confirm(`Xóa dòng ${sheetRow} trên Google Sheets?`)) return;

        let isSavedOffline = !navigator.onLine;

        try {
            if (isSavedOffline) {
                // Queue the deletion offline
                let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
                queue.push({ action: 'delete', rowNumber: sheetRow, context: context, clientId: sheetRow });
                localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));

                farmData.splice(farmData.indexOf(rowData), 1);
                applyFiltersAndRender();
                if (typeof updateConnectionStatus === 'function') updateConnectionStatus();
                showToast("Đã xếp hàng yêu cầu xóa offline!", "success");
                return;
            }

            if (!isConfigured()) {
                farmData.splice(farmData.indexOf(rowData), 1);
                applyFiltersAndRender();
                return;
            }
            document.body.style.cursor = 'wait';

            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "deleteByRow", rowNumber: sheetRow, context: context, token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();
            if (result.status === "success") {
                showToast("Xóa thành công!", "success");
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) syncBtn.click();
            } else {
                alert("Lỗi khi xóa: " + result.message);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối khi xóa.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    window.deleteRow = async function () {
        alert("Phiên bản xóa cũ không còn được hỗ trợ. Vui lòng tải lại trang.");
    };

    window.switchToInlineEdit = function (btn) {
        const idx = parseInt(btn.getAttribute('data-row-index'));
        const rowData = dataToRenderRef[idx];
        const tr = btn.closest('tr');
        if (!rowData || !tr) return;

        // Save original HTML for cancel
        tr.dataset.originalHtml = tr.innerHTML;
        tr.dataset.rowIndex = idx;
        tr.classList.add('editing-row');

        if (currentTableTab === 'expense') {
            const amount = parseFloat(String(rowData["Chi Phí"] || "0").replace(/[^\d]/g, ''));
            tr.innerHTML = `
                <td></td>
                <td>${formatDateVietnamese(rowData.parsedDate)}</td>
                <td>
                    <select class="inline-edit-input" id="edit-exp-type">
                        <option value="${rowData["Loại CP"]}">${rowData["Loại CP"]}</option>
                        <option value="Chi Phí Khác">Chi Phí Khác</option>
                        <option value="Thuốc">Thuốc</option>
                        <option value="Phân">Phân</option>
                        <option value="Lãi">Lãi</option>
                        <option value="Công">Công</option>
                        <option value="Mua Bông">Mua Bông</option>
                        <option value="Vật Tư KD">Vật Tư KD</option>
                        <option value="Vận Chuyển">Vận Chuyển</option>
                        <option value="Expensed">Expensed</option>
                    </select>
                </td>
                <td><input type="text" class="inline-edit-input" id="edit-exp-note" value="${rowData["Ghi Chú"] || rowData["Ghi Chú Chi Phí"] || ""}"></td>
                <td><input type="text" class="inline-edit-input money-input" id="edit-exp-amount" value="${formatMoneyStr(amount)}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:4px 8px; font-size:12px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:4px 8px; font-size:12px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
        } else if (currentTableTab === 'vua') {
            tr.innerHTML = `
                <td></td>
                <td data-label="Ngày">${formatDateVietnamese(rowData.parsedDate)}</td>
                <td data-label="Tên Vựa"><input type="text" class="inline-edit-input" id="edit-buyer" value="${rowData["Người Mua"] || ""}"></td>
                <td data-label="Loại Bông"><input type="text" class="inline-edit-input" id="edit-flower-type" value="${rowData["Phân Loại Bông"] || ""}"></td>
                <td data-label="SL"><input type="number" class="inline-edit-input" id="edit-qty" oninput="updateVuaInline('cost')" value="${rowData["Số lượng"] || 0}"></td>
                <td data-label="Giá"><input type="text" class="inline-edit-input money-input" id="edit-price" oninput="updateVuaInline('cost')" value="${formatMoneyStr(rowData["Giá"] || 0)}"></td>
                <td data-label="Chi Phí"><input type="text" class="inline-edit-input money-input" id="edit-chi-phi" oninput="updateVuaInline('cost')" value="${formatMoneyStr(rowData["Chi Phí"] || 0)}" style="color:#ef4444; font-weight:700;"></td>
                <td data-label="Loại CP">
                    <input type="text" class="inline-edit-input" id="edit-loai-cp" list="expense-types-list" value="${rowData["Loại CP"] || ""}">
                    <datalist id="expense-types-list">
                        <option value="Vận Chuyển">
                        <option value="Vật Tư KD">
                        <option value="Công">
                        <option value="Mua Bông">
                        <option value="Bốc xếp">
                        <option value="Chi Phí Khác">
                    </datalist>
                </td>
                <td data-label="Phải Thu"><input type="text" class="inline-edit-input money-input" id="edit-phai-thu" oninput="updateVuaInline('phai-thu')" value="${formatMoneyStr(rowData["Tiền Phải Thu"] || 0)}" style="color:var(--primary-color); font-weight:700;"></td>
                <td data-label="Doanh Thu"><input type="text" class="inline-edit-input money-input" id="edit-doanh-thu" oninput="updateVuaInline('doanh-thu')" value="${formatMoneyStr(rowData["Doanh Thu Khác"] || 0)}" style="color:#ec4899; font-weight:700;"></td>
                <td data-label="Đã Thu"><input type="text" class="inline-edit-input money-input" id="edit-da-thu" value="${formatMoneyStr(rowData["Đã Thu"] || 0)}" style="color:#10b981; font-weight:700;"></td>
                <td data-label="Status">
                    <select class="inline-edit-input" id="edit-status">
                        <option value="Chưa Xong" ${rowData["Status"] === "Chưa Xong" ? "selected" : ""}>Chưa Xong</option>
                        <option value="Xong" ${rowData["Status"] === "Xong" ? "selected" : ""}>Xong</option>
                    </select>
                </td>
                <td data-label="Ghi chú"><input type="text" class="inline-edit-input" id="edit-note" value="${rowData["Ghi Chú"] || ""}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:5px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:5px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
            // Store original values and derive hidden costs (Vật Tư)
            const pt = parseMoney(rowData["Tiền Phải Thu"]);
            const dt = parseMoney(rowData["Doanh Thu Khác"]);
            const cp = parseMoney(rowData["Chi Phí"]);
            const fc = parseMoney(rowData["Doanh Thu Bông"]);

            // Vật Tư = Phải Thu - (FlowerCost + Chi Phí + Doanh Thu)
            // This captures any fixed material costs or discrepancies
            const derivedVattu = pt - (fc + cp + dt);

            tr.dataset.flowerCost = fc;
            tr.dataset.vattu = derivedVattu;
            tr.dataset.originalChiPhi = cp;
        } else if (currentTableTab === 'adjustment') {
            const adjVal = parseSignedMoney(rowData["Khoản Thu Chi Bất Thường"]);
            tr.innerHTML = `
                <td></td>
                <td>${formatDateVietnamese(rowData.parsedDate)}</td>
                <td><input type="text" class="inline-edit-input money-input-signed" id="edit-adj-amount" value="${formatMoneyStr(adjVal)}"></td>
                <td><input type="text" class="inline-edit-input" id="edit-adj-note" value="${rowData["Ghi Chú Thu Chi Bất Thường"] || rowData["Ghi Chú"] || ""}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:5px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:5px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
        } else {
            // Farm Mode
            tr.innerHTML = `
                <td></td>
                <td>${formatDateVietnamese(rowData.parsedDate)}</td>
                <td><input type="text" class="inline-edit-input" id="edit-buyer" value="${rowData["Người Mua"] || ""}"></td>
                <td><input type="text" class="inline-edit-input" id="edit-flower-type" value="${rowData["Phân Loại Bông"] || ""}"></td>
                <td><input type="number" class="inline-edit-input" id="edit-qty" oninput="updateInlineRevenue()" value="${rowData["Số lượng"] || 0}"></td>
                <td><input type="text" class="inline-edit-input money-input" id="edit-price" oninput="updateInlineRevenue()" value="${formatMoneyStr(rowData["Giá"] || 0)}"></td>
                <td id="edit-revenue-display">${formatCurrency(parseFloat(rowData["Số lượng"] || 0) * (parseFloat(rowData["Giá"]) || 0))}</td>
                <td>
                    <select class="inline-edit-input" id="edit-status">
                        <option value="Chưa Xong" ${rowData["Status"] === "Chưa Xong" ? "selected" : ""}>Chưa Xong</option>
                        <option value="Xong" ${rowData["Status"] === "Xong" ? "selected" : ""}>Xong</option>
                    </select>
                </td>
                <td><input type="text" class="inline-edit-input" id="edit-note" value="${rowData["Ghi Chú"] || ""}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:5px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:5px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
        }
        // Initialize revenue display if in Farm mode
        if (currentTableTab === 'farm') {
            window.updateInlineRevenue();
        }
    };

    window.updateVuaInline = function (source) {
        const qtyEl = document.getElementById('edit-qty');
        const priceEl = document.getElementById('edit-price');
        const ptEl = document.getElementById('edit-phai-thu');
        const dtEl = document.getElementById('edit-doanh-thu');
        const cpEl = document.getElementById('edit-chi-phi');
        if (!qtyEl || !priceEl || !ptEl || !dtEl || !cpEl) return;

        const tr = qtyEl.closest('tr');
        const qty = parseFloat(qtyEl.value) || 0;
        const price = parseMoney(priceEl.value);
        const shipping = parseMoney(cpEl.value);
        const vattu = parseFloat(tr.dataset.vattu) || 0;

        // Recalculate flower cost only if qty or price has changed from original
        // This prevents rounding differences in the sheet from causing jumps in profit
        let flowerCost = parseFloat(tr.dataset.flowerCost) || 0;
        const rowIndex = parseInt(tr.dataset.rowIndex);
        const originalData = dataToRenderRef[rowIndex];

        if (source === 'cost') {
            // If we are here because of SL or Giá input, we should update flowerCost
            // But if we are here because of Chi Phí, and SL/Giá are same as original, keep flowerCost
            if (qty !== parseFloat(originalData["Số lượng"]) || price !== parseMoney(originalData["Giá"])) {
                flowerCost = qty * price;
            }
        } else {
            // For other sources, always use current inputs
            flowerCost = qty * price;
        }

        const baseCost = flowerCost + shipping + vattu;

        if (source === 'cost') {
            // Update Profit (Doanh Thu) based on fixed Total (Phải Thu)
            const pt = parseMoney(ptEl.value);
            dtEl.value = formatMoneyStr(Math.max(0, pt - baseCost));
        } else if (source === 'phai-thu') {
            // Update Profit (Doanh Thu)
            const pt = parseMoney(ptEl.value);
            dtEl.value = formatMoneyStr(Math.max(0, pt - baseCost));
        } else if (source === 'doanh-thu') {
            // Update Total (Phải Thu)
            const dt = parseMoney(dtEl.value);
            ptEl.value = formatMoneyStr(baseCost + dt);
        }
    };

    window.updateInlineRevenue = function () {
        const qtyInput = document.getElementById('edit-qty');
        const priceInput = document.getElementById('edit-price');
        const display = document.getElementById('edit-revenue-display');
        if (!qtyInput || !priceInput || !display) return;

        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseMoney(priceInput.value);
        const revenue = qty * price;
        display.innerText = formatCurrency(revenue);
    };

    window.cancelInlineEdit = function (btn) {
        const tr = btn.closest('tr');
        if (tr && tr.dataset.originalHtml) {
            tr.innerHTML = tr.dataset.originalHtml;
            tr.classList.remove('editing-row');
        }
    };

    window.saveInlineEdit = async function (idx, btn) {
        const tr = btn.closest('tr');
        const originalData = dataToRenderRef[idx];
        if (!originalData || !tr) return;

        if (!isConfigured()) {
            alert("Chưa cấu hình Server URL. Không thể cập nhật dòng dữ liệu.");
            return;
        }

        if (!confirm("Xác nhận cập nhật dòng dữ liệu này?")) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            // 1. Collect Data
            const updates = {};

            // Preserve original Loại DT if it exists
            if (originalData["Loại DT"]) {
                updates["Loại DT"] = originalData["Loại DT"];
            } else if (currentTableTab === 'vua') {
                updates["Loại DT"] = "Vựa";
            } else if (currentTableTab === 'farm') {
                updates["Loại DT"] = "Farm";
            }

            if (currentTableTab === 'expense') {
                updates["Loại CP"] = document.getElementById('edit-exp-type').value;
                updates["Ghi Chú Chi Phí"] = document.getElementById('edit-exp-note').value;
                updates["Chi Phí"] = parseMoney(document.getElementById('edit-exp-amount').value).toString();
            } else if (currentTableTab === 'adjustment') {
                updates["Khoản Thu Chi Bất Thường"] = parseSignedMoney(document.getElementById('edit-adj-amount').value).toString();
                updates["Ghi Chú Thu Chi Bất Thường"] = document.getElementById('edit-adj-note').value;
                // Preserve original classification
                if (originalData["Loại CP"]) updates["Loại CP"] = originalData["Loại CP"];
                if (originalData["Phân Loại Bông"]) updates["Phân Loại Bông"] = originalData["Phân Loại Bông"];
            } else if (currentTableTab === 'vua') {
                const buyerInput = document.getElementById('edit-buyer');
                const flowerTypeInput = document.getElementById('edit-flower-type');
                const qtyInput = document.getElementById('edit-qty');
                const priceInput = document.getElementById('edit-price');
                const cpInput = document.getElementById('edit-chi-phi');
                const loaiCPInput = document.getElementById('edit-loai-cp');
                const ptInput = document.getElementById('edit-phai-thu');
                const dtInput = document.getElementById('edit-doanh-thu');
                const daThuInput = document.getElementById('edit-da-thu');
                const statusInput = document.getElementById('edit-status');
                const noteInput = document.getElementById('edit-note');

                if (buyerInput) updates["Người Mua"] = buyerInput.value;
                if (flowerTypeInput) updates["Phân Loại Bông"] = flowerTypeInput.value;
                if (qtyInput) updates["Số lượng"] = qtyInput.value;
                if (priceInput) updates["Giá"] = parseMoney(priceInput.value).toString();
                if (cpInput) updates["Chi Phí"] = parseMoney(cpInput.value).toString();
                if (loaiCPInput) updates["Loại CP"] = loaiCPInput.value;
                if (ptInput) updates["Tiền Phải Thu"] = parseMoney(ptInput.value).toString();
                if (dtInput) updates["Doanh Thu Khác"] = parseMoney(dtInput.value).toString();
                if (daThuInput) {
                    const daThuVal = parseMoney(daThuInput.value);
                    // Only update "Đã Thu" if it's not zero to prevent accidental overwriting of existing payments
                    if (daThuVal !== 0) {
                        updates["Đã Thu"] = daThuVal.toString();
                    }
                }
                if (statusInput) updates["Status"] = statusInput.value;
                if (noteInput) updates["Ghi Chú"] = noteInput.value;

                // Auto-calculate flower revenue for completeness
                if (qtyInput && priceInput) {
                    updates["Doanh Thu Bông"] = (parseFloat(qtyInput.value || 0) * parseMoney(priceInput.value)).toString();
                }
                if (!updates["Loại DT"]) updates["Loại DT"] = "Vựa";
            } else {
                // Farm Mode
                const buyerInput = document.getElementById('edit-buyer');
                const flowerTypeInput = document.getElementById('edit-flower-type');
                const qtyInput = document.getElementById('edit-qty');
                const priceInput = document.getElementById('edit-price');
                const statusInput = document.getElementById('edit-status');
                const noteInput = document.getElementById('edit-note');

                if (buyerInput) updates["Người Mua"] = buyerInput.value;
                if (flowerTypeInput) updates["Phân Loại Bông"] = flowerTypeInput.value;
                if (qtyInput) updates["Số lượng"] = qtyInput.value;
                if (statusInput) updates["Status"] = statusInput.value;
                if (noteInput) updates["Ghi Chú"] = noteInput.value;

                if (priceInput) {
                    const price = parseMoney(priceInput.value);
                    updates["Giá"] = price.toString();
                    updates["Doanh Thu Bông"] = (parseFloat(updates["Số lượng"] || 0) * price).toString();
                }
                if (!updates["Loại DT"]) updates["Loại DT"] = "Farm";
            }

            // 2. Send IN-PLACE Update
            const sheetRow = originalData._sheetRowNumber;
            if (!sheetRow) throw new Error("Không xác định được số dòng trên Google Sheets. Hãy tải lại dữ liệu.");

            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "update",
                    rowNumber: sheetRow,
                    updates: updates,
                    token: getToken()
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });

            const result = await response.json();
            if (result.status !== "success") throw new Error("Lỗi cập nhật: " + result.message);

            showToast("Cập nhật thành công!", "success");

            // Reload data to show updated state
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
        } catch (e) {
            alert(e.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
    };

    // Menu Routing
    const menuTodo = document.getElementById('menu-todo'); // NEW
    const menuData = document.getElementById('menu-data');
    const menuReport = document.getElementById('menu-report');
    const menuDebt = document.getElementById('menu-debt');
    const menuCashFlow = document.getElementById('menu-cashflow'); // NEW
    const menuFinancial = document.getElementById('menu-financial');
    const menuInvestment = document.getElementById('menu-investment');
    const menuFormulas = document.getElementById('menu-formulas'); // NEW
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    const viewTodo = document.getElementById('view-todo'); // NEW
    const viewData = document.getElementById('view-data');
    const viewReport = document.getElementById('view-report');
    const viewDebt = document.getElementById('view-debt');
    const viewCashFlow = document.getElementById('view-cashflow'); // NEW
    const viewFinancial = document.getElementById('view-financial');
    const viewInvestment = document.getElementById('view-investment');
    const viewFormulas = document.getElementById('view-formulas'); // NEW

    function hideAllViews() {
        if (menuTodo) menuTodo.classList.remove('active');
        if (menuData) menuData.classList.remove('active');
        if (menuReport) menuReport.classList.remove('active');
        if (menuDebt) menuDebt.classList.remove('active');
        if (menuCashFlow) menuCashFlow.classList.remove('active');
        if (menuFinancial) menuFinancial.classList.remove('active');
        if (menuInvestment) menuInvestment.classList.remove('active');
        if (menuFormulas) menuFormulas.classList.remove('active');

        mobileNavItems.forEach(i => i.classList.remove('active'));

        if (viewTodo) viewTodo.style.display = 'none';
        if (viewData) viewData.style.display = 'none';
        if (viewReport) viewReport.style.display = 'none';
        if (viewDebt) viewDebt.style.display = 'none';
        if (viewCashFlow) viewCashFlow.style.display = 'none';
        if (viewFinancial) viewFinancial.style.display = 'none';
        if (viewInvestment) viewInvestment.style.display = 'none';
        if (viewFormulas) viewFormulas.style.display = 'none';
    }

    function syncMobileNav(viewId) {
        mobileNavItems.forEach(item => {
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function switchView(viewId) {
        if (viewId === 'investment' && getRole() === 'EMP_LV2') {
            if (window.showToast) window.showToast("Tài khoản bậc 2 không có quyền truy cập mục Đầu Tư.", "error");
            else alert("Tài khoản bậc 2 không có quyền truy cập mục Đầu Tư.");
            switchView('todo');
            return;
        }
        hideAllViews();
        localStorage.setItem("active_app_view", viewId);

        if (viewId === 'todo') {
            if (menuTodo) menuTodo.classList.add('active');
            syncMobileNav('todo');
            if (viewTodo) viewTodo.style.display = 'block';
            if (typeof renderFocus === 'function') renderFocus(); // Refresh todo
        } else if (viewId === 'data') {
            if (menuData) menuData.classList.add('active');
            syncMobileNav('data');
            if (viewData) viewData.style.display = 'block';
            applyFiltersAndRender();
        } else if (viewId === 'report') {
            if (menuReport) menuReport.classList.add('active');
            syncMobileNav('report');
            if (viewReport) viewReport.style.display = 'block';
            updateDashboard();
        } else if (viewId === 'debt') {
            if (menuDebt) menuDebt.classList.add('active');
            syncMobileNav('debt');
            if (viewDebt) viewDebt.style.display = 'block';
            renderDebtTable();
        } else if (viewId === 'cashflow') {
            if (menuCashFlow) menuCashFlow.classList.add('active');
            syncMobileNav('cashflow');
            if (viewCashFlow) viewCashFlow.style.display = 'block';
            updateCashInHand();
            updateCashFlowReport();
        } else if (viewId === 'financial') {
            if (menuFinancial) menuFinancial.classList.add('active');
            syncMobileNav('financial');
            if (viewFinancial) viewFinancial.style.display = 'block';
            fetchFinancialReport();
        } else if (viewId === 'investment') {
            if (menuInvestment) menuInvestment.classList.add('active');
            syncMobileNav('investment');
            if (viewInvestment) viewInvestment.style.display = 'block';
            if (typeof fetchInvestmentData === 'function') fetchInvestmentData();
        } else if (viewId === 'formulas') {
            if (menuFormulas) menuFormulas.classList.add('active');
            syncMobileNav('formulas');
            if (viewFormulas) viewFormulas.style.display = 'block';
            if (typeof initFormulasTab === 'function') initFormulasTab();
        }
    }
    window.switchView = switchView;

    if (menuTodo) {
        menuTodo.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('todo');
        });
    }

    if (menuData) {
        menuData.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('data');
        });
    }

    if (menuReport) {
        menuReport.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('report');
        });
    }

    if (menuDebt) {
        menuDebt.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('debt');
        });
    }

    if (menuInvestment) {
        menuInvestment.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('investment');
        });
    }

    if (menuCashFlow) {
        menuCashFlow.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('cashflow');
        });
    }

    if (menuFinancial) {
        menuFinancial.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('financial');
        });
    }

    if (menuFormulas) {
        menuFormulas.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('formulas');
        });
    }

    // Mobile Nav Click Listener
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Debt Filter Listener
    const debtFilter = document.getElementById('debt-filter');
    if (debtFilter) {
        debtFilter.addEventListener('change', renderDebtTable);
    }

    // Debt Table Rendering Logic
    let currentSelectedBuyer = null;

    function renderDebtTable() {
        const masterView = document.getElementById('debt-master-view');
        const detailView = document.getElementById('debt-detail-view');
        const filterVal = document.getElementById('debt-filter') ? document.getElementById('debt-filter').value : 'farm';

        if (masterView) masterView.style.display = 'grid';
        if (detailView) detailView.style.display = 'none';

        let debtData = farmData.filter(row => (row["Status"] || "").toLowerCase() !== "xong");

        // The UI filters have been removed, so we always process all data to render both columns at once

        // 1. Group items by Date + Buyer to get the unique transactions
        const transactions = {};
        debtData.forEach(row => {
            if (!row.parsedDate || isNaN(row.parsedDate.getTime())) return;
            const dateStr = formatDateVietnamese(row.parsedDate);
            const buyer = (row["Người Mua"] || "Khách Lẻ").trim();
            const isVua = (row["Loại DT"] || "") === "Vựa";
            const key = `${dateStr}_${buyer}`;

            if (!transactions[key]) {
                transactions[key] = {
                    key: key,
                    dateStr: dateStr,
                    rawDate: row.parsedDate.getTime(),
                    buyer: buyer,
                    lines: [],
                    totalExpected: 0,
                    vuaExpectedAdded: false,
                    paid: 0,
                    totalQty: 0,
                    isVua: isVua
                };

            }

            const t = transactions[key];
            const qty = parseFloat(row["Số lượng"]) || 0;
            const priceStr = row["Giá"];
            const price = priceStr ? parseFloat(String(priceStr).replace(/[^\d]/g, '')) || 0 : 0;
            const dtBongStr = row["Doanh Thu Bông"];
            const dtBong = dtBongStr ? parseFloat(String(dtBongStr).replace(/[^\d]/g, '')) || 0 : 0;

            const flowerType = row["Phân Loại Bông"] || "Bông";
            const ptStr = row["Tiền Phải Thu"];
            const tPhaiThu = ptStr ? parseFloat(String(ptStr).replace(/[^\d]/g, '')) || 0 : 0;
            const daThuStr = row["Đã Thu"];
            const actualPaid = daThuStr ? parseFloat(String(daThuStr).replace(/[^\d]/g, '')) || 0 : 0;

            t.lines.push({ qty, price, flowerType, dtBong, rawRow: row, isVua });
            t.totalQty += qty;
            t.paid += actualPaid; // This now safely extracts millions from e.g. "1.600.000đ"

            if (isVua) {
                // Remove the 'vuaExpectedAdded' logic completely so multiple batches on the same day sum correctly
                if (tPhaiThu > 0) {
                    t.totalExpected += tPhaiThu;
                }
            } else {
                t.totalExpected += dtBong;
            }
        });

        // 2. Group transactions by Buyer
        const buyers = {};
        Object.values(transactions).forEach(t => {
            if (!buyers[t.buyer]) {
                buyers[t.buyer] = { name: t.buyer, totalDebt: 0, orderCount: 0, transactions: [], isVua: false };
            }
            if (t.lines.length > 0 && t.lines[0].isVua) {
                buyers[t.buyer].isVua = true;
            }
            buyers[t.buyer].totalDebt += (t.totalExpected - t.paid);
            buyers[t.buyer].orderCount += 1; // Đếm số ngày nợ thay vì số đơn lẻ
            buyers[t.buyer].transactions.push(t);
        });

        // 3. Render Master List
        const farmListContainer = document.getElementById('debt-farm-list');
        const vuaListContainer = document.getElementById('debt-vua-list');
        const masterTotalEl = document.getElementById('master-total-debt');
        const farmTotalEl = document.getElementById('farm-total-debt');
        const vuaTotalEl = document.getElementById('vua-total-debt');

        if (!farmListContainer || !vuaListContainer) return;

        farmListContainer.innerHTML = '';
        vuaListContainer.innerHTML = '';

        let globalDebt = 0;
        let farmDebt = 0;
        let vuaDebt = 0;

        let farmCount = 0;
        let vuaCount = 0;

        // Filter out fully paid buyers globally
        const activeBuyers = Object.values(buyers).filter(b => b.totalDebt > 0);
        const sortedBuyers = activeBuyers.sort((a, b) => b.totalDebt - a.totalDebt);

        sortedBuyers.forEach(b => {
            globalDebt += b.totalDebt;
            const btn = document.createElement('button');
            btn.className = 'customer-debt-btn';
            if (b.isVua) btn.classList.add('vua-flavor');

            let debtFormatted = formatShorthandCurrency(b.totalDebt);

            btn.innerHTML = `
                 <span class="buyer-name-part">👤 <span>${b.name}</span></span>
                 <span class="debt-amount-part">🔴 ${debtFormatted} <span class="order-count-tag">(${b.orderCount} toa)</span></span>
             `;

            btn.onclick = () => showDebtDetail(b);

            if (b.isVua) {
                vuaListContainer.appendChild(btn);
                vuaDebt += b.totalDebt;
                vuaCount++;
            } else {
                farmListContainer.appendChild(btn);
                farmDebt += b.totalDebt;
                farmCount++;
            }
        });

        if (farmCount === 0) {
            farmListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 10px; background: white; border-radius: 8px;">Hoan hô! Không có khoản phải thu.</div>`;
        }
        if (vuaCount === 0) {
            vuaListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 10px; background: white; border-radius: 8px;">Hoan hô! Không có khoản phải thu.</div>`;
        }

        if (masterTotalEl) masterTotalEl.innerText = formatCurrency(globalDebt);
        if (farmTotalEl) farmTotalEl.innerText = formatCurrency(farmDebt);
        if (vuaTotalEl) vuaTotalEl.innerText = formatCurrency(vuaDebt);

        // Keep detail view open if it was already open and buyer still has debt
        if (currentSelectedBuyer && buyers[currentSelectedBuyer.name]) {
            showDebtDetail(buyers[currentSelectedBuyer.name]);
        } else {
            currentSelectedBuyer = null;
            if (masterView) masterView.style.display = 'grid';
            if (detailView) detailView.style.display = 'none';
        }
    }

    // Switch to detail view
    function showDebtDetail(buyerObj) {
        currentSelectedBuyer = buyerObj;
        document.getElementById('debt-master-view').style.display = 'none';
        document.getElementById('debt-detail-view').style.display = 'block';

        document.getElementById('detail-buyer-name').innerHTML = `<i class="fa-solid fa-user-circle"></i> ${buyerObj.name}`;

        const txList = document.getElementById('detail-transaction-list');
        txList.innerHTML = '';

        // Đọc bộ lọc ngày
        const fromVal = (document.getElementById('invoice-date-from') || {}).value;
        const toVal = (document.getElementById('invoice-date-to') || {}).value;
        const fromTs = parseDateInputToTs(fromVal);
        const toTs = toVal ? parseDateInputToTs(toVal) + 86399999 : null; // end of day

        // Sắp xếp ngày từ cũ đến mới (Oldest first)
        const sortedTx = [...buyerObj.transactions].sort((a, b) => a.rawDate - b.rawDate);

        // Lọc giao dịch theo bộ lọc ngày nếu có
        const filteredTx = sortedTx.filter(t => {
            const ts = t.rawDate;
            if (fromTs !== null && ts < fromTs) return false;
            if (toTs !== null && ts > toTs) return false;
            return true;
        });

        if (filteredTx.length === 0) {
            txList.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 20px; font-style: italic;">Không có giao dịch nào trong khoảng ngày này.</div>`;
        }

        filteredTx.forEach((t, idx) => {
            let remaining = 0;
            t.lines.forEach(l => {
                const status = (l.rawRow["Status"] || "").trim().toLowerCase();
                if (status !== "xong") {
                    const lineExpected = l.isVua ? (parseFloat(l.rawRow["Tiền Phải Thu"]) || 0) : (parseFloat(l.rawRow["Doanh Thu Bông"]) || 0);
                    const linePaid = parseFloat(l.rawRow["Đã Thu"]) || 0;
                    remaining += Math.max(0, lineExpected - linePaid);
                }
            });
            const parts = t.dateStr.split('/');
            let shortDate = t.dateStr;
            if (parts.length === 3) {
                shortDate = `${parts[0]}/${parts[1]}/${parts[2].slice(-2)}`;
            }

            const invoiceItem = document.createElement('div');
            invoiceItem.className = 'invoice-item';

            // Chi tiết sản phẩm trong đơn
            const linesHtml = t.lines
                .filter(l => l.qty > 0)
                .map(l => {
                    const unitPriceLabel = l.price ? ` x ${formatCurrency(l.price)}` : '';
                    return `
                <div class="line-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #475569; font-size: 0.88rem;">${l.qty} ${l.flowerType}${unitPriceLabel}</span>
                        <button class="btn-edit-line" data-row="${l.rawRow._sheetRowNumber}" data-qty="${l.qty}" data-price="${l.price}" data-flowertype="${l.flowerType}" data-isvua="${l.isVua}"
                            style="background: none; border: none; color: #6366f1; cursor: pointer; padding: 2px 6px; font-size: 0.8rem; display: inline-flex; align-items: center; border-radius: 4px; transition: all 0.2s;" title="Chỉnh sửa đơn giá, số lượng">
                            <i class="fa-solid fa-pen" style="pointer-events: none;"></i>
                        </button>
                    </div>
                    <span style="font-weight: 700; color: #1e293b; font-size: 0.9rem;">${formatCurrency(l.isVua ? l.rawRow["Tiền Phải Thu"] : l.dtBong)}</span>
                </div>
            `}).join('');

            invoiceItem.innerHTML = `
                <div class="invoice-item-main" style="align-items: center; display: flex; gap: 8px;">
                    <div style="display: flex; align-items: center; justify-content: center; padding: 4px 0 4px 6px; width: 18px; height: 18px;">
                        <input type="checkbox" class="tx-select-checkbox" data-txkey="${t.key}" style="cursor: pointer; width: 18px; height: 18px; accent-color: #6366f1;">
                    </div>
                    <div class="invoice-item-info" style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <span style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">
                                📅 ${shortDate}
                            </span>
                            <span style="font-weight: 800; color: ${t.isVua ? 'var(--primary-color)' : 'var(--secondary-color)'}; font-size: 1rem;">
                                ${formatCurrency(t.totalExpected)}
                            </span>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <button class="toggle-details-btn" data-txkey="${t.key}">
                                <i class="fa-solid fa-chevron-down"></i> Xem chi tiết (${t.lines.length} mục)
                            </button>
                            ${t.paid > 0 ? `<span class="invoice-badge-paid"><i class="fa-solid fa-circle-check"></i> Đã thu: ${formatCurrency(t.paid)}</span>` : ''}
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 100px;">
                        <button class="btn-pay-row ${t.isVua ? 'vua' : ''}" data-txkey="${t.key}">
                            <i class="fa-solid fa-money-bill-transfer"></i> Thu tiền
                        </button>
                        ${remaining > 0 ? `<div style="font-size: 0.7rem; color: var(--danger); font-weight: 700;">Còn phải thu: ${formatCurrency(remaining)}</div>` : ''}
                    </div>
                </div>
                
                <div class="invoice-item-details" id="details-${idx}">
                    ${linesHtml}
                </div>
            `;

            txList.appendChild(invoiceItem);

            // Gắn sự kiện toggle chi tiết
            const toggleBtn = invoiceItem.querySelector('.toggle-details-btn');
            const detailsDiv = invoiceItem.querySelector('.invoice-item-details');
            toggleBtn.addEventListener('click', () => {
                const isActive = detailsDiv.classList.toggle('active');
                toggleBtn.classList.toggle('active');
                toggleBtn.innerHTML = isActive ?
                    `<i class="fa-solid fa-chevron-up"></i> Thu gọn` :
                    `<i class="fa-solid fa-chevron-down"></i> Xem chi tiết (${t.lines.length} mục)`;
            });

            // Gắn sự kiện Thanh toán đơn lẻ
            const payRowBtn = invoiceItem.querySelector('.btn-pay-row');
            if (payRowBtn) {
                payRowBtn.addEventListener('click', () => {
                    paySingleTransaction(t);
                });
            }
        });

        // Xử lý Checkbox & Chọn Tất Cả
        const chkSelectAll = document.getElementById('chk-select-all-tx');
        const selectedCountLabel = document.getElementById('selected-tx-count');
        const btnPaySelected = document.getElementById('btn-pay-selected');
        const btnPaySelectedCount = document.getElementById('btn-pay-selected-count');

        if (chkSelectAll) {
            chkSelectAll.checked = false; // Reset
        }
        if (selectedCountLabel) {
            selectedCountLabel.style.display = 'none';
        }
        if (btnPaySelected) {
            btnPaySelected.style.display = 'none';
        }

        // Định nghĩa hàm cập nhật động số liệu tổng hợp
        function updateDetailTotals(checkedBoxes) {
            let sumQty = 0;
            let sumExpected = 0;
            let sumPaid = 0;

            if (checkedBoxes && checkedBoxes.length > 0) {
                // Tính theo các ngày được chọn bằng checkbox
                const checkedKeys = checkedBoxes.map(cb => cb.getAttribute('data-txkey'));
                const checkedTxList = buyerObj.transactions.filter(t => checkedKeys.includes(t.key));
                checkedTxList.forEach(t => {
                    sumQty += (t.totalQty || 0);
                    sumExpected += (t.totalExpected || 0);
                    sumPaid += (t.paid || 0);
                });
            } else {
                // Tính theo các ngày đang hiển thị trong bộ lọc
                filteredTx.forEach(t => {
                    sumQty += (t.totalQty || 0);
                    sumExpected += (t.totalExpected || 0);
                    sumPaid += (t.paid || 0);
                });
            }

            const detailTotalQty = document.getElementById('detail-total-qty');
            const detailTotalAmount = document.getElementById('detail-total-amount');
            const detailPaidAmount = document.getElementById('detail-paid-amount');
            const detailDebtAmount = document.getElementById('detail-debt-amount');

            if (detailTotalQty) detailTotalQty.innerText = sumQty.toLocaleString('vi-VN') + ' bông';
            if (detailTotalAmount) detailTotalAmount.innerText = formatCurrency(sumExpected);
            if (detailPaidAmount) detailPaidAmount.innerText = formatCurrency(sumPaid);
            if (detailDebtAmount) detailDebtAmount.innerText = formatCurrency(sumExpected - sumPaid);
        }

        function updateSelectionState() {
            const allCheckboxes = txList.querySelectorAll('.tx-select-checkbox:not(:disabled)');
            const checkedBoxes = Array.from(allCheckboxes).filter(cb => cb.checked);
            const count = checkedBoxes.length;

            if (selectedCountLabel) {
                if (count > 0) {
                    selectedCountLabel.innerText = `Đang chọn: ${count} ngày`;
                    selectedCountLabel.style.display = 'inline';
                } else {
                    selectedCountLabel.style.display = 'none';
                }
            }

            if (btnPaySelected) {
                if (count > 0) {
                    btnPaySelected.style.display = 'flex';
                    // Tính số tiền còn phải thu của các ngày được chọn (Tổng Tiền Đơn trừ đi Đã Thanh Toán)
                    const checkedKeys = checkedBoxes.map(cb => cb.getAttribute('data-txkey'));
                    const checkedTxList = buyerObj.transactions.filter(t => checkedKeys.includes(t.key));
                    let checkedExpected = 0;
                    let checkedPaid = 0;
                    checkedTxList.forEach(t => {
                        checkedExpected += (t.totalExpected || 0);
                        checkedPaid += (t.paid || 0);
                    });
                    let checkedDebt = checkedExpected - checkedPaid;
                    if (btnPaySelectedCount) btnPaySelectedCount.innerText = formatCurrency(checkedDebt);
                } else {
                    btnPaySelected.style.display = 'none';
                }
            }

            if (chkSelectAll) {
                chkSelectAll.checked = count === allCheckboxes.length && allCheckboxes.length > 0;
            }

            // Gọi hàm cập nhật số liệu tổng hợp
            updateDetailTotals(checkedBoxes);
        }

        if (chkSelectAll) {
            const handleSelectAll = () => {
                const val = chkSelectAll.checked;
                const allCheckboxes = txList.querySelectorAll('.tx-select-checkbox:not(:disabled)');
                allCheckboxes.forEach(cb => {
                    cb.checked = val;
                });
                updateSelectionState();
            };
            chkSelectAll.onclick = handleSelectAll;
            chkSelectAll.onchange = handleSelectAll;
        }

        // Delegated events for all dynamically loaded checkboxes in the list
        txList.addEventListener('change', (e) => {
            if (e.target && e.target.classList.contains('tx-select-checkbox')) {
                updateSelectionState();
            }
        });
        txList.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('tx-select-checkbox')) {
                updateSelectionState();
            }
        });

        // Delegated click event for edit product line button
        txList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-edit-line');
            if (btn) {
                const row = parseInt(btn.getAttribute('data-row'));
                const qty = parseFloat(btn.getAttribute('data-qty'));
                const price = parseFloat(btn.getAttribute('data-price'));
                const flowerType = btn.getAttribute('data-flowertype');
                const isVua = btn.getAttribute('data-isvua') === 'true';

                editTransactionLine({ row, qty, price, flowerType, isVua });
            }
        });

        // Cập nhật số liệu tổng hợp ban đầu theo bộ lọc
        updateSelectionState();
    }




    // Back button listener
    const btnBack = document.getElementById('btn-back-to-master');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            currentSelectedBuyer = null;
            document.getElementById('debt-master-view').style.display = 'grid';
            document.getElementById('debt-detail-view').style.display = 'none';
        });
    }

    // Custom Modal for Payment Input
    function showPaymentModal(title, subtitle, defaultAmount) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-partial-pay');
            const titleEl = document.getElementById('modal-pay-title');
            const subtitleEl = document.getElementById('modal-pay-subtitle');
            const inputAmount = document.getElementById('input-pay-amount');
            const btnConfirm = document.getElementById('btn-confirm-pay');
            const btnCancel = document.getElementById('btn-cancel-pay');

            titleEl.innerText = title;
            subtitleEl.innerHTML = subtitle.replace(/\n/g, '<br>');
            inputAmount.value = defaultAmount ? defaultAmount : '';

            modal.style.display = 'flex';
            setTimeout(() => inputAmount.focus(), 100);

            let cleanup;

            const onConfirm = () => {
                cleanup();
                resolve(inputAmount.value);
            };

            const onCancel = () => {
                cleanup();
                resolve(null);
            };

            cleanup = () => {
                modal.style.display = 'none';
                btnConfirm.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
            };

            btnConfirm.addEventListener('click', onConfirm);
            btnCancel.addEventListener('click', onCancel);
        });
    }

    // Custom Modal for Editing Transaction line
    async function editTransactionLine(lineObj) {
        if (!isAuthorizedForDebt()) {
            alert("Bạn không có quyền thực hiện chỉnh sửa!");
            return;
        }

        const modal = document.getElementById('modal-edit-line');
        const inputQty = document.getElementById('input-edit-qty');
        const inputPrice = document.getElementById('input-edit-price');
        const textTotal = document.getElementById('text-edit-total');
        const subtitleEl = document.getElementById('modal-edit-line-subtitle');
        const btnConfirm = document.getElementById('btn-confirm-edit-line');
        const btnCancel = document.getElementById('btn-cancel-edit-line');

        // Set initial values
        subtitleEl.innerText = `Đang sửa đơn: ${lineObj.flowerType}`;
        inputQty.value = lineObj.qty;
        inputPrice.value = formatMoneyStr(lineObj.price);

        function updateModalTotal() {
            const q = parseFloat(inputQty.value) || 0;
            const p = parseMoney(inputPrice.value) || 0;
            textTotal.innerText = formatCurrency(q * p);
        }

        updateModalTotal();

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => inputQty.focus(), 100);

        // Listeners for auto-calculation
        const onQtyInput = () => updateModalTotal();
        const onPriceInput = (e) => {
            const val = parseMoney(e.target.value);
            e.target.value = val === 0 ? "" : formatMoneyStr(val);
            updateModalTotal();
        };

        inputQty.addEventListener('input', onQtyInput);
        inputPrice.addEventListener('input', onPriceInput);

        const closeEditModal = () => {
            modal.style.display = 'none';
            inputQty.removeEventListener('input', onQtyInput);
            inputPrice.removeEventListener('input', onPriceInput);
        };

        return new Promise((resolve) => {
            const onConfirm = async () => {
                if (!isConfigured()) {
                    alert("Chưa cấu hình Server URL. Không thể cập nhật dòng đơn hàng.");
                    closeEditModal();
                    resolve(false);
                    return;
                }
                const newQty = parseFloat(inputQty.value) || 0;
                const newPrice = parseMoney(inputPrice.value) || 0;

                if (newQty <= 0 || newPrice <= 0) {
                    alert("Số lượng và đơn giá phải lớn hơn 0.");
                    return;
                }

                closeEditModal();
                document.body.style.cursor = 'wait';

                try {
                    showToast(`Đang cập nhật dòng đơn hàng...`, "info");

                    const updates = {
                        "Số lượng": newQty,
                        "Giá": newPrice
                    };

                    if (lineObj.isVua) {
                        updates["Tiền Phải Thu"] = newQty * newPrice;
                    } else {
                        updates["Doanh Thu Bông"] = newQty * newPrice;
                    }

                    const response = await fetch(CONFIG.WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({
                            action: "update",
                            rowNumber: lineObj.row,
                            updates: updates,
                            token: getToken()
                        }),
                        headers: { "Content-Type": "text/plain;charset=utf-8" }
                    });

                    const result = await response.json();
                    if (result.status !== "success") {
                        throw new Error(result.message || "Lỗi khi cập nhật Google Sheets");
                    }

                    showToast("Đã cập nhật dòng đơn hàng thành công!", "success");
                    renderDebtTable();

                    // Trigger sync
                    const syncBtnGlobal = document.getElementById('sync-gsheet-btn');
                    if (syncBtnGlobal) syncBtnGlobal.click();

                } catch (err) {
                    console.error(err);
                    alert("Lỗi khi cập nhật dòng đơn hàng: " + err.message);
                } finally {
                    document.body.style.cursor = 'default';
                }
            };

            const onCancel = () => {
                closeEditModal();
                btnConfirm.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
            };

            btnConfirm.onclick = onConfirm;
            btnCancel.onclick = onCancel;
        });
    }

    // Process payment calls
    async function processPayment(isFull) {
        if (!isAuthorizedForDebt()) {
            alert("Bạn không có quyền thực hiện thanh toán!");
            return;
        }
        if (!currentSelectedBuyer) return;
        const totalDebt = currentSelectedBuyer.totalDebt;
        let amountToPay = totalDebt;

        if (!isFull) {
            const rawInput = await showPaymentModal(
                "Thu tiền phải thu",
                `Tổng phải thu hiện tại: <b>${formatCurrency(totalDebt)}</b>\nNhập số tiền muốn thu (VNĐ):`,
                ""
            );
            if (!rawInput) return;
            amountToPay = parseFloat(rawInput.replace(/[^\d]/g, ''));
            if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > totalDebt) {
                alert("Số tiền không hợp lệ hoặc lớn hơn tổng phải thu!");
                return;
            }
        } else {
            if (!confirm(`Xác nhận thu HẾT toàn bộ số tiền phải thu ${formatCurrency(totalDebt)} của ${currentSelectedBuyer.name}?`)) return;
        }

        if (!isConfigured()) {
            alert("Vui lòng cấu hình WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';

        // Phân bổ số tiền trả cho các đơn nợ (từ cũ nhất đến mới nhất)
        let remainingPayment = amountToPay;
        const sortedTxAsc = [...currentSelectedBuyer.transactions].sort((a, b) => a.rawDate - b.rawDate);
        const updatesList = [];

        for (let i = 0; i < sortedTxAsc.length; i++) {
            if (remainingPayment <= 0 && !isFull) break;

            const t = sortedTxAsc[i];
            let currentDebt = 0;
            t.lines.forEach(l => {
                const status = (l.rawRow["Status"] || "").trim().toLowerCase();
                if (status !== "xong") {
                    const lineExpected = l.isVua ? (parseFloat(l.rawRow["Tiền Phải Thu"]) || 0) : (parseFloat(l.rawRow["Doanh Thu Bông"]) || 0);
                    const linePaid = parseFloat(l.rawRow["Đã Thu"]) || 0;
                    currentDebt += Math.max(0, lineExpected - linePaid);
                }
            });
            // Nếu là Pay All (isFull), chúng ta vẫn xử lý t nếu nó chưa Xong hoàn toàn
            if (!isFull && currentDebt <= 0) continue;

            const amountForThisTx = isFull ? currentDebt : Math.min(currentDebt, remainingPayment);
            if (!isFull) remainingPayment -= amountForThisTx;

            let remainingForThisTx = amountForThisTx;
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            t.lines.forEach(line => {
                const row = line.rawRow;
                const statusStr = (row["Status"] || "").toLowerCase();
                const isAlreadyDone = statusStr === "xong";

                // Lấy giá trị mong đợi và hiện tại
                const lineExpected = line.isVua ? (parseFloat(String(row["Tiền Phải Thu"] || "0").replace(/[^\d]/g, '')) || 0)
                    : (parseFloat(String(row["Doanh Thu Bông"] || "0").replace(/[^\d]/g, '')) || 0);
                const linePaid = parseFloat(String(row["Đã Thu"] || "0").replace(/[^\d]/g, '')) || 0;
                const lineDebt = lineExpected - linePaid;

                let payForThisLine = 0;
                let markAsDone = false;

                if (isFull) {
                    // Chế độ Thanh toán Hết: Luôn đánh dấu Xong cho các dòng chưa Xong
                    if (isAlreadyDone) return;
                    payForThisLine = Math.max(0, lineDebt);
                    markAsDone = true;
                } else {
                    // Chế độ Một phần: Chỉ xử lý nếu còn tiền và dòng chưa xong
                    if (isAlreadyDone || remainingForThisTx <= 0) return;
                    payForThisLine = Math.min(lineDebt, remainingForThisTx);
                    remainingForThisTx -= payForThisLine;
                    markAsDone = (linePaid + payForThisLine) >= lineExpected;
                }

                // Luôn cập nhật nếu phả trả thêm tiền hoặc nếu cần chuyển trạng thái sang Xong
                if (payForThisLine > 0 || markAsDone) {
                    const newPaidTotal = linePaid + payForThisLine;
                    const existingNote = row["Ghi Chú"] || "";
                    const now = new Date();
                    const fullDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                    const fullTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                    const noteType = isFull ? "hết" : "một phần";
                    let finalNote = `Thanh toán ${noteType} ngày ${fullDateStr} ${fullTimeStr}`;

                    if (existingNote.trim() !== '') {
                        finalNote = existingNote + " | " + finalNote;
                    }


                    updatesList.push({
                        targetRow: row,
                        updates: {
                            "Đã Thu": newPaidTotal,
                            "Status": markAsDone ? "Xong" : "Chưa Xong",
                            "Ghi Chú": finalNote
                        }
                    });
                }
            });

        }

        try {
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            if (isFull) {
                showToast(`Đang thanh toán HẾT cho ${currentSelectedBuyer.name}...`, "info");
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "bulkPay",
                        buyerName: currentSelectedBuyer.name,
                        isAllDates: true,
                        token: getToken()
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status === "success") {
                    showToast(`Thành công! Đã xử lý ${result.count} đơn hàng.`, "success");
                } else {
                    throw new Error(result.message);
                }
            } else {
                // Thanh toán một phần: Tạo hàng mới, status để "", nội dung thanh toán một phần ngày xxxxx, đã thu, các hàng khác giữ nguyên
                showToast(`Đang ghi nhận thanh toán một phần ${formatCurrency(amountToPay)}...`, "info");

                const now = new Date();
                const fullDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                const fullTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

                const payload = {
                    action: "add",
                    token: getToken(),
                    data: {
                        "Ngày": fullDateStr,
                        "Status": "",
                        "Người Mua": currentSelectedBuyer.name,
                        "Số lượng": "",
                        "Giá": "",
                        "Doanh Thu Bông": "",
                        "Phân Loại Bông": "",
                        "Ghi Chú": `Thanh toán một phần ngày ${fullDateStr} ${fullTimeStr}`,
                        "Đã Thu": amountToPay.toString(),
                        "Tiền Phải Thu": "",
                        "Ghi Chú Vựa thu": "",
                        "Doanh Thu Khác": "",
                        "Loại DT": currentSelectedBuyer.isVua ? "Vựa" : "Farm",
                        "Chi Phí": "",
                        "Loại CP": "",
                        "Ghi Chú Chi Phí": ""
                    }
                };

                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });

                const result = await response.json();
                if (result.status !== "success") throw new Error(result.message);

                showToast(`Đã ghi nhận thanh toán một phần thành công!`, "success");
            }


            renderDebtTable();
            const syncBtnGlobal = document.getElementById('sync-gsheet-btn');
            if (syncBtnGlobal) syncBtnGlobal.click();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi xử lý thanh toán: " + err.message);
        } finally {
            document.body.style.cursor = 'default';
        }
    }


    const btnPayFull = document.getElementById('btn-pay-full');

    const btnPayPartial = document.getElementById('btn-pay-partial');
    if (btnPayFull) btnPayFull.addEventListener('click', () => processPayment(true));
    if (btnPayPartial) btnPayPartial.addEventListener('click', () => processPayment(false));

    const btnPaySelected = document.getElementById('btn-pay-selected');
    if (btnPaySelected) {
        btnPaySelected.addEventListener('click', async () => {
            if (!isAuthorizedForDebt()) {
                alert("Bạn không có quyền thực hiện thanh toán!");
                return;
            }
            if (!currentSelectedBuyer) return;

            const checkedBoxes = document.querySelectorAll('.tx-select-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert("Vui lòng chọn ít nhất một ngày giao dịch.");
                return;
            }

            const selectedTxKeys = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-txkey'));
            const selectedTxList = currentSelectedBuyer.transactions.filter(t => selectedTxKeys.includes(t.key));

            let selectedExpected = 0;
            let selectedPaid = 0;
            selectedTxList.forEach(t => {
                selectedExpected += (t.totalExpected || 0);
                selectedPaid += (t.paid || 0);
            });
            let selectedDebt = selectedExpected - selectedPaid;

            if (selectedDebt <= 0) {
                alert("Các ngày đã chọn không có nợ cần thanh toán.");
                return;
            }

            if (!confirm(`Xác nhận thu HẾT nợ của ${selectedTxList.length} ngày đã chọn? (Tổng nợ còn phải thu: ${formatCurrency(selectedDebt)})`)) return;

            if (!isConfigured()) {
                alert("Vui lòng cấu hình WEB_APP_URL!");
                return;
            }

            document.body.style.cursor = 'wait';
            try {
                showToast(`Đang thanh toán các ngày đã chọn...`, "info");

                const dateStrList = selectedTxList.map(t => t.dateStr);
                const shortDates = selectedTxList.map(t => {
                    const parts = t.dateStr.split('/');
                    if (parts.length >= 2) {
                        return `${parts[0]}/${parts[1]}`;
                    }
                    return t.dateStr;
                }).join(', ');
                const customNote = `Thanh toán cho ngày ${shortDates}`;

                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "bulkPay",
                        buyerName: currentSelectedBuyer.name,
                        dateStr: dateStrList,
                        customNote: customNote,
                        isAllDates: false,
                        token: getToken()
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });

                const result = await response.json();
                if (result.status !== "success") {
                    throw new Error(result.message || `Lỗi khi xử lý thanh toán.`);
                }

                showToast(`Thành công! Đã thu nợ của ${selectedTxList.length} ngày đã chọn.`, "success");
                renderDebtTable();
                const syncBtnGlobal = document.getElementById('sync-gsheet-btn');
                if (syncBtnGlobal) syncBtnGlobal.click();
            } catch (err) {
                console.error(err);
                alert("Lỗi khi xử lý thanh toán các ngày đã chọn: " + err.message);
            } finally {
                document.body.style.cursor = 'default';
            }
        });
    }

    async function paySingleTransaction(t) {
        if (!isAuthorizedForDebt()) {
            alert("Bạn không có quyền thực hiện thanh toán!");
            return;
        }

        let remaining = 0;
        t.lines.forEach(l => {
            const status = (l.rawRow["Status"] || "").trim().toLowerCase();
            if (status !== "xong") {
                const lineExpected = l.isVua ? (parseFloat(l.rawRow["Tiền Phải Thu"]) || 0) : (parseFloat(l.rawRow["Doanh Thu Bông"]) || 0);
                const linePaid = parseFloat(l.rawRow["Đã Thu"]) || 0;
                remaining += Math.max(0, lineExpected - linePaid);
            }
        });
        const rawInput = await showPaymentModal(
            `Thanh toán ngày ${t.dateStr}`,
            `Số tiền phải thu còn lại: <b>${formatCurrency(remaining)}</b>\n\nNhập số tiền muốn thu (Mặc định: thu hết):`,
            formatMoneyStr(remaining)
        );

        if (rawInput === null) return; // Cancel

        const amountToPay = parseMoney(rawInput);
        if (amountToPay <= 0) {
            alert("Số tiền không hợp lệ.");
            return;
        }
        if (amountToPay > remaining) {
            if (!confirm(`Số tiền ${formatCurrency(amountToPay)} lớn hơn số tiền phải thu ${formatCurrency(remaining)}. Bạn vẫn muốn tiếp tục?`)) return;
        }

        if (!isConfigured()) {
            alert("Vui lòng cấu hình WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';
        try {
            const isFull = amountToPay >= remaining;
            showToast(`Đang ghi nhận thanh toán ${isFull ? 'HẾT' : 'một phần'} ngày ${t.dateStr}...`, "info");

            let response;
            if (isFull) {
                response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "recordPayment",
                        buyerName: currentSelectedBuyer.name,
                        amount: amountToPay,
                        dateStr: t.dateStr,
                        isFull: true,
                        token: getToken()
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
            } else {
                // Thanh toán một phần: Tạo hàng mới
                const now = new Date();
                const fullDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
                const fullTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

                response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "add",
                        token: getToken(),
                        data: {
                            "Ngày": fullDateStr,
                            "Status": "",
                            "Người Mua": currentSelectedBuyer.name,
                            "Số lượng": "",
                            "Giá": "",
                            "Doanh Thu Bông": "",
                            "Phân Loại Bông": "",
                            "Ghi Chú": `Thanh toán một phần ngày ${fullDateStr} ${fullTimeStr}`,
                            "Đã Thu": amountToPay.toString(),
                            "Tiền Phải Thu": "",
                            "Ghi Chú Vựa thu": "",
                            "Doanh Thu Khác": "",
                            "Loại DT": currentSelectedBuyer.isVua ? "Vựa" : "Farm",
                            "Chi Phí": "",
                            "Loại CP": "",
                            "Ghi Chú Chi Phí": ""
                        }
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
            }

            const result = await response.json();
            if (result.status !== "success") throw new Error(result.message);

            showToast(`Thành công! Đã ghi nhận ${formatCurrency(amountToPay)}.`, "success");

            renderDebtTable();
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi xử lý thanh toán: " + err.message);
        } finally {
            document.body.style.cursor = 'default';
        }
    }







    // Report Setup
    function syncMainToComparison() {
        const reportRangeSelect = document.getElementById('report-range');
        const reportMonthSelect = document.getElementById('report-month');
        const reportYearSelect = document.getElementById('report-year');

        const reportYearPrev = document.getElementById('report-year-prev');
        const reportMonthPrev = document.getElementById('report-month-prev');
        const reportQuarterPrev = document.getElementById('report-quarter-prev');

        if (!reportYearSelect || !reportYearPrev) return;

        // Auto-sync Month/Quarter when range changes, but keep the Comparison Year as is (usually -1)
        if (reportMonthSelect && reportMonthPrev) {
            reportMonthPrev.value = reportMonthSelect.value;
        }
        if (reportRangeSelect && reportQuarterPrev) {
            reportQuarterPrev.value = reportRangeSelect.value;
        }
    }

    const reportRangeSelect = document.getElementById('report-range');
    const reportMonthSelect = document.getElementById('report-month');
    const monthSelectContainer = document.getElementById('month-select-container');

    const cmpMonth1Select = document.getElementById('cmp-month1');
    const cmpMonth2Select = document.getElementById('cmp-month2');
    const cmpPeriodSelect = document.getElementById('cmp-period');

    if (reportRangeSelect) {
        reportRangeSelect.addEventListener('change', () => {
            const val = reportRangeSelect.value;
            const isMonth = val === 'month';
            const isQuarter = val.startsWith('q');

            monthSelectContainer.style.display = isMonth ? 'flex' : 'none';

            // Adjust chart displays
            document.getElementById('yearly-report-charts').style.display = (isMonth || isQuarter) ? 'none' : 'grid';
            document.getElementById('monthly-report-charts').style.display = (isMonth || isQuarter) ? 'grid' : 'none';

            const chartTitleSpan = document.querySelector('#monthly-report-charts h2 span');
            if (chartTitleSpan) {
                chartTitleSpan.innerText = isMonth ? 'Báo Cáo Chi Tiết Tháng' : 'Báo Cáo Chi Tiết Quý';
            }

            const kpiLabels = document.querySelectorAll('.kpi-cards h3');
            kpiLabels.forEach(label => {
                let context = isMonth ? 'T.Tháng' : (isQuarter ? 'T.Quý' : 'T.Năm');
                label.innerText = label.innerText.replace(/T\.(Tháng|Năm|Quý)/g, context);
            });
            updateDashboard();
            syncMainToComparison();
        });
    }

    if (reportMonthSelect) {
        reportMonthSelect.addEventListener('change', () => {
            updateDashboard();
            syncMainToComparison();
        });
    }

    // Scroll to Expense Distribution Chart on KPI Click
    const kpiExpenseCard = document.getElementById('kpi-card-expense');
    if (kpiExpenseCard) {
        kpiExpenseCard.addEventListener('click', () => {
            const chartCard = document.getElementById('expense-distribution-card');
            if (chartCard) {
                chartCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add highlight effect
                chartCard.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
                chartCard.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                chartCard.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.2)';
                setTimeout(() => {
                    chartCard.style.borderColor = '';
                    chartCard.style.boxShadow = '';
                }, 1500);
            }
        });
    }

    if (cmpPeriodSelect) {
        cmpPeriodSelect.addEventListener('change', () => {
            const isIndividualMonth = cmpPeriodSelect.value === 'month';
            if (cmpMonth1Select) cmpMonth1Select.style.display = isIndividualMonth ? 'block' : 'none';
            if (cmpMonth2Select) cmpMonth2Select.style.display = isIndividualMonth ? 'block' : 'none';
            updateComparison();
        });
    }
    if (cmpMonth1Select) cmpMonth1Select.addEventListener('change', updateComparison);
    if (cmpMonth2Select) cmpMonth2Select.addEventListener('change', updateComparison);

    // Toggle Comparison Button & Sync logic
    const toggleCmpBtn = document.getElementById('toggle-comparison-btn');
    if (toggleCmpBtn) {
        toggleCmpBtn.addEventListener('click', () => {
            const unifiedControls = document.getElementById('unified-cmp-controls');
            const btnSpan = toggleCmpBtn.querySelector('span');
            const icon = toggleCmpBtn.querySelector('i');

            if (unifiedControls.style.display === 'none' || !unifiedControls.style.display) {
                // OPEN MODE
                unifiedControls.style.display = 'flex';
                toggleCmpBtn.style.backgroundColor = 'var(--primary-color)';
                toggleCmpBtn.style.color = 'white';
                if (btnSpan) btnSpan.innerText = "Đóng so sánh";
                if (icon) { icon.className = "fa-solid fa-xmark"; }

                // Set default comparison year/month if not set
                const mainYear = document.getElementById('report-year').value;
                const mainMonth = document.getElementById('report-month').value;
                const reportYearPrev = document.getElementById('report-year-prev');
                const reportMonthPrev = document.getElementById('report-month-prev');

                if (reportYearPrev && !reportYearPrev.value) reportYearPrev.value = parseInt(mainYear) - 1;
                if (reportMonthPrev && !reportMonthPrev.value) reportMonthPrev.value = mainMonth;
                const reportQuarterPrev = document.getElementById('report-quarter-prev');
                if (reportQuarterPrev && !reportQuarterPrev.value) reportQuarterPrev.value = document.getElementById('report-range').value;

                updateDashboard();
            } else {
                // CLOSE MODE
                unifiedControls.style.display = 'none';
                toggleCmpBtn.style.backgroundColor = '#f1f5f9';
                toggleCmpBtn.style.color = '#475569';
                if (btnSpan) btnSpan.innerText = "So sánh khác";
                if (icon) { icon.className = "fa-solid fa-calendar-days"; }
                updateDashboard();
            }
        });
    }

    // New unified baseline listeners
    const reportYearPrev = document.getElementById('report-year-prev');
    const reportMonthPrev = document.getElementById('report-month-prev');
    const reportQuarterPrev = document.getElementById('report-quarter-prev');
    if (reportYearPrev) reportYearPrev.addEventListener('change', updateDashboard);
    if (reportMonthPrev) reportMonthPrev.addEventListener('change', updateDashboard);
    if (reportQuarterPrev) reportQuarterPrev.addEventListener('change', updateDashboard);
    function populateYears() {
        const yearSelect = document.getElementById('report-year');
        const cmpY1Select = document.getElementById('cmp-year1');
        const cmpY2Select = document.getElementById('cmp-year2');
        const prevYearSelect = document.getElementById('report-year-prev');
        const cfYearSelect = document.getElementById('cashflow-year');
        const cfYearSelect2 = document.getElementById('cashflow-year-2');
        const annualRatiosYearSelect = document.getElementById('financial-ratios-year');

        const years = new Set();
        farmData.forEach(row => {
            if (row.parsedDate && !isNaN(row.parsedDate.getTime())) {
                years.add(row.parsedDate.getFullYear());
            }
        });

        const sortedYears = Array.from(years).sort((a, b) => b - a);
        const allYearSelectors = [yearSelect, cmpY1Select, cmpY2Select, prevYearSelect, cfYearSelect, cfYearSelect2, annualRatiosYearSelect];

        allYearSelectors.forEach(sel => {
            if (!sel) return;
            sel.innerHTML = sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
        });

        const currentYear = new Date().getFullYear();
        const currentMonthNum = new Date().getMonth() + 1;

        if (years.has(currentYear)) {
            if (yearSelect) yearSelect.value = currentYear;
            if (annualRatiosYearSelect) annualRatiosYearSelect.value = currentYear;

            const monthSelect = document.getElementById('report-month');
            if (monthSelect) monthSelect.value = currentMonthNum;

            if (cmpY2Select) cmpY2Select.value = currentYear;

            const cfMonthSelect = document.getElementById('cashflow-month');
            const cfMonthSelect2 = document.getElementById('cashflow-month-2');

            if (cfYearSelect) cfYearSelect.value = currentYear;
            if (cfMonthSelect) cfMonthSelect.value = currentMonthNum.toString();

            if (cfYearSelect2) cfYearSelect2.value = years.has(currentYear - 1) ? currentYear - 1 : currentYear;
            if (cfMonthSelect2) cfMonthSelect2.value = currentMonthNum.toString();

            // set y1 to previous year if available
            if (cmpY1Select) {
                cmpY1Select.value = years.has(currentYear - 1) ? currentYear - 1 : currentYear;
            }

            // Set Dashboard Baseline (Report Prev) defaults to same period last year
            const reportYearPrev = document.getElementById('report-year-prev');
            const reportMonthPrev = document.getElementById('report-month-prev');
            if (reportYearPrev) {
                reportYearPrev.value = years.has(currentYear - 1) ? currentYear - 1 : currentYear;
            }
            if (reportMonthPrev) {
                reportMonthPrev.value = currentMonthNum;
            }
        }
    }

    // 5. Dashboard & Reports Logic
    function updateDashboard() {
        const yearSelect = document.getElementById('report-year');
        const monthSelect = document.getElementById('report-month');
        const filterSelect = document.getElementById('report-filter');
        const rangeSelect = document.getElementById('report-range');

        function getPeriodElapsedRatio(selectedYear, selectedMonth, rangeVal) {
            const now = new Date();
            const curYear = now.getFullYear();
            const curMonth = now.getMonth() + 1;
            const curDay = now.getDate();

            if (selectedYear < curYear) return 1;
            if (selectedYear > curYear) return 0;

            if (rangeVal === 'month') {
                if (selectedMonth < curMonth) return 1;
                if (selectedMonth > curMonth) return 0;
                const daysInMonth = new Date(curYear, curMonth, 0).getDate();
                return Math.max(0.01, Math.min(1, curDay / daysInMonth));
            } else if (rangeVal.startsWith('q')) {
                const qNum = parseInt(rangeVal.substring(1));
                const curQ = Math.ceil(curMonth / 3);
                if (qNum < curQ) return 1;
                if (qNum > curQ) return 0;

                const qStartMonth = (qNum - 1) * 3 + 1;
                let elapsedDays = 0;
                let totalDays = 0;
                for (let m = qStartMonth; m < qStartMonth + 3; m++) {
                    const daysInM = new Date(curYear, m, 0).getDate();
                    totalDays += daysInM;
                    if (m < curMonth) {
                        elapsedDays += daysInM;
                    } else if (m === curMonth) {
                        elapsedDays += curDay;
                    }
                }
                return Math.max(0.01, Math.min(1, elapsedDays / totalDays));
            } else {
                const curYearStart = new Date(curYear, 0, 1);
                const isLeap = (curYear % 4 === 0 && curYear % 100 !== 0) || (curYear % 400 === 0);
                const totalDays = isLeap ? 366 : 365;
                const diff = now - curYearStart;
                const oneDay = 1000 * 60 * 60 * 24;
                const elapsedDays = Math.floor(diff / oneDay) + 1;
                return Math.max(0.01, Math.min(1, elapsedDays / totalDays));
            }
        }

        function checkIsBeforeOrOnRelativeDay(d, selectedYear, selectedMonth, rangeVal) {
            const now = new Date();
            const curYear = now.getFullYear();
            const curMonth = now.getMonth() + 1;
            const curDay = now.getDate();

            if (selectedYear < curYear) return true;
            if (selectedYear > curYear) return false;

            const rowMonth = d.getMonth() + 1;
            const rowDay = d.getDate();

            if (rangeVal === 'month') {
                if (selectedMonth < curMonth) return true;
                if (selectedMonth > curMonth) return false;
                return rowDay <= curDay;
            } else if (rangeVal.startsWith('q')) {
                const qNum = parseInt(rangeVal.substring(1));
                const curQ = Math.ceil(curMonth / 3);
                if (qNum < curQ) return true;
                if (qNum > curQ) return false;

                function getQuarterDayOffset(date, targetQ) {
                    const year = date.getFullYear();
                    const qStartMonth = (targetQ - 1) * 3;
                    const qStart = new Date(year, qStartMonth, 1);
                    const diff = date - qStart;
                    const oneDay = 1000 * 60 * 60 * 24;
                    return Math.floor(diff / oneDay) + 1;
                }
                const rowQ = Math.ceil(rowMonth / 3);
                return getQuarterDayOffset(d, rowQ) <= getQuarterDayOffset(now, curQ);
            } else {
                const curYearStart = new Date(curYear, 0, 1);
                const diffNow = now - curYearStart;
                const oneDay = 1000 * 60 * 60 * 24;
                const elapsedDaysNow = Math.floor(diffNow / oneDay) + 1;

                const rowYearStart = new Date(d.getFullYear(), 0, 1);
                const diffRow = d - rowYearStart;
                const elapsedDaysRow = Math.floor(diffRow / oneDay) + 1;

                return elapsedDaysRow <= elapsedDaysNow;
            }
        }

        if (!yearSelect.options.length) populateYears();

        const selectedYear = parseInt(yearSelect.value) || new Date().getFullYear();
        const selectedMonth = parseInt(monthSelect.value) || (new Date().getMonth() + 1);
        const reportType = filterSelect ? filterSelect.value : "Chung";
        const rangeVal = rangeSelect ? rangeSelect.value : 'month';
        const isMonthlyRange = rangeVal === 'month';
        const isQuarterRange = rangeVal.startsWith('q');

        // Baseline determination (default is same period last year)
        let baselineYear = selectedYear - 1;
        let baselineMonth = selectedMonth;
        let baselineQuarter = isQuarterRange ? rangeVal : null;

        const customCmpBox = document.getElementById('unified-cmp-controls');
        if (customCmpBox && customCmpBox.style.display !== 'none') {
            const yPrev = document.getElementById('report-year-prev');
            const mPrev = document.getElementById('report-month-prev');
            const qPrev = document.getElementById('report-quarter-prev');
            if (yPrev) baselineYear = parseInt(yPrev.value);
            if (mPrev && isMonthlyRange) baselineMonth = parseInt(mPrev.value);
            if (qPrev && isQuarterRange) baselineQuarter = qPrev.value;
        }

        let totalQty = 0, totalRevenue = 0, totalExpense = 0;
        let prevQty = 0, prevRevenue = 0, prevExpense = 0;
        let prevQtyToDate = 0, prevRevenueToDate = 0, prevExpenseToDate = 0;

        const statement = {
            revFarm: 0, revCompany: 0, revVua: 0,
            expensed: 0, chiPhiKhac: 0, phanBon: 0, thuoc: 0, luong: 0, lai: 0, vatTu: 0, muaBong: 0,
            vanChuyen: 0, vanHanh: 0,
            totalRev: 0, totalExp: 0, netProfit: 0
        };

        const yearlyMonthlyData = Array.from({ length: 12 }, () => ({ qty: 0, revenue: 0, expense: 0 }));
        const dailyData = [];
        const quarterData = [
            { qty: 0, revFarm: 0, revVua: 0, expense: 0 },
            { qty: 0, revFarm: 0, revVua: 0, expense: 0 },
            { qty: 0, revFarm: 0, revVua: 0, expense: 0 }
        ];

        farmData.forEach(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return;

            const rowYear = d.getFullYear();
            const rowMonth = d.getMonth() + 1;

            let isCurr = false;
            let isPrev = false;

            if (isQuarterRange) {
                const qTarget = baselineQuarter || rangeVal;
                let inCurrQ = false;
                if (rangeVal === 'q1' && rowMonth >= 1 && rowMonth <= 3) inCurrQ = true;
                if (rangeVal === 'q2' && rowMonth >= 4 && rowMonth <= 6) inCurrQ = true;
                if (rangeVal === 'q3' && rowMonth >= 7 && rowMonth <= 9) inCurrQ = true;
                if (rangeVal === 'q4' && rowMonth >= 10 && rowMonth <= 12) inCurrQ = true;

                let inPrevQ = false;
                if (qTarget === 'q1' && rowMonth >= 1 && rowMonth <= 3) inPrevQ = true;
                if (qTarget === 'q2' && rowMonth >= 4 && rowMonth <= 6) inPrevQ = true;
                if (qTarget === 'q3' && rowMonth >= 7 && rowMonth <= 9) inPrevQ = true;
                if (qTarget === 'q4' && rowMonth >= 10 && rowMonth <= 12) inPrevQ = true;

                if (inCurrQ && rowYear === selectedYear) isCurr = true;
                if (inPrevQ && rowYear === baselineYear) isPrev = true;
            } else if (isMonthlyRange) {
                if (rowYear === selectedYear && rowMonth === selectedMonth) isCurr = true;
                if (rowYear === baselineYear && rowMonth === baselineMonth) isPrev = true;
            } else { // Yearly
                if (rowYear === selectedYear) isCurr = true;
                if (rowYear === baselineYear) isPrev = true;
            }

            if (!isCurr && !isPrev) return;

            const typeDT = (row["Loại DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT.toLowerCase().includes("vựa") || typeDT.toLowerCase().includes("vua");
            const isFarm = typeDT === "Farm" || typeDT === "";
            const loaiCP = (row["Loại CP"] || "").trim();

            const rawQty = parseFloat(row["Số lượng"]) || 0;
            const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
            const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
            const chiPhi = parseFloat(row["Chi Phí"]) || 0;

            let rev = 0, exp = 0, q = 0;
            const isExpenseCompany = (loaiCP === "Expensed");
            const isExpenseVua = (loaiCP === "Vật Tư KD" || loaiCP === "Vận Chuyển" || loaiCP === "Mua Bông");
            const isExpenseFarm = (!isExpenseCompany && !isExpenseVua);

            if (reportType === "Company") {
                if (isCompany) rev = dtKhac;
                if (isExpenseCompany) exp = chiPhi;
            } else if (reportType === "Vựa") {
                if (isVua) rev = dtKhac;
                if (isExpenseVua) exp = chiPhi;
            } else if (reportType === "Farm") {
                rev = dtBong + (isFarm ? dtKhac : 0);
                q = rawQty;
                if (isExpenseFarm) exp = chiPhi;
            } else {
                q = rawQty; rev = dtBong + dtKhac; exp = chiPhi;
            }

            if (isCurr) {
                totalQty += q; totalRevenue += rev; totalExpense += exp;

                statement.revFarm += dtBong + (isFarm ? dtKhac : 0);
                statement.revCompany += dtBong + (isCompany ? dtKhac : 0);
                if (isVua) statement.revVua += dtKhac;

                // Use lowercase comparison to match actual sheet data values (same as cashflow builder)
                const loaiCPLow = loaiCP.toLowerCase();
                if (loaiCPLow === "expensed") statement.expensed += chiPhi;
                else if (loaiCPLow === "phân" || loaiCPLow === "phan") statement.phanBon += chiPhi;
                else if (loaiCPLow === "thuốc" || loaiCPLow === "thuoc") statement.thuoc += chiPhi;
                else if (loaiCPLow === "công" || loaiCPLow === "cong") statement.luong += chiPhi;
                else if (loaiCPLow === "lãi" || loaiCPLow === "lai") statement.lai += chiPhi;
                else if (loaiCPLow === "vật tư" || loaiCPLow === "vat tu" || loaiCPLow === "vật tư kd" || loaiCPLow === "vat tu kd") statement.vatTu += chiPhi;
                else if (loaiCPLow === "mua bông" || loaiCPLow === "mua bong") statement.muaBong += chiPhi;
                else if (loaiCPLow === "vận chuyển" || loaiCPLow === "van chuyen") statement.vanChuyen += chiPhi;
                else if (loaiCPLow === "chi phí khác" || loaiCPLow === "chi phi khac") statement.chiPhiKhac += chiPhi;
                else if (chiPhi > 0) statement.chiPhiKhac += chiPhi; // catch-all → Chi phí khác

                if (!isMonthlyRange && !isQuarterRange) {
                    yearlyMonthlyData[d.getMonth()].qty += q;
                    yearlyMonthlyData[d.getMonth()].revenue += rev;
                    yearlyMonthlyData[d.getMonth()].expense += exp;
                } else if (isMonthlyRange) {
                    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                    if (dailyData.length === 0) {
                        for (let i = 0; i < daysInMonth; i++) dailyData.push({ qty: 0, revFarm: 0, revVua: 0, expense: 0 });
                    }
                    const dayIdx = d.getDate() - 1;
                    if (dayIdx >= 0 && dayIdx < dailyData.length) {
                        dailyData[dayIdx].qty += q;
                        dailyData[dayIdx].revFarm += dtBong;
                        if (isVua) dailyData[dayIdx].revVua += dtKhac;
                        dailyData[dayIdx].expense += exp;
                    }
                } else if (isQuarterRange) {
                    let quarterStartMonthObj;
                    if (rangeVal === 'q1') quarterStartMonthObj = 0;
                    else if (rangeVal === 'q2') quarterStartMonthObj = 3;
                    else if (rangeVal === 'q3') quarterStartMonthObj = 6;
                    else if (rangeVal === 'q4') quarterStartMonthObj = 9;

                    const monthIdxInQuarter = d.getMonth() - quarterStartMonthObj;
                    if (monthIdxInQuarter >= 0 && monthIdxInQuarter < 3) {
                        quarterData[monthIdxInQuarter].qty += q;
                        quarterData[monthIdxInQuarter].revFarm += dtBong;
                        if (isVua) quarterData[monthIdxInQuarter].revVua += dtKhac;
                        quarterData[monthIdxInQuarter].expense += exp;
                    }
                }
            } else if (isPrev) {
                prevQty += q; prevRevenue += rev; prevExpense += exp;
                if (checkIsBeforeOrOnRelativeDay(d, selectedYear, selectedMonth, rangeVal)) {
                    prevQtyToDate += q;
                    prevRevenueToDate += rev;
                    prevExpenseToDate += exp;
                }
            }
        });


        const totalProfit = totalRevenue - totalExpense;
        const prevProfit = prevRevenue - prevExpense;

        document.getElementById('kpi-qty').innerText = totalQty.toLocaleString('vi-VN');
        document.getElementById('kpi-revenue').innerText = formatCurrency(totalRevenue);
        document.getElementById('kpi-expense').innerText = formatCurrency(totalExpense);
        document.getElementById('kpi-profit').innerText = formatCurrency(totalProfit);

        // --- 1. Rankings & Net Profit Estimates ---
        const flowerRevenues = {};
        const flowerPrices = {};
        const buyerPurchases = {};
        const buyerDebts = {};

        // Calculate historical/global outstanding debts
        farmData.forEach(row => {
            const status = (row["Status"] || "").trim().toLowerCase();
            if (status === "xong") return; // Skip fully paid rows

            const buyer = (row["Người Mua"] || "Khách Lẻ").trim();
            if (buyer === "Nông Trại") return; // Skip internal farm rows

            const isVua = (row["Loại DT"] || "").trim().toLowerCase().includes("vựa") || (row["Loại DT"] || "").trim().toLowerCase().includes("vua");
            const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
            const ptVal = parseFloat(row["Tiền Phải Thu"]) || 0;
            const expected = isVua ? ptVal : dtBong;
            const daThuStr = row["Đã Thu"];
            const paid = daThuStr ? parseFloat(String(daThuStr).replace(/[^\d]/g, '')) || 0 : 0;
            const debt = expected - paid;

            buyerDebts[buyer] = (buyerDebts[buyer] || 0) + debt;
        });

        // Loop through all data again to calculate flower sales and buyer purchases in CURRENT period
        farmData.forEach(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return;
            const rowYear = d.getFullYear();
            const rowMonth = d.getMonth() + 1;

            let isCurr = false;
            if (isQuarterRange) {
                let inCurrQ = false;
                if (rangeVal === 'q1' && rowMonth >= 1 && rowMonth <= 3) inCurrQ = true;
                if (rangeVal === 'q2' && rowMonth >= 4 && rowMonth <= 6) inCurrQ = true;
                if (rangeVal === 'q3' && rowMonth >= 7 && rowMonth <= 9) inCurrQ = true;
                if (rangeVal === 'q4' && rowMonth >= 10 && rowMonth <= 12) inCurrQ = true;
                if (inCurrQ && rowYear === selectedYear) isCurr = true;
            } else if (isMonthlyRange) {
                if (rowYear === selectedYear && rowMonth === selectedMonth) isCurr = true;
            } else {
                if (rowYear === selectedYear) isCurr = true;
            }

            if (isCurr) {
                const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
                const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
                const flower = (row["Phân Loại Bông"] || "").trim();
                const price = parseFloat(row["Giá"]) || 0;

                if (flower && dtBong > 0) {
                    flowerRevenues[flower] = (flowerRevenues[flower] || 0) + dtBong;
                    if (price > 0) {
                        flowerPrices[flower] = Math.max(flowerPrices[flower] || 0, price);
                    }
                }

                const buyer = (row["Người Mua"] || "").trim();
                if (buyer && buyer !== "Nông Trại" && (dtBong > 0 || dtKhac > 0)) {
                    buyerPurchases[buyer] = (buyerPurchases[buyer] || 0) + (dtBong + dtKhac);
                }
            }
        });

        // Sort and Render Rankings (Revenue)
        const topFlowers = Object.entries(flowerRevenues)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        const rankFlowersEl = document.getElementById('rank-top-flowers');
        if (rankFlowersEl) {
            if (topFlowers.length > 0) {
                rankFlowersEl.innerHTML = topFlowers.map((tf, i) =>
                    `<li>${tf[0]} <span style="color:var(--secondary-color); font-weight:800; margin-left: 6px;">${formatShorthandCurrency(tf[1])}</span></li>`
                ).join('');
            } else {
                rankFlowersEl.innerHTML = '<li style="color:#64748b; font-weight:500;">Chưa có dữ liệu</li>';
            }
        }

        // Sort and Render Rankings (Max Price)
        const topPriceFlowers = Object.entries(flowerPrices)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        const rankPriceFlowersEl = document.getElementById('rank-top-price-flowers');
        if (rankPriceFlowersEl) {
            if (topPriceFlowers.length > 0) {
                rankPriceFlowersEl.innerHTML = topPriceFlowers.map((tf, i) =>
                    `<li>${tf[0]} <span style="color:#f59e0b; font-weight:800; margin-left: 6px;">${formatCurrency(tf[1])}</span></li>`
                ).join('');
            } else {
                rankPriceFlowersEl.innerHTML = '<li style="color:#64748b; font-weight:500;">Chưa có dữ liệu</li>';
            }
        }

        const topBuyer = Object.entries(buyerPurchases).sort((a, b) => b[1] - a[1])[0];
        const rankTopBuyerEl = document.getElementById('rank-top-buyer');
        if (rankTopBuyerEl) {
            rankTopBuyerEl.innerText = topBuyer ? `${topBuyer[0]} (${formatShorthandCurrency(topBuyer[1])})` : "Chưa có dữ liệu";
        }

        const topDebt = Object.entries(buyerDebts)
            .filter(entry => entry[1] > 0)
            .sort((a, b) => b[1] - a[1])[0];
        const rankTopDebtEl = document.getElementById('rank-top-debt-buyer');
        if (rankTopDebtEl) {
            rankTopDebtEl.innerText = topDebt ? `${topDebt[0]} (${formatShorthandCurrency(topDebt[1])})` : "Không có dư nợ";
        }

        // --- 2. Estimated Net Profit & Projections Calculation ---
        const deprRateInput = document.getElementById('depreciation-rate');

        // Calculate elapsed ratio and current/previous averages
        const elapsedRatio = getPeriodElapsedRatio(selectedYear, selectedMonth, rangeVal);
        const currAvgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
        const prevAvgPrice = prevQty > 0 ? prevRevenue / prevQty : 0;

        // Project current values to full period
        const projQty = elapsedRatio > 0 ? totalQty / elapsedRatio : 0;
        const projRevenue = elapsedRatio > 0 ? totalRevenue / elapsedRatio : 0;
        const projExpense = elapsedRatio > 0 ? totalExpense / elapsedRatio : 0;
        const projProfit = projRevenue - projExpense;

        // Save current totals and projections globally to prevent stale closures when the input listener triggers
        window.currentDashboardTotals = {
            elapsedRatio: elapsedRatio,
            totalQty: totalQty,
            totalRevenue: totalRevenue,
            totalExpense: totalExpense,
            totalProfit: totalProfit,
            projQty: projQty,
            projRevenue: projRevenue,
            projExpense: projExpense,
            projProfit: projProfit,
            currAvgPrice: currAvgPrice,
            prevAvgPrice: prevAvgPrice,
            prevQty: prevQty,
            prevRevenue: prevRevenue,
            prevExpense: prevExpense,
            prevQtyToDate: prevQtyToDate,
            prevRevenueToDate: prevRevenueToDate,
            prevExpenseToDate: prevExpenseToDate,
            prevAvgPriceToDate: prevQtyToDate > 0 ? prevRevenueToDate / prevQtyToDate : 0
        };

        function calculateNetProfitEstimate() {
            const deprRate = parseFloat(deprRateInput ? deprRateInput.value : 2) || 0;
            const totals = window.currentDashboardTotals || {
                elapsedRatio: 1,
                totalQty: 0,
                totalRevenue: 0,
                totalExpense: 0,
                totalProfit: 0,
                projQty: 0,
                projRevenue: 0,
                projExpense: 0,
                projProfit: 0,
                currAvgPrice: 0,
                prevAvgPrice: 0,
                prevQty: 0,
                prevRevenue: 0,
                prevExpense: 0,
                prevQtyToDate: 0,
                prevRevenueToDate: 0,
                prevExpenseToDate: 0,
                prevAvgPriceToDate: 0
            };

            // --- Smart Projection Logic ---
            // Base: Linear run-rate (always reliable: current_pace * full_period)
            const linearRevenue = totals.elapsedRatio > 0 ? totals.totalRevenue / totals.elapsedRatio : totals.totalRevenue;
            const linearExpense = totals.elapsedRatio > 0 ? totals.totalExpense / totals.elapsedRatio : totals.totalExpense;
            const linearQty = totals.elapsedRatio > 0 ? totals.totalQty / totals.elapsedRatio : totals.totalQty;

            // YoY growth rates (current-to-date vs same period last year)
            const revGrowthRate = (totals.prevRevenueToDate > 0 && totals.totalRevenue >= 0)
                ? totals.totalRevenue / totals.prevRevenueToDate : null;
            const expGrowthRate = (totals.prevExpenseToDate > 0 && totals.totalExpense >= 0)
                ? totals.totalExpense / totals.prevExpenseToDate : null;
            const qtyGrowthRate = (totals.prevQtyToDate > 0 && totals.totalQty >= 0)
                ? totals.totalQty / totals.prevQtyToDate : null;

            // YoY is only reliable when:
            // 1. We have enough prior-year data (prevToDate ≥ 5% of prevFull)
            // 2. The growth rate is within a sane band (0.5x – 3x)
            // 3. At least 20% of the period has elapsed (avoid day-1 noise)
            const MIN_YOY = 0.5, MAX_YOY = 3.0, MIN_ELAPSED_FOR_YOY = 0.20;

            function safeYoY(growthRate, prevFull, prevToDate, linear) {
                if (growthRate === null) return null;
                if (totals.elapsedRatio < MIN_ELAPSED_FOR_YOY) return null;   // too early
                if (prevToDate < prevFull * 0.02) return null;                 // prev data too sparse
                if (growthRate < MIN_YOY || growthRate > MAX_YOY) return null; // growth out of range
                return prevFull * growthRate;
            }

            const yoyRevenue = safeYoY(revGrowthRate, totals.prevRevenue, totals.prevRevenueToDate, linearRevenue);
            const yoyExpense = safeYoY(expGrowthRate, totals.prevExpense, totals.prevExpenseToDate, linearExpense);
            const yoyQty = safeYoY(qtyGrowthRate, totals.prevQty, totals.prevQtyToDate, linearQty);

            // Blend weight: 0% YoY at elapsed=0, up to 60% YoY when elapsed=100%
            const yoyW = Math.min(totals.elapsedRatio * 0.8, 0.6);
            const linW = 1 - yoyW;

            const projRevenue = yoyRevenue !== null ? (yoyRevenue * yoyW + linearRevenue * linW) : linearRevenue;
            const projExpense = yoyExpense !== null ? (yoyExpense * yoyW + linearExpense * linW) : linearExpense;
            const projQty = yoyQty !== null ? (yoyQty * yoyW + linearQty * linW) : linearQty;

            const projProfit = projRevenue - projExpense;
            const projDepr = projRevenue * (deprRate / 100);
            const projNetProfit = projProfit - projDepr;

            // Elements
            const progressBadge = document.getElementById('estimate-progress-badge');
            const priceCompareEl = document.getElementById('estimate-price-compare');
            const qtyCompareEl = document.getElementById('estimate-qty-compare');
            const estRevEl = document.getElementById('estimate-revenue');
            const estExpEl = document.getElementById('estimate-expense');
            const estDeprEl = document.getElementById('estimate-depreciation');
            const estNetProfitEl = document.getElementById('estimate-net-profit');
            const profitCompareEl = document.getElementById('estimate-profit-compare');

            // 1. Progress Badge
            if (progressBadge) {
                if (totals.elapsedRatio >= 1) {
                    progressBadge.innerText = "100% Hoàn thành";
                    progressBadge.style.background = "#d1fae5";
                    progressBadge.style.color = "#065f46";
                } else if (totals.elapsedRatio <= 0) {
                    progressBadge.innerText = "Chưa bắt đầu";
                    progressBadge.style.background = "#f1f5f9";
                    progressBadge.style.color = "#475569";
                } else {
                    progressBadge.innerText = `Tiến độ: ${(totals.elapsedRatio * 100).toFixed(0)}%`;
                    progressBadge.style.background = "#e0f2fe";
                    progressBadge.style.color = "#0369a1";
                }
            }

            // 2. Average Price Comparison (Forecasted vs previous year full period)
            if (priceCompareEl) {
                const projAvgPrice = projQty > 0 ? projRevenue / projQty : (totals.currAvgPrice || 0);
                const prevPrice = totals.prevAvgPrice || totals.prevAvgPriceToDate || 0;
                const diff = prevPrice > 0 ? ((projAvgPrice - prevPrice) / prevPrice) * 100 : 0;
                const sign = diff >= 0 ? "+" : "";
                const color = diff >= 0 ? "#10b981" : "#ef4444";
                const icon = diff >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
                priceCompareEl.innerHTML = `${formatCurrency(Math.round(projAvgPrice))} <span style="font-size: 0.72rem; color: ${color}; font-weight: 700; margin-left: 4px;"><i class="fa-solid ${icon}"></i> ${sign}${diff.toFixed(1)}%</span>`;
            }

            // 3. Volume Comparison (Forecasted quantity vs previous year full period)
            if (qtyCompareEl) {
                const prevQty = totals.prevQty || totals.prevQtyToDate || 0;
                const qDiff = prevQty > 0 ? ((projQty - prevQty) / prevQty) * 100 : 0;
                const sign = qDiff >= 0 ? "+" : "";
                const color = qDiff >= 0 ? "#10b981" : "#ef4444";
                const icon = qDiff >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
                qtyCompareEl.innerHTML = `${Math.round(projQty).toLocaleString('vi-VN')} <span style="font-size: 0.72rem; color: ${color}; font-weight: 700; margin-left: 4px;"><i class="fa-solid ${icon}"></i> ${sign}${qDiff.toFixed(1)}%</span>`;
            }

            // 4. Projected Income details
            if (estRevEl) estRevEl.innerText = formatCurrency(projRevenue);
            if (estExpEl) estExpEl.innerText = formatCurrency(projExpense);
            if (estDeprEl) estDeprEl.innerText = formatCurrency(projDepr);

            // 5. Projected Net Profit
            if (estNetProfitEl) {
                estNetProfitEl.innerText = formatCurrency(projNetProfit);
                estNetProfitEl.style.color = projNetProfit < 0 ? 'var(--danger)' : '#10b981';
            }

            // 6. Net Profit Comparison with Last Year
            if (profitCompareEl) {
                const prevDepr = totals.prevRevenue * (deprRate / 100);
                const prevNetProfit = (totals.prevRevenue - totals.prevExpense) - prevDepr;
                const profitDiff = prevNetProfit !== 0 ? ((projNetProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0;
                const sign = profitDiff >= 0 ? "+" : "";
                const color = profitDiff >= 0 ? "#10b981" : "#ef4444";
                const icon = profitDiff >= 0 ? "fa-caret-up" : "fa-caret-down";
                profitCompareEl.innerHTML = `Dự kiến: <span style="color: ${color}; font-weight: 800;"><i class="fa-solid ${icon}"></i> ${sign}${profitDiff.toFixed(1)}%</span> so với cùng kỳ năm trước (${formatShorthandCurrency(prevNetProfit)})`;
            }

            // 7. Store projection metadata for tooltip
            window._lastProjectionMeta = {
                elapsedRatio: totals.elapsedRatio,
                method: (yoyRevenue !== null || yoyExpense !== null) ? 'blend' : 'linear',
                yoyW: yoyW,
                linW: linW,
                linearRevenue, linearExpense,
                yoyRevenue, yoyExpense,
                projRevenue, projExpense, projQty,
                projNetProfit, projDepr,
                deprRate,
                revGrowthRate, expGrowthRate,
                prevRevenue: totals.prevRevenue,
                prevExpense: totals.prevExpense,
                prevRevenueToDate: totals.prevRevenueToDate,
                prevExpenseToDate: totals.prevExpenseToDate,
                totalRevenue: totals.totalRevenue,
                totalExpense: totals.totalExpense,
            };
            if (typeof recalcBreakEven === 'function') {
                recalcBreakEven();
            }
        }

        // Tooltip for LN RÒNG DỰ BÁO
        (function attachEstimateTooltip() {
            const container = document.getElementById('estimate-net-profit-container');
            if (!container || container._tooltipAttached) return;
            container._tooltipAttached = true;

            let tooltipEl = null;

            container.addEventListener('mouseenter', function () {
                const meta = window._lastProjectionMeta;
                if (!meta) return;

                const pct = (meta.elapsedRatio * 100).toFixed(0);
                const isBlend = meta.method === 'blend';
                const linPct = (meta.linW * 100).toFixed(0);
                const yoyPct = (meta.yoyW * 100).toFixed(0);

                const methodBadge = isBlend
                    ? `<span style="background:#d1fae5; color:#065f46; border-radius:4px; padding:1px 6px; font-weight:700;">Kết hợp (${linPct}% Linear + ${yoyPct}% YoY)</span>`
                    : `<span style="background:#e0f2fe; color:#0369a1; border-radius:4px; padding:1px 6px; font-weight:700;">Linear Run-rate (100%)</span>`;

                const yoyReasonHtml = !isBlend ? `
                    <div style="color:#94a3b8; font-size:0.75rem; margin-top:2px;">
                        ⚠️ YoY chưa áp dụng: ${meta.elapsedRatio < 0.20
                        ? `tiến độ chưa đủ ${(meta.elapsedRatio * 100).toFixed(0)}% < 20%`
                        : meta.revGrowthRate !== null && (meta.revGrowthRate < 0.5 || meta.revGrowthRate > 3.0)
                            ? `tỷ lệ tăng trưởng ngoài ngưỡng (${meta.revGrowthRate?.toFixed(1)}x)`
                            : 'không đủ dữ liệu năm trước'}
                    </div>` : '';

                const revGrowthHtml = meta.revGrowthRate !== null
                    ? `<span style="color:${meta.revGrowthRate >= 1 ? '#10b981' : '#f59e0b'}"> (${(meta.revGrowthRate * 100).toFixed(0)}% so YoY)</span>` : '';
                const expGrowthHtml = meta.expGrowthRate !== null
                    ? `<span style="color:${meta.expGrowthRate <= 1 ? '#10b981' : '#ef4444'}"> (${(meta.expGrowthRate * 100).toFixed(0)}% so YoY)</span>` : '';

                tooltipEl = document.createElement('div');
                tooltipEl.id = 'proj-tooltip';
                tooltipEl.innerHTML = `
                    <div style="font-weight:800; color:#1e293b; margin-bottom:8px; font-size:0.88rem; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
                        📊 Nguyên Lý Tính Dự Báo
                    </div>

                    <div style="margin-bottom:6px; font-size:0.78rem;">
                        <b>Phương pháp:</b> ${methodBadge}
                        ${yoyReasonHtml}
                    </div>

                    <div style="background:#f8fafc; border-radius:8px; padding:8px 10px; margin-bottom:6px; font-size:0.78rem; line-height:1.7;">
                        <div><b>📅 Tiến độ kỳ:</b> ${pct}% thời gian đã trôi qua</div>
                        <div><b>📈 Doanh thu thực tế:</b> ${formatCurrency(meta.totalRevenue)}${revGrowthHtml}</div>
                        <div><b>📉 Chi phí thực tế:</b> ${formatCurrency(meta.totalExpense)}${expGrowthHtml}</div>
                    </div>

                    <div style="background:#f0fdf4; border-radius:8px; padding:8px 10px; margin-bottom:6px; font-size:0.78rem; line-height:1.7;">
                        <div style="font-weight:700; color:#047857; margin-bottom:3px;">Kết quả chiếu đến cuối kỳ:</div>
                        <div>DT dự báo = ${formatCurrency(meta.projRevenue)}</div>
                        <div>CP dự báo = ${formatCurrency(meta.projExpense)}</div>
                        <div>(-) Khấu Hao ${meta.deprRate}% = ${formatCurrency(meta.projDepr)}</div>
                        <div style="border-top:1px solid #bbf7d0; margin-top:4px; padding-top:4px; font-weight:800;">
                            LN Ròng ≈ ${formatCurrency(meta.projNetProfit)}
                        </div>
                    </div>

                    <div style="font-size:0.72rem; color:#94a3b8; line-height:1.5; border-top:1px solid #f1f5f9; padding-top:6px;">
                        <b>Công thức:</b><br>
                        • <b>Linear:</b> Giá trị thực ÷ % tiến độ<br>
                        • <b>YoY:</b> Cùng kỳ năm trước × tỷ lệ tăng trưởng<br>
                        • YoY chỉ áp dụng khi ≥20% kỳ trôi qua &amp; tăng trưởng 0.5×–3×
                    </div>
                `;

                Object.assign(tooltipEl.style, {
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '0',
                    right: '0',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 20px 40px -8px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.1)',
                    padding: '14px 16px',
                    zIndex: '99999',
                    pointerEvents: 'none',
                    animation: 'fadeInUp 0.18s ease',
                    fontFamily: 'inherit',
                });

                container.appendChild(tooltipEl);
            });

            container.addEventListener('mouseleave', function () {
                if (tooltipEl && tooltipEl.parentNode) {
                    tooltipEl.parentNode.removeChild(tooltipEl);
                    tooltipEl = null;
                }
            });
        })();

        if (deprRateInput && !deprRateInput.dataset.listenerAttached) {
            deprRateInput.addEventListener('input', calculateNetProfitEstimate);
            deprRateInput.dataset.listenerAttached = "true";
        }
        calculateNetProfitEstimate();

        // --- 3. Render Expense Distribution Pie Chart ---
        if (typeof renderExpenseDistributionChart === 'function') {
            renderExpenseDistributionChart(statement);
        }

        // Update Growth Indicators
        function updateGrowth(id, curr, prev, compYear, unit = '', inverse = false) {
            const el = document.getElementById(id);
            if (!el) return;
            if (!prev || prev === 0) {
                el.innerHTML = `<span class="na">N/A</span>`;
                return;
            }
            const diffPct = ((curr - prev) / prev) * 100;
            const isPositive = diffPct >= 0;
            const colorClass = inverse ? (isPositive ? 'negative' : 'positive') : (isPositive ? 'positive' : 'negative');
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';

            // Format comparison value
            let prevFormatted = '';
            if (unit === '₫') {
                const absPrev = Math.abs(prev);
                if (absPrev >= 1000000) {
                    prevFormatted = (prev / 1000000).toFixed(1) + 'tr';
                } else if (absPrev >= 1000) {
                    prevFormatted = (prev / 1000).toFixed(0) + 'k';
                } else {
                    prevFormatted = prev.toString();
                }
            } else {
                prevFormatted = prev.toLocaleString('vi-VN');
            }

            el.className = `growth-badge ${colorClass}`;
            el.innerHTML = `<i class="fa-solid ${icon}"></i> ${Math.abs(diffPct).toFixed(1)}% <span style="font-size: 0.85em; margin-left: 4px; opacity: 0.9;">(${prevFormatted} vs ${compTitle})</span>`;
        }

        const compTitle = isMonthlyRange ? `T${baselineMonth}/${baselineYear}` : (isQuarterRange ? `Quý ${(baselineQuarter || rangeVal).substring(1).toUpperCase()} ${baselineYear}` : `Năm ${baselineYear}`);
        updateGrowth('growth-qty', totalQty, prevQty, compTitle, '');
        updateGrowth('growth-revenue', totalRevenue, prevRevenue, compTitle, '₫');
        updateGrowth('growth-expense', totalExpense, prevExpense, compTitle, '₫', true);
        updateGrowth('growth-profit', totalProfit, prevProfit, compTitle, '₫');

        renderDetailedStatement(statement, totalRevenue, totalExpense, totalProfit);

        if (!isMonthlyRange && !isQuarterRange) {
            const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            renderYearlyCharts(labels, yearlyMonthlyData, selectedYear);
        } else if (isMonthlyRange) {
            const filteredDays = [];
            dailyData.forEach((d, i) => {
                if (d.qty > 0 || d.revFarm > 0 || d.revVua > 0 || d.expense > 0) {
                    filteredDays.push({ label: `${i + 1}`, data: d });
                }
            });
            renderMonthlyCombinedChart(filteredDays.map(fd => fd.label), filteredDays.map(fd => fd.data), selectedMonth, selectedYear);
        } else if (isQuarterRange) {
            let quarterStartNum = (parseInt(rangeVal.substring(1)) - 1) * 3 + 1;
            const labels = [
                `Tháng ${quarterStartNum}`,
                `Tháng ${quarterStartNum + 1}`,
                `Tháng ${quarterStartNum + 2}`
            ];
            renderMonthlyCombinedChart(labels, quarterData, null, selectedYear);
        }
    }

    function updateDashboardFinancialRatios(year, targetConfig = null) {
        const config = targetConfig || {
            container: 'dashboard-financial-ratios',
            status: 'financial-year-status',
            yearText: null
        };

        const container = document.getElementById(config.container);
        if (!container) return;

        const cacheJson = localStorage.getItem('cached_financial_report');
        if (!cacheJson) {
            container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-light); text-align: center; width: 100%;">Tải <a href="#" onclick="switchView(\'financial\'); return false;" style="color: var(--primary-color);">Báo cáo tài chính</a> để xem chỉ số phân tích.</p>';
            return;
        }

        try {
            const result = JSON.parse(cacheJson);
            const values = result.data || [];
            if (values.length < 1) return;

            // Updated Status Logic
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const yearNum = parseInt(year);
            const statusEl = document.getElementById(config.status);

            if (statusEl) {
                if (yearNum < currentYear) {
                    statusEl.innerHTML = '<i class="fa-solid fa-clipboard-check"></i> Đã kiểm toán';
                    statusEl.style.background = 'rgba(16, 185, 129, 0.1)';
                    statusEl.style.color = '#059669';
                } else if (yearNum === currentYear) {
                    const remains = 12 - currentMonth;
                    statusEl.innerHTML = `<i class="fa-solid fa-bullseye"></i> Dự kiến (Còn ${remains} tháng)`;
                    statusEl.style.background = 'rgba(245, 158, 11, 0.1)';
                    statusEl.style.color = '#d97706';
                } else {
                    statusEl.innerHTML = '<i class="fa-solid fa-calendar-plus"></i> Kế hoạch';
                    statusEl.style.background = 'rgba(99, 102, 241, 0.1)';
                    statusEl.style.color = '#4f46e5';
                }
            }

            const yearTextEl = config.yearText ? document.getElementById(config.yearText) : null;
            if (yearTextEl) yearTextEl.innerText = year;

            const headerRow = values[0];
            const yearIdx = headerRow.findIndex(cell => String(cell).includes(year));

            if (yearIdx === -1) {
                container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-light); text-align: center; width: 100%;">Không có dữ liệu phân tích cho năm ${year}.</p>`;
                return;
            }

            const findValAtCol = (label, colIdx) => {
                const row = values.find(r => String(r[0] || "").toUpperCase() === label.toUpperCase());
                return row ? row[colIdx] : null;
            };

            const findVal = (label) => findValAtCol(label, yearIdx);

            const roe = findVal("ROE");
            const roa = findVal("ROA");
            const debt = findVal("NỢ / VCSH") || findVal("NỢ/VCSH");
            const payback = findVal("PAYBACK TIME");
            const equityCurr = findVal("VỐN CHỦ SỞ HỮU") || 0;
            const equityPrev = (yearIdx > 1) ? (findValAtCol("VỐN CHỦ SỞ HỮU", yearIdx - 1) || 0) : 0;
            const netProfit = findVal("LỢI NHUẬN SAU THUẾ") || findVal("LỢI NHUẬN") || 0;

            // Balance Sheet KPIs
            const totalAssets = findVal("TỔNG CỘNG TÀI SẢN") || findVal("TỔNG TÀI SẢN") || 0;
            const totalDebt = findVal("TỔNG NỢ PHẢI TRẢ") || 0;
            const vcshGrowth = findVal("(TỶ LỆ TĂNG TRƯỞNG VCSH)") || findVal("TỶ LỆ TĂNG TRƯỞNG VCSH") || findVal("TĂNG TRƯỞNG VCSH") || null;

            const formatPct = (val) => {
                if (typeof val !== 'number') return "N/A";
                let pct = (Math.abs(val) < 2) ? val * 100 : val;
                return pct.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
            };

            const formatPayback = (val) => {
                if (typeof val !== 'number' || isNaN(val)) return "N/A";
                let totalMonths = Math.round(val * 12);
                const years = Math.floor(totalMonths / 12);
                const months = totalMonths % 12;
                let res = "";
                if (years > 0) res += years + (years > 1 ? " Years" : " Year");
                if (months > 0) {
                    if (res) res += " ";
                    res += months + (months > 1 ? " Months" : " Month");
                }
                return res || "0 Months";
            };

            const formatBalanceVal = (val) => {
                if (typeof val !== 'number' || isNaN(val)) return "N/A";
                const absVal = Math.abs(val);
                if (absVal >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ';
                if (absVal >= 1000000) return (val / 1000000).toFixed(1) + ' Tr';
                return formatNumber(val);
            };

            const goalVal = findVal("MỤC TIÊU") || 0;
            const remainingGoal = goalVal - equityCurr;

            // Tính màu cho tỷ lệ tăng trưởng VCSH
            let vcshGrowthPct = null;
            if (typeof vcshGrowth === 'number') {
                vcshGrowthPct = Math.abs(vcshGrowth) < 2 ? vcshGrowth * 100 : vcshGrowth;
            }
            const vcshColor = vcshGrowthPct !== null ? (vcshGrowthPct > 5 ? '#a7f3d0' : '#fca5a5') : 'white';
            const vcshIcon = vcshGrowthPct !== null ? (vcshGrowthPct > 5 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down') : 'fa-chart-simple';

            container.innerHTML = `
                <div class="ratio-summary-card">
                    <span class="ratio-label"><i class="fa-solid fa-chart-line"></i> ROE</span>
                    <span class="ratio-value">${formatPct(roe)}</span>
                </div>
                <div class="ratio-summary-card">
                    <span class="ratio-label"><i class="fa-solid fa-chart-pie"></i> ROA</span>
                    <span class="ratio-value">${formatPct(roa)}</span>
                </div>
                <div class="ratio-summary-card">
                    <span class="ratio-label"><i class="fa-solid fa-scale-balanced"></i> Nợ / VCSH</span>
                    <span class="ratio-value">${formatPct(debt)}</span>
                </div>
                <div class="ratio-summary-card highlight-target">
                    <span class="ratio-label"><i class="fa-solid fa-bullseye"></i> Mục Tiêu Cần Đạt</span>
                    <span class="ratio-value">${remainingGoal > 0 ? formatNumber(remainingGoal) : "✔ Hoàn thành"}</span>
                </div>
                <div class="ratio-summary-card highlight-warning">
                    <span class="ratio-label"><i class="fa-solid fa-hourglass-half"></i> Hoàn Vốn</span>
                    <span class="ratio-value">${formatPayback(payback)}</span>
                </div>

                <!-- Divider Row 2: Chỉ số bảng cân đối kế toán -->
                <div class="ratio-row2-divider">
                    <i class="fa-solid fa-building-columns"></i> Chỉ Số Tài Chính
                </div>
                <div class="ratio-summary-card ratio-bs-card" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important;">
                    <span class="ratio-label"><i class="fa-solid fa-vault"></i> Tổng Tài Sản</span>
                    <span class="ratio-value" style="font-size: 1.3rem !important;">${formatBalanceVal(totalAssets)}</span>
                </div>
                <div class="ratio-summary-card ratio-bs-card" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;">
                    <span class="ratio-label"><i class="fa-solid fa-file-invoice-dollar"></i> Tổng Nợ Phải Trả</span>
                    <span class="ratio-value" style="font-size: 1.3rem !important;">${formatBalanceVal(totalDebt)}</span>
                </div>
                <div class="ratio-summary-card ratio-bs-card" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;">
                    <span class="ratio-label"><i class="fa-solid fa-sack-dollar"></i> Lợi Nhuận</span>
                    <span class="ratio-value" style="font-size: 1.3rem !important; color: ${typeof netProfit === 'number' && netProfit < 0 ? '#fecaca' : '#ffffff'} !important;">${formatBalanceVal(netProfit)}</span>
                </div>
                <div class="ratio-summary-card ratio-bs-card" style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%) !important;">
                    <span class="ratio-label"><i class="fa-solid fa-landmark"></i> Vốn Chủ Sở Hữu</span>
                    <span class="ratio-value" style="font-size: 1.3rem !important;">${formatBalanceVal(equityCurr)}</span>
                </div>
                <div class="ratio-summary-card ratio-bs-card" style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%) !important;">
                    <span class="ratio-label"><i class="fa-solid ${vcshIcon}"></i> Tăng Trưởng VCSH</span>
                    <span class="ratio-value" style="font-size: 1.3rem !important; color: ${vcshColor} !important;">${vcshGrowthPct !== null ? vcshGrowthPct.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%' : 'N/A'}</span>
                </div>
            `;
        } catch (e) {
            console.error(e);
        }
    }

    const annualRatiosYearSelect = document.getElementById('financial-ratios-year');
    if (annualRatiosYearSelect) {
        annualRatiosYearSelect.addEventListener('change', () => {
            updateDashboardFinancialRatios(annualRatiosYearSelect.value, {
                container: 'annual-financial-ratios',
                status: 'annual-year-status',
                yearText: 'annual-health-year-text'
            });
        });
    }

    // Cashflow Filter listeners
    const cfMonth = document.getElementById('cashflow-month');
    const cfYear = document.getElementById('cashflow-year');
    const cfMonth2 = document.getElementById('cashflow-month-2');
    const cfYear2 = document.getElementById('cashflow-year-2');
    const cfCompareToggle = document.getElementById('cashflow-compare-toggle');
    const cfComparisonPicker = document.getElementById('cashflow-comparison-picker');

    if (cfMonth) {
        cfMonth.addEventListener('change', () => {
            updateCashFlowReport();
            updateCashInHand();
        });
    }
    if (cfYear) {
        cfYear.addEventListener('change', () => {
            updateCashFlowReport();
            updateCashInHand();
        });
    }
    if (cfMonth2) cfMonth2.addEventListener('change', updateCashFlowReport);
    if (cfYear2) cfYear2.addEventListener('change', updateCashFlowReport);

    const cfBeDeprInput = document.getElementById('cashflow-be-depr-input');
    if (cfBeDeprInput) {
        cfBeDeprInput.addEventListener('input', (e) => {
            let originalValue = e.target.value;
            let selectionEnd = e.target.selectionEnd;
            let offsetFromEnd = originalValue.length - selectionEnd;
            
            let digits = originalValue.replace(/[^\d]/g, '');
            if (!digits) {
                e.target.value = "";
                recalcBreakEven();
                return;
            }
            
            let num = parseInt(digits, 10) || 0;
            let formatted = new Intl.NumberFormat('vi-VN').format(num);
            e.target.value = formatted;
            
            let newPos = Math.max(0, formatted.length - offsetFromEnd);
            e.target.setSelectionRange(newPos, newPos);
            
            recalcBreakEven();
        });
    }

    if (cfCompareToggle) {
        cfCompareToggle.addEventListener('change', (e) => {
            if (cfComparisonPicker) {
                cfComparisonPicker.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked) {
                    // Tự động chọn cùng kỳ năm trước khi gạt nút so sánh
                    const currentYear = new Date().getFullYear();
                    const currentMonthNum = new Date().getMonth() + 1;
                    const prevYear = currentYear - 1;

                    if (cfYear2) {
                        // Kiểm tra xem năm trước có trong danh sách chọn không
                        const hasPrevYear = Array.from(cfYear2.options).some(opt => opt.value == prevYear);
                        if (hasPrevYear) cfYear2.value = prevYear;
                    }
                    if (cfMonth2) cfMonth2.value = currentMonthNum.toString();
                }
            }
            updateCashFlowReport();
        });
    }

    function updateCashFlowReport() {
        const isComparison = cfCompareToggle && cfCompareToggle.checked;

        function getStatement(yearId, monthId) {
            const yearSelect = document.getElementById(yearId);
            const monthSelect = document.getElementById(monthId);
            const selectedYear = parseInt(yearSelect.value) || new Date().getFullYear();
            const selectedMonthStr = monthSelect.value;

            const statement = {
                period: selectedMonthStr === "all" ? `Năm ${selectedYear}` : `Tháng ${selectedMonthStr}/${selectedYear}`,
                revFarm: 0, revCompany: 0, revVua: 0,
                expensed: 0, phanBon: 0, thuoc: 0, luong: 0, lai: 0, vatTu: 0, muaBong: 0,
                vanChuyen: 0, vanHanh: 0,
                totalRev: 0, totalExp: 0, netProfit: 0
            };

            farmData.forEach(row => {
                const d = row.parsedDate;
                if (!d || isNaN(d.getTime())) return;
                const rowYear = d.getFullYear();
                const rowMonth = d.getMonth() + 1;

                if (rowYear !== selectedYear) return;
                if (selectedMonthStr !== "all" && rowMonth !== parseInt(selectedMonthStr)) return;

                const typeDT = (row["Loại DT"] || "").trim();
                const isCompany = typeDT === "Company";
                const isVua = typeDT.toLowerCase().includes("vựa") || typeDT.toLowerCase().includes("vua");
                const isFarm = typeDT === "Farm" || typeDT === "";

                const loaiCP = (row["Loại CP"] || "").trim().toLowerCase();

                const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
                const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
                const chiPhi = parseFloat(row["Chi Phí"]) || 0;

                const rowRevenue = (chiPhi > 0 && dtKhac === chiPhi) ? 0 : dtKhac;

                // Doanh thu Farm chuẩn theo yêu cầu: Tổng cột F (Doanh Thu Bông)
                statement.revFarm += dtBong;

                if (isCompany) statement.revCompany += rowRevenue;
                else if (isVua) statement.revVua += rowRevenue;
                else if (isFarm && rowRevenue > 0) {
                    statement.revCompany += rowRevenue;
                }

                statement.totalRev += (dtBong + rowRevenue);
                statement.totalExp += chiPhi;

                if (loaiCP === "expensed") statement.expensed += chiPhi;
                else if (loaiCP === "phân" || loaiCP === "phan") statement.phanBon += chiPhi;
                else if (loaiCP === "thuốc" || loaiCP === "thuoc") statement.thuoc += chiPhi;
                else if (loaiCP === "công" || loaiCP === "cong") statement.luong += chiPhi;
                else if (loaiCP === "lãi" || loaiCP === "lai") statement.lai += chiPhi;
                else if (loaiCP === "vật tư" || loaiCP === "vat tu" || loaiCP === "vật tư kd") statement.vatTu += chiPhi;
                else if (loaiCP === "mua bông") statement.muaBong += chiPhi;
                else if (loaiCP === "vận chuyển" || loaiCP === "van chuyen") statement.vanChuyen += chiPhi;
                else if (loaiCP === "chi phí khác" || loaiCP === "chi phi khac") statement.vanHanh += chiPhi;
                else if (chiPhi > 0) statement.vanHanh += chiPhi;
            });

            statement.netProfit = statement.totalRev - statement.totalExp;
            return statement;
        }

        const s1 = getStatement('cashflow-year', 'cashflow-month');
        const s2 = isComparison ? getStatement('cashflow-year-2', 'cashflow-month-2') : null;

        renderDetailedStatement(s1, s2);
    }

    function renderDetailedStatement(s1, s2 = null) {
        const container = document.getElementById('statement-content');
        if (!container) return;

        const isCmp = s2 !== null;

        function formatVal(val) {
            return formatCurrency(val);
        }

        function getDiffHtml(v1, v2) {
            if (!isCmp) return '';
            const diff = v1 - v2;
            const pct = v2 !== 0 ? ((diff / Math.abs(v2)) * 100).toFixed(1) : (v1 !== 0 ? 100 : 0);
            const cls = diff > 0 ? 'diff-up' : (diff < 0 ? 'diff-down' : '');
            const sign = diff > 0 ? '+' : '';
            return `<div class="comparison-col ${cls}"><span class="diff-tag">(${sign}${pct}%)</span></div>`;
        }

        function renderRow(label, v1, v2, type = "normal") {
            let rowClass = "statement-row";
            if (type === "title") rowClass += " main-title";
            if (type === "indented") rowClass += " indented";
            if (type === "sub-indented") rowClass += " sub-indented";
            if (type === "total") rowClass += " total-line";
            if (type === "net") rowClass += " net-profit";

            // Define which categories have details
            const detailLabels = ["Doanh thu Farm", "Company", "Vựa", "Expensed", "Vật Tư", "Mua Bông", "Phân bón", "Thuốc", "Lương", "Lãi", "Vận Chuyển", "Chi phí khác"];
            const hasDetails = detailLabels.includes(label);
            if (hasDetails) rowClass += " has-details";

            return `
                <div class="${rowClass}" ${hasDetails ? `data-detail-type="${label}"` : ''}>
                    <span class="statement-label">
                        ${label}
                        ${hasDetails ? ` <i class="cashflow-info-btn fa-solid fa-circle-info" style="cursor: pointer !important; opacity: 0.55; margin-left: 6px; font-size: 0.82rem; transition: all 0.25s;" title="Xem chi tiết ${label}"></i>` : ''}
                    </span>
                    <div class="comparison-col statement-value">${formatVal(v1)}</div>
                    ${isCmp ? `<div class="comparison-col statement-value" style="color: var(--text-light); text-transform:none;">${formatVal(v2)}</div>` : ''}
                    ${getDiffHtml(v1, v2)}
                </div>
            `;
        }

        let html = `
            <div class="statement-header-row">
                <span class="statement-label">Diễn giải hạng mục</span>
                <div class="comparison-col" style="text-align: right;">${s1.period}</div>
                ${isCmp ? `<div class="comparison-col" style="text-align: right; color: var(--text-light); text-transform:none;">${s2.period}</div>` : ''}
                ${isCmp ? `<div class="comparison-col" style="text-align: right;">% +/-</div>` : ''}
            </div>
        `;

        html += renderRow("Doanh thu Farm", s1.revFarm, isCmp ? s2.revFarm : 0, "title");
        html += renderRow("Doanh thu khác", s1.revCompany + s1.revVua, isCmp ? (s2.revCompany + s2.revVua) : 0, "title");
        html += renderRow("Company", s1.revCompany, isCmp ? s2.revCompany : 0, "indented");
        html += renderRow("Vựa", s1.revVua, isCmp ? s2.revVua : 0, "indented");

        html += renderRow("Tổng Doanh Thu", s1.totalRev, isCmp ? s2.totalRev : 0, "total");

        html += renderRow("Khấu trừ:", 0, 0, "title");
        html += renderRow("Expensed", s1.expensed, isCmp ? s2.expensed : 0, "indented");

        // Group 1: Chi Phí Vựa
        const totalVua1 = s1.vatTu + s1.muaBong;
        const totalVua2 = isCmp ? (s2.vatTu + s2.muaBong) : 0;
        html += renderRow("Chi Phí Vựa", totalVua1, totalVua2, "indented");
        html += renderRow("Vật Tư", s1.vatTu, isCmp ? s2.vatTu : 0, "sub-indented");
        html += renderRow("Mua Bông", s1.muaBong, isCmp ? s2.muaBong : 0, "sub-indented");

        // Group 2: Chi Phí Vận Hành
        const totalOps1 = s1.vanChuyen + s1.vanHanh + s1.phanBon + s1.thuoc + s1.luong + s1.lai;
        const totalOps2 = isCmp ? (s2.vanChuyen + s2.vanHanh + s2.phanBon + s2.thuoc + s2.luong + s2.lai) : 0;

        html += renderRow("Chi Phí Vận Hành", totalOps1, totalOps2, "indented");
        html += renderRow("Phân bón", s1.phanBon, isCmp ? s2.phanBon : 0, "sub-indented");
        html += renderRow("Thuốc", s1.thuoc, isCmp ? s2.thuoc : 0, "sub-indented");
        html += renderRow("Lương", s1.luong, isCmp ? s2.luong : 0, "sub-indented");
        html += renderRow("Lãi", s1.lai, isCmp ? s2.lai : 0, "sub-indented");
        html += renderRow("Vận Chuyển", s1.vanChuyen, isCmp ? s2.vanChuyen : 0, "sub-indented");
        html += renderRow("Chi phí khác", s1.vanHanh, isCmp ? s2.vanHanh : 0, "sub-indented");

        html += renderRow("Tổng Chi Phí", s1.totalExp, isCmp ? s2.totalExp : 0, "total");
        html += renderRow("Lợi nhuận ròng", s1.netProfit, isCmp ? s2.netProfit : 0, "net");

        container.innerHTML = isCmp ? `<div class="comparison-table-wrapper">${html}</div>` : html;
        initCashFlowDrawer();
        renderCashflowExpenseChart(s1);
        renderCashflowBreakEven(s1);
    }

    function recalcBreakEven() {
        if (!currentCashflowStatement) return;
        
        const monthSelect = document.getElementById('cashflow-month');
        const yearSelect = document.getElementById('cashflow-year');
        const selectedMonthStr = monthSelect ? monthSelect.value : "all";
        const selectedYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();

        let numMonths = 1;
        if (selectedMonthStr === "all") {
            const now = new Date();
            const currentYear = now.getFullYear();
            if (selectedYear < currentYear) {
                numMonths = 12;
            } else if (selectedYear === currentYear) {
                numMonths = now.getMonth() + 1; // e.g. June = 6
            } else {
                numMonths = 12;
            }
        }

        const inputEl = document.getElementById('cashflow-be-depr-input');
        let monthlyDepr = 45000000; // default
        if (inputEl) {
            const val = parseMoney(inputEl.value);
            if (!isNaN(val) && val >= 0) {
                monthlyDepr = val;
            }
        }
        
        const additionalFixedCost = monthlyDepr * numMonths;

        const s = currentCashflowStatement;
        
        // 1. Variable Costs
        const variableCosts = s.phanBon + s.thuoc + s.muaBong + s.vanChuyen;
        
        // 2. Fixed Costs
        const fixedCostsFromStatement = s.luong + s.lai + s.vatTu + s.expensed + s.vanHanh;
        const totalFixedCosts = fixedCostsFromStatement + additionalFixedCost;
        
        // 3. Break-even Revenue (Option 2: Cash-Outflow Recovery)
        const breakEvenRevenue = totalFixedCosts + variableCosts;
        
        // 4. Gap / Difference (excluding Company revenue)
        const actualRevenueForBE = s.totalRev - (s.revCompany || 0);
        const diff = actualRevenueForBE - breakEvenRevenue;
        
        // 5. Calculate Average Price of Flowers for selected period
        let flowerQty = 0;
        let flowerRev = 0;

        if (farmData && farmData.length > 0) {
            farmData.forEach(row => {
                const d = row.parsedDate;
                if (!d || isNaN(d.getTime())) return;
                const rowYear = d.getFullYear();
                const rowMonth = d.getMonth() + 1;

                if (rowYear !== selectedYear) return;
                if (selectedMonthStr !== "all" && rowMonth !== parseInt(selectedMonthStr)) return;

                const qty = parseFloat(String(row["Số lượng"]).replace(/\./g, '').replace(/,/g, '.')) || 0;
                const rev = parseFloat(String(row["Doanh Thu Bông"]).replace(/\./g, '').replace(/,/g, '.')) || 0;

                flowerQty += qty;
                flowerRev += rev;
            });
        }

        const actualAvgPrice = flowerQty > 0 ? (flowerRev / flowerQty) : 0;

        // Check if forecast matches the Cash Flow selected period
        const reportMonth = document.getElementById('report-month')?.value;
        const reportYear = document.getElementById('report-year')?.value;
        const reportFilter = document.getElementById('report-filter')?.value || 'month';
        const reportRange = document.getElementById('report-range')?.value || 'month';

        let avgPrice = 0;
        let isForecastPrice = false;

        const isMatch = (selectedYear.toString() === reportYear) && (
            (selectedMonthStr === "all" && reportFilter === "year") ||
            (selectedMonthStr === reportMonth && reportFilter === "month" && reportRange === "month")
        );

        if (isMatch && window._lastProjectionMeta && window._lastProjectionMeta.projQty > 0) {
            avgPrice = window._lastProjectionMeta.projRevenue / window._lastProjectionMeta.projQty;
            isForecastPrice = true;
        } else {
            avgPrice = actualAvgPrice;
        }

        const resultsEl = document.getElementById('cashflow-be-results');
        if (resultsEl) {
            const statusColor = diff >= 0 ? '#10b981' : '#ef4444';
            const statusSign = diff >= 0 ? '+' : '';
            const statusText = diff >= 0 ? 'Đã vượt điểm hòa vốn (Có lãi)' : 'Chưa đạt điểm hòa vốn (Thâm hụt)';
            const statusBg = diff >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

            let flowerBeHtml = '';
            if (avgPrice > 0) {
                const beFlowers = breakEvenRevenue / avgPrice;
                flowerBeHtml = `
                    <div style="font-size: 0.88rem; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                        <span style="color: var(--text-light); border-bottom: 1px dotted #94a3b8; cursor: help;" title="${isForecastPrice ? 'Giá bán trung bình dự báo từ mô hình dự phóng YoY/Linear của trang Dự báo' : 'Giá bán trung bình thực tế = Tổng doanh thu bông / Tổng số lượng hoa thực tế trong kỳ'}">Giá bán TB ${isForecastPrice ? '(Dự báo)' : '(Thực tế)'}:</span>
                        <strong style="color: var(--text-dark);">${formatCurrency(Math.round(avgPrice))} / bông</strong>
                    </div>
                    <div style="font-size: 0.95rem; display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.1); margin-top: 4px;">
                        <span style="font-weight: 700; color: var(--text-dark); border-bottom: 1px dotted #94a3b8; cursor: help;" title="Số lượng hoa cần bán = Doanh thu hòa vốn / Giá bán trung bình">SL hoa hòa vốn:</span>
                        <strong style="color: #6366f1; font-size: 1.05rem;">${Math.ceil(beFlowers).toLocaleString('vi-VN')} bông</strong>
                    </div>
                    <div style="font-size: 0.95rem; display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.1); margin-top: 4px;">
                        <span style="font-weight: 700; color: var(--text-dark); border-bottom: 1px dotted #94a3b8; cursor: help;" title="Tổng số lượng hoa thực tế bán ra ghi nhận trong báo cáo dòng tiền">SL hoa thực tế:</span>
                        <strong style="color: ${statusColor}; font-size: 1.05rem;">${Math.round(flowerQty).toLocaleString('vi-VN')} bông</strong>
                    </div>
                `;
            }

            resultsEl.innerHTML = `
                <div style="font-size: 0.88rem; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                    <span style="color: var(--text-light); border-bottom: 1px dotted #94a3b8; cursor: help;" title="CP cố định vận hành = Lương + Lãi vay + Vật tư KD + Tiêu dùng (Expensed) + Vận hành khác">CP cố định vận hành:</span>
                    <strong style="color: var(--text-dark);">${formatCurrency(fixedCostsFromStatement)}</strong>
                </div>
                <div style="font-size: 0.88rem; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                    <span style="color: var(--text-light); border-bottom: 1px dotted #94a3b8; cursor: help;" title="${selectedMonthStr === 'all' ? 'Khấu hao bổ sung = Khấu hao mỗi tháng (' + formatCurrency(monthlyDepr) + ') × ' + numMonths + ' tháng' : 'Khấu hao bổ sung do người dùng nhập ở ô phía trên'}">Khấu hao bổ sung${selectedMonthStr === 'all' ? ' (' + numMonths + 'T)' : ''}:</span>
                    <strong style="color: var(--text-dark);">${formatCurrency(additionalFixedCost)}</strong>
                </div>
                <div style="font-size: 0.88rem; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                    <span style="color: var(--text-light); border-bottom: 1px dotted #94a3b8; cursor: help;" title="Tổng chi phí cố định (FC) = Chi phí cố định vận hành + Khấu hao bổ sung">Tổng CP cố định (FC):</span>
                    <strong style="color: var(--text-dark);">${formatCurrency(totalFixedCosts)}</strong>
                </div>
                <div style="font-size: 0.88rem; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                    <span style="color: var(--text-light); border-bottom: 1px dotted #94a3b8; cursor: help;" title="Tổng chi phí biến đổi (VC) = Phân bón + Thuốc + Mua bông + Vận chuyển">Tổng CP biến đổi (VC):</span>
                    <strong style="color: var(--text-dark);">${formatCurrency(variableCosts)}</strong>
                </div>
                <div style="font-size: 0.95rem; display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.1); margin-top: 4px;">
                    <span style="font-weight: 700; color: var(--text-dark); border-bottom: 1px dotted #94a3b8; cursor: help;" title="Doanh thu Hòa vốn = Tổng chi phí cố định (FC) + Tổng chi phí biến đổi (VC)">Doanh thu Hòa vốn:</span>
                    <strong style="color: #4f46e5; font-size: 1.05rem;">${formatCurrency(breakEvenRevenue)}</strong>
                </div>
                <div style="font-size: 0.95rem; display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                    <span style="font-weight: 700; color: var(--text-dark); border-bottom: 1px dotted #94a3b8; cursor: help;" title="Tổng doanh thu thực tế ghi nhận trong kỳ không bao gồm doanh thu Company (chỉ tính Farm và Vựa)">Doanh thu thực tế:</span>
                    <strong style="color: ${statusColor}; font-size: 1.05rem;">${formatCurrency(actualRevenueForBE)}</strong>
                </div>
                ${flowerBeHtml}
                <div style="margin-top: 8px; padding: 10px; border-radius: 10px; background-color: ${statusBg}; color: ${statusColor}; text-align: center; font-weight: 700; font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px; cursor: help;" title="Chênh lệch so với điểm hòa vốn = Doanh thu thực tế - Doanh thu hòa vốn">
                    <div>${statusText}</div>
                    <div style="font-size: 1rem; font-weight: 800;">
                        ${statusSign}${formatCurrency(diff)}
                    </div>
                </div>
            `;
        }
    }

    function renderCashflowBreakEven(s) {
        currentCashflowStatement = s;
        recalcBreakEven();
    }

    function renderCashflowExpenseChart(s) {
        const canvas = document.getElementById('cashflowExpenseChart');
        const legendEl = document.getElementById('cashflow-expense-legend');
        if (!canvas) return;

        if (cashflowExpenseChartInstance) {
            cashflowExpenseChartInstance.destroy();
            cashflowExpenseChartInstance = null;
        }

        const categories = [
            { label: "Expensed", val: s.expensed, color: "#64748b" },
            { label: "Vật Tư", val: s.vatTu, color: "#ec4899" },
            { label: "Mua Bông", val: s.muaBong, color: "#ef4444" },
            { label: "Phân bón", val: s.phanBon, color: "#10b981" },
            { label: "Thuốc", val: s.thuoc, color: "#0ea5e9" },
            { label: "Lương", val: s.luong, color: "#8b5cf6" },
            { label: "Lãi", val: s.lai, color: "#f59e0b" },
            { label: "Vận Chuyển", val: s.vanChuyen, color: "#3b82f6" },
            { label: "Chi phí khác", val: s.vanHanh, color: "#14b8a6" }
        ];

        const activeCategories = categories.filter(c => c.val > 0);
        const sumExpenses = activeCategories.reduce((acc, curr) => acc + curr.val, 0);

        if (activeCategories.length === 0) {
            if (legendEl) legendEl.innerHTML = '<div style="text-align: center; color: #64748b; font-weight: 500; padding: 2rem 0;">Không phát sinh chi phí</div>';
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        // Draw the Chart
        cashflowExpenseChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: activeCategories.map(c => c.label),
                datasets: [{
                    data: activeCategories.map(c => c.val),
                    backgroundColor: activeCategories.map(c => c.color),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const val = context.raw;
                                const pct = sumExpenses > 0 ? ((val / sumExpenses) * 100).toFixed(1) : '0.0';
                                return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
                            }
                        }
                    },
                    datalabels: {
                        display: function (context) {
                            const val = context.dataset.data[context.dataIndex];
                            const pct = sumExpenses > 0 ? (val / sumExpenses) * 100 : 0;
                            return pct >= 5; // only show label on slices >= 5% to avoid clutter
                        },
                        formatter: function (value) {
                            return formatCurrency(value);
                        },
                        color: '#ffffff',
                        font: {
                            weight: 'bold',
                            size: 10
                        }
                    }
                }
            }
        });

        // Build Custom Legend
        if (legendEl) {
            legendEl.innerHTML = activeCategories.map(c => {
                const pct = sumExpenses > 0 ? ((c.val / sumExpenses) * 100).toFixed(1) : '0.0';
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 3px; background-color: ${c.color};"></span>
                            <span style="font-weight: 600; color: #475569;">${c.label}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-weight: 700; color: #1e293b;">${formatCurrency(c.val)}</span>
                            <span style="font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background-color: rgba(0,0,0,0.05); color: #64748b;">${pct}%</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function hideDrawer() {
        const overlay = document.getElementById('cashflow-drawer-overlay');
        const panel = document.getElementById('cashflow-drawer-panel');
        if (overlay && panel) {
            overlay.classList.remove('show');
            panel.classList.remove('show');

            // Remove active style from any active info buttons
            document.querySelectorAll('.cashflow-info-btn.active').forEach(b => b.classList.remove('active'));

            setTimeout(() => {
                if (!overlay.classList.contains('show')) {
                    overlay.style.display = 'none';
                    panel.style.display = 'none';
                }
            }, 300);
        }
    }
    // Expose hideDrawer and showAllDrawerTransactions to the global scope
    window.hideDrawer = hideDrawer;
    window.showAllDrawerTransactions = function (total) {
        const extras = document.querySelectorAll('.cashflow-drawer-panel .extra-item');
        extras.forEach(el => {
            el.style.setProperty('display', 'flex', 'important');
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 10);
        });

        const moreContainer = document.getElementById('cashflow-drawer-more-container');
        if (moreContainer) moreContainer.style.display = 'none';

        const footer = document.querySelector('.cashflow-drawer-footer');
        if (footer) footer.textContent = `Hiển thị toàn bộ ${total} giao dịch gần nhất.`;
    };

    // --- CASHFLOW EDIT CONTROLLER ---
    window.openEditCashflow = function (btn) {
        const rowNumber = btn.getAttribute('data-row');
        const type = btn.getAttribute('data-type');
        const amount = btn.getAttribute('data-amount');
        const note = btn.getAttribute('data-note');
        const isRevenue = btn.getAttribute('data-isrevenue') === 'true';

        window.currentEditingCashflow = { rowNumber, type, amount, note, isRevenue };

        const amountInput = document.getElementById('input-edit-cashflow-amount');
        const noteInput = document.getElementById('input-edit-cashflow-note');

        if (amountInput) {
            amountInput.value = formatMoneyStr(parseFloat(amount) || 0);
        }
        if (noteInput) {
            noteInput.value = note;
        }

        const modal = document.getElementById('modal-edit-cashflow');
        if (modal) modal.style.display = 'flex';
    };

    window.closeEditCashflow = function () {
        const modal = document.getElementById('modal-edit-cashflow');
        if (modal) modal.style.display = 'none';
        window.currentEditingCashflow = null;
    };

    window.confirmEditCashflow = async function () {
        if (!isConfigured()) {
            alert("Chưa cấu hình Server URL. Không thể cập nhật Dòng tiền.");
            return;
        }
        const amountInput = document.getElementById('input-edit-cashflow-amount');
        const noteInput = document.getElementById('input-edit-cashflow-note');
        if (!amountInput || !noteInput || !window.currentEditingCashflow) return;

        const amountVal = parseMoney(amountInput.value);
        const noteVal = noteInput.value.trim();
        const rowNumber = parseInt(window.currentEditingCashflow.rowNumber);

        const updates = {};
        if (window.currentEditingCashflow.type === "Doanh thu Farm") {
            updates["Doanh Thu Bông"] = amountVal;
            updates["Ghi Chú"] = noteVal;
        } else if (window.currentEditingCashflow.type === "Company" || window.currentEditingCashflow.type === "Vựa") {
            updates["Doanh Thu Khác"] = amountVal;
            updates["Ghi Chú"] = noteVal;
        } else {
            updates["Chi Phí"] = amountVal;
            updates["Ghi Chú Chi Phí"] = noteVal;
        }

        // 1. Optimistically update local farmData in-memory
        const farmItem = farmData.find(item => item._sheetRowNumber === rowNumber);
        if (farmItem) {
            for (const key in updates) {
                farmItem[key] = updates[key];
            }
        }

        // 2. Optimistically update localStorage cache
        const cached = localStorage.getItem('farm_management_data');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.data)) {
                    const rawItem = parsed.data.find(item => item._sheetRowNumber === rowNumber);
                    if (rawItem) {
                        for (const key in updates) {
                            rawItem[key] = String(updates[key]);
                        }
                        localStorage.setItem('farm_management_data', JSON.stringify(parsed));
                    }
                }
            } catch (e) {
                console.error("Failed to update cache: ", e);
            }
        }

        // 3. Close modal and hide drawer immediately
        window.closeEditCashflow();
        hideDrawer();

        // 4. Force immediate UI rerendering
        applyFiltersAndRender();
        populateYears();
        updateCashInHand();
        if (document.getElementById('view-report') && document.getElementById('view-report').style.display === 'block') {
            updateDashboard();
        }
        if (document.getElementById('view-cashflow') && document.getElementById('view-cashflow').style.display === 'block') {
            updateCashFlowReport();
        }
        renderDebtTable();

        // 5. Append update action to the background synchronization queue
        let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
        queue.push({
            action: 'update',
            rowNumber: rowNumber,
            updates: updates,
            clientId: "EDIT_CASHFLOW_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
        });
        localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));

        showToast("Đang cập nhật dòng tiền...", "success");

        // 6. Process the queue asynchronously
        processSyncQueue();
    };

    function showDrawerForType(type, btn, isDashboard = false, themeColor = null) {
        let overlay = document.getElementById('cashflow-drawer-overlay');
        let panel = document.getElementById('cashflow-drawer-panel');

        if (!overlay || !panel) {
            overlay = document.createElement('div');
            overlay.id = 'cashflow-drawer-overlay';
            overlay.className = 'cashflow-drawer-overlay';
            document.body.appendChild(overlay);

            panel = document.createElement('div');
            panel.id = 'cashflow-drawer-panel';
            panel.className = 'cashflow-drawer-panel';
            document.body.appendChild(panel);

            overlay.addEventListener('click', hideDrawer);
        }

        // Apply theme color styling if provided
        if (themeColor) {
            panel.style.borderLeft = `4px solid ${themeColor}`;
        } else {
            panel.style.borderLeft = '1px solid rgba(255, 255, 255, 0.15)';
        }

        // Fetch dates from filter inputs
        let selectedYear = new Date().getFullYear();
        let selectedMonthStr = "all";
        let isQuarterRange = false;
        let rangeVal = "month";

        if (isDashboard) {
            const rYearSel = document.getElementById('report-year');
            const rMonthSel = document.getElementById('report-month');
            const rRangeSel = document.getElementById('report-range');
            selectedYear = rYearSel ? parseInt(rYearSel.value) : new Date().getFullYear();
            selectedMonthStr = rMonthSel ? rMonthSel.value : "all";
            rangeVal = rRangeSel ? rRangeSel.value : 'month';
            isQuarterRange = rangeVal.startsWith('q');
        } else {
            const yearSelect = document.getElementById('cashflow-year');
            const monthSelect = document.getElementById('cashflow-month');
            selectedYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
            selectedMonthStr = monthSelect ? monthSelect.value : "all";
        }

        // Filter transactions
        let filtered = farmData.filter(item => {
            const d = item.parsedDate;
            if (!d || isNaN(d.getTime())) return false;

            if (isDashboard) {
                const rowYear = d.getFullYear();
                const rowMonth = d.getMonth() + 1;

                if (isQuarterRange) {
                    let inCurrQ = false;
                    if (rangeVal === 'q1' && rowMonth >= 1 && rowMonth <= 3) inCurrQ = true;
                    if (rangeVal === 'q2' && rowMonth >= 4 && rowMonth <= 6) inCurrQ = true;
                    if (rangeVal === 'q3' && rowMonth >= 7 && rowMonth <= 9) inCurrQ = true;
                    if (rangeVal === 'q4' && rowMonth >= 10 && rowMonth <= 12) inCurrQ = true;
                    return inCurrQ && rowYear === selectedYear;
                } else if (rangeVal === 'month') {
                    return rowYear === selectedYear && rowMonth === parseInt(selectedMonthStr);
                } else { // Yearly
                    return rowYear === selectedYear;
                }
            } else {
                if (d.getFullYear() !== selectedYear) return false;
                if (selectedMonthStr !== "all" && (d.getMonth() + 1) !== parseInt(selectedMonthStr)) return false;
                return true;
            }
        });

        // Specific filtering based on category type
        if (type === "Doanh thu Farm") {
            filtered = filtered.filter(item => parseFloat(item["Doanh Thu Bông"]) > 0);
        } else if (type === "Company") {
            filtered = filtered.filter(item => {
                const typeDT = (item["Loại DT"] || "").trim();
                return parseFloat(item["Doanh Thu Khác"]) > 0 && (typeDT === "Company" || typeDT === "");
            });
        } else if (type === "Vựa") {
            filtered = filtered.filter(item => {
                const typeDT = (item["Loại DT"] || "").trim().toLowerCase();
                return parseFloat(item["Doanh Thu Khác"]) > 0 && (typeDT.includes("vựa") || typeDT.includes("vua"));
            });
        } else if (type === "Expensed") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && loaiCP === "expensed";
            });
        } else if (type === "Vật Tư") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && (loaiCP === "vật tư" || loaiCP === "vat tu" || loaiCP === "vật tư kd");
            });
        } else if (type === "Mua Bông") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && loaiCP === "mua bông";
            });
        } else if (type === "Phân bón") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && (loaiCP === "phân" || loaiCP === "phan");
            });
        } else if (type === "Thuốc") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && (loaiCP === "thuốc" || loaiCP === "thuoc");
            });
        } else if (type === "Lương") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && (loaiCP === "công" || loaiCP === "cong");
            });
        } else if (type === "Lãi") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && (loaiCP === "lãi" || loaiCP === "lai");
            });
        } else if (type === "Vận Chuyển") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                return parseFloat(item["Chi Phí"]) > 0 && (loaiCP === "vận chuyển" || loaiCP === "van chuyen");
            });
        } else if (type === "Chi phí khác") {
            filtered = filtered.filter(item => {
                const loaiCP = (item["Loại CP"] || "").trim().toLowerCase();
                const specificTypes = ["expensed", "phân", "phan", "thuốc", "thuoc", "công", "cong", "lãi", "lai", "vật tư", "vat tu", "vật tư kd", "mua bông", "vận chuyển", "van chuyen"];
                return parseFloat(item["Chi Phí"]) > 0 && !specificTypes.includes(loaiCP);
            });
        }

        // Sort by date descending
        filtered.sort((a, b) => b.parsedDate - a.parsedDate);

        // Limit initially to 10
        const limit = 10;

        // Icon for drawer header
        let iconHtml = '';
        if (themeColor) {
            iconHtml = `<i class="fa-solid fa-chart-pie" style="color: ${themeColor}; font-size: 1.2rem;"></i>`;
        } else if (type.includes("Doanh thu")) {
            iconHtml = '<i class="fa-solid fa-arrow-trend-up" style="color: #34d399; font-size: 1.2rem;"></i>';
        } else {
            iconHtml = '<i class="fa-solid fa-arrow-trend-down" style="color: #fb7185; font-size: 1.2rem;"></i>';
        }

        let listHtml = '';
        if (filtered.length === 0) {
            listHtml = `<div style="text-align: center; color: #94a3b8; padding: 32px 0;">Không có giao dịch nào trong kỳ.</div>`;
        } else {
            listHtml = filtered.map((item, index) => {
                const dateStr = formatDateVietnamese(item.parsedDate);
                let amount = 0;
                let note = '';
                let isRevenue = false;

                if (type === "Doanh thu Farm") {
                    amount = parseFloat(item["Doanh Thu Bông"]) || 0;
                    note = `${item["Người Mua"] || ''} - ${item["Phân Loại Bông"] || 'Bông'}`;
                    isRevenue = true;
                } else if (type === "Company") {
                    amount = parseFloat(item["Doanh Thu Khác"]) || 0;
                    note = item["Người Mua"] ? `${item["Người Mua"]}: ${item["Ghi Chú"] || ''}` : (item["Ghi Chú"] || 'Doanh thu khác');
                    isRevenue = true;
                } else if (type === "Vựa") {
                    amount = parseFloat(item["Doanh Thu Khác"]) || 0;
                    note = `${item["Người Mua"] || 'Vựa'}: ${item["Ghi Chú"] || ''}`;
                    isRevenue = true;
                } else if (type === "Chi phí khác") {
                    amount = parseFloat(item["Chi Phí"]) || 0;
                    note = `[${item["Loại CP"] || 'Khác'}] ${item["Ghi Chú Chi Phí"] || item["Ghi Chú"] || ''}`;
                } else {
                    amount = parseFloat(item["Chi Phí"]) || 0;
                    note = item["Ghi Chú Chi Phí"] || item["Ghi Chú"] || type;
                }

                const amountClass = isRevenue ? 'revenue' : 'expense';
                const sign = isRevenue ? '+' : '-';
                const isExtra = index >= limit;
                const itemClass = isExtra ? 'cashflow-drawer-item extra-item' : 'cashflow-drawer-item';

                const isRevenueStr = isRevenue ? 'true' : 'false';
                let rawNote = '';
                if (type === "Doanh thu Farm") {
                    rawNote = item["Ghi Chú"] || '';
                } else if (type === "Company" || type === "Vựa") {
                    rawNote = item["Ghi Chú"] || '';
                } else {
                    rawNote = item["Ghi Chú Chi Phí"] || item["Ghi Chú"] || '';
                }

                const amountStyle = (!isRevenue && themeColor) ? `style="color: ${themeColor} !important;"` : '';
                const editBtnStyle = themeColor ? `style="color: ${themeColor} !important; background: transparent; border: none; cursor: pointer; font-size: 0.78rem; display: flex; align-items: center; gap: 4px; opacity: 0.6; transition: all 0.2s;"` : `style="background: transparent; border: none; color: #a5b4fc; cursor: pointer; font-size: 0.78rem; display: flex; align-items: center; gap: 4px; opacity: 0.6; transition: all 0.2s;"`;

                return `
                    <div class="${itemClass}">
                        <div class="cashflow-drawer-item-left">
                            <span class="cashflow-drawer-date">${dateStr}</span>
                            <span class="cashflow-drawer-note" title="${note}">${note}</span>
                        </div>
                        <div class="cashflow-drawer-item-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                            <span class="cashflow-drawer-amount ${amountClass}" ${amountStyle}>${sign}${formatCurrency(amount)}</span>
                            <button class="cashflow-drawer-edit-btn" 
                                    data-row="${item._sheetRowNumber}" 
                                    data-type="${type}" 
                                    data-amount="${amount}" 
                                    data-isrevenue="${isRevenueStr}"
                                    data-note="${rawNote.replace(/"/g, '&quot;')}" 
                                    ${editBtnStyle} 
                                    onmouseover="this.style.opacity=1" 
                                    onmouseout="this.style.opacity=0.6"
                                    onclick="openEditCashflow(this)">
                                <i class="fa-solid fa-pen-to-square"></i>Sửa
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Append a premium "Xem thêm" button if total filtered items is > 10
            if (filtered.length > limit) {
                listHtml += `
                    <div class="cashflow-drawer-more-container" id="cashflow-drawer-more-container" style="text-align: center; margin-top: 16px;">
                        <button class="cashflow-drawer-more-btn" onclick="showAllDrawerTransactions(${filtered.length})">
                            Xem thêm (${filtered.length - limit} giao dịch khác) <i class="fa-solid fa-chevron-down" style="margin-left: 4px;"></i>
                        </button>
                    </div>
                `;
            }
        }

        const periodText = isDashboard ? (
            rangeVal === 'month' ? `Tháng ${selectedMonthStr}/${selectedYear}` : (
                rangeVal.startsWith('q') ? `Quý ${rangeVal.substring(1).toUpperCase()} ${selectedYear}` : `Năm ${selectedYear}`
            )
        ) : (selectedMonthStr === "all" ? `Năm ${selectedYear}` : `Tháng ${selectedMonthStr}/${selectedYear}`);

        let footerText = `Hiển thị toàn bộ ${filtered.length} giao dịch gần nhất.`;
        if (filtered.length > limit) {
            footerText = `Hiển thị ${limit} trên tổng số ${filtered.length} giao dịch gần nhất. Các giao dịch khác xem tại bảng Nhật ký.`;
        }

        const drawerTitleColor = themeColor || (type.includes("Doanh thu") ? '#38bdf8' : '#fb7185');

        panel.innerHTML = `
            <div class="cashflow-drawer-header">
                <div class="cashflow-drawer-title" style="color: ${drawerTitleColor} !important;">
                    ${iconHtml}
                    <span>Chi Tiết ${type}</span>
                </div>
                <button class="cashflow-drawer-close" onclick="hideDrawer()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cashflow-drawer-body">
                <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;">
                    KỲ BÁO CÁO: ${periodText.toUpperCase()}
                </div>
                <div class="cashflow-drawer-list">
                    ${listHtml}
                </div>
            </div>
            <div class="cashflow-drawer-footer">
                ${footerText}
            </div>
        `;

        // Position and show side drawer
        overlay.style.display = 'block';
        panel.style.display = 'flex';

        // Force reflow
        overlay.offsetWidth;

        overlay.classList.add('show');
        panel.classList.add('show');
    }

    // Expose window.showDrawerForExpenseCategory mapping function
    window.showDrawerForExpenseCategory = function (categoryLabel) {
        let type = "";
        let color = "#10b981";
        if (categoryLabel === "Mua Bông") { type = "Mua Bông"; color = "#f43f5e"; }
        else if (categoryLabel === "Vật Tư KD") { type = "Vật Tư"; color = "#3b82f6"; }
        else if (categoryLabel === "Vận Chuyển") { type = "Vận Chuyển"; color = "#0ea5e9"; }
        else if (categoryLabel === "Nhân Công") { type = "Lương"; color = "#10b981"; }
        else if (categoryLabel === "Phân Bón") { type = "Phân bón"; color = "#f59e0b"; }
        else if (categoryLabel === "Thuốc BVTV") { type = "Thuốc"; color = "#8b5cf6"; }
        else if (categoryLabel === "Trả Lãi") { type = "Lãi"; color = "#64748b"; }
        else if (categoryLabel === "Expensed") { type = "Expensed"; color = "#ec4899"; }
        else if (categoryLabel === "Chi phí khác" || categoryLabel === "Chi Phí Khác") { type = "Chi phí khác"; color = "#a855f7"; }

        showDrawerForType(type, null, true, color);
    };

    function injectDrawerStyles() {
        if (document.getElementById('cashflow-drawer-styles')) return;
        const style = document.createElement('style');
        style.id = 'cashflow-drawer-styles';
        style.textContent = `
            /* Premium Cashflow Details Side Drawer */
            .cashflow-drawer-overlay {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              background: rgba(15, 23, 42, 0.4) !important;
              backdrop-filter: blur(8px) !important;
              -webkit-backdrop-filter: blur(8px) !important;
              z-index: 100000 !important;
              opacity: 0 !important;
              visibility: hidden !important;
              transition: opacity 0.3s ease, visibility 0.3s ease !important;
              display: none;
            }

            .cashflow-drawer-overlay.show {
              opacity: 1 !important;
              visibility: visible !important;
            }

            .cashflow-drawer-panel {
              position: fixed !important;
              top: 0 !important;
              right: -420px !important; /* Slide out of view */
              width: 400px !important;
              height: 100vh !important;
              background: rgba(15, 23, 42, 0.96) !important;
              backdrop-filter: blur(20px) !important;
              -webkit-backdrop-filter: blur(20px) !important;
              border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
              box-shadow: -10px 0 30px rgba(0, 0, 0, 0.4) !important;
              z-index: 100001 !important;
              display: none;
              flex-direction: column !important;
              color: #f8fafc !important;
              font-family: 'Inter', sans-serif !important;
              transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
              box-sizing: border-box !important;
            }

            @media (max-width: 576px) {
              .cashflow-drawer-panel {
                width: 100% !important;
                right: -100% !important;
              }
            }

            .cashflow-drawer-panel.show {
              right: 0 !important;
            }

            /* Header */
            .cashflow-drawer-header {
              padding: 24px !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
            }

            .cashflow-drawer-title {
              font-size: 1.1rem !important;
              font-weight: 800 !important;
              color: #38bdf8 !important;
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
            }

            .cashflow-drawer-close {
              background: none !important;
              border: none !important;
              color: #94a3b8 !important;
              font-size: 1.2rem !important;
              cursor: pointer !important;
              transition: color 0.2s, transform 0.2s !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 4px !important;
            }

            .cashflow-drawer-close:hover {
              color: #f8fafc !important;
              transform: rotate(90deg) !important;
            }

            /* Content Body */
            .cashflow-drawer-body {
              padding: 24px !important;
              flex: 1 !important;
              overflow-y: auto !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 16px !important;
            }

            /* Transaction List */
            .cashflow-drawer-list {
              display: flex !important;
              flex-direction: column !important;
              gap: 12px !important;
            }

            .cashflow-drawer-item {
              background: rgba(255, 255, 255, 0.03) !important;
              border: 1px solid rgba(255, 255, 255, 0.06) !important;
              border-radius: 8px !important;
              padding: 14px !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              transition: background 0.2s, transform 0.2s !important;
            }

            .cashflow-drawer-item:hover {
              background: rgba(255, 255, 255, 0.06) !important;
              transform: translateY(-2px) !important;
            }

            .cashflow-drawer-item-left {
              display: flex !important;
              flex-direction: column !important;
              gap: 4px !important;
              flex: 1 !important;
              padding-right: 12px !important;
              min-width: 0 !important;
            }

            .cashflow-drawer-date {
              font-size: 0.75rem !important;
              color: #94a3b8 !important;
              font-weight: 600 !important;
            }

            .cashflow-drawer-note {
              font-size: 0.85rem !important;
              color: #e2e8f0 !important;
              line-height: 1.4 !important;
              word-break: break-word !important;
            }

            .cashflow-drawer-amount {
              font-weight: 800 !important;
              font-family: 'Inter', sans-serif !important;
              font-size: 0.95rem !important;
              white-space: nowrap !important;
            }

            .cashflow-drawer-amount.expense {
              color: #fb7185 !important;
            }

            .cashflow-drawer-amount.revenue {
              color: #34d399 !important;
            }

            /* Extra item styling for smooth reveal */
            .cashflow-drawer-item.extra-item {
              display: none !important;
              opacity: 0;
              transform: translateY(10px);
              transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Premium Load More Button Styling */
            .cashflow-drawer-more-btn {
              background: rgba(14, 165, 233, 0.15) !important;
              border: 1px dashed rgba(14, 165, 233, 0.4) !important;
              color: #38bdf8 !important;
              padding: 10px 20px !important;
              font-size: 0.82rem !important;
              font-weight: 700 !important;
              border-radius: 8px !important;
              cursor: pointer !important;
              transition: all 0.25s ease !important;
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 6px !important;
              margin-top: 4px !important;
              margin-bottom: 8px !important;
            }

            .cashflow-drawer-more-btn:hover {
              background: rgba(14, 165, 233, 0.25) !important;
              border-color: #38bdf8 !important;
              transform: translateY(-1px) !important;
              box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2) !important;
            }

            .cashflow-drawer-more-btn:active {
              transform: translateY(0) !important;
            }

            /* Footer */
            .cashflow-drawer-footer {
              padding: 20px 24px !important;
              background: rgba(0, 0, 0, 0.2) !important;
              border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
              font-size: 0.78rem !important;
              color: #64748b !important;
              text-align: center !important;
              line-height: 1.4 !important;
            }
        `;
        document.head.appendChild(style);
    }

    function initCashFlowDrawer() {
        injectDrawerStyles();
        // Create global drawer elements if not exists
        let overlay = document.getElementById('cashflow-drawer-overlay');
        let panel = document.getElementById('cashflow-drawer-panel');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'cashflow-drawer-overlay';
            overlay.className = 'cashflow-drawer-overlay';
            document.body.appendChild(overlay);

            panel = document.createElement('div');
            panel.id = 'cashflow-drawer-panel';
            panel.className = 'cashflow-drawer-panel';
            document.body.appendChild(panel);

            overlay.addEventListener('click', hideDrawer);
        }

        if (window.cashflowDrawerBound) return;
        window.cashflowDrawerBound = true;

        // Listen for clicks globally on document for absolute robustness
        document.addEventListener('click', (e) => {
            const infoBtn = e.target.closest('.cashflow-info-btn');
            if (!infoBtn) return;

            e.stopPropagation();

            const row = infoBtn.closest('.statement-row.has-details');
            if (!row) return;

            const type = row.getAttribute('data-detail-type');
            if (!type) return;

            // Highlight button
            document.querySelectorAll('.cashflow-info-btn.active').forEach(b => b.classList.remove('active'));
            infoBtn.classList.add('active');

            showDrawerForType(type, infoBtn);
        });
    }

    // --- FINANCIAL REPORT LOGIC ---

    async function fetchFinancialReport(forced = false) {
        const loadingEl = document.getElementById('financial-loading');
        const tableContainer = document.querySelector('.financial-table-container-card');

        // Caching logic
        const cacheKey = 'cached_financial_report';
        const cachedData = localStorage.getItem(cacheKey);

        // Nếu không phải bắt buộc load mới và có cache, hiển thị ngay từ cache
        if (!forced && cachedData) {
            try {
                const result = JSON.parse(cachedData);
                renderFinancialTable(result);
                // Vẫn hiện loading mờ để báo hiệu đang kiểm tra bản mới nhất trong background
                if (tableContainer) tableContainer.style.opacity = '0.7';

                // Update Annual Financial Ratios from cache
                const annSel = document.getElementById('financial-ratios-year');
                if (annSel && annSel.value) {
                    updateDashboardFinancialRatios(annSel.value, {
                        container: 'annual-financial-ratios',
                        status: 'annual-year-status',
                        yearText: 'annual-health-year-text'
                    });
                }
            } catch (e) {
                console.error("Cache error", e);
            }
        } else {
            if (loadingEl) loadingEl.style.display = 'block';
            if (tableContainer) tableContainer.style.opacity = '0.5';
        }

        if (!isConfigured()) {
            console.warn("Financial report CONFIG.WEB_APP_URL not configured. Skipping sync.");
            if (loadingEl) loadingEl.style.display = 'none';
            if (tableContainer) tableContainer.style.opacity = '1';
            return;
        }

        try {
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "get_financial_report", token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();

            if (result.status === "success") {
                localStorage.setItem(cacheKey, JSON.stringify(result));
                renderFinancialTable(result);

                // Update Annual Financial Ratios from new data
                const annSel = document.getElementById('financial-ratios-year');
                if (annSel && annSel.value) {
                    updateDashboardFinancialRatios(annSel.value, {
                        container: 'annual-financial-ratios',
                        status: 'annual-year-status',
                        yearText: 'annual-health-year-text'
                    });
                }
            } else {
                showToast("Lỗi tải báo cáo: " + result.message, "error");
            }
        } catch (err) {
            console.error(err);
            // Nếu có cache rồi thì không hiện lỗi kết nối quá gắt gao
            if (!cachedData) showToast("Lỗi kết nối Server!", "error");
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
            if (tableContainer) tableContainer.style.opacity = '1';
        }
    }

    function renderFinancialTable(result) {
        const values = result.data || [];
        const notes = result.notes || [];
        const thead = document.getElementById('financial-thead');
        const tbody = document.getElementById('financial-tbody');
        if (!thead || !tbody) return;

        thead.innerHTML = '';
        tbody.innerHTML = '';

        if (!values || values.length < 1) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 2rem;">Chưa có dữ liệu báo cáo.</td></tr>';
            return;
        }

        const headerRow = values[0];
        const isAdmin = getRole() === 'ADMIN';

        // 1. Render Headers
        const thr = document.createElement('tr');
        const currentYearStr = String(new Date().getFullYear());
        headerRow.forEach((cell, cIdx) => {
            const th = document.createElement('th');
            // Nh?n di?n siu c?p v linh ho?t
            const cellStr = String(cell || "").trim();
            const isCurrentYear = cellStr.includes(currentYearStr) || cellStr === "2026";
            if (isCurrentYear) th.classList.add("financial-col-current");

            if (cIdx === 0) {
                th.innerText = "CHỈ TIÊU / NĂM";
            } else {
                const year = cell;
                const isLocked = notes[cIdx] === "LOCKED";

                // Chỉ hiển thị icon khóa nếu năm đó bị khóa bên Sheet, không cho phép bấm
                let lockIndicator = '';
                if (isLocked) {
                    lockIndicator = `<i class="fa-solid fa-lock" style="font-size: 0.7rem; color: var(--danger); opacity: 0.6;" title="Dữ liệu đã khóa"></i>`;
                }

                th.innerHTML = `
                    <div style="position: relative; width: 100%; display: inline-block;">
                        <span style="display: block; width: 100%; text-align: center;">${year}</span>
                        <span style="position: absolute; right: 0; top: 50%; transform: translateY(-50%);">
                            ${lockIndicator}
                        </span>
                    </div>
                `;
            }
            thr.appendChild(th);
        });
        thead.appendChild(thr);

        // 2. Render Data Rows (Dữ liệu bắt đầu từ dòng index 1 trở đi)
        for (let rIdx = 1; rIdx < values.length; rIdx++) {
            const rowData = values[rIdx];
            // Bỏ qua dòng chỉ chứa text cũ 'LOCKED' nếu còn sót lại (đề phòng)
            if (rIdx === 1 && String(rowData[1]).toUpperCase() === "LOCKED") continue;

            const tr = document.createElement('tr');

            // ... (row styling)
            const rowLabel = String(rowData[0] || "").trim();
            const upperLabel = rowLabel.toUpperCase();
            const isSectionHeader = rowLabel && rowLabel === rowLabel.toUpperCase() && !rowLabel.includes("TỔNG");
            const isTotalRow = upperLabel.includes("TỔNG");

            const isPercentageRatio = ["ROE", "ROA", "NỢ/VCSH", "NỢ / VCSH", "TĂNG TRƯỞNG VCSH", "HOÀN THÀNH MỤC TIÊU", "(%)", "%"].some(r => upperLabel.includes(r));
            const isOtherRatio = ["PAYBACK TIME"].includes(upperLabel);

            if (isSectionHeader) tr.classList.add("financial-row-header");
            if (isTotalRow) tr.classList.add("financial-row-total");
            if (upperLabel.includes("VỐN CHỦ")) tr.classList.add("financial-row-equity");
            if (upperLabel.includes("LỢI NHUẬN")) tr.classList.add("financial-row-profit");

            // Apply important formatting to specific user-requested rows
            const exactKeywords = [
                "VỐN CHỦ SỞ HỮU", "TỔNG NỢ PHẢI TRẢ", "TỔNG CỘNG TÀI SẢN",
                "TỔNG CỘNG NGUỒN VỐN", "LỢI NHUẬN", "ROE", "ROA",
                "NỢ/VCSH", "PAYBACK TIME",
                "TÀI SẢN DÀI HẠN", "TÀI SẢN NGẮN HẠN"
            ];
            // Match if row starts with keyword or equals keyword (avoiding middle matches like 'Tỷ lệ VCSH')
            const isImportantRow = exactKeywords.some(key => upperLabel === key || upperLabel.startsWith(key + " ") || upperLabel === "[" + key + "]");
            if (isImportantRow) {
                tr.classList.add("financial-row-highlight-premium");
            }

            rowData.forEach((cell, cIdx) => {
                const td = document.createElement('td');
                const isLocked = notes[cIdx] === "LOCKED";

                if (cIdx === 0) {
                    td.innerText = cell;
                } else {
                    if (isImportantRow) {
                        td.style.backgroundColor = "rgba(14, 165, 233, 0.12)"; // Inline backup
                        td.style.fontWeight = "900";
                        td.style.color = "#0369a1";
                    }
                    if (isLocked) td.className = "financial-col-locked";
                    // So snh t?ng th? v?i c? th? 2026
                    const cellStr = String(headerRow[cIdx] || "").trim();
                    const isCurrentYear = cellStr.includes(currentYearStr) || cellStr === "2026";
                    if (isCurrentYear) td.classList.add("financial-col-current");

                    const val = cell === "" ? 0 : cell;
                    let displayVal = "";

                    if (rowLabel === "") {
                        displayVal = ""; // Hide zeros in spacer rows
                    } else if (isPercentageRatio && typeof val === 'number') {
                        let pctVal = val;
                        if (Math.abs(val) < 2) pctVal = val * 100;
                        displayVal = pctVal.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
                        td.style.fontWeight = "700";
                        td.style.color = "var(--primary-color)";

                        // Dynamic coloring for Target Completion
                        if (upperLabel.includes("HOÀN THÀNH MỤC TIÊU")) {
                            td.style.color = pctVal >= 100 ? "#10b981" : "#ef4444";
                            if (!isCurrentYear) {
                                const statusText = pctVal >= 100 ? "(Passed)" : "(Failed)";
                                displayVal = `<div>${displayVal}</div><div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px; border-top: 1px dashed ${pctVal >= 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; padding-top: 2px;">${statusText}</div>`;
                            }
                        }

                        // Dynamic coloring for Growth Ratio (> 5% is green, else red)
                        if (upperLabel.includes("TĂNG TRƯỞNG VCSH")) {
                            td.style.color = pctVal > 5 ? "#10b981" : "#ef4444";
                        }
                    } else if (isOtherRatio) {
                        // Giữ lại số lẻ cho các tỷ số đặc biệt nếu cần (vd: Payback time)
                        displayVal = (typeof val === 'number' ? val.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : val);
                    } else {
                        // Tất cả các con số thông thường (Tiền, sản lượng) đều làm tròn nguyên
                        displayVal = formatNumber(val);
                    }

                    if (upperLabel.includes("HOÀN THÀNH MỤC TIÊU") && isPercentageRatio) {
                        td.innerHTML = displayVal;
                    } else {
                        td.innerText = displayVal;
                    }

                }

                if (isImportantRow) {
                    td.style.fontWeight = "800";
                    td.style.textDecoration = "underline";
                    td.style.textUnderlineOffset = "4px";
                }

                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }

        // Tự động cuộn đến cột năm hiện tại (nằm ở bên phải cùng vùng nhìn thấy)
        setTimeout(() => {
            const currentYearCol = thead.querySelector('.financial-col-current');
            const container = document.querySelector('.financial-table-responsive');
            if (currentYearCol && container) {
                // Cuộn sao cho mép phải của cột hiện tại sát mép phải màn hình
                const scrollPos = currentYearCol.offsetLeft + currentYearCol.clientWidth - container.clientWidth + 5;
                container.scrollTo({
                    left: scrollPos,
                    behavior: 'smooth'
                });
            }
        }, 300);

        // 3. Extract and Render Financial Growth Chart
        try {
            const headerRow = values[0] || [];
            const years = headerRow.slice(1);

            // Tìm hàng VCSH và Mục Tiêu
            const equityRow = values.find(row => {
                const label = String(row[0] || "").toUpperCase();
                return label.includes("VỐN CHỦ SỞ HỮU") && !label.includes("TỶ LỆ");
            });
            const goalRow = values.find(row => {
                const label = String(row[0] || "").toUpperCase();
                return label.includes("MỤC TIÊU") && !label.includes("TỶ LỆ");
            });

            if (equityRow && goalRow && years.length > 0) {
                const equityData = equityRow.slice(1).map(v => Number(v) || 0);
                const goalData = goalRow.slice(1).map(v => Number(v) || 0);
                updateFinancialGrowthChart(years, equityData, goalData);
            }
        } catch (err) {
            console.error("Chart Error:", err);
        }
    }

    function updateFinancialGrowthChart(years, equityData, goalData) {
        const canvas = document.getElementById('financial-growth-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (financialGrowthChartInstance) financialGrowthChartInstance.destroy();

        financialGrowthChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Vốn Chủ Sở Hữu',
                        data: equityData,
                        backgroundColor: 'rgba(14, 165, 233, 0.7)',
                        borderColor: '#0ea5e9',
                        borderWidth: 1,
                        borderRadius: 6,
                        order: 2,
                        datalabels: {
                            anchor: 'center',
                            align: 'center',
                            font: { weight: '900', size: 10 },
                            color: '#ffffff',
                            formatter: (val) => val > 0 ? formatNumber(val) : ''
                        }
                    },
                    {
                        type: 'line',
                        label: 'Mục Tiêu',
                        data: goalData,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#8b5cf6',
                        pointRadius: 5,
                        fill: false,
                        tension: 0.3,
                        order: 1,
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            offset: 8, // Nhích lên để không bị che
                            font: { weight: '900', size: 11 },
                            color: '#6d28d9',
                            formatter: (val) => val > 0 ? formatNumber(val) : ''
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 25 // Chừa chỗ cho label nhích lên
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } },
                    ChartDataLabels: {
                        // Global override handled in datasets
                        display: true
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // Attach sync button listener
    const syncFinancialBtn = document.getElementById('sync-financial-btn');
    if (syncFinancialBtn) {
        syncFinancialBtn.addEventListener('click', () => fetchFinancialReport(true));
    }

    function renderExpenseDistributionChart(statement) {
        const ctx = document.getElementById('expenseDistributionChart');
        if (!ctx) return;

        // --- Hierarchical structure mirroring the cashflow report ---
        // Standalone: Expensed
        // Group: Chi Phí Vựa → Vật Tư KD + Mua Bông
        // Group: Chi Phí Vận Hành → Phân Bón, Thuốc BVTV, Nhân Công, Trả Lãi, Vận Chuyển

        // Expensed standalone = only items with loaiCP === "Expensed" exactly
        const expensedItem = { label: 'Expensed', val: statement.expensed, color: '#ec4899', type: 'Chi phí khác' };

        const vuaItems = [
            { label: 'Vật Tư KD', val: statement.vatTu, color: '#3b82f6', type: 'Vật Tư' },
            { label: 'Mua Bông', val: statement.muaBong, color: '#f43f5e', type: 'Mua Bông' },
        ];

        const opItems = [
            { label: 'Phân Bón', val: statement.phanBon, color: '#f59e0b', type: 'Phân bón' },
            { label: 'Thuốc BVTV', val: statement.thuoc, color: '#8b5cf6', type: 'Thuốc' },
            { label: 'Nhân Công', val: statement.luong, color: '#10b981', type: 'Lương' },
            { label: 'Trả Lãi', val: statement.lai, color: '#64748b', type: 'Lãi' },
            { label: 'Vận Chuyển', val: statement.vanChuyen, color: '#0ea5e9', type: 'Vận Chuyển' },
            { label: 'Chi phí khác', val: statement.chiPhiKhac, color: '#a855f7', type: 'Chi phí khác' },
        ];

        // Flat list for donut chart (all items including expensed)
        const allLeafItems = [expensedItem, ...vuaItems, ...opItems];
        const activeCategories = allLeafItems.filter(c => c.val > 0);

        // Calculate grand total
        const sumExpenses = allLeafItems.reduce((sum, c) => sum + c.val, 0);

        // Group totals
        const vuaTotal = vuaItems.reduce((s, c) => s + c.val, 0);
        const opTotal = opItems.reduce((s, c) => s + c.val, 0);

        // Populate legend — hierarchical structure mirroring cashflow report
        const legendEl = document.getElementById('expense-distribution-legend');
        if (legendEl) {
            if (sumExpenses > 0 || vuaTotal > 0 || opTotal > 0 || expensedItem.val > 0) {

                // Helper: render a standalone clickable row (for Expensed)
                function standaloneItemHtml(c) {
                    const pct = sumExpenses > 0 ? ((c.val / sumExpenses) * 100).toFixed(1) : '0.0';
                    return `
                        <div class="legend-standalone legend-item-clickable"
                             onclick="window.showDrawerForExpenseCategory('${c.label}')"
                             title="Nhấp để xem chi tiết ${c.label}">
                            <span class="legend-label" style="font-weight: 700; color: #475569;">
                                <span class="legend-dot" style="background: ${c.color}; width: 9px; height: 9px;"></span>
                                ${c.label}
                            </span>
                            <div class="legend-values">
                                <span class="legend-amount">${formatCurrency(c.val)}</span>
                                <span class="legend-pct">${pct}%</span>
                            </div>
                        </div>`;
                }

                // Helper: render a sub-item row (clickable leaf, indented)
                function subItemHtml(c) {
                    const pct = sumExpenses > 0 ? ((c.val / sumExpenses) * 100).toFixed(1) : '0.0';
                    const clickable = c.val > 0 ? `onclick="window.showDrawerForExpenseCategory('${c.label}')" title="Nhấp để xem chi tiết ${c.label}"` : '';
                    const clickClass = c.val > 0 ? 'legend-item-clickable' : '';
                    const amountStyle = c.val === 0 ? 'color: #94a3b8;' : '';
                    return `
                        <div class="legend-sub-item ${clickClass}" ${clickable}>
                            <span class="legend-label" style="padding-left: 18px; ${c.val === 0 ? 'color: #94a3b8;' : ''}">
                                <span class="legend-branch">└</span>
                                <span class="legend-dot" style="background: ${c.color}; width: 8px; height: 8px; ${c.val === 0 ? 'opacity:0.4;' : ''}"></span>
                                ${c.label}
                            </span>
                            <div class="legend-values">
                                <span class="legend-amount" style="${amountStyle}">${formatCurrency(c.val)}</span>
                                <span class="legend-pct" style="${c.val === 0 ? 'color:#94a3b8; background:#f8fafc;' : ''}">${pct}%</span>
                            </div>
                        </div>`;
                }

                // Helper: group header (not clickable, shows subtotal)
                function groupHeaderHtml(label, groupTotal) {
                    const pct = sumExpenses > 0 ? ((groupTotal / sumExpenses) * 100).toFixed(1) : '0.0';
                    return `
                        <div class="legend-group-header" style="margin-top: 8px;">
                            <span class="legend-label" style="font-weight: 800; color: #1e293b;">
                                <span style="color: #64748b; margin-right: 5px; font-size: 0.75rem;">－</span>
                                ${label}
                            </span>
                            <div class="legend-values">
                                <span class="legend-amount" style="font-weight: 800;">${formatCurrency(groupTotal)}</span>
                                <span class="legend-pct">${pct}%</span>
                            </div>
                        </div>`;
                }

                // Build hierarchical HTML
                let html = '';

                // 1. Expensed (standalone, always show)
                html += standaloneItemHtml(expensedItem);

                // 2. Group: Chi Phí Vựa (always render the group, show 0đ items too)
                html += groupHeaderHtml('Chi Phí Vựa', vuaTotal);
                html += vuaItems.map(subItemHtml).join('');

                // 3. Group: Chi Phí Vận Hành (always render if any op item exists)
                html += groupHeaderHtml('Chi Phí Vận Hành', opTotal);
                html += opItems.map(subItemHtml).join('');

                // 4. Total row
                html += `
                    <div class="legend-item legend-item-total" style="margin-top: 10px;">
                        <span class="legend-label" style="font-weight: 900; color: #1e293b;">
                            <span class="legend-dot" style="background: linear-gradient(135deg, #f43f5e, #ec4899); box-shadow: 0 0 6px rgba(244,63,94,0.4);"></span>
                            Tổng Chi Phí
                        </span>
                        <div class="legend-values">
                            <span class="legend-amount" style="color: #ef4444; font-size: 1rem;">${formatCurrency(sumExpenses)}</span>
                            <span class="legend-pct" style="background: #fee2e2; color: #dc2626; font-weight: 900;">100%</span>
                        </div>
                    </div>`;

                legendEl.innerHTML = html;
            } else {
                legendEl.innerHTML = '<div style="text-align: center; color: #64748b; font-weight: 500; padding: 2rem 0;">Không phát sinh chi phí</div>';
            }
        }


        if (expenseDistributionChartInstance) {
            expenseDistributionChartInstance.destroy();
            expenseDistributionChartInstance = null;
        }

        if (activeCategories.length === 0) {
            // Draw empty placeholder or clear canvas
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        expenseDistributionChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: activeCategories.map(c => c.label),
                datasets: [{
                    data: activeCategories.map(c => c.val),
                    backgroundColor: activeCategories.map(c => c.color),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, activeElements) => {
                    if (activeElements && activeElements.length > 0) {
                        const activeEl = activeElements[0];
                        const idx = activeEl.index;
                        const categoryLabel = activeCategories[idx].label;
                        if (typeof window.showDrawerForExpenseCategory === 'function') {
                            window.showDrawerForExpenseCategory(categoryLabel);
                        }
                    }
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const val = context.raw;
                                const pct = sumExpenses > 0 ? ((val / sumExpenses) * 100).toFixed(1) : '0.0';
                                return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
                            }
                        }
                    },
                    datalabels: {
                        display: function (context) {
                            const val = context.dataset.data[context.dataIndex];
                            const pct = sumExpenses > 0 ? (val / sumExpenses) * 100 : 0;
                            return pct >= 5; // only show label on slices ≥ 5%
                        },
                        formatter: function (value, context) {
                            const label = context.chart.data.labels[context.dataIndex];
                            const pct = sumExpenses > 0 ? ((value / sumExpenses) * 100).toFixed(1) : '0.0';
                            // Shorten label if too long
                            const shortLabel = label.length > 10 ? label.substring(0, 9) + '…' : label;
                            return `${shortLabel}\n${pct}%`;
                        },
                        color: '#ffffff',
                        font: {
                            weight: '700',
                            size: 11,
                            family: "'Inter', 'Outfit', sans-serif"
                        },
                        textShadowColor: 'rgba(0,0,0,0.35)',
                        textShadowBlur: 4,
                        textAlign: 'center',
                        anchor: 'center',
                        align: 'center',
                        padding: 2,
                        borderRadius: 4,
                    }
                },
                cutout: '55%'
            }
        });
    }

    function renderYearlyCharts(labels, data, year) {
        const qtyData = data.map(m => m.qty);
        const revData = data.map(m => m.revenue);
        const expData = data.map(m => m.expense);
        const profitData = data.map(m => m.revenue - m.expense);

        const ctxQty = document.getElementById('annualQtyChart').getContext('2d');
        if (annualQtyChartInstance) annualQtyChartInstance.destroy();
        annualQtyChartInstance = new Chart(ctxQty, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: `Sản Lượng (${year})`, data: qtyData, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4 }]
            },
            options: getChartOptions(),
            plugins: [ChartDataLabels]
        });

        const ctxRP = document.getElementById('annualRevProfitChart').getContext('2d');
        if (annualRevProfitChartInstance) annualRevProfitChartInstance.destroy();
        annualRevProfitChartInstance = new Chart(ctxRP, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Doanh Thu', data: revData, backgroundColor: 'rgba(14, 165, 233, 0.7)', borderRadius: 4 },
                    { label: 'Lợi Nhuận', data: profitData, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4 }
                ]
            },
            options: getChartOptions(),
            plugins: [ChartDataLabels]
        });

        const ctxExp = document.getElementById('annualExpenseChart').getContext('2d');
        if (annualExpenseChartInstance) annualExpenseChartInstance.destroy();
        annualExpenseChartInstance = new Chart(ctxExp, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: `Chi Phí (${year})`, data: expData, backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 4 }]
            },
            options: getChartOptions(),
            plugins: [ChartDataLabels]
        });
    }

    function renderMonthlyCombinedChart(labels, data, month, year) {
        const revFarmData = data.map(d => d.revFarm);
        const revVuaData = data.map(d => d.revVua);
        const expData = data.map(d => d.expense);
        const qtyData = data.map(d => d.qty);
        const avgPriceData = data.map(d => d.qty > 0 ? Math.round(d.revFarm / d.qty) : null);
        const hasPriceData = avgPriceData.some(v => v !== null && v > 0);

        const canvas = document.getElementById('monthlyCombinedChart');
        const container = document.getElementById('MONTHLY_CHART_FIX_CONTAINER');
        const ctx = canvas.getContext('2d');

        const isMobile = window.innerWidth <= 768;
        const targetH = isMobile ? (window.innerHeight * 0.85) : 785;

        if (container) {
            container.style.height = isMobile ? '90vh' : '825px';
        }
        canvas.style.height = targetH + 'px';
        canvas.height = targetH;

        if (monthlyCombinedChartInstance) monthlyCombinedChartInstance.destroy();

        monthlyCombinedChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar', label: 'Doanh Thu Farm', data: revFarmData,
                        backgroundColor: '#38bdf8', yAxisID: 'y',
                        stack: 'revenue', barPercentage: 0.9, categoryPercentage: 0.8
                    },
                    {
                        type: 'bar', label: 'Doanh Thu Vựa', data: revVuaData,
                        backgroundColor: '#3b82f6', yAxisID: 'y',
                        stack: 'revenue', barPercentage: 0.9, categoryPercentage: 0.8
                    },
                    {
                        type: 'bar', label: 'Chi Phí', data: expData,
                        backgroundColor: '#ef4444', yAxisID: 'y',
                        stack: 'expense', barPercentage: 0.9, categoryPercentage: 0.8
                    },
                    {
                        type: 'line', label: 'Sản Lượng (Bông)', data: qtyData,
                        borderColor: 'rgb(249, 115, 22)', backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 5, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#fff',
                        pointBorderColor: 'rgb(249, 115, 22)', yAxisID: 'y1'
                    },
                    ...(hasPriceData ? [{
                        type: 'line', label: 'Giá TB (Bông)', data: avgPriceData,
                        borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 4, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#fff',
                        pointBorderColor: 'rgb(16, 185, 129)', yAxisID: 'y2',
                        spanGaps: true,
                        hidden: true
                    }] : [])
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 5, bottom: 20, left: 20, right: 20 } },
                interaction: {
                    mode: 'index',
                    intersect: false,
                    axis: 'x'
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: {
                            font: { weight: 'bold', size: 14 },
                            color: '#000',
                            autoSkip: false
                        }
                    },
                    y: {
                        type: 'linear', display: true, position: 'left',
                        stacked: true,
                        grace: '20%',
                        title: {
                            display: true,
                            text: 'Doanh Thu (VNĐ)',
                            font: { weight: 'bold', size: 14 },
                            color: '#000',
                            padding: 10
                        },
                        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
                        ticks: {
                            font: { weight: 'bold', size: 13 },
                            color: '#000',
                            callback: (val) => val.toLocaleString('vi-VN')
                        }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        grid: { drawOnChartArea: false },
                        grace: '20%',
                        title: {
                            display: true,
                            text: 'Sản lượng Bông',
                            font: { weight: 'bold', size: 14 },
                            color: '#000',
                            padding: 10
                        },
                        ticks: {
                            font: { weight: 'bold', size: 13 },
                            color: '#000',
                            callback: (val) => val.toLocaleString('vi-VN')
                        }
                    },
                    y2: {
                        type: 'linear', display: hasPriceData ? 'auto' : false, position: 'right',
                        grid: { drawOnChartArea: false },
                        grace: '20%',
                        title: {
                            display: true,
                            text: 'Giá trung bình (VNĐ/Bông)',
                            font: { weight: 'bold', size: 14 },
                            color: '#000',
                            padding: 10
                        },
                        ticks: {
                            font: { weight: 'bold', size: 13 },
                            color: '#000',
                            callback: (val) => val.toLocaleString('vi-VN') + ' ₫'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'nearest',
                        intersect: true,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1e293b',
                        bodyColor: '#475569',
                        padding: 12,
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    if (context.dataset.label.includes('Sản Lượng')) {
                                        label += context.parsed.y.toLocaleString('vi-VN') + ' Bông';
                                        
                                        // If price dataset is hidden, show it inside the tooltip of Sản Lượng
                                        const priceDataset = context.chart.data.datasets.find(ds => ds.label && ds.label.includes('Giá'));
                                        const isPriceVisible = priceDataset && context.chart.isDatasetVisible(context.chart.data.datasets.indexOf(priceDataset));
                                        if (!isPriceVisible) {
                                            const dayData = data[context.dataIndex];
                                            if (dayData && dayData.qty > 0) {
                                                const avgPrice = Math.round(dayData.revFarm / dayData.qty);
                                                label += ` (Giá TB: ${avgPrice.toLocaleString('vi-VN')} ₫/Bông)`;
                                            }
                                        }
                                    } else if (context.dataset.label.includes('Giá')) {
                                        label += context.parsed.y.toLocaleString('vi-VN') + ' ₫/Bông';
                                    } else {
                                        label += context.parsed.y.toLocaleString('vi-VN') + ' ₫';
                                    }
                                }
                                return label;
                            },
                            afterBody: (tooltipItems) => {
                                const label = tooltipItems[0].label;
                                // If multiple items exist (mode: index), we take the first one's dataset label as primary
                                // or we can determine which one is truly being hovered if needed.
                                // For now, pass all to getRichTooltipData to filter accordingly.
                                return getRichTooltipData(label, tooltipItems);
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { weight: 'bold', size: 13 },
                            color: '#000'
                        }
                    },
                    title: {
                        display: true,
                        text: `BIỂU ĐỒ DOANH THU & SẢN LƯỢNG - THÁNG ${month}/${year}`,
                        font: { size: 18, weight: 'bold' },
                        padding: { top: 5, bottom: 10 },
                        color: '#000'
                    },
                    datalabels: {
                        display: (context) => {
                            const val = context.dataset.data[context.dataIndex];
                            if (val === null || val <= 0) return false;

                            const wrapper = document.getElementById('monthly-chart-wrapper');
                            const isFullscreen = wrapper && wrapper.style.position === 'fixed';
                            const isLandscape = window.innerWidth > window.innerHeight;

                            // Always show if enough space or desktop
                            if (window.innerWidth > 1024 || isFullscreen || isLandscape) return true;

                            // On mobile, show only for the line chart to avoid clutter, or if specifically important
                            return context.dataset.type === 'line';
                        },
                        formatter: (val, context) => {
                            if (context.dataset.label && context.dataset.label.includes('Sản Lượng')) {
                                return val.toLocaleString('vi-VN');
                            }
                            return val.toLocaleString('vi-VN') + ' ₫';
                        },
                        font: { size: 10, weight: 'bold' },
                        color: (context) => {
                            if (context.dataset.label && context.dataset.label.includes('Giá')) return '#fff';
                            return context.dataset.type === 'line' ? '#000' : '#1e293b';
                        },
                        backgroundColor: (context) => {
                            if (context.dataset.label && context.dataset.label.includes('Giá')) return '#10b981';
                            if (context.dataset.label && context.dataset.label.includes('Sản Lượng')) return '#fbbf24';
                            return 'rgba(255, 255, 255, 0.65)';
                        },
                        padding: 3,
                        borderRadius: 4,
                        anchor: (context) => {
                            return context.dataset.label && context.dataset.label.includes('Giá') ? 'start' : 'end';
                        },
                        align: (context) => {
                            return context.dataset.label && context.dataset.label.includes('Giá') ? 'bottom' : 'top';
                        },
                        offset: 4,
                        clip: false
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function getRichTooltipData(label, tooltipItems = []) {
        function formatDetailLine(r) {
            const buyer = (r["Người Mua"] || "").trim();
            const qty = parseFloat(r["Số lượng"]) || 0;
            const price = parseFloat(r["Giá"]) || 0;
            const flowerType = (r["Phân Loại Bông"] || "").trim();
            const amount = (r["Doanh Thu Bông"] || 0) + (r["Doanh Thu Khác"] || 0);
            const note = (r["Ghi Chú"] || r["Ghi chú"] || "").trim();
            const isVua = (r["Loại DT"] || "").trim().toLowerCase() === "vựa" || (r["Loại DT"] || "").trim().toLowerCase() === "vua";

            let lineStr = ` ▸ ${buyer || 'Khách lẻ'}: `;
            if (qty > 0 && price > 0 && flowerType !== "") {
                const formattedPrice = formatCurrency(price).replace('₫', '').trim();
                const formattedAmount = formatCurrency(qty * price).replace('₫', '').trim();
                lineStr += `${formatNumber(qty)} ${flowerType} x ${formattedPrice} = ${formattedAmount}`;

                const dtKhac = parseFloat(r["Doanh Thu Khác"]) || 0;
                if (isVua && dtKhac > 0) {
                    lineStr += ` (LN: ${formatCurrency(dtKhac).replace('₫', '').trim()})`;
                }
            } else {
                lineStr += `${formatCurrency(amount).replace('₫', '').trim()}`;
            }
            if (note) {
                lineStr += ` - ${note}`;
            }
            return lineStr.trim();
        }

        const year = document.getElementById('report-year').value;
        const reportMonth = document.getElementById('report-month').value;
        const range = document.getElementById('report-range').value;
        const filter = document.getElementById('report-filter').value;

        let filtered = [];

        if (range === 'year' || label.startsWith('T')) {
            const mStr = label.replace('T', '').replace('Tháng ', '');
            const m = parseInt(mStr);
            if (!isNaN(m)) {
                filtered = farmData.filter(d => d.parsedDate.getMonth() + 1 === m && d.parsedDate.getFullYear() == year);
            }
        } else {
            const day = parseInt(label);
            if (!isNaN(day)) {
                const month = parseInt(reportMonth);
                filtered = farmData.filter(dObj =>
                    dObj.parsedDate.getDate() === day &&
                    dObj.parsedDate.getMonth() + 1 === month &&
                    dObj.parsedDate.getFullYear() == year
                );
            }
        }

        if (filter !== "Chung" && filtered.length > 0) {
            filtered = filtered.filter(item => {
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                if (filter === "Farm") return type === "farm" || type === "";
                if (filter === "Vựa") return type === "vựa" || type === "vua";
                if (filter === "Company") return type === "company" || type === "hđkd";
                return true;
            });
        }

        if (filtered.length === 0) return [];

        // Check which dataset is being hovered to show specific details
        // In 'nearest' mode with intersect: true, tooltipItems should typically contain the one specific item.
        const hoveredLabels = tooltipItems.map(ti => ti.dataset.label);

        // 1. If hovering over Expenses, show breakdown
        if (hoveredLabels.some(l => l && l.includes("Chi Phí"))) {
            const expenseDetails = filtered.filter(r => (r["Chi Phí"] || 0) > 0);
            if (expenseDetails.length > 0) {
                let lines = ["", "────── 💸 CHI TIẾT CHI PHÍ ──────"];
                expenseDetails.forEach(r => {
                    const cat = (r["Loại CP"] || "Khác").trim();
                    const note = (r["Ghi Chú Chi Phí"] || r["Ghi Chú"] || r["Ghi chú"] || "").trim();
                    let displayCat = cat;
                    let displayNote = note ? '- ' + note : '';
                    if (cat.toLowerCase() === "chi phí khác" && note) {
                        displayCat = `Chi Phí Khác (${note})`;
                        displayNote = '';
                    }
                    lines.push(` ▸ ${displayCat}: ${formatCurrency(r["Chi Phí"]).replace('₫', '').trim()} ${displayNote}`.trim());
                });
                if (lines.length > 2) return lines;
            }
        }

        // 2. If hovering over Doanh Thu Farm, show Buyers/Production details
        if (hoveredLabels.some(l => l && (l.includes("Farm") || l.includes("Giá")))) {
            const revItems = filtered.filter(r => {
                const type = (r["Loại DT"] || "").trim().toLowerCase();
                const isFarm = type === "farm" || type === "" || (r["Doanh Thu Bông"] || 0) > 0;
                return isFarm && ((r["Doanh Thu Bông"] || 0) > 0 || (r["Doanh Thu Khác"] || 0) > 0);
            });
            let lines = [];
            if (revItems.length > 0) {
                lines.push("", "────── 🌾 CHI TIẾT FARM ──────");
                revItems.forEach(r => {
                    lines.push(formatDetailLine(r));
                });
            }

            // ALSO show Vựa details if hovering on Farm
            const vuaItems = filtered.filter(r => {
                const type = (r["Loại DT"] || "").trim().toLowerCase();
                return (type === "vựa" || type === "vua") && (parseFloat(r["Số lượng"]) > 0 || (r["Doanh Thu Khác"] || 0) > 0);
            });
            if (vuaItems.length > 0) {
                lines.push("", "────── 🏘️ CHI TIẾT VỰA ──────");
                vuaItems.forEach(r => {
                    lines.push(formatDetailLine(r));
                });
            }
            if (lines.length > 0) return lines;
        }

        // 3. If hovering over Doanh Thu Vựa, show Vựa details
        if (hoveredLabels.some(l => l && l.includes("Vựa"))) {
            const revItems = filtered.filter(r => {
                const type = (r["Loại DT"] || "").trim().toLowerCase();
                return (type === "vựa" || type === "vua") && (parseFloat(r["Số lượng"]) > 0 || (r["Doanh Thu Khác"] || 0) > 0);
            });
            if (revItems.length > 0) {
                let lines = ["", "────── 🏘️ CHI TIẾT VỰA ──────"];
                revItems.forEach(r => {
                    lines.push(formatDetailLine(r));
                });
                if (lines.length > 2) return lines;
            }
        }

        // 4. Default: General Summary (for total or point)
        const farmRev = filtered.filter(r => (r["Loại DT"] || "").trim() === "" || (r["Loại DT"] || "").toLowerCase() === "farm")
            .reduce((sum, r) => sum + (r["Doanh Thu Bông"] || 0), 0);
        const vuaRev = filtered.filter(r => (r["Loại DT"] || "").toLowerCase().trim() === "vựa" || (r["Loại DT"] || "").toLowerCase().trim() === "vua")
            .reduce((sum, r) => sum + (r["Doanh Thu Khác"] || 0), 0);
        const expTotal = filtered.reduce((sum, r) => sum + (r["Chi Phí"] || 0), 0);

        let sumLines = [];
        if (farmRev > 0) sumLines.push(`🚜 Farm: ${formatCurrency(farmRev).replace('₫', '').trim()}`);
        if (vuaRev > 0) sumLines.push(`🏘️ Vựa: ${formatCurrency(vuaRev).replace('₫', '').trim()}`);
        if (expTotal > 0) sumLines.push(`💸 Chi phí: ${formatCurrency(expTotal).replace('₫', '').trim()}`);

        const buyers = [...new Set(filtered.map(r => r["Người Mua"]).filter(b => b))];
        if (buyers.length > 0) {
            sumLines.push(`👤 Khách: ${buyers.slice(0, 3).join(', ')}${buyers.length > 3 ? '...' : ''}`);
        }

        return sumLines;
    }

    function getChartOptions() {
        return {
            responsive: true, maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            plugins: {
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    bodyFont: { size: 12 },
                    titleFont: { size: 14, weight: 'bold' },
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 4,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += formatCurrency(context.parsed.y);
                            return label;
                        },
                        afterBody: (tooltipItems) => {
                            const label = tooltipItems[0].label;
                            // For annual charts, we might want different detail level or just the summary.
                            return getRichTooltipData(label, tooltipItems);
                        }
                    }
                },
                datalabels: {
                    display: () => window.innerWidth > 768 || window.innerWidth > window.innerHeight,
                    anchor: 'end', align: 'top',
                    formatter: val => (val === 0 ? '' : new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(val)),
                    font: { size: 9, weight: 'bold' }
                }
            }
        };
    }

    // --- YOY COMPARISON FUNCTION ---
    function updateComparison() {
        const y1Select = document.getElementById('cmp-year1');
        const y2Select = document.getElementById('cmp-year2');
        const m1Select = document.getElementById('cmp-month1');
        const m2Select = document.getElementById('cmp-month2');
        const pSelect = document.getElementById('cmp-period');

        if (!y1Select || !y1Select.value) return;

        const y1 = parseInt(y1Select.value);
        const y2 = parseInt(y2Select.value);
        const m1 = m1Select ? parseInt(m1Select.value) : 0;
        const m2 = m2Select ? parseInt(m2Select.value) : 0;
        const period = pSelect.value;
        const reportFilter = document.getElementById('report-filter') ? document.getElementById('report-filter').value : "Chung";

        let dataY1 = { qty: 0, rev: 0, exp: 0 };
        let dataY2 = { qty: 0, rev: 0, exp: 0 };

        farmData.forEach(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return;
            const year = d.getFullYear();
            const month = d.getMonth();

            // Point 1 Matching
            let isP1 = (year === y1);
            if (isP1) {
                if (period === 'month') {
                    if (month !== m1) isP1 = false;
                } else if (period === 'q1' && (month < 0 || month > 2)) isP1 = false;
                else if (period === 'q2' && (month < 3 || month > 5)) isP1 = false;
                else if (period === 'q3' && (month < 6 || month > 8)) isP1 = false;
                else if (period === 'q4' && (month < 9 || month > 11)) isP1 = false;
            }

            // Point 2 Matching
            let isP2 = (year === y2);
            if (isP2) {
                if (period === 'month') {
                    if (month !== m2) isP2 = false;
                } else if (period === 'q1' && (month < 0 || month > 2)) isP2 = false;
                else if (period === 'q2' && (month < 3 || month > 5)) isP2 = false;
                else if (period === 'q3' && (month < 6 || month > 8)) isP2 = false;
                else if (period === 'q4' && (month < 9 || month > 11)) isP2 = false;
            }

            if (!isP1 && !isP2) return;

            // Reuse existing report-specific logic
            const typeDT = (row["Loại DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT === "Vựa" || typeDT === "vựa";
            const isFarm = typeDT === "Farm" || typeDT === "";

            const loaiCP = (row["Loại CP"] || "").trim();

            const rawQty = parseFloat(row["Số lượng"]) || 0;
            const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
            const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
            const chiPhi = parseFloat(row["Chi Phí"]) || 0;

            let rev = 0, exp = 0, q = 0;

            const isExpenseCompany = (loaiCP === "Expensed");
            const isExpenseVua = (loaiCP === "Vật Tư KD" || loaiCP === "Vận Chuyển" || loaiCP === "Mua Bông");
            const isExpenseFarm = (!isExpenseCompany && !isExpenseVua);

            if (reportFilter === "Company") {
                rev = dtBong + (isCompany ? dtKhac : 0);
                q = rawQty;
                if (isExpenseCompany) exp = chiPhi;
            } else if (reportFilter === "Vựa") {
                if (isVua) rev = dtKhac;
                if (isExpenseVua) exp = chiPhi;
            } else if (reportFilter === "Farm") {
                rev = dtBong + (isFarm ? dtKhac : 0);
                q = rawQty;
                if (isExpenseFarm) exp = chiPhi;
            } else { // "Chung"
                q = rawQty; rev = dtBong + dtKhac; exp = chiPhi;
            }

            if (isP1) { dataY1.qty += q; dataY1.rev += rev; dataY1.exp += exp; }
            if (isP2) { dataY2.qty += q; dataY2.rev += rev; dataY2.exp += exp; }
        });

        // Set UI
        dataY1.profit = dataY1.rev - dataY1.exp;
        dataY2.profit = dataY2.rev - dataY2.exp;

        const formatCompactStr = (num) => new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(num);

        document.getElementById('cmp-qty-y1').innerText = dataY1.qty.toLocaleString('vi-VN');
        document.getElementById('cmp-qty-y2').innerText = dataY2.qty.toLocaleString('vi-VN');
        document.getElementById('cmp-rev-y1').innerText = formatCompactStr(dataY1.rev) + ' ₫';
        document.getElementById('cmp-rev-y2').innerText = formatCompactStr(dataY2.rev) + ' ₫';
        document.getElementById('cmp-exp-y1').innerText = formatCompactStr(dataY1.exp) + ' ₫';
        document.getElementById('cmp-exp-y2').innerText = formatCompactStr(dataY2.exp) + ' ₫';
        document.getElementById('cmp-profit-y1').innerText = formatCompactStr(dataY1.profit) + ' ₫';
        document.getElementById('cmp-profit-y2').innerText = formatCompactStr(dataY2.profit) + ' ₫';

        const renderPct = (id, v1, v2, inverse = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (v1 === 0 && v2 === 0) {
                el.innerHTML = `<span style="display:inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: var(--text-light); background-color: rgba(0,0,0,0.05); font-size: 0.9rem;">-</span>`;
                return;
            }
            if (v1 === 0 && v2 !== 0) {
                el.innerHTML = `<span style="display:inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: var(--text-light); background-color: rgba(0,0,0,0.05); font-size: 0.9rem;">N/A</span>`;
                return;
            }

            const pct = ((v2 - v1) / Math.abs(v1)) * 100;
            const sign = pct >= 0 ? '+' : '';
            const isGood = pct > 0 ? !inverse : (pct < 0 ? inverse : true);
            const color = isGood ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
            const bgColor = isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

            el.innerHTML = `<span style="display:inline-block; padding: 3px 8px; border-radius: 6px; font-weight: bold; color: ${color}; background-color: ${bgColor}; font-size: 0.95rem;">${sign}${pct.toFixed(1)}%</span>`;
        };

        renderPct('cmp-qty-pct', dataY1.qty, dataY2.qty);
        renderPct('cmp-rev-pct', dataY1.rev, dataY2.rev);
        renderPct('cmp-exp-pct', dataY1.exp, dataY2.exp, true); // lower is better
        renderPct('cmp-profit-pct', dataY1.profit, dataY2.profit);
    }

    // Attach Event Listeners for Report Controls
    document.getElementById('report-year').addEventListener('change', updateDashboard);
    if (document.getElementById('report-filter')) {
        document.getElementById('report-filter').addEventListener('change', updateDashboard);
    }
    if (document.getElementById('report-month')) {
        document.getElementById('report-month').addEventListener('change', updateDashboard);
    }
    if (document.getElementById('report-range')) {
        document.getElementById('report-range').addEventListener('change', () => {
            const range = document.getElementById('report-range').value;
            const cmpMonth = document.getElementById('report-month-prev');
            const cmpQuarter = document.getElementById('report-quarter-prev');

            if (cmpMonth) cmpMonth.style.display = (range === 'month') ? 'inline-block' : 'none';
            if (cmpQuarter) cmpQuarter.style.display = (range.startsWith('q')) ? 'inline-block' : 'none';
            updateDashboard();
        });
    }
    if (document.getElementById('cmp-period')) {
        document.getElementById('cmp-period').addEventListener('change', updateComparison);
        document.getElementById('cmp-year1').addEventListener('change', updateComparison);
        document.getElementById('cmp-year2').addEventListener('change', updateComparison);
    }

    // Call populate once to set options on load
    populateYears();


    // Update Filter And Render logic to include dashboard update
    function applyFiltersAndRender() {
        let filtered = [...farmData];

        // Luôn sắp xếp theo Ngày giảm dần, cùng ngày thì đơn cũ hơn (số dòng nhỏ hơn) lên đầu, đơn mới nhất xuống cuối nhóm ngày
        filtered.sort((a, b) => {
            const dateDiff = (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0);
            if (dateDiff !== 0) return dateDiff;
            // tie-breaker: cùng ngày → số hàng nhỏ hơn (đơn cũ) lên trước, đơn mới nhất xuống cuối nhóm
            const rowA = a._sheetRowNumber || Number.MAX_SAFE_INTEGER;
            const rowB = b._sheetRowNumber || Number.MAX_SAFE_INTEGER;
            return rowA - rowB;
        });

        // Tab Filter
        let sliceLimit = 20; // Giới hạn 20 hàng gần nhất cho tab "Tất Cả" theo yêu cầu
        if (currentTableTab === 'today') {
            const todayStr = formatDateInput(new Date());
            filtered = filtered.filter(item => {
                const dateStr = formatDateInput(item.parsedDate);
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                const isFarmOrVua = type === "farm" || type === "vựa" || type === "vua";
                return dateStr === todayStr && isFarmOrVua;
            });
            sliceLimit = 500; // Hiển thị hết đơn hôm nay
        } else if (currentTableTab === 'farm') {
            filtered = filtered.filter(item => {
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                const isVua = type.includes("vựa") || type.includes("vua");
                const isCmp = type.includes("company") || type.includes("hđkd");

                // Nếu là Vựa hoặc Company hoặc Chi phí (Rỗng) thì ẩn khỏi tab Farm
                if (isVua || isCmp || type === "") return false;

                // Nếu ròng chi phí (không có doanh thu bông và không có người mua) thì ẩn
                const dtBong = parseFloat(String(item["Doanh Thu Bông"] || "0").replace(/[^\d]/g, '')) || 0;
                const note = (item["Ghi Chú Chi Phí"] || item["Ghi Chú"] || "").toLowerCase();
                if (dtBong === 0 && (note.includes("chi phí") || note.includes("tiền lãi"))) {
                    // Có thể là chi phí ròng
                }

                return true;
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'vua') {
            filtered = filtered.filter(item => {
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                return type === "vựa" || type === "vua";
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'expense') {
            filtered = filtered.filter(item => {
                const cpVal = parseFloat(String(item["Chi Phí"] || "0").replace(/[^\d]/g, '')) || 0;
                return cpVal > 0 || (item["Loại CP"] && item["Loại CP"].trim() !== "");
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'adjustment') {
            filtered = filtered.filter(item => {
                const adjVal = parseFloat(String(item["Khoản Thu Chi Bất Thường"] || "0").replace(/[^\d]/g, '')) || 0;
                return adjVal !== 0;
            });
            sliceLimit = 15;
        }

        // Search Filter
        const searchTerm = searchBuyerInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(item =>
                (item["Người Mua"] || "").toLowerCase().includes(searchTerm) ||
                (item["Ghi Chú"] || "").toLowerCase().includes(searchTerm) ||
                (item["Loại CP"] || "").toLowerCase().includes(searchTerm) ||
                (item["Ngày"] || "").toLowerCase().includes(searchTerm)
            );
        }
        // Status Filter
        const statusTerm = filterStatusSelect.value;
        if (statusTerm !== "all") {
            filtered = filtered.filter(item => item["Status"] === statusTerm);
        }
        // Manual Sorting (overrides default if active)
        if (sortState.column) {
            filtered.sort((a, b) => {
                let valA = a[sortState.column];
                let valB = b[sortState.column];
                if (sortState.column === 'Ngày') {
                    valA = a.parsedDate?.getTime() || 0;
                    valB = b.parsedDate?.getTime() || 0;
                }
                if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
                // Tie-breaker: cùng giá trị thì đơn cũ hơn (số dòng nhỏ hơn) lên trước, đơn mới nhất xuống cuối
                const rowA = a._sheetRowNumber || Number.MAX_SAFE_INTEGER;
                const rowB = b._sheetRowNumber || Number.MAX_SAFE_INTEGER;
                return rowA - rowB;
            });
        }

        const baseLimits = { all: 20, farm: 15, vua: 15, expense: 15 };
        const baseLimit = baseLimits[currentTableTab] || 20;
        const limit = Math.max(currentLimit, baseLimit);

        // Update filter count badges
        const countRow = document.getElementById('filter-count-row');
        if (countRow) {
            const total = filtered.length;
            const done = filtered.filter(r => r["Status"] === "Xong").length;
            const pending = total - done;
            const currentStatus = document.getElementById('transaction-filter-status')?.value ?? 'all';
            countRow.innerHTML = [
                { label: `Tất cả (${total})`, val: 'all', cls: '' },
                { label: `✅ Xong (${done})`, val: 'Xong', cls: 'badge-done' },
                { label: `⏳ Chưa thu (${pending})`, val: 'Chưa Xong', cls: 'badge-pending' }
            ].map(b => `<span class="filter-count-badge ${b.cls} ${currentStatus === b.val ? 'active' : ''}" data-status="${b.val}">${b.label}</span>`).join('');
            countRow.querySelectorAll('.filter-count-badge').forEach(badge => {
                badge.addEventListener('click', () => {
                    const fs = document.getElementById('transaction-filter-status');
                    if (fs) { fs.value = badge.dataset.status; fs.dispatchEvent(new Event('change')); }
                });
            });
        }

        const paginatedData = filtered.slice(0, limit);
        renderTable(paginatedData);

        // Load More button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            if (filtered.length > limit) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.textContent = `⬇ Xem thêm (còn ${filtered.length - limit} dòng)`;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    // --- SKELETON LOADING HELPERS ---
    function showTableSkeleton() {
        const tableBody = document.getElementById('transaction-tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="11">
                    <div class="skeleton" style="height: 45px; width: 100%; opacity: 0.6; margin: 4px 0;"></div>
                </td>
            `;
            tableBody.appendChild(tr);
        }
    }

    function showKPISkeleton() {
        const kpiIds = ['kpi-qty', 'kpi-revenue', 'kpi-expense', 'kpi-profit'];
        kpiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<div class="skeleton" style="height: 28px; width: 120px; display: inline-block;"></div>`;
        });
        // Also secondary parts of KPIs for comparison
        document.querySelectorAll('.growth-badge').forEach(el => {
            el.innerHTML = `<div class="skeleton" style="height: 16px; width: 60px;"></div>`;
        });
    }

    function showCashflowSkeleton() {
        const container = document.getElementById('statement-content');
        if (!container) return;
        container.innerHTML = `
            <div style="padding: 2rem;">
                <div class="skeleton" style="height: 40px; width: 40%; margin-bottom: 2rem;"></div>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="skeleton" style="height: 25px; width: 100%;"></div>
                    <div class="skeleton" style="height: 25px; width: 90%;"></div>
                    <div class="skeleton" style="height: 25px; width: 100%;"></div>
                    <div class="skeleton" style="height: 25px; width: 85%;"></div>
                </div>
            </div>
        `;
    }

    // --- DATA PROCESSING & CACHING HELPERS ---
    const CACHE_KEY = 'farm_management_data';

    function processRawSheetData(rawData) {
        return rawData.map((item, idx) => {
            let rowDate = new Date();
            if (item["Ngày"]) {
                if (!isNaN(item["Ngày"])) {
                    rowDate = excelToJsDate(parseFloat(item["Ngày"]));
                } else {
                    const parts = item["Ngày"].split(/[-/]/);
                    if (parts.length === 3) {
                        let yr = parseInt(parts[2], 10);
                        if (yr < 100) yr += 2000;
                        rowDate = new Date(yr, parts[1] - 1, parts[0]);
                    } else {
                        rowDate = new Date(item["Ngày"]);
                        if (rowDate && !isNaN(rowDate.getTime()) && rowDate.getFullYear() < 100) {
                            rowDate.setFullYear(rowDate.getFullYear() + 2000);
                        }
                    }
                }
            }

            const parseSheetNum = (val) => {
                if (!val) return 0;
                let s = String(val).replace(/\./g, '').replace(/,/g, '');
                let n = parseFloat(s);
                return isNaN(n) ? 0 : n;
            };

            return {
                ...item,
                parsedDate: rowDate,
                // Preserve _sheetRowNumber if already set (from gviz), else compute from idx
                _sheetRowNumber: item._sheetRowNumber || (idx + 2),
                "Status": (item["Status"] || "").trim(),
                "Số lượng": parseSheetNum(item["Số lượng"]),
                "Giá": parseSheetNum(item["Giá"]),
                "Doanh Thu Bông": parseSheetNum(item["Doanh Thu Bông"]),
                "Chi Phí": parseSheetNum(item["Chi Phí"]),
                "Tiền Phải Thu": parseSheetNum(item["Tiền Phải Thu"]),
                "Doanh Thu Khác": parseSheetNum(item["Doanh Thu Khác"]),
                "Đã Thu": parseSheetNum(item["Đã Thu"]),
                "Khoản Thu Chi Bất Thường": parseSheetNum(item["Khoản Thu Chi Bất Thường"]),
                "Cash": parseSheetNum(item["Cash"])
            };


        });
    }

    // ─── CASH IN HAND — Monthly Ledger ───────────────────────────────────────

    let cachedOpeningBalance = null; // Config fallback for first month only

    // Opening balance logic removed per user request. Ledger starts from 0 or previous row's Cash.


    // Populate year selector and default to current month/year
    function initCashSelectors() {
        // No-op: shared selectors are used instead.
    }

    async function updateCashInHand() {
        if (!farmData || farmData.length === 0) return;

        const monthSel = document.getElementById('cashflow-month');
        const yearSel = document.getElementById('cashflow-year');
        const selMonthVal = monthSel?.value || "all";
        const selYear = parseInt(yearSel?.value) || new Date().getFullYear();

        // 1. Opening balance = Cash (Q) của dòng cuối cùng TRƯỚC thời kỳ được chọn
        let openingBalance = 0;
        let lastPrevDate = null;

        farmData.forEach(row => {
            if (!row.parsedDate) return;
            const ry = row.parsedDate.getFullYear(), rm = row.parsedDate.getMonth() + 1;
            let isBefore;
            if (selMonthVal === "all") {
                isBefore = ry < selYear;
            } else {
                const selMonth = parseInt(selMonthVal);
                isBefore = ry < selYear || (ry === selYear && rm < selMonth);
            }
            if (isBefore && (!lastPrevDate || row.parsedDate >= lastPrevDate)) {
                lastPrevDate = row.parsedDate;
                const cashVal = parseFloat(row["Cash"]);
                if (!isNaN(cashVal)) openingBalance = cashVal;
            }
        });

        // 2. Số dư cuối kỳ = Cash (Q) của dòng cuối cùng TRONG thời kỳ được chọn
        let currentCash = openingBalance; // fallback nếu chưa có dữ liệu
        let lastInMonthDate = null;

        farmData.forEach(row => {
            if (!row.parsedDate) return;
            const ry = row.parsedDate.getFullYear(), rm = row.parsedDate.getMonth() + 1;
            let isInPeriod;
            if (selMonthVal === "all") {
                isInPeriod = ry === selYear;
            } else {
                const selMonth = parseInt(selMonthVal);
                isInPeriod = ry === selYear && rm === selMonth;
            }
            if (isInPeriod) {
                if (!lastInMonthDate || row.parsedDate >= lastInMonthDate) {
                    lastInMonthDate = row.parsedDate;
                    const cashVal = parseFloat(row["Cash"]);
                    if (!isNaN(cashVal)) currentCash = cashVal;
                }
            }
        });

        // 3. Tính breakdown để hiển thị (chỉ phục vụ UI)
        let cashIn = 0, cashOut = 0, adjTotal = 0;
        farmData.forEach(row => {
            if (!row.parsedDate) return;
            const ry = row.parsedDate.getFullYear(), rm = row.parsedDate.getMonth() + 1;
            if (ry !== selYear) return;
            if (selMonthVal !== "all" && rm !== parseInt(selMonthVal)) return;

            const loaiDT = (row["Loại DT"] || "").trim();
            const valI = parseFloat(row["Đã Thu"]) || 0;
            const valExp = parseFloat(row["Chi Phí"]) || 0;
            const valR = parseFloat(row["Khoản Thu Chi Bất Thường"]) || 0;
            if (loaiDT === "ADJ") {
                adjTotal += valR;
            } else {
                cashIn += valI;
                if (loaiDT === "Company") cashIn += (parseFloat(row["Doanh Thu Khác"]) || 0);
                cashOut += valExp;
                adjTotal += valR;
            }
        });

        // 4. Cập nhật UI
        const cashEl = document.getElementById('kpi-cash-hand');
        const openEl = document.getElementById('cash-opening');
        const inEl = document.getElementById('cash-in-total');
        const outEl = document.getElementById('cash-out-total');
        const adjEl = document.getElementById('cash-adj-total');
        const adjRow = document.getElementById('cash-adj-row');
        const openLabelEl = document.getElementById('cash-opening-label');

        if (openLabelEl) {
            openLabelEl.innerText = selMonthVal === "all" ? "💰 Đầu năm:" : "💰 Đầu tháng:";
        }

        if (cashEl) {
            cashEl.innerText = formatCurrency(currentCash);
            cashEl.style.color = currentCash >= 0 ? '#10b981' : '#ef4444';
        }
        if (openEl) openEl.innerText = formatCurrency(openingBalance);
        if (inEl) inEl.innerText = formatCurrency(cashIn);
        if (outEl) outEl.innerText = formatCurrency(cashOut);
        if (adjEl && adjRow) {
            if (adjTotal !== 0) {
                adjEl.innerText = (adjTotal > 0 ? '+' : '') + formatCurrency(adjTotal);
                adjRow.style.display = '';
            } else { adjRow.style.display = 'none'; }
        }

        const diffEl = document.getElementById('cash-diff-total');
        if (diffEl) {
            const cashDiff = cashIn - cashOut + adjTotal;
            if (cashDiff > 0) {
                diffEl.innerText = '+' + formatCurrency(cashDiff);
                diffEl.style.color = '#10b981';
            } else if (cashDiff < 0) {
                diffEl.innerText = formatCurrency(cashDiff);
                diffEl.style.color = '#ef4444';
            } else {
                diffEl.innerText = '0 ₫';
                diffEl.style.color = '#94a3b8';
            }
        }

        // Show/hide admin buttons
        const adminActions = document.getElementById('cash-admin-actions');
        if (adminActions) adminActions.style.display = getRole() === 'ADMIN' ? 'flex' : 'none';
    }

    // Modal Opening Balance removed per user request.


    // ─── MODAL: Điều Chỉnh Quỹ ───────────────────────────────────────────────
    const modalAdj = document.getElementById('modal-adjust-cash');
    const btnAdjust = document.getElementById('btn-adjust-cash');
    const btnSaveAdj = document.getElementById('btn-save-adj');
    const btnCancelAdj = document.getElementById('btn-cancel-adj');
    const inputAdjAmount = document.getElementById('input-adj-amount');
    const inputAdjNote = document.getElementById('input-adj-note');

    if (btnAdjust) btnAdjust.addEventListener('click', () => {
        if (inputAdjAmount) inputAdjAmount.value = '';
        if (inputAdjNote) inputAdjNote.value = '';
        if (modalAdj) modalAdj.style.display = 'flex';
        if (inputAdjAmount) inputAdjAmount.focus();
    });
    if (btnCancelAdj) btnCancelAdj.addEventListener('click', () => { if (modalAdj) modalAdj.style.display = 'none'; });
    if (btnSaveAdj) btnSaveAdj.addEventListener('click', async () => {
        const amount = parseSignedMoney(inputAdjAmount?.value || '');
        if (isNaN(amount) || amount === 0) { showToast("Số tiền không hợp lệ!", "error"); return; }
        const note = inputAdjNote?.value?.trim() || 'Khoản thu bất thường';
        btnSaveAdj.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btnSaveAdj.disabled = true;
        try {
            const res = await (await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "save_adjustment", token: getToken(),
                    data: { "Ngày": formatDateVietnamese(new Date()), "Ghi Chú": note, "amount": amount }
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            })).json();
            if (res.status === "success") {
                // Đóng panel NGAY LẬP TỨC bằng nhiều phương thức để đảm bảo hiệu quả
                const panel = document.getElementById('modal-adjust-cash');
                if (panel) {
                    panel.style.display = 'none';
                    panel.setAttribute('style', 'display: none !important');
                }

                showToast(`Đã ghi khoản bất thường ${formatSignedMoneyStr(amount)} — ${note}`, "success");

                // Clear inputs
                if (inputAdjAmount) inputAdjAmount.value = '';
                if (inputAdjNote) inputAdjNote.value = '';

                // Sync data
                if (window.syncData) window.syncData();
            } else throw new Error(res.message || "Lưu thất bại");
        } catch (e) {
            console.error("Lỗi khi lưu khoản bất thường:", e);
            showToast("Lỗi: " + e.message, "error");
        } finally {
            const btn = document.getElementById('btn-save-adj');
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Lưu bản ghi';
                btn.disabled = false;
            }
            // Fallback: Kiểm tra lại nếu modal chưa đóng thì đóng tiếp ở đây (nếu thành công)
            // Tuy nhiên không đóng ở đây nếu có lỗi để người dùng sửa dữ liệu.
        }
    });

    // Close modals by clicking outside
    [modalAdj, document.getElementById('modal-partial-pay')].forEach(m => {
        if (m) m.addEventListener('click', e => {
            if (e.target === m) {
                m.style.display = 'none';
                // Since this modal resolves a promise, clicking outside won't immediately resolve it unless we capture it. 
                // Currently, clicking outside just hides it (leaving the promise hanging).
                // Actually, wait, let's trigger the cancel button instead to resolve the promise.
                const cancelBtn = m.querySelector('.btn-cancel-premium');
                if (cancelBtn) cancelBtn.click();
            }
        });
    });




    function saveToCache(rawData) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: rawData
            }));
        } catch (e) { console.warn("Caching failed:", e); }
    }

    function loadFromCache() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;
        try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.data)) {
                farmData = processRawSheetData(parsed.data);
                applyFiltersAndRender();
                populateYears();
                if (document.getElementById('view-report').style.display === 'block') updateDashboard();
                if (document.getElementById('view-cashflow').style.display === 'block') updateCashFlowReport();
                return true;
            }
        } catch (e) { console.error("Cache error:", e); }
        return false;
    }

    // 6. Google Sheets Sync Logic
    async function syncData() {
        const syncBtn = document.getElementById('sync-gsheet-btn');
        if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';

        showTableSkeleton();
        showKPISkeleton();
        showCashflowSkeleton();

        const sheetId = '1eOTLVBUOJg9ppOu4tkLUXbzfrOHAGK0bEPSwTbl7v4U';

        // Define global callback for JSONP
        window.handleGvizResponse = function (data) {
            const scriptNode = document.getElementById('gsheet-script');
            if (scriptNode) scriptNode.remove();

            if (data.status === 'error') {
                alert("Lỗi từ Google Sheets: " + data.errors[0].detailed_message);
                if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Đồng bộ dữ liệu mới';
                return;
            }

            const cols = data.table.cols.map(c => c ? c.label : '');
            const parsedData = data.table.rows.map((row, rowIdx) => {
                const item = {};
                cols.forEach((col, index) => {
                    if (!col) return;
                    const cell = row.c[index];
                    let val = "";
                    if (cell !== null && cell !== undefined) {
                        val = cell.f !== undefined ? cell.f : (cell.v !== null ? cell.v : "");
                    }
                    item[col] = String(val);
                });
                item._sheetRowNumber = rowIdx + 2; // row 1 = header, data starts at row 2
                return item;
            });

            // Cache then Map parsedData
            saveToCache(parsedData);
            farmData = processRawSheetData(parsedData);

            applyFiltersAndRender();
            updateBuyerSuggestions(farmData);
            populateYears();
            initCashSelectors();
            updateCashInHand();
            if (document.getElementById('view-report').style.display === 'block') {
                updateDashboard();
            }
            if (document.getElementById('view-cashflow').style.display === 'block') {
                updateCashFlowReport();
            }
            // Luôn cập nhật lại bảng nợ (Debt Section) khi sync xong
            renderDebtTable();

            if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Đồng bộ dữ liệu mới';
        };

        // Create script tag for JSONP
        const script = document.createElement('script');
        script.id = 'gsheet-script';
        script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:handleGvizResponse&sheet=Data`;

        // Handle network errors for script loading
        script.onerror = function () {
            if (window.showToast) {
                window.showToast("Không thể kết nối đến Google Sheets. Đang chạy offline.", "warning");
            } else {
                alert("Không thể kết nối đến Google Sheets. Hãy kiểm tra kết nối mạng của bạn.");
            }
            if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Đồng bộ dữ liệu mới';
            script.remove();
        };

        document.body.appendChild(script);
    }
    // Make it available globally for inline calls if needed
    window.syncData = syncData;

    const syncBtnGlobal = document.getElementById('sync-gsheet-btn');
    if (syncBtnGlobal) {
        syncBtnGlobal.addEventListener('click', () => {
            syncData();
        });
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'expense-item';
            row.innerHTML = `
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Hạng mục</label>
                    <select class="exp-type" style="border-color: #f87171;">
                        <option value="Chi Phí Khác">Chi Phí Khác</option>
                        <option value="Thuốc">Thuốc</option>
                        <option value="Phân">Phân</option>
                        <option value="Lãi">Lãi</option>
                        <option value="Công">Công</option>
                        <option value="Mua Bông">Mua Bông</option>
                        <option value="Vật Tư KD">Vật Tư KD</option>
                        <option value="Vận Chuyển">Vận Chuyển</option>
                        <option value="Expensed">Expensed</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Số tiền</label>
                    <input type="text" placeholder="0" class="exp-amount money-input" style="border-color: #f87171; color: #b91c1c; font-weight: bold;">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Ghi chú chi tiết</label>
                    <input type="text" placeholder="Nhập ghi chú..." class="exp-note" style="border-color: #f87171;">
                </div>
                <button type="button" class="del-expense-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
            `;
            expenseItemsContainer.appendChild(row);
            attachExpenseRowEvents(row);
        });
    }

    function attachExpenseRowEvents(row) {
        const delBtn = row.querySelector('.del-expense-btn');
        if (delBtn) {
            delBtn.addEventListener('click', () => {
                const rows = expenseItemsContainer.querySelectorAll('.expense-item');
                if (rows.length > 1) {
                    row.remove();
                } else {
                    alert("Phải có ít nhất một dòng chi phí.");
                }
            });
        }
    }

    // Initialize events for first row
    if (expenseItemsContainer) {
        expenseItemsContainer.querySelectorAll('.expense-item').forEach(attachExpenseRowEvents);
    }

    // Tabs Logic
    const tabBtns = document.querySelectorAll('.table-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // update tab state
            currentTableTab = btn.dataset.tab;

            // clear search and checkbox implicitly via render
            document.getElementById('select-all-checkbox').checked = false;
            applyFiltersAndRender();
        });
    });

    // Checkbox & Bulk Delete Logic
    const selectAllCb = document.getElementById('select-all-checkbox');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const bulkDeleteCount = document.getElementById('bulk-delete-count');

    window.updateBulkDeleteUI = function () {
        const checkedBoxes = tableBody.querySelectorAll('.row-checkbox:checked');
        const count = checkedBoxes.length;
        const noPermission = bulkDeleteBtn && bulkDeleteBtn.dataset.noPermission === 'true';
        if (count > 0 && !noPermission) {
            bulkDeleteBtn.style.display = 'block';
            if (bulkDeleteCount) bulkDeleteCount.innerText = count;
        } else {
            if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';
        }

        const allBoxes = tableBody.querySelectorAll('.row-checkbox:not(:disabled)');
        if (allBoxes.length > 0) {
            selectAllCb.checked = count === allBoxes.length;
        } else {
            selectAllCb.checked = false;
        }
    }

    if (selectAllCb) {
        selectAllCb.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            tableBody.querySelectorAll('.row-checkbox:not(:disabled)').forEach(cb => {
                cb.checked = isChecked;
            });
            updateBulkDeleteUI();
        });
    }

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkDeleteUI();
        }
    });

    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', async () => {
            const checkedBoxes = tableBody.querySelectorAll('.row-checkbox:checked');
            if (checkedBoxes.length === 0) return;

            if (!confirm(`Bạn có chắc chắn muốn xoá ${checkedBoxes.length} dòng dữ liệu này khỏi Google Sheets?`)) return;

            if (!isConfigured()) {
                alert("Vui lòng cấu hình WEB_APP_URL!");
                return;
            }

            document.body.style.cursor = 'wait';
            bulkDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang Xoá...';
            bulkDeleteBtn.disabled = true;

            let successCount = 0;
            const rowsToDelete = Array.from(checkedBoxes).map(cb => {
                const idx = parseInt(cb.getAttribute('data-row-index'));
                return dataToRenderRef[idx];
            }).filter(Boolean);

            try {
                // Sắp xếp giảm dần theo row number — xóa từ dưới lên để tránh dịch chuyển index
                rowsToDelete.sort((a, b) => (b._sheetRowNumber || 0) - (a._sheetRowNumber || 0));

                for (let i = 0; i < rowsToDelete.length; i++) {
                    const rowData = rowsToDelete[i];
                    const sheetRow = rowData._sheetRowNumber;
                    if (!sheetRow) continue;

                    bulkDeleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang Xoá (${i + 1}/${rowsToDelete.length})...`;

                    const context = currentTableTab === 'adjustment' ? 'adjustment' :
                        (currentTableTab === 'expense' ? 'expense' : 'all');

                    const response = await fetch(CONFIG.WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({ action: "deleteByRow", rowNumber: sheetRow, context: context, token: getToken() }),
                        headers: { "Content-Type": "text/plain;charset=utf-8" }
                    });
                    const result = await response.json();
                    if (result.status === "success") {
                        successCount++;
                        // Adjust _sheetRowNumber for rows below this one
                        farmData.forEach(r => { if (r._sheetRowNumber > sheetRow) r._sheetRowNumber--; });
                        const fidx = farmData.indexOf(rowData);
                        if (fidx >= 0) farmData.splice(fidx, 1);
                    }
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                showToast(`Đã xoá thành công ${successCount}/${rowsToDelete.length} đơn dữ liệu.`, "success");
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) syncBtn.click();
            } catch (err) {
                console.error(err);
                alert("Lỗi kết nối khi xoá hàng loạt.");
            } finally {
                document.body.style.cursor = 'default';
                bulkDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Xoá Các Dòng Đã Chọn (<span id="bulk-delete-count">0</span>)';
                bulkDeleteBtn.disabled = false;
                selectAllCb.checked = false;

                // Sync lại dữ liệu để đảm bảo khớp hoàn toàn với Sheet
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) {
                    syncBtn.click();
                } else {
                    applyFiltersAndRender();
                }
            }
        });
    }

    searchBuyerInput.addEventListener('input', applyFiltersAndRender);
    filterStatusSelect.addEventListener('change', applyFiltersAndRender);

    headers.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (sortState.column === column) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = column;
                sortState.direction = 'asc';
            }
            applyFiltersAndRender();
        });
    });

    // 5. Data Entry Logic (Auto-calc & Submit)
    // Farm entry no longer has static calculateRevenue because multiple items are supported.

    // Initial Date for Form Setup (Set to Today)
    document.getElementById('date-input').value = formatDateInput(new Date());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAuthorizedForEntry()) {
            alert("Bạn không có quyền nhập liệu!");
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn lưu các dòng dữ liệu này?")) {
            return;
        }

        const entryMode = entryTypeSelect ? entryTypeSelect.value : 'farm';
        // Shared fields
        // Parse date as LOCAL midnight (not UTC) to match server-side date parsing
        // Avoid new Date("YYYY-MM-DD") which creates UTC midnight, causing +7h offset vs local dates from server
        const _rawDateVal = document.getElementById('date-input').value; // "YYYY-MM-DD"
        const [_yr, _mo, _dd] = _rawDateVal.split('-').map(Number);
        const dInput = new Date(_yr, _mo - 1, _dd); // Local midnight — consistent với processRawSheetData
        const dateStr = formatDateVietnamese(dInput); // Dùng định dạng chuẩn DD/MM/YYYY để khớp với Sheet
        const statusVal = document.getElementById('status-input').value; // Removed default "Chưa Xong"
        const buyerVal = document.getElementById('buyer-input').value;
        const noteVal = statusVal === 'Xong' ? `Đã thu tiền ngày ${dateStr}` : "";

        const submitBtn = form.querySelector('button[type="submit"]');

        let payloadRowsStr = [];
        let payloadRowsParsed = [];

        if (entryMode === 'farm') {
            const items = flowerItemsContainer.querySelectorAll('.flower-item');

            if (items.length === 0) {
                alert("Vui lòng thêm ít nhất 1 dòng bông!");
                return;
            }

            items.forEach((item, index) => {
                const typeStr = item.querySelector('.fw-type').value || "Bông";
                const qValue = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const pValue = parseMoney(item.querySelector('.fw-price').value);
                const dtBong = qValue * pValue;

                payloadRowsStr.push({
                    "Ngày": dateStr,
                    "Status": statusVal,
                    "Người Mua": buyerVal,
                    "Số lượng": qValue.toString(),
                    "Giá": pValue.toString(),
                    "Doanh Thu Bông": dtBong.toString(),
                    "Phân Loại Bông": typeStr,
                    "Ghi Chú": noteVal,
                    "Đã Thu": statusVal === 'Xong' ? dtBong.toString() : "",
                    "Tiền Phải Thu": "", "Ghi Chú Vựa thu": "", "Doanh Thu Khác": "",
                    "Loại DT": "Farm", "Chi Phí": "", "Loại CP": "", "Ghi Chú Chi Phí": ""
                });

                payloadRowsParsed.push({
                    "Ngày": dateStr, "Status": statusVal, "Người Mua": buyerVal, "Phân Loại Bông": typeStr, "Ghi Chú": noteVal,
                    parsedDate: dInput, "Số lượng": qValue, "Giá": pValue, "Doanh Thu Bông": dtBong,
                    "Đã Thu": statusVal === 'Xong' ? dtBong : 0,
                    "Chi Phí": 0, "Tiền Phải Thu": 0, "Doanh Thu Khác": 0, "Loại DT": "Farm"
                });
            });
        } else if (entryMode === 'vua') {
            // Vựa Mode
            const shipCost = parseMoney(vuaShipCostInput.value);
            const vattuCost = parseMoney(vuaVattuCostInput.value);
            const packingCost = parseMoney(document.getElementById('vua-packing-cost') ? document.getElementById('vua-packing-cost').value : "0");
            const totalCollect = parseMoney(vuaTotalCollectInput.value);
            const items = flowerItemsContainer.querySelectorAll('.flower-item');

            let sumCost = 0;
            items.forEach((item) => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const p = parseMoney(item.querySelector('.fw-price').value);
                sumCost += (q * p);
            });
            const expectedRevenue = packingCost; // User wants Profit recorded as Revenue

            items.forEach((item, index) => {
                const typeStr = item.querySelector('.fw-type').value || "Bông";
                const qValue = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const pValue = parseMoney(item.querySelector('.fw-price').value);
                const dtBong = qValue * pValue;

                const tPhaiThuStr = index === 0 ? totalCollect.toString() : "";
                const dtKhacStr = index === 0 ? expectedRevenue.toString() : "";
                const daThuStr = (statusVal === 'Xong' && index === 0) ? totalCollect.toString() : "";

                let chiPhiStr = "";
                let loaiCPStr = "";

                if (index === 0 && shipCost > 0) {
                    chiPhiStr = shipCost.toString();
                    loaiCPStr = "Vận Chuyển";
                }

                payloadRowsStr.push({
                    "Ngày": dateStr, "Status": statusVal, "Người Mua": buyerVal, "Số lượng": qValue.toString(), "Giá": pValue.toString(), "Doanh Thu Bông": dtBong.toString(), "Phân Loại Bông": typeStr, "Ghi Chú": noteVal,
                    "Đã Thu": daThuStr, "Tiền Phải Thu": tPhaiThuStr, "Ghi Chú Vựa thu": "", "Doanh Thu Khác": dtKhacStr, "Loại DT": "Vựa", "Chi Phí": chiPhiStr, "Loại CP": loaiCPStr, "Ghi Chú Chi Phí": ""
                });

                payloadRowsParsed.push({
                    "Ngày": dateStr, "Status": statusVal, "Người Mua": buyerVal, "Phân Loại Bông": typeStr, "Ghi Chú": noteVal, "Loại DT": "Vựa", "Loại CP": loaiCPStr,
                    parsedDate: dInput, "Số lượng": qValue, "Giá": pValue, "Doanh Thu Bông": dtBong,
                    "Đã Thu": (statusVal === 'Xong' && index === 0) ? totalCollect : 0,
                    "Tiền Phải Thu": index === 0 ? totalCollect : 0, "Chi Phí": index === 0 ? shipCost : 0, "Doanh Thu Khác": index === 0 ? expectedRevenue : 0
                });
            });
        } else if (entryMode === 'expense') {
            const expItems = expenseItemsContainer.querySelectorAll('.expense-item');

            expItems.forEach(item => {
                const expType = item.querySelector('.exp-type').value;
                const expAmount = parseMoney(item.querySelector('.exp-amount').value);
                const expNote = item.querySelector('.exp-note').value;

                if (expAmount > 0) {
                    payloadRowsStr.push({
                        "action": "add_expense",
                        "data": {
                            "Ngày": dateStr,
                            "Status": "Xong",
                            "Người Mua": buyerVal,
                            "Chi Phí": expAmount.toString(),
                            "Loại CP": expType,
                            "Ghi Chú Chi Phí": expNote
                        }
                    });

                    payloadRowsParsed.push({
                        "Ngày": dateStr, "Status": "Xong", "Người Mua": buyerVal, "Chi Phí": expAmount, "Loại CP": expType, "Ghi Chú Chi Phí": expNote,
                        parsedDate: dInput, "Số lượng": 0, "Giá": 0, "Doanh Thu Bông": 0, "Tiền Phải Thu": 0, "Doanh Thu Khác": 0
                    });
                }
            });
        }

        // Final check for Vua/Farm mode to add action if missing
        if (entryMode !== 'expense') {
            payloadRowsStr = payloadRowsStr.map(row => ({
                "action": "add",
                "data": row
            }));
        }

        if (!isConfigured()) {
            alert("Vui lòng cấu hình WEB_APP_URL! Dữ liệu hiện tại chỉ lưu tạm.");
            payloadRowsParsed.forEach(p => farmData.unshift(p));
            applyFiltersAndRender();
            return;
        }

        let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');

        // IF EDIT MODE: Delete old row first (or remove from queue if it was offline)
        if (currentEditRowData) {
            const sheetRow = currentEditRowData._sheetRowNumber;
            if (sheetRow) {
                if (typeof sheetRow === 'string' && sheetRow.startsWith('OFFLINE_')) {
                    // Just filter it out of the local queue
                    queue = queue.filter(item => item.clientId !== sheetRow);
                } else {
                    // Queue a delete action for the server
                    const context = currentTableTab === 'adjustment' ? 'adjustment' : (currentTableTab === 'expense' ? 'expense' : 'all');
                    queue.push({ action: 'delete', rowNumber: sheetRow, context: context, clientId: "DEL_" + sheetRow });
                }
            }
            // Remove old row from local data
            const fidx = farmData.indexOf(currentEditRowData);
            if (fidx >= 0) farmData.splice(fidx, 1);
        }

        // Add new rows to queue
        const timestampId = "OFFLINE_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        payloadRowsStr.forEach((p, pIdx) => {
            const rowClientId = `${timestampId}_${pIdx}`;
            queue.push({ action: 'add', payload: p, clientId: rowClientId });

            // Map the clientId to the optimistic parsed row
            if (payloadRowsParsed[pIdx]) {
                payloadRowsParsed[pIdx]._sheetRowNumber = rowClientId;
            }
        });

        // Save queue
        localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));

        // Optimistic UI update
        payloadRowsParsed.forEach(p => farmData.unshift(p));
        applyFiltersAndRender();
        populateYears();
        if (typeof updateConnectionStatus === 'function') updateConnectionStatus();
        if (document.getElementById('view-report').style.display === 'block') updateDashboard();

        showToast("Đang lưu giao dịch vào danh sách chờ...", "success");

        currentEditRowData = null; // Clear edit mode
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.remove();

        // Immediate reset of form inputs & submit button to allow next input instantly
        submitBtn.disabled = false;
        form.reset();
        document.getElementById('date-input').value = formatDateInput(new Date());

        // Reset flower items container to default single row
        if (flowerItemsContainer) {
            flowerItemsContainer.innerHTML = `
                <div class="flower-item">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">SL</label>
                        <input type="number" placeholder="0" class="fw-qty" min="0" required>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Loại mặt hàng</label>
                        <input type="text" class="fw-type" list="flower-types" placeholder="Tên hoa..." required
                            style="width: 100%; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Đơn Giá</label>
                        <input type="text" placeholder="0" class="fw-price money-input" required>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Thành tiền</label>
                        <input type="text" placeholder="0" class="fw-total" readonly style="background: #f1f5f9; color: #0f172a; font-weight: 800; border: 1.5px solid #cbd5e1 !important;">
                    </div>
                    <button type="button" class="del-flower-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            attachFlowerRowEvents(flowerItemsContainer.querySelector('.flower-item'));
        }

        if (entryTypeSelect && entryTypeSelect.value === 'vua') calculateVuaTotals();

        // Reset expense items container to default single row
        if (expenseItemsContainer) {
            expenseItemsContainer.innerHTML = `
                <div class="expense-item">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Hạng mục</label>
                        <select class="exp-type" style="border-color: #f87171;">
                            <option value="Chi Phí Khác">Chi Phí Khác</option>
                            <option value="Thuốc">Thuốc</option>
                            <option value="Phân">Phân</option>
                            <option value="Lãi">Lãi</option>
                            <option value="Công">Công</option>
                            <option value="Mua Bông">Mua Bông</option>
                            <option value="Vật Tư KD">Vật Tư KD</option>
                            <option value="Vận Chuyển">Vận Chuyển</option>
                            <option value="Expensed">Expensed</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Số tiền</label>
                        <input type="text" placeholder="0" class="exp-amount money-input" required style="border-color: #f87171; color: #b91c1c; font-weight: bold;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Ghi chú chi tiết</label>
                        <input type="text" placeholder="Nhập ghi chú..." class="exp-note" style="border-color: #f87171;">
                    </div>
                    <button type="button" class="del-expense-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            attachExpenseRowEvents(expenseItemsContainer.querySelector('.expense-item'));
        }

        if (entryTypeSelect) {
            entryTypeSelect.dispatchEvent(new Event('change'));
        }

        // Asynchronously process the queue in the background
        processSyncQueue();
    });

    // Load More
    const loadMoreBtnEl = document.getElementById('load-more-btn');
    if (loadMoreBtnEl) {
        loadMoreBtnEl.addEventListener('click', () => {
            currentLimit += 20;
            applyFiltersAndRender();
        });
    }
    document.querySelectorAll('.table-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLimit = 20;
        });
    });

    // Export utilities to window for Chatbot access
    window.utils = {
        getToken,
        parseMoney,
        formatDateInput,
        formatCurrency,
        formatMoneyStr,
        excelToJsDate,
        formatDateVietnamese
    };

    window.showToast = function (message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        toast.className = 'toast toast-' + type;
        toast.innerHTML = (icons[type] || 'ℹ️') + ' ' + message;
        container.appendChild(toast);
        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, duration);
    };

    // Swipe-to-Delete
    (function () {
        const tb = document.getElementById('table-body');
        if (!tb) return;
        let sx = 0, sy = 0;
        const THRESH = 80;
        tb.addEventListener('touchstart', function (e) {
            const row = e.target.closest('tr');
            if (!row) return;
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
            row._sx = sx;
        }, { passive: true });
        tb.addEventListener('touchmove', function (e) {
            const row = e.target.closest('tr');
            if (!row || !row._sx) return;
            const dx = e.touches[0].clientX - row._sx;
            const dy = e.touches[0].clientY - sy;
            if (Math.abs(dy) > Math.abs(dx)) return;
            if (dx < -10) {
                const p = Math.min(Math.abs(dx) / THRESH, 1);
                row.style.opacity = String(1 - p * 0.4);
                row.style.transform = 'translateX(' + dx + 'px)';
            }
        }, { passive: true });
        tb.addEventListener('touchend', function (e) {
            const row = e.target.closest('tr');
            if (!row || !row._sx) return;
            const dx = e.changedTouches[0].clientX - row._sx;
            row._sx = 0;
            if (dx < -THRESH) {
                const btn = row.querySelector('.action-btn[data-row-index]');
                if (btn) {
                    row.style.transition = 'transform 0.25s, opacity 0.25s';
                    row.style.transform = 'translateX(-100%)';
                    row.style.opacity = '0';
                    setTimeout(() => btn.click(), 200);
                    setTimeout(() => { row.style.transition = ''; row.style.transform = ''; row.style.opacity = ''; }, 500);
                    return;
                }
            }
            row.style.transition = 'transform 0.2s, opacity 0.2s';
            row.style.transform = '';
            row.style.opacity = '';
            setTimeout(() => { row.style.transition = ''; }, 220);
        }, { passive: true });
    })();

    // --- FINAL INITIALIZATION ---
    loadFromCache();
    currentLimit = 20;

    // Restore saved view on load (Centralized initialization)
    const savedView = localStorage.getItem("active_app_view") || 'todo';
    switchView(savedView);

    if (entryTypeSelect) {
        entryTypeSelect.dispatchEvent(new Event("change"));
    }

    const syncBtn = document.getElementById('sync-gsheet-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            if (!isAuthorizedForSync()) {
                console.log("Sync skipped: Read-only access");
                return;
            }
            syncData();
        });
    }

    // --- AUTO-SYNC ON STARTUP ---
    const role = getRole();
    if (role && syncBtn) {
        setTimeout(() => {
            console.log("Auto-syncing data for role:", role);
            // Kích hoạt sync trực tiếp thay vì click button (vì button có thể bị ẩn với EMP_LV2)
            syncData();
        }, 800);
    }
    // --- RECEIPT EXPORT LOGIC ---

    // Helper: parse "YYYY-MM-DD" date input value to start-of-day timestamp
    function parseDateInputToTs(val) {
        if (!val) return null;
        const [y, m, d] = val.split('-').map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    }

    // Helper: convert dd/mm/yyyy string -> timestamp
    function parseDdMmYyyyToTs(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const [dd, mm, yyyy] = parts.map(Number);
        return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).getTime();
    }

    // Update the summary label in the filter panel
    function updateInvoiceDateFilterSummary() {
        const summaryEl = document.getElementById('invoice-date-filter-summary');
        if (!summaryEl) return;
        const fromVal = (document.getElementById('invoice-date-from') || {}).value;
        const toVal = (document.getElementById('invoice-date-to') || {}).value;
        if (!fromVal && !toVal) {
            summaryEl.innerHTML = '<i class="fa-solid fa-circle-info"></i> Đang hiển thị tất cả các ngày';
            summaryEl.style.color = '#94a3b8';
        } else {
            const fromStr = fromVal ? fromVal.split('-').reverse().join('/') : '...';
            const toStr = toVal ? toVal.split('-').reverse().join('/') : '...';
            summaryEl.innerHTML = `<i class="fa-solid fa-filter"></i> Lọc từ <b>${fromStr}</b> đến <b>${toStr}</b>`;
            summaryEl.style.color = '#6366f1';
        }
    }

    async function processSettleCumulative(endDateStr, debtAmount) {
        if (!isAuthorizedForDebt()) {
            alert("Bạn không có quyền thực hiện thanh toán!");
            return;
        }
        if (!currentSelectedBuyer) return;

        const rawInput = await showPaymentModal(
            `Gạch nợ lũy kế đến ngày ${endDateStr}`,
            `Số tiền nợ lũy kế cần thu: <b>${formatCurrency(debtAmount)}</b>\n\nNhập số tiền thực thu hôm nay:`,
            formatMoneyStr(debtAmount)
        );

        if (rawInput === null) return; // Cancel

        const amountToPay = parseMoney(rawInput);
        if (amountToPay <= 0) {
            alert("Số tiền không hợp lệ.");
            return;
        }

        if (!confirm(`Xác nhận GẠCH TOÀN BỘ toa nợ lũy kế từ trước đến ngày ${endDateStr} của ${currentSelectedBuyer.name}?\nSố tiền thực thu hôm nay sẽ là: ${formatCurrency(amountToPay)}.`)) return;

        if (!isConfigured()) {
            alert("Vui lòng cấu hình WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';
        try {
            showToast(`Đang chốt gạch nợ lũy kế đến ngày ${endDateStr}...`, "info");
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "settleCumulative",
                    buyerName: currentSelectedBuyer.name,
                    endDateStr: endDateStr,
                    amount: amountToPay,
                    token: getToken()
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });

            const result = await response.json();
            if (result.status !== "success") {
                throw new Error(result.message || "Lỗi khi xử lý gạch nợ.");
            }

            showToast(`Thành công! Đã chốt gạch nợ lũy kế của ${currentSelectedBuyer.name}.`, "success");

            // Đóng hóa đơn
            window.closeReceipt();

            // Reload & đồng bộ
            renderDebtTable();
            const syncBtnGlobal = document.getElementById('sync-gsheet-btn');
            if (syncBtnGlobal) syncBtnGlobal.click();
        } catch (err) {
            console.error(err);
            alert("Lỗi khi xử lý gạch nợ lũy kế: " + err.message);
        } finally {
            document.body.style.cursor = 'default';
        }
    }

    // Attach delegated click listener once during DOM setup
    const receiptItemsBody = document.getElementById('receipt-items-body');
    if (receiptItemsBody) {
        receiptItemsBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-settle-cumulative');
            if (btn) {
                const endDateStr = btn.getAttribute('data-enddate');
                const debtAmount = parseFloat(btn.getAttribute('data-debt')) || 0;
                await processSettleCumulative(endDateStr, debtAmount);
            }
        });
    }

    window.showReceipt = function () {
        if (!currentSelectedBuyer) return;

        const modal = document.getElementById('receipt-modal');
        const itemsBody = document.getElementById('receipt-items-body');

        // Đọc bộ lọc ngày
        const fromVal = (document.getElementById('invoice-date-from') || {}).value;
        const toVal = (document.getElementById('invoice-date-to') || {}).value;
        const fromTs = parseDateInputToTs(fromVal);
        const toTs = toVal ? parseDateInputToTs(toVal) + 86399999 : null; // end of day

        // Lọc giao dịch theo khoảng ngày
        const allTx = currentSelectedBuyer.transactions;
        const filteredTx = allTx.filter(t => {
            const ts = t.rawDate;
            if (fromTs !== null && ts < fromTs) return false;
            if (toTs !== null && ts > toTs) return false;
            return true;
        });

        // Tính toán nợ cũ mang sang (các giao dịch diễn ra trước khoảng ngày lọc)
        let oldDebt = 0;
        if (fromTs !== null) {
            allTx.forEach(t => {
                if (t.rawDate < fromTs) {
                    oldDebt += ((t.totalExpected || 0) - (t.paid || 0));
                }
            });
        }

        // Tính toán số liệu phát sinh trong kỳ
        let periodQty = 0;
        let periodTotal = 0;
        let periodPaid = 0;

        filteredTx.forEach(t => {
            periodQty += (t.totalQty || 0);
            periodTotal += (t.totalExpected || 0);
            periodPaid += (t.paid || 0);
        });

        const accumulatedDebt = oldDebt + periodTotal - periodPaid;

        // Cập nhật thông tin chung
        document.getElementById('receipt-customer-name').innerText = currentSelectedBuyer.name;
        document.getElementById('receipt-id').innerText = "Số: INV-" + Date.now().toString().slice(-6);

        // Hiển thị khoảng ngày trên hóa đơn
        const receiptDateEl = document.getElementById('receipt-date');
        if (fromVal || toVal) {
            const fromStr = fromVal ? fromVal.split('-').reverse().join('/') : '...';
            const toStr = toVal ? toVal.split('-').reverse().join('/') : '...';
            receiptDateEl.innerText = `${fromStr} → ${toStr}`;
        } else {
            receiptDateEl.innerText = formatDateVN(new Date());
        }

        if (filteredTx.length === 0) {
            itemsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding: 20px; font-style: italic;">Không có giao dịch nào trong khoảng ngày này.</td></tr>`;
            document.getElementById('receipt-summary-qty').innerText = "0 bông";
            document.getElementById('receipt-summary-period-total').innerText = formatCurrency(0);
            document.getElementById('receipt-summary-period-paid').innerText = formatCurrency(0);
            document.getElementById('receipt-summary-accumulated-debt').innerText = formatCurrency(accumulatedDebt);
            modal.style.display = 'flex';
            return;
        }

        // Đổ dữ liệu mặt hàng, chèn dòng tổng kết khi có giao dịch đã thu (t.paid > 0)
        itemsBody.innerHTML = '';

        // Sắp xếp theo ngày tăng dần
        const sortedFilteredTx = [...filteredTx].sort((a, b) => a.rawDate - b.rawDate);

        let runningTotalExpected = 0;
        let runningPaid = 0;

        // Tìm ngày thanh toán lớn nhất trong danh sách sao kê lọc để chỉ cho phép gạch lũy kế tại ngày đó
        let latestPaymentTxDate = 0;
        sortedFilteredTx.forEach(t => {
            if (t.paid > 0) {
                latestPaymentTxDate = Math.max(latestPaymentTxDate, t.rawDate);
            }
        });

        sortedFilteredTx.forEach(t => {
            // Tích lũy dồn cộng
            runningTotalExpected += (t.totalExpected || 0);
            runningPaid += (t.paid || 0);

            const row = document.createElement('tr');
            const summary = t.lines
                .filter(l => l.qty > 0)
                .map(l => {
                    if (currentSelectedBuyer && currentSelectedBuyer.isVua) {
                        return `${l.qty} ${l.flowerType}`;
                    }
                    const shortPrice = l.price >= 1000 ? (l.price / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'k' : l.price;
                    return `${l.qty} ${l.flowerType} x ${shortPrice}`;
                }).join(', ');

            // Định dạng lại ngày từ DD/MM/YYYY sang DD/MM/YY
            let shortDateWithYear = t.dateStr;
            if (t.dateStr.length >= 10) {
                const parts = t.dateStr.split('/');
                if (parts.length === 3) {
                    shortDateWithYear = `${parts[0]}/${parts[1]}/${parts[2].slice(-2)}`;
                }
            }

            row.innerHTML = `
                <td style="color: #64748b; font-size: 0.8rem;">${shortDateWithYear}</td>
                <td style="word-break: break-word; white-space: normal;">
                    <div>${summary || '<span style="color:#94a3b8; font-style:italic;">Không mua hoa (Chỉ trả tiền)</span>'}</div>
                    ${t.paid > 0 ? `<div style="font-size: 0.75rem; color: #059669; margin-top: 2px;">✅ Đã thu: ${formatCurrency(t.paid)}</div>` : ''}
                </td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(t.totalExpected)}</td>
            `;
            itemsBody.appendChild(row);

            // Chỉ tổng kết khi có phần đã thu (t.paid > 0)
            if (t.paid > 0) {
                const subtotalRow = document.createElement('tr');
                subtotalRow.style.cssText = 'background: linear-gradient(90deg, #f0f4ff 0%, #e8eeff 100%); border-top: 2px solid #6366f1;';
                const runningDebt = runningTotalExpected - runningPaid;

                subtotalRow.innerHTML = `
                    <td colspan="3" style="padding: 6px 10px 5px 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                            <span style="font-weight: 800; font-size: 0.82rem; color: #4f46e5; display: flex; align-items: center; gap: 5px;">
                                <i class="fa-solid fa-coins"></i>Cộng dồn đến ngày ${shortDateWithYear}
                            </span>
                            <span style="font-weight: 900; font-size: 0.95rem; color: #4f46e5; white-space: nowrap;">
                                ${formatCurrency(runningTotalExpected)}
                            </span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 3px;">
                            <span style="font-size: 0.75rem; font-weight: 700; color: #059669;">✅ Tổng đã thu: ${formatCurrency(runningPaid)}</span>
                            ${runningDebt > 0 ? (
                        t.rawDate === latestPaymentTxDate ? `
                                    <span class="btn-settle-cumulative" data-enddate="${t.dateStr}" data-debt="${runningDebt}"
                                        style="font-size: 0.82rem; font-weight: 800; color: #ef4444; cursor: pointer; padding: 2px 6px; border-radius: 4px; border: 1px dashed rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;"
                                        onmouseover="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.8)';"
                                        onmouseout="this.style.background='rgba(239, 68, 68, 0.05)'; this.style.borderColor='rgba(239, 68, 68, 0.4)';"
                                        title="Nhấp để gạch nợ lũy kế đến ngày này">
                                        🔴 Còn nợ: ${formatCurrency(runningDebt)} <i class="fa-solid fa-check-double" style="font-size: 0.75rem; margin-left: 2px;"></i>
                                    </span>
                                ` : `
                                    <span style="font-size: 0.78rem; font-weight: 700; color: #ef4444; display: inline-flex; align-items: center; gap: 4px;">
                                        🔴 Còn nợ: ${formatCurrency(runningDebt)}
                                    </span>
                                `
                    ) : '<span style="font-size: 0.75rem; font-weight: 700; color: #059669;">✅ Đã thanh toán hết</span>'}
                        </div>
                    </td>
                `;
                itemsBody.appendChild(subtotalRow);

                // Khoảng trống mỏng sau dòng tổng kết
                const spacerRow = document.createElement('tr');
                spacerRow.innerHTML = `<td colspan="3" style="padding: 3px 0; background: transparent;"></td>`;
                itemsBody.appendChild(spacerRow);
            }
        });

        document.getElementById('receipt-summary-qty').innerText = formatNumber(periodQty) + " bông";
        document.getElementById('receipt-summary-period-total').innerText = formatCurrency(periodTotal);
        document.getElementById('receipt-summary-period-paid').innerText = formatCurrency(periodPaid);
        document.getElementById('receipt-summary-accumulated-debt').innerText = formatCurrency(accumulatedDebt);

        modal.style.display = 'flex';
    };

    window.closeReceipt = function () {
        document.getElementById('receipt-modal').style.display = 'none';
    };

    window.downloadPDF = function () {
        const element = document.querySelector('.receipt-paper');
        const buyerName = currentSelectedBuyer ? currentSelectedBuyer.name : 'KhachHang';
        const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');

        const opt = {
            margin: 10,
            filename: `HoaDon_${buyerName}_${dateStr}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        // Hiện thông báo đang xử lý
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo PDF...';
        btn.disabled = true;

        html2pdf().set(opt).from(element).save().then(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("PDF Export Error:", err);
            alert("Có lỗi khi xuất PDF. Hãy thử dùng nút 'In Máy In' thay thế.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    };

    const btnExportReceipt = document.getElementById('btn-export-receipt');
    if (btnExportReceipt) {
        btnExportReceipt.addEventListener('click', showReceipt);
    }

    // --- BỘ LỌC NGÀY XUẤT HÓA ĐƠN ---
    const invoiceDateFrom = document.getElementById('invoice-date-from');
    const invoiceDateTo = document.getElementById('invoice-date-to');

    // Toggle logic for date filter panel
    const btnToggleFilter = document.getElementById('btn-toggle-date-filter');
    const filterContainer = document.getElementById('invoice-date-filter');
    const iconToggleFilter = document.getElementById('icon-toggle-filter');

    if (btnToggleFilter && filterContainer) {
        btnToggleFilter.addEventListener('click', () => {
            const isHidden = filterContainer.style.display === 'none';
            if (isHidden) {
                filterContainer.style.display = 'block';
                if (iconToggleFilter) iconToggleFilter.style.transform = 'rotate(180deg)';
                btnToggleFilter.style.borderColor = '#6366f1';
                btnToggleFilter.style.color = '#4f46e5';
                btnToggleFilter.style.background = '#f5f3ff';
            } else {
                filterContainer.style.display = 'none';
                if (iconToggleFilter) iconToggleFilter.style.transform = 'rotate(0deg)';
                btnToggleFilter.style.borderColor = '#cbd5e1';
                btnToggleFilter.style.color = '#475569';
                btnToggleFilter.style.background = 'white';
            }
        });
    }

    function clearActiveQuickButtons() {
        document.querySelectorAll('.btn-quick-date').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    function setQuickDateRange(fromYmd, toYmd, activeBtnId) {
        if (invoiceDateFrom) invoiceDateFrom.value = fromYmd || '';
        if (invoiceDateTo) invoiceDateTo.value = toYmd || '';

        // Cập nhật class active cho nút tương ứng
        document.querySelectorAll('.btn-quick-date').forEach(btn => {
            if (btn.id === activeBtnId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        updateInvoiceDateFilterSummary();

        // Tự động cập nhật danh sách và số liệu tổng hợp nếu đang xem chi tiết hóa đơn
        if (currentSelectedBuyer) {
            showDebtDetail(currentSelectedBuyer);
        }
    }

    // Khởi tạo summary label khi trang load
    updateInvoiceDateFilterSummary();

    // Cập nhật summary và xóa trạng thái nút nhanh khi thay đổi ngày thủ công
    if (invoiceDateFrom) {
        invoiceDateFrom.addEventListener('change', () => {
            clearActiveQuickButtons();
            updateInvoiceDateFilterSummary();
            if (currentSelectedBuyer) {
                showDebtDetail(currentSelectedBuyer);
            }
        });
    }
    if (invoiceDateTo) {
        invoiceDateTo.addEventListener('change', () => {
            clearActiveQuickButtons();
            updateInvoiceDateFilterSummary();
            if (currentSelectedBuyer) {
                showDebtDetail(currentSelectedBuyer);
            }
        });
    }

    // Nút "Hôm nay"
    const btnQuickToday = document.getElementById('btn-quick-today');
    if (btnQuickToday) {
        btnQuickToday.addEventListener('click', () => {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            const ymd = `${y}-${m}-${d}`;
            setQuickDateRange(ymd, ymd, 'btn-quick-today');
        });
    }

    // Nút "Gần nhất" (Ngày giao dịch gần nhất của khách)
    const btnQuickLatest = document.getElementById('btn-quick-latest');
    if (btnQuickLatest) {
        btnQuickLatest.addEventListener('click', () => {
            if (!currentSelectedBuyer || !currentSelectedBuyer.transactions || currentSelectedBuyer.transactions.length === 0) {
                alert("Hãy chọn một khách hàng trước.");
                return;
            }
            const latestTx = currentSelectedBuyer.transactions.reduce((max, t) => t.rawDate > max.rawDate ? t : max, currentSelectedBuyer.transactions[0]);
            const date = new Date(latestTx.rawDate);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const ymd = `${y}-${m}-${d}`;
            setQuickDateRange(ymd, ymd, 'btn-quick-latest');
        });
    }

    // Nút "Xa nhất" (Ngày giao dịch đầu tiên của khách)
    const btnQuickEarliest = document.getElementById('btn-quick-earliest');
    if (btnQuickEarliest) {
        btnQuickEarliest.addEventListener('click', () => {
            if (!currentSelectedBuyer || !currentSelectedBuyer.transactions || currentSelectedBuyer.transactions.length === 0) {
                alert("Hãy chọn một khách hàng trước.");
                return;
            }
            const earliestTx = currentSelectedBuyer.transactions.reduce((min, t) => t.rawDate < min.rawDate ? t : min, currentSelectedBuyer.transactions[0]);
            const date = new Date(earliestTx.rawDate);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const ymd = `${y}-${m}-${d}`;
            setQuickDateRange(ymd, '', 'btn-quick-earliest');
        });
    }

    // Nút "Tháng này"
    const btnQuickMonth = document.getElementById('btn-quick-month');
    if (btnQuickMonth) {
        btnQuickMonth.addEventListener('click', () => {
            const today = new Date();
            const y = today.getFullYear();
            const m = today.getMonth();
            const firstDay = new Date(y, m, 1);
            const lastDay = new Date(y, m + 1, 0);

            const fY = firstDay.getFullYear();
            const fM = String(firstDay.getMonth() + 1).padStart(2, '0');
            const fD = String(firstDay.getDate()).padStart(2, '0');

            const lY = lastDay.getFullYear();
            const lM = String(lastDay.getMonth() + 1).padStart(2, '0');
            const lD = String(lastDay.getDate()).padStart(2, '0');

            setQuickDateRange(`${fY}-${fM}-${fD}`, `${lY}-${lM}-${lD}`, 'btn-quick-month');
        });
    }

    // Nút "Tất cả" - xóa bộ lọc ngày
    const btnClearDateFilter = document.getElementById('btn-clear-date-filter');
    if (btnClearDateFilter) {
        btnClearDateFilter.addEventListener('click', () => {
            setQuickDateRange('', '', null);
        });
    }


    // Fullscreen Chart Logic
    const btnFullscreenMonthly = document.getElementById('btn-fullscreen-monthly-chart');
    const monthlyChartWrapper = document.getElementById('monthly-chart-wrapper');

    if (btnFullscreenMonthly && monthlyChartWrapper) {
        const chartContainer = monthlyChartWrapper.querySelector('.chart-container');
        let isFakeFullscreen = false;

        btnFullscreenMonthly.addEventListener('click', () => {
            if (!isFakeFullscreen) {
                isFakeFullscreen = true;

                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(e => console.log(e));
                }

                btnFullscreenMonthly.innerHTML = '<i class="fa-solid fa-compress"></i> <span>Thu Nhỏ</span>';

                // CSS fake fullscreen
                monthlyChartWrapper.classList.add('force-fullscreen-mode');
                monthlyChartWrapper.style.setProperty('position', 'fixed', 'important');
                monthlyChartWrapper.style.setProperty('z-index', '9999999', 'important');
                monthlyChartWrapper.style.setProperty('margin', '0', 'important');
                // Hide title and float the toggle button
                const wrapperHeader = monthlyChartWrapper.querySelector('div[style*="justify-content: space-between"]');
                if (wrapperHeader) {
                    const titleH2 = wrapperHeader.querySelector('h2');
                    if (titleH2) titleH2.style.display = 'none';
                    wrapperHeader.style.setProperty('position', 'absolute', 'important');
                    wrapperHeader.style.setProperty('top', '10px', 'important');
                    wrapperHeader.style.setProperty('right', '10px', 'important');
                    wrapperHeader.style.setProperty('z-index', '10', 'important');
                    wrapperHeader.style.setProperty('margin', '0', 'important');
                }

                // Force landscape visually if in portrait mode
                const updateFullscreenSize = () => {
                    const vW = window.innerWidth;
                    const vH = window.innerHeight;

                    if (vH > vW) {
                        // Portrait orientation -> Rotate to Landscape
                        monthlyChartWrapper.style.setProperty('width', vH + 'px', 'important');
                        monthlyChartWrapper.style.setProperty('height', vW + 'px', 'important');
                        monthlyChartWrapper.style.setProperty('top', '0', 'important');
                        monthlyChartWrapper.style.setProperty('left', '100%', 'important');
                        monthlyChartWrapper.style.setProperty('transform', 'rotate(90deg)', 'important');
                        monthlyChartWrapper.style.setProperty('transform-origin', 'top left', 'important');
                    } else {
                        // Already Landscape
                        monthlyChartWrapper.style.setProperty('width', '100vw', 'important');
                        monthlyChartWrapper.style.setProperty('height', '100vh', 'important');
                        monthlyChartWrapper.style.setProperty('top', '0', 'important');
                        monthlyChartWrapper.style.setProperty('left', '0', 'important');
                        monthlyChartWrapper.style.setProperty('transform', 'none', 'important');
                        monthlyChartWrapper.style.setProperty('transform-origin', 'initial', 'important');
                    }

                    setTimeout(() => {
                        const canvas = document.getElementById('monthlyCombinedChart');
                        const container = canvas ? canvas.parentElement : null;
                        if (canvas && container && typeof monthlyCombinedChartInstance !== 'undefined' && monthlyCombinedChartInstance) {
                            canvas.style.setProperty('width', '100%', 'important');
                            canvas.style.setProperty('height', '100%', 'important');
                            monthlyCombinedChartInstance.resize(container.offsetWidth, container.offsetHeight);
                            monthlyCombinedChartInstance.update('none');
                        }
                    }, 300);
                };

                updateFullscreenSize();
                window.addEventListener('resize', updateFullscreenSize);
                window._updateFullscreenMonthly = updateFullscreenSize;

                if (chartContainer) {
                    chartContainer.style.setProperty('height', '100%', 'important');
                    chartContainer.style.setProperty('width', '100%', 'important');
                    chartContainer.style.setProperty('min-height', '0', 'important');
                    chartContainer.style.setProperty('display', 'flex', 'important');
                    chartContainer.style.setProperty('align-items', 'center', 'important');
                    chartContainer.style.setProperty('justify-content', 'center', 'important');
                    chartContainer.style.flex = '1';
                }

                document.body.style.overflow = 'hidden';

                // Force Chart.js to resize after entering fullscreen
                setTimeout(() => {
                    const canvas = document.getElementById('monthlyCombinedChart');
                    const container = canvas ? canvas.parentElement : null;
                    if (canvas && container) {
                        canvas.style.setProperty('width', '100%', 'important');
                        canvas.style.setProperty('height', '100%', 'important');

                        if (typeof monthlyCombinedChartInstance !== 'undefined' && monthlyCombinedChartInstance) {
                            monthlyCombinedChartInstance.resize(container.offsetWidth, container.offsetHeight);
                            monthlyCombinedChartInstance.update('none');
                        }
                    }
                }, 200);

            } else {
                isFakeFullscreen = false;

                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }

                btnFullscreenMonthly.innerHTML = '<i class="fa-solid fa-expand"></i> <span>Phóng To</span>';

                // Revert CSS
                monthlyChartWrapper.classList.remove('force-fullscreen-mode');

                const bottomNav = document.querySelector('.mobile-nav');
                if (bottomNav) bottomNav.style.display = 'flex';

                const wrapperHeader = monthlyChartWrapper.querySelector('div[style*="justify-content: space-between"]');
                if (wrapperHeader) {
                    const titleH2 = wrapperHeader.querySelector('h2');
                    if (titleH2) titleH2.style.display = '';
                    wrapperHeader.style.removeProperty('position');
                    wrapperHeader.style.removeProperty('top');
                    wrapperHeader.style.removeProperty('right');
                    wrapperHeader.style.removeProperty('z-index');
                    wrapperHeader.style.removeProperty('margin');
                }

                monthlyChartWrapper.style.removeProperty('position');
                monthlyChartWrapper.style.removeProperty('top');
                monthlyChartWrapper.style.removeProperty('left');
                monthlyChartWrapper.style.removeProperty('width');
                monthlyChartWrapper.style.removeProperty('height');
                monthlyChartWrapper.style.removeProperty('z-index');
                monthlyChartWrapper.style.removeProperty('margin');
                monthlyChartWrapper.style.removeProperty('border-radius');
                monthlyChartWrapper.style.removeProperty('background-color');
                monthlyChartWrapper.style.removeProperty('padding');
                monthlyChartWrapper.style.removeProperty('display');
                monthlyChartWrapper.style.removeProperty('flex-direction');
                monthlyChartWrapper.style.removeProperty('overflow');
                monthlyChartWrapper.style.removeProperty('transform');
                monthlyChartWrapper.style.removeProperty('transform-origin');

                if (chartContainer) {
                    chartContainer.style.removeProperty('flex');
                    chartContainer.style.removeProperty('min-height');
                    chartContainer.style.removeProperty('height');
                }

                window.removeEventListener('resize', window._updateFullscreenMonthly);
                delete window._updateFullscreenMonthly;

                document.body.style.overflow = '';

                // Force Chart.js to resize after container dimensions change
                setTimeout(() => {
                    const canvas = document.getElementById('monthlyCombinedChart');
                    const container = document.getElementById('MONTHLY_CHART_FIX_CONTAINER');
                    if (canvas) {
                        const container = document.getElementById('MONTHLY_CHART_FIX_CONTAINER');
                        const isMobile = window.innerWidth <= 768;
                        if (container) {
                            container.style.height = isMobile ? '90vh' : '825px';
                        }
                        canvas.style.height = isMobile ? '85vh' : '785px';
                        canvas.style.width = '100%';

                        if (typeof monthlyCombinedChartInstance !== 'undefined' && monthlyCombinedChartInstance) {
                            monthlyCombinedChartInstance.resize();
                            monthlyCombinedChartInstance.update();
                        }
                    }
                }, 150);
            }
        });
    }

    // Investment logic moved to investment.js

    // Offline Sync Queue & Connection indicator logic
    function updateConnectionStatus() {
        const indicator = document.getElementById('conn-status-indicator');
        if (!indicator) return;

        const queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
        const hasPending = queue.length > 0;

        const dot = indicator.querySelector('.status-dot');
        const loader = indicator.querySelector('.status-loader');
        const text = indicator.querySelector('.status-text');

        if (!navigator.onLine) {
            indicator.className = 'conn-status-badge status-offline';
            if (dot) {
                dot.style.display = 'inline-block';
                dot.style.background = '#ef4444';
            }
            if (loader) loader.style.display = 'none';
            if (text) text.innerText = `Ngoại tuyến ${hasPending ? `(${queue.length} nợ)` : ''}`;
            indicator.style.background = '#fef2f2';
            indicator.style.color = '#991b1b';
            indicator.style.borderColor = '#fecaca';
        } else {
            if (hasPending) {
                indicator.className = 'conn-status-badge status-syncing';
                if (dot) dot.style.display = 'none';
                if (loader) {
                    loader.style.display = 'inline-block';
                    loader.style.color = '#f59e0b';
                }
                if (text) text.innerText = `Chờ đồng bộ (${queue.length})`;
                indicator.style.background = '#fffbeb';
                indicator.style.color = '#92400e';
                indicator.style.borderColor = '#fef3c7';
            } else {
                indicator.className = 'conn-status-badge status-online';
                if (dot) {
                    dot.style.display = 'inline-block';
                    dot.style.background = '#22c55e';
                }
                if (loader) loader.style.display = 'none';
                if (text) text.innerText = 'Trực tuyến';
                indicator.style.background = '#f0fdf4';
                indicator.style.color = '#166534';
                indicator.style.borderColor = '#bbf7d0';
            }
        }
    }

    let isProcessingQueue = false;

    async function processSyncQueue() {
        if (!navigator.onLine) {
            updateConnectionStatus();
            return;
        }
        if (isProcessingQueue) return;
        isProcessingQueue = true;

        try {
            updateConnectionStatus();
            while (navigator.onLine) {
                // Read queue from localStorage at each iteration to ensure we pick up newly added items
                let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
                if (queue.length === 0) break;

                const item = queue[0];
                let success = false;
                let response = null;

                const indicator = document.getElementById('conn-status-indicator');
                if (indicator) {
                    indicator.className = 'conn-status-badge status-syncing';
                    const dot = indicator.querySelector('.status-dot');
                    const loader = indicator.querySelector('.status-loader');
                    const text = indicator.querySelector('.status-text');
                    if (dot) dot.style.display = 'none';
                    if (loader) {
                        loader.style.display = 'inline-block';
                        loader.style.color = '#f59e0b';
                    }
                    if (text) text.innerText = `Đang đồng bộ... (${queue.length} dòng)`;
                }

                try {
                    if (item.action === 'add') {
                        response = await fetch(CONFIG.WEB_APP_URL, {
                            method: "POST",
                            body: JSON.stringify({ ...item.payload, token: getToken() }),
                            headers: { "Content-Type": "text/plain;charset=utf-8" }
                        });
                    } else if (item.action === 'delete') {
                        response = await fetch(CONFIG.WEB_APP_URL, {
                            method: "POST",
                            body: JSON.stringify({ action: "deleteByRow", rowNumber: item.rowNumber, context: item.context, token: getToken() }),
                            headers: { "Content-Type": "text/plain;charset=utf-8" }
                        });
                    } else if (item.action === 'update') {
                        response = await fetch(CONFIG.WEB_APP_URL, {
                            method: "POST",
                            body: JSON.stringify({ action: "update", rowNumber: item.rowNumber, updates: item.updates, token: getToken() }),
                            headers: { "Content-Type": "text/plain;charset=utf-8" }
                        });
                    }

                    if (response) {
                        const result = await response.json();
                        if (result.status === "success") {
                            success = true;
                        } else {
                            console.error("Failed to sync item:", result.message);
                        }
                    }
                } catch (err) {
                    console.error("Network error during queue sync:", err);
                }

                if (success) {
                    let updatedQueue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
                    if (updatedQueue.length > 0) {
                        const first = updatedQueue[0];
                        // Double check it's the same item before shifting to avoid any array mutations
                        if ((item.clientId && first.clientId === item.clientId) || 
                            (item.rowNumber && first.rowNumber === item.rowNumber)) {
                            updatedQueue.shift();
                        } else {
                            updatedQueue = updatedQueue.filter(x => {
                                if (item.clientId && x.clientId === item.clientId) return false;
                                if (item.rowNumber && x.rowNumber === item.rowNumber) return false;
                                return true;
                            });
                        }
                        localStorage.setItem('harvest_sync_queue', JSON.stringify(updatedQueue));
                    }
                } else {
                    // Break loop on failure to prevent infinite retries of a failing item
                    break;
                }
            }

            // Once the queue is fully cleared, trigger a sync refresh to get actual Sheet row IDs
            let checkQueue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
            if (checkQueue.length === 0) {
                showToast("Đồng bộ dữ liệu lên Cloud thành công!", "success");
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) {
                    syncBtn.click();
                } else {
                    syncData();
                }
            }
        } catch (e) {
            console.error("Queue sync error:", e);
        } finally {
            isProcessingQueue = false;
            updateConnectionStatus();
        }
    }

    // --- QUEUE MANAGER MODAL LOGIC ---
    function getQueueItemDescription(item, source) {
        if (source === 'todo') {
            if (item.action === 'save_todo_task') {
                const taskName = item.data ? (item.data.task || 'Không tên') : 'Không tên';
                const status = item.data ? (item.data.status || 'Chưa bắt đầu') : 'Chưa bắt đầu';
                return `<b>Công việc:</b> ${taskName} [Trạng thái: ${status}]`;
            } else if (item.action === 'delete_todo_task') {
                return `<b>Xóa công việc:</b> ID ${item.id}`;
            }
            return `Hành động: ${item.action}`;
        } else {
            if (item.action === 'add') {
                const payload = item.payload || {};
                const name = payload.buyerName || payload.name || 'Không rõ';
                const date = payload.date || payload.ngay || '';
                        const total = payload.totalExpected || payload.total || 0;
                return `<b>Thêm mới:</b> Khách ${name} (${date}) - ${total.toLocaleString('vi-VN')}đ`;
            } else if (item.action === 'delete') {
                return `<b>Xóa dòng:</b> Dòng ${item.rowNumber} (Bảng: ${item.context || 'không rõ'})`;
            } else if (item.action === 'update') {
                return `<b>Sửa dòng:</b> Dòng ${item.rowNumber} (Thay đổi: ${JSON.stringify(item.updates)})`;
            }
            return `Hành động: ${item.action}`;
        }
    }

    function renderQueueItems() {
        const listContainer = document.getElementById('queue-items-list');
        if (!listContainer) return;

        const harvestQueue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
        const todoQueue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');

        if (harvestQueue.length === 0 && todoQueue.length === 0) {
            listContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: #94a3b8; font-style: italic; font-weight: 600;">Hàng chờ đồng bộ đang trống!</div>`;
            return;
        }

        let html = '';

        harvestQueue.forEach((item, index) => {
            const desc = getQueueItemDescription(item, 'harvest');
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(99, 102, 241, 0.05); border-left: 4px solid #6366f1; border-radius: 8px;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div>
                            <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: #6366f1; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">Dữ liệu Farm</span>
                        </div>
                        <span style="font-size: 0.85rem; color: #334155;">${desc}</span>
                    </div>
                    <button type="button" onclick="window.removeQueueItem('harvest', ${index})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; font-size: 1rem;" title="Xóa bỏ mục này">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        });

        todoQueue.forEach((item, index) => {
            const desc = getQueueItemDescription(item, 'todo');
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981; border-radius: 8px;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div>
                            <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">Công Việc</span>
                        </div>
                        <span style="font-size: 0.85rem; color: #334155;">${desc}</span>
                    </div>
                    <button type="button" onclick="window.removeQueueItem('todo', ${index})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; font-size: 1rem;" title="Xóa bỏ mục này">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        });

        listContainer.innerHTML = html;
    }

    window.removeQueueItem = function(source, index) {
        if (!confirm('Bạn có chắc muốn xóa mục này khỏi hàng chờ? Giao dịch/công việc này sẽ không được đồng bộ lên Cloud.')) return;
        
        if (source === 'harvest') {
            let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
            queue.splice(index, 1);
            localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));
            updateConnectionStatus();
        } else {
            let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
            queue.splice(index, 1);
            localStorage.setItem('todo_sync_queue', JSON.stringify(queue));
            if (window.updateTodoConnectionStatus) {
                window.updateTodoConnectionStatus();
            } else {
                updateConnectionStatus();
            }
        }
        renderQueueItems();
    };

    window.renderQueueItems = renderQueueItems;

    const connBadge = document.getElementById('conn-status-indicator');
    if (connBadge) {
        connBadge.style.cursor = 'pointer';
        connBadge.title = 'Nhấp để quản lý hàng chờ đồng bộ (Queue)';
        connBadge.addEventListener('click', () => {
            const modal = document.getElementById('queue-manager-modal');
            if (modal) {
                modal.style.display = 'flex';
                renderQueueItems();
            }
        });
    }

    const btnClearQueue = document.getElementById('btn-clear-queue');
    if (btnClearQueue) {
        btnClearQueue.addEventListener('click', () => {
            if (!confirm('Cảnh báo: Bạn có chắc chắn muốn xóa TOÀN BỘ hàng chờ đồng bộ của cả Dữ liệu Farm và Công Việc? Tất cả thay đổi chưa lưu lên Cloud sẽ bị hủy bỏ.')) return;
            
            localStorage.setItem('harvest_sync_queue', '[]');
            localStorage.setItem('todo_sync_queue', '[]');
            
            showToast('Đã xóa toàn bộ hàng chờ đồng bộ!', 'info');
            document.getElementById('queue-manager-modal').style.display = 'none';
            
            updateConnectionStatus();
            if (window.updateTodoConnectionStatus) {
                window.updateTodoConnectionStatus();
            }
        });
    }

    const btnRetryQueue = document.getElementById('btn-retry-queue');
    if (btnRetryQueue) {
        btnRetryQueue.addEventListener('click', () => {
            showToast('Đang thực hiện đồng bộ lại...', 'info');
            document.getElementById('queue-manager-modal').style.display = 'none';
            
            processSyncQueue();
            if (window.processTodoSyncQueue) {
                window.processTodoSyncQueue();
            }
        });
    }

    // --- PROFILE MODIFICATION LOGIC ---
    const btnEditProfile = document.getElementById("btn-edit-profile");
    const profileModal = document.getElementById("profile-modal");
    const profileNewName = document.getElementById("profile-new-name");
    const profileNewUsername = document.getElementById("profile-new-username");
    const profileCurrentPassword = document.getElementById("profile-current-password");
    const profileErrorMsg = document.getElementById("profile-error-msg");
    const btnSaveProfile = document.getElementById("btn-save-profile");

    if (btnEditProfile && profileModal) {
        btnEditProfile.addEventListener("click", (e) => {
            e.stopPropagation();
            if (userDropdown) userDropdown.classList.remove("active");
            
            // Fill current name & username
            if (profileNewName) profileNewName.value = getUserName() || "";
            if (profileNewUsername) {
                const token = getToken() || "";
                const currentUsername = token.includes(":") ? token.split(":")[0] : "admin";
                profileNewUsername.value = currentUsername;
            }
            if (profileCurrentPassword) profileCurrentPassword.value = "";
            if (profileErrorMsg) profileErrorMsg.style.display = "none";
            
            profileModal.style.display = "flex";
        });
    }

    if (btnSaveProfile) {
        btnSaveProfile.addEventListener("click", async () => {
            const newName = profileNewName ? profileNewName.value.trim() : "";
            const newUsername = profileNewUsername ? profileNewUsername.value.trim() : "";
            const currentPasswordInput = profileCurrentPassword ? profileCurrentPassword.value : "";

            if (!newName) {
                showProfileError("Tên hiển thị không được bỏ trống!");
                return;
            }

            if (!newUsername) {
                showProfileError("Tên đăng nhập không được bỏ trống!");
                return;
            }

            // Extract current password and current username from token
            const token = getToken() || "";
            let currUsername = "admin";
            let currPassword = "";
            if (token.includes(":")) {
                const parts = token.split(":");
                currUsername = parts[0];
                currPassword = parts[1];
            } else {
                currPassword = token;
                const role = getRole();
                if (role === "EMP_LV1") currUsername = "emp1";
                else if (role === "EMP_LV2") currUsername = "emp2";
            }

            // Validate current password
            if (currentPasswordInput !== currPassword) {
                showProfileError("Mật khẩu hiện tại không chính xác!");
                return;
            }

            btnSaveProfile.disabled = true;
            const originalBtnText = btnSaveProfile.innerHTML;
            btnSaveProfile.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

            if (profileErrorMsg) profileErrorMsg.style.display = "none";

            // Check if backend is configured
            if (!isConfigured()) {
                try {
                    let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                    const currentRole = getRole();
                    const oldUsername = getToken() ? getToken().split(":")[0] : newUsername;
                    
                    if (oldUsername && customUsers[oldUsername]) {
                        delete customUsers[oldUsername];
                    }
                    if (customUsers[currentRole]) {
                        delete customUsers[currentRole];
                    }
                    
                    customUsers[newUsername] = {
                        name: newName,
                        role: currentRole,
                        username: newUsername,
                        password: currPassword
                    };

                    localStorage.setItem("custom_users", JSON.stringify(customUsers));

                    sessionStorage.setItem("user-name", newName);
                    sessionStorage.setItem("user-token", newUsername + ":" + currPassword);

                    showToast("Đã lưu thông tin cục bộ thành công!", "success");
                    if (profileModal) profileModal.style.display = "none";
                    updateUserProfile();
                    setTimeout(() => location.reload(), 500);
                } catch (err) {
                    showProfileError("Lỗi lưu thông tin: " + err.message);
                } finally {
                    btnSaveProfile.disabled = false;
                    btnSaveProfile.innerHTML = originalBtnText;
                }
                return;
            }

            // Online saving via Apps Script
            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "update_profile",
                        token: getToken(),
                        oldPassword: currPassword,
                        newName: newName,
                        newUsername: newUsername
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });

                const result = await response.json();
                if (result.status === "success") {
                    sessionStorage.setItem("user-name", newName);
                    sessionStorage.setItem("user-token", newUsername + ":" + currPassword);

                    // Update cached credentials for offline use
                    try {
                        let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                        const currentRole = getRole();
                        const oldUsername = getToken() ? getToken().split(":")[0] : newUsername;
                        
                        if (oldUsername && customUsers[oldUsername]) {
                            delete customUsers[oldUsername];
                        }
                        if (customUsers[currentRole]) {
                            delete customUsers[currentRole];
                        }

                        customUsers[newUsername] = {
                            name: newName,
                            role: currentRole,
                            username: newUsername,
                            password: currPassword
                        };
                        localStorage.setItem("custom_users", JSON.stringify(customUsers));
                    } catch (e) {
                        console.error("Failed to update cached credentials offline:", e);
                    }

                    showToast("Cập nhật thông tin thành công!", "success");
                    if (profileModal) profileModal.style.display = "none";
                    updateUserProfile();
                    setTimeout(() => location.reload(), 500);
                } else {
                    showProfileError(result.message || "Lỗi khi cập nhật thông tin.");
                }
            } catch (err) {
                console.warn("Server update failed, attempting local fallback save:", err);
                try {
                    let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                    const currentRole = getRole();
                    const oldUsername = getToken() ? getToken().split(":")[0] : newUsername;
                    
                    if (oldUsername && customUsers[oldUsername]) {
                        delete customUsers[oldUsername];
                    }
                    if (customUsers[currentRole]) {
                        delete customUsers[currentRole];
                    }
                    
                    customUsers[newUsername] = {
                        name: newName,
                        role: currentRole,
                        username: newUsername,
                        password: currPassword
                    };

                    localStorage.setItem("custom_users", JSON.stringify(customUsers));

                    sessionStorage.setItem("user-name", newName);
                    sessionStorage.setItem("user-token", newUsername + ":" + currPassword);

                    showToast("Lưu cục bộ thành công (Không kết nối được Server)!", "warning");
                    if (profileModal) profileModal.style.display = "none";
                    updateUserProfile();
                    setTimeout(() => location.reload(), 500);
                } catch (localErr) {
                    showProfileError("Lỗi lưu thông tin cục bộ: " + localErr.message);
                }
            } finally {
                btnSaveProfile.disabled = false;
                btnSaveProfile.innerHTML = originalBtnText;
            }
        });
    }

    function showProfileError(msg) {
        if (profileErrorMsg) {
            profileErrorMsg.innerText = msg;
            profileErrorMsg.style.display = "block";
        }
    }

    // --- PASSWORD MODIFICATION LOGIC ---
    const btnChangePassword = document.getElementById("btn-change-password");
    const passwordModal = document.getElementById("password-modal");
    const pwCurrentPassword = document.getElementById("pw-current-password");
    const pwNewPassword = document.getElementById("pw-new-password");
    const pwConfirmPassword = document.getElementById("pw-confirm-password");
    const pwErrorMsg = document.getElementById("pw-error-msg");
    const btnSavePassword = document.getElementById("btn-save-password");

    if (btnChangePassword && passwordModal) {
        btnChangePassword.addEventListener("click", (e) => {
            e.stopPropagation();
            if (userDropdown) userDropdown.classList.remove("active");
            
            if (pwCurrentPassword) pwCurrentPassword.value = "";
            if (pwNewPassword) pwNewPassword.value = "";
            if (pwConfirmPassword) pwConfirmPassword.value = "";
            if (pwErrorMsg) pwErrorMsg.style.display = "none";
            
            passwordModal.style.display = "flex";
        });
    }

    if (btnSavePassword) {
        btnSavePassword.addEventListener("click", async () => {
            const currentPasswordInput = pwCurrentPassword ? pwCurrentPassword.value : "";
            const newPassword = pwNewPassword ? pwNewPassword.value.trim() : "";
            const confirmPassword = pwConfirmPassword ? pwConfirmPassword.value.trim() : "";

            if (!currentPasswordInput) {
                showPasswordError("Mật khẩu hiện tại không được bỏ trống!");
                return;
            }

            if (!newPassword) {
                showPasswordError("Mật khẩu mới không được bỏ trống!");
                return;
            }

            if (newPassword !== confirmPassword) {
                showPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp!");
                return;
            }

            // Extract current password and username from token
            const token = getToken() || "";
            let currUsername = "admin";
            let currPassword = "";
            if (token.includes(":")) {
                const parts = token.split(":");
                currUsername = parts[0];
                currPassword = parts[1];
            } else {
                currPassword = token;
                const role = getRole();
                if (role === "EMP_LV1") currUsername = "emp1";
                else if (role === "EMP_LV2") currUsername = "emp2";
            }

            // Validate current password
            if (currentPasswordInput !== currPassword) {
                showPasswordError("Mật khẩu hiện tại không chính xác!");
                return;
            }

            btnSavePassword.disabled = true;
            const originalBtnText = btnSavePassword.innerHTML;
            btnSavePassword.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

            if (pwErrorMsg) pwErrorMsg.style.display = "none";

            // Check if backend is configured
            if (!isConfigured()) {
                try {
                    let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                    const currentRole = getRole();
                    const currentName = getUserName() || "Người dùng";
                    
                    customUsers[currUsername] = {
                        name: currentName,
                        role: currentRole,
                        username: currUsername,
                        password: newPassword
                    };

                    localStorage.setItem("custom_users", JSON.stringify(customUsers));

                    sessionStorage.setItem("user-token", currUsername + ":" + newPassword);

                    showToast("Đã đổi mật khẩu cục bộ thành công!", "success");
                    if (passwordModal) passwordModal.style.display = "none";
                    setTimeout(() => location.reload(), 500);
                } catch (err) {
                    showPasswordError("Lỗi đổi mật khẩu: " + err.message);
                } finally {
                    btnSavePassword.disabled = false;
                    btnSavePassword.innerHTML = originalBtnText;
                }
                return;
            }

            // Online saving via Apps Script
            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "update_profile",
                        token: getToken(),
                        oldPassword: currPassword,
                        newPassword: newPassword
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });

                const result = await response.json();
                if (result.status === "success") {
                    sessionStorage.setItem("user-token", currUsername + ":" + newPassword);

                    // Update cached credentials for offline use
                    try {
                        let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                        const currentRole = getRole();
                        const currentName = getUserName() || "Người dùng";

                        customUsers[currUsername] = {
                            name: currentName,
                            role: currentRole,
                            username: currUsername,
                            password: newPassword
                        };
                        localStorage.setItem("custom_users", JSON.stringify(customUsers));
                    } catch (e) {
                        console.error("Failed to update cached credentials offline:", e);
                    }

                    showToast("Đổi mật khẩu thành công!", "success");
                    if (passwordModal) passwordModal.style.display = "none";
                    setTimeout(() => location.reload(), 500);
                } else {
                    showPasswordError(result.message || "Lỗi khi đổi mật khẩu.");
                }
            } catch (err) {
                console.warn("Server update failed, attempting local fallback save:", err);
                try {
                    let customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
                    const currentRole = getRole();
                    const currentName = getUserName() || "Người dùng";

                    customUsers[currUsername] = {
                        name: currentName,
                        role: currentRole,
                        username: currUsername,
                        password: newPassword
                    };

                    localStorage.setItem("custom_users", JSON.stringify(customUsers));

                    sessionStorage.setItem("user-token", currUsername + ":" + newPassword);

                    showToast("Đổi mật khẩu cục bộ thành công (Không kết nối được Server)!", "warning");
                    if (passwordModal) passwordModal.style.display = "none";
                    setTimeout(() => location.reload(), 500);
                } catch (localErr) {
                    showPasswordError("Lỗi đổi mật khẩu cục bộ: " + localErr.message);
                }
            } finally {
                btnSavePassword.disabled = false;
                btnSavePassword.innerHTML = originalBtnText;
            }
        });
    }

    function showPasswordError(msg) {
        if (pwErrorMsg) {
            pwErrorMsg.innerText = msg;
            pwErrorMsg.style.display = "block";
        }
    }

    // Bind event listeners
    window.addEventListener('online', () => {
        updateConnectionStatus();
        processSyncQueue();
    });
    window.addEventListener('offline', updateConnectionStatus);

    // Check queue on startup
    setTimeout(() => {
        updateConnectionStatus();
        processSyncQueue();
    }, 1500);

    window.updateConnectionStatus = updateConnectionStatus;
    window.processSyncQueue = processSyncQueue;
});

