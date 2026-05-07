/**
 * Todo V2 - Premium Logic Module
 * Standalone task management for theHarvest7
 */

let todoCache = [];
let todoCharts = {};
let currentSort = { key: 'deadline', asc: true };
let selectedFocusDate = new Date();
selectedFocusDate.setHours(0,0,0,0);


// Register Chart.js Plugins
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation (Updated for new Premium UI)
    const navButtons = document.querySelectorAll('.todo-nav-btn');
    const subviews = document.querySelectorAll('.subview');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            // Update buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update views
            subviews.forEach(v => {
                v.style.display = 'none';
                v.classList.remove('active-subview');
            });

            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.style.display = 'block';
                targetView.classList.add('active-subview');

                // Trigger view-specific renders
                if (targetId === 'view-focus') renderFocus();
                if (targetId === 'view-calendar') renderCalendar();
                if (targetId === 'view-dashboard') renderDashboard();
                if (targetId === 'view-list') renderTable();
            }
        });
    });

    // Modal Handlers
    const modal = document.getElementById('todo-modal');
    const closeBtn = document.getElementById('close-modal');
    const addBtn = document.getElementById('add-task-btn');

    addBtn?.addEventListener('click', () => {
        resetModal();
        document.getElementById('modal-title').innerText = "Thêm Công Việc Mới";
        modal.style.display = 'flex';
    });

    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Save Button
    document.getElementById('save-task-btn')?.addEventListener('click', saveTask);

    // Modal Delete Button
    document.getElementById('delete-task-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('task-id').value;
        if (id) {
            await deleteTask(id);
            document.getElementById('todo-modal').style.display = 'none';
        }
    });

    // Calendar Controls
    document.getElementById('cal-month')?.addEventListener('change', renderCalendar);
    document.getElementById('cal-year')?.addEventListener('change', renderCalendar);

    // Filter Controls
    document.getElementById('filter-search')?.addEventListener('input', renderTable);
    document.getElementById('filter-status')?.addEventListener('change', renderTable);
    document.getElementById('filter-priority')?.addEventListener('change', renderTable);
    document.getElementById('filter-category')?.addEventListener('change', renderTable);
    document.getElementById('filter-month')?.addEventListener('change', renderTable);
    document.getElementById('filter-year')?.addEventListener('change', renderTable);
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-month').value = '';
        document.getElementById('filter-year').value = '';
        renderTable();
    });

    // Populate List Filter years
    const filterYear = document.getElementById('filter-year');
    const filterMonth = document.getElementById('filter-month');
    const now = new Date();

    if (filterYear) {
        const currentYear = now.getFullYear();
        let yearHtml = '<option value="">Năm</option>';
        for (let y = currentYear - 1; y <= currentYear + 2; y++) {
            yearHtml += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
        }
        filterYear.innerHTML = yearHtml;
    }
    if (filterMonth) {
        filterMonth.value = now.getMonth();
    }

    // Dashboard Filters
    const dashMonth = document.getElementById('dash-month');
    const dashYear = document.getElementById('dash-year');
    if (dashMonth && dashYear) {
        // Populate years (current - 2 to current + 5)
        const currentYear = new Date().getFullYear();
        let yearHtml = '<option value="all">Tất cả năm</option>';
        for (let y = currentYear - 1; y <= currentYear + 2; y++) {
            yearHtml += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
        }
        dashYear.innerHTML = yearHtml;
        dashMonth.value = new Date().getMonth();

        dashMonth.addEventListener('change', renderDashboard);
        dashYear.addEventListener('change', renderDashboard);
        document.getElementById('btn-reset-dash-filter')?.addEventListener('click', () => {
            dashMonth.value = new Date().getMonth();
            dashYear.value = new Date().getFullYear();
            renderDashboard();
        });
    }

    // Initial Calendar values
    const monthEl = document.getElementById('cal-month');
    const yearEl = document.getElementById('cal-year');
    if (monthEl) monthEl.value = now.getMonth();
    if (yearEl) yearEl.value = now.getFullYear();

    // Initial Load
    loadTodoData();
    
    // Fallback: If for some reason renderActiveView isn't called by loadTodoData
    setTimeout(() => {
        if (document.getElementById('view-focus')?.style.display !== 'none') {
            renderFocus();
        }
    }, 1500);
});

// --- API LAYER ---
async function callApi(action, extraParams = {}) {
    // Check if CONFIG is available
    if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL) {
        console.error("CONFIG not found. Using fallback URL for demo.");
        return { status: "error", message: "Config missing" };
    }

    const token = localStorage.getItem('farm_token') || "huytran97";
    const payload = { action: action, token: token, ...extraParams };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch(CONFIG.WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("API Error:", error);
        return { status: "error", message: error.name === 'AbortError' ? "Yêu cầu hết thời gian (15s)" : error.message };
    }
}

// --- DATA FETCHING ---
async function loadTodoData() {
    // 1. Try loading from cache first for instant UI
    const cachedData = localStorage.getItem('todo_cache_v2');
    if (cachedData) {
        try {
            todoCache = JSON.parse(cachedData);
            // Re-hydrate Date objects
            todoCache.forEach(t => {
                if (t.deadlineDate) t.deadlineDate = new Date(t.deadlineDate);
                if (t.createdDate) t.createdDate = new Date(t.createdDate);
            });
            renderActiveView();
        } catch (e) {
            console.error("Cache parse error", e);
        }
    }

    const tableBody = document.getElementById('todo-table-body');
    if (!todoCache.length && tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 3rem;">Đang tải dữ liệu...</td></tr>';
    }

    const res = await callApi("get_todo_data");
    if (res.status === "success") {
        const rawData = res.data;
        const parsed = [];
        if (rawData && rawData.length > 1) {
            for (let i = 1; i < rawData.length; i++) {
                const r = rawData[i];
                if (!r[0]) continue;

                parsed.push({
                    id: r[0],
                    task: r[1],
                    deadline: r[2],
                    deadlineDate: parseLocalDate(r[2]), // Pre-parse for speed
                    priority: r[3],
                    status: r[4],
                    category: r[5],
                    note: r[6],
                    createdAt: r[7],
                    createdDate: parseLocalDate(r[7]) // Pre-parse for speed
                });
            }
        }
        todoCache = parsed;
        localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));
        updateCategoryFilterOptions();
        renderActiveView();
    } else {
        console.error("Failed to load data:", res.message);
        if (!todoCache.length && tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 3rem; color: var(--danger);">Không thể tải dữ liệu từ máy chủ.</td></tr>';
        }
    }
}

function renderActiveView() {
    const activeBtn = document.querySelector('.todo-nav-btn.active');
    const targetId = activeBtn?.getAttribute('data-target') || 'view-dashboard';

    if (targetId === 'view-list') renderTable();
    else if (targetId === 'view-calendar') renderCalendar();
    else if (targetId === 'view-dashboard') renderDashboard();
    else if (targetId === 'view-focus') renderFocus();
}

function updateCategoryFilterOptions() {
    const filterCat = document.getElementById('filter-category');
    if (!filterCat) return;

    const currentVal = filterCat.value;
    const categories = [...new Set(todoCache.map(t => t.category || 'Chung'))].sort();
    
    let html = '<option value="">Tất cả phân loại</option>';
    categories.forEach(c => {
        html += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`;
    });
    filterCat.innerHTML = html;
}

// --- RENDERING: TABLE ---
function renderTable() {
    const tableBody = document.getElementById('todo-table-body');
    if (!tableBody) return;

    if (todoCache.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 3rem;">Chưa có công việc nào.</td></tr>';
        return;
    }

    // Get Filter Values
    const searchQuery = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    const priorityFilter = document.getElementById('filter-priority')?.value || '';
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const monthFilter = document.getElementById('filter-month')?.value || '';
    const yearFilter = document.getElementById('filter-year')?.value || '';

    // Apply Filters
    let filtered = todoCache.filter(t => {
        // Smart Date Search: if query is DD/MM/YYYY format, match exactly with deadlineDate
        let matchesSearch = !searchQuery || 
                             t.task.toLowerCase().includes(searchQuery) || 
                             (t.category && t.category.toLowerCase().includes(searchQuery));
        
        // If searchQuery looks like a date (e.g. "01/05/2026")
        if (searchQuery.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) && t.deadlineDate) {
            const parts = searchQuery.split('/');
            const d = t.deadlineDate;
            const isMatch = d.getDate() === parseInt(parts[0]) &&
                            (d.getMonth() + 1) === parseInt(parts[1]) &&
                            d.getFullYear() === parseInt(parts[2]);
            if (isMatch) matchesSearch = true;
        } else if (searchQuery && t.deadline && t.deadline.includes(searchQuery)) {
            matchesSearch = true;
        }

        let matchesStatus = !statusFilter || t.status === statusFilter;
        
        // Handle special derived filter: Delayed
        if (statusFilter === 'Trễ') {
            const isDone = t.status === 'Hoàn thành' || t.status === 'Hủy bỏ';
            const dl = t.deadlineDate;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchesStatus = dl && dl.getTime() < today.getTime() && !isDone;
        }

        const matchesPriority = !priorityFilter || t.priority === priorityFilter;
        const matchesCategory = !categoryFilter || t.category === categoryFilter;

        let matchesMonthYear = true;
        if (t.deadlineDate) {
            if (monthFilter !== '' && t.deadlineDate.getMonth() != monthFilter) matchesMonthYear = false;
            if (yearFilter !== '' && t.deadlineDate.getFullYear() != yearFilter) matchesMonthYear = false;
        } else if (monthFilter !== '' || yearFilter !== '') {
            matchesMonthYear = false; // If filter set but no deadline, exclude
        }

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesMonthYear;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 3rem;">Không tìm thấy công việc phù hợp với bộ lọc.</td></tr>';
        return;
    }

    // Apply Sorting
    const sorted = [...filtered].sort((a, b) => {
        let valA = a[currentSort.key] || "";
        let valB = b[currentSort.key] || "";

        if (currentSort.key === 'deadline') {
            valA = parseLocalDate(valA) || new Date(8640000000000000);
            valB = parseLocalDate(valB) || new Date(8640000000000000);
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });

    tableBody.innerHTML = '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    sorted.forEach(t => {
        const isDone = t.status === 'Hoàn thành' || t.status === 'Hủy bỏ';
        const tr = document.createElement('tr');
        if (isDone) tr.classList.add('task-row-done');

        let daysLeftHtml = "-";
        if (t.deadline && !isDone) {
            const dl = parseLocalDate(t.deadline);
            if (dl) {
                dl.setHours(0, 0, 0, 0);
                const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));

                if (diff < 0) daysLeftHtml = `<span style="color: var(--danger); font-weight: 700;">Trễ ${Math.abs(diff)} ngày</span>`;
                else if (diff === 0) daysLeftHtml = `<span style="color: var(--accent); font-weight: 700;">Hôm nay</span>`;
                else daysLeftHtml = `Còn ${diff} ngày`;
            }
        } else if (isDone && t.status === 'Hoàn thành') {
            daysLeftHtml = `<span style="color: var(--secondary-color); font-weight: 700;"><i class="fa-solid fa-check-double"></i> Xong</span>`;
        }

        const dl = t.deadlineDate;
        const isDelayed = dl && dl.getTime() < now.getTime() && !isDone;
        const delayHtml = isDelayed ? `<span class="badge badge-status-delay" style="margin-left: 5px;">delay</span>` : '';

        tr.innerHTML = `
            <td>${isDone ? '<i class="fa-solid fa-check" style="color: var(--secondary-color); margin-right: 8px;"></i>' : ''}${escapeHtml(t.task)}${delayHtml}</td>
            <td>${t.deadline ? formatDate(t.deadline) : '-'}</td>
            <td>${daysLeftHtml}</td>
            <td><span class="badge ${getPriorityClass(t.priority)}">${t.priority}</span></td>
            <td>
                <select onchange="updateTaskStatus('${t.id}', this.value)" class="badge ${getStatusClass(t.status)}" style="border:none; cursor:pointer; outline:none;">
                    <option value="Chưa bắt đầu" ${t.status === 'Chưa bắt đầu' ? 'selected' : ''}>Chưa bắt đầu</option>
                    <option value="Đang thực hiện" ${t.status === 'Đang thực hiện' ? 'selected' : ''}>Đang thực hiện</option>
                    <option value="Đang chờ duyệt" ${t.status === 'Đang chờ duyệt' ? 'selected' : ''}>Đang chờ duyệt</option>
                    <option value="Hoàn thành" ${t.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                    <option value="Tạm dừng" ${t.status === 'Tạm dừng' ? 'selected' : ''}>Tạm dừng</option>
                    <option value="Hủy bỏ" ${t.status === 'Hủy bỏ' ? 'selected' : ''}>Hủy bỏ</option>
                </select>
            </td>
            <td><span style="color: var(--text-light); font-size: 0.8rem;">${escapeHtml(t.category || 'Chung')}</span></td>
            <td><div style="max-width: 200px; font-size: 0.85rem; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(t.note || '')}">${escapeHtml(t.note || '-')}</div></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn-icon" onclick="editTask('${t.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon delete" onclick="deleteTask('${t.id}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// --- RENDERING: CALENDAR ---
function renderCalendar() {
    const month = parseInt(document.getElementById('cal-month').value);
    const year = parseInt(document.getElementById('cal-year').value);
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Day Headers
    const isMobile = window.innerWidth < 600;
    const days = isMobile ? 
        ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : 
        ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    
    days.forEach(d => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.innerText = d;
        grid.appendChild(div);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust start day (Mon-Sun)
    let startDay = firstDay.getDay();
    if (startDay === 0) startDay = 7; // Sunday is 7

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous Month Days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = 1; i < startDay; i++) {
        const d = prevMonthLastDate - (startDay - i - 1);
        const cellDate = new Date(year, month - 1, d);
        renderCalendarCell(grid, cellDate, d, true, today);
    }

    // Current Month Days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const cellDate = new Date(year, month, d);
        renderCalendarCell(grid, cellDate, d, false, today);
    }

    // Next Month Days (Fill to complete the last week)
    const totalCells = grid.children.length - 7; // Subtract headers
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
            const cellDate = new Date(year, month + 1, d);
            renderCalendarCell(grid, cellDate, d, true, today);
        }
    }
}

function renderCalendarCell(grid, date, dayNum, isOtherMonth, today) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    if (isOtherMonth) div.classList.add('other-month');
    if (date.getTime() === today.getTime()) div.classList.add('today');

    div.innerHTML = `<div class="calendar-day-num">${dayNum}</div>`;

    const m = date.getMonth();
    const y = date.getFullYear();

    // Find tasks: Tasks due on this date OR (if cell is today) overdue tasks
    const dayTasks = todoCache.filter(t => {
        if (!t.deadline) return false;
        const dl = parseLocalDate(t.deadline);
        if (!dl) return false;

        const isSameDay = dl.getDate() === dayNum && dl.getMonth() === m && dl.getFullYear() === y;
        
        // Logic for Overdue/Delayed: if this cell is TODAY, show all past incomplete tasks
        const isTodayCell = date.getTime() === today.getTime();
        const isOverdue = dl.getTime() < today.getTime() && t.status !== 'Hoàn thành' && t.status !== 'Hủy bỏ';

        return isSameDay || (isTodayCell && isOverdue);
    });

    // Sort tasks by priority
    const priorityWeight = { 'Khẩn cấp': 1, 'Cao': 2, 'Trung bình': 3, 'Thấp': 4 };
    dayTasks.sort((a, b) => (priorityWeight[a.priority] || 99) - (priorityWeight[b.priority] || 99));

    dayTasks.forEach(t => {
        const isDone = t.status === 'Hoàn thành' || t.status === 'Hủy bỏ';
        const tDiv = document.createElement('div');
        tDiv.className = 'calendar-task';
        if (isDone) tDiv.style.opacity = '0.6';
        
        const dl = parseLocalDate(t.deadline);
        const isOverdue = dl && dl.getTime() < today.getTime() && !isDone;
        // Category Tag Logic
        let catTag = '';
        if (t.category) {
            let catClass = 'cat-tag-khac';
            const cat = t.category.toLowerCase();
            if (cat.includes('farm')) catClass = 'cat-tag-farm';
            else if (cat.includes('airbus')) catClass = 'cat-tag-airbus';
            else if (cat.includes('family')) catClass = 'cat-tag-family';
            else if (cat.includes('cá nhân')) catClass = 'cat-tag-ca-nhan';
            else if (cat.includes('self-help')) catClass = 'cat-tag-phat-trien';
            
            catTag = ` <span class="cat-tag ${catClass}">${t.category}</span>`;
        }

        const checkIcon = t.status === 'Hoàn thành' ? '<i class="fa-solid fa-check" style="font-size: 0.7rem;"></i> ' : '';
        
        tDiv.innerHTML = (isOverdue ? '<span style="color: #ef4444; font-weight: 800;">(Trễ)</span> ' : '') + checkIcon + escapeHtml(t.task) + catTag;
        tDiv.title = t.task + (t.category ? ` [${t.category}]` : '');

        // Color by priority
        if (t.priority === 'Khẩn cấp') tDiv.style.background = '#fee2e2';
        else if (t.priority === 'Cao') tDiv.style.background = '#ffedd5';
        else tDiv.style.background = '#f1f5f9';

        if (isDone) tDiv.style.textDecoration = 'line-through';

        tDiv.onclick = (e) => {
            e.stopPropagation();
            editTask(t.id);
        };
        div.appendChild(tDiv);
    });

    grid.appendChild(div);
}

// --- RENDERING: FOCUS VIEW ---
function renderFocus() {
    console.log("Rendering Focus View... selected date:", selectedFocusDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const todayList = document.getElementById('focus-today-list');
    const urgentList = document.getElementById('focus-urgent-list');

    if (!todayList || !urgentList) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    // Filter Selected Date + Overdue (Incomplete tasks from past)
    const todayTasks = todoCache.filter(t => {
        const dl = t.deadlineDate;
        if (!dl) return false;

        const isSameDay = dl.getTime() === selectedFocusDate.getTime();
        
        // If viewing TODAY, also show overdue tasks
        const isPast = dl.getTime() < today.getTime();
        const isIncomplete = t.status !== 'Hoàn thành' && t.status !== 'Hủy bỏ';
        const showOverdue = selectedFocusDate.getTime() === today.getTime() && isPast && isIncomplete;

        return isSameDay || showOverdue;
    }).sort((a, b) => {
        // Incomplete first, then by deadline
        const aDone = a.status === 'Hoàn thành' || a.status === 'Hủy bỏ' ? 1 : 0;
        const bDone = b.status === 'Hoàn thành' || b.status === 'Hủy bỏ' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (a.deadlineDate || 0) - (b.deadlineDate || 0);
    });

    // Filter Urgent
    const urgentTasks = todoCache.filter(t => t.priority === 'Khẩn cấp')
        .sort((a, b) => {
            // Incomplete first, then by deadline
            const aDone = a.status === 'Hoàn thành' ? 1 : 0;
            const bDone = b.status === 'Hoàn thành' ? 1 : 0;
            if (aDone !== bDone) return aDone - bDone;

            const dA = a.deadlineDate ? a.deadlineDate.getTime() : 8640000000000000;
            const dB = b.deadlineDate ? b.deadlineDate.getTime() : 8640000000000000;
            return dA - dB;
        });

    // Update Header Label
    const todayHeader = document.querySelector('#view-focus .focus-column:first-child .focus-header');
    if (todayHeader) {
        const isToday = selectedFocusDate.getTime() === today.getTime();
        todayHeader.innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${isToday ? 'CÔNG VIỆC HÔM NAY' : 'CÔNG VIỆC NGÀY ' + formatDate(selectedFocusDate)}`;
    }

    // Render Today
    const todayHtml = todayTasks.length
        ? todayTasks.map(t => createFocusItemHTML(t, 'var(--accent)')).join('')
        : `<div style="text-align:center; color: var(--text-light); padding: 2rem;">Ngày này không có việc.</div>`;
    todayList.innerHTML = todayHtml;

    // Render Urgent
    const urgentHtml = urgentTasks.length
        ? urgentTasks.map(t => createFocusItemHTML(t, 'var(--danger)')).join('')
        : '<div style="text-align:center; color: var(--text-light); padding: 2rem;">Không có việc khẩn cấp.</div>';
    urgentList.innerHTML = urgentHtml;

    renderWeeklyFilter();
}

function renderWeeklyFilter() {
    console.log("Rendering Weekly Filter...");
    const filterContainer = document.getElementById('focus-weekly-filter');
    if (!filterContainer) return;

    filterContainer.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 7 days: 2 days ago to 4 days ahead
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 2);

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        d.setHours(0,0,0,0);

        const isActive = d.getTime() === selectedFocusDate.getTime();
        const isToday = d.getTime() === today.getTime();

        const pill = document.createElement('div');
        pill.className = `date-pill ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`;
        
        const dayName = dayNames[d.getDay()];
        const dayNum = d.getDate();

        pill.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-num">${dayNum}</span>
        `;

        pill.onclick = () => {
            selectedFocusDate = d;
            renderFocus();
        };

        filterContainer.appendChild(pill);
    }
}

function createFocusItemHTML(t, borderColor) {
    const isCompleted = t.status === 'Hoàn thành';
    const titleStyle = isCompleted ? 'text-decoration: line-through; color: var(--text-light);' : '';
    
    // Check for delay
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dl = t.deadlineDate;
    const isDelayed = dl && dl.getTime() < now.getTime() && !isCompleted;
    const delayHtml = isDelayed ? `<span class="badge badge-status-delay" style="margin-left: 8px;">delay</span>` : '';

    return `
        <div class="focus-item" style="border-left-color: ${borderColor}; opacity: ${isCompleted ? 0.6 : 1}" onclick="editTask('${t.id}')">
            <div class="focus-item-title" style="${titleStyle}">${escapeHtml(t.task)}${delayHtml}</div>
            <div class="focus-item-meta">
                <span><i class="fa-regular fa-clock"></i> ${t.deadline ? formatDate(t.deadline) : 'Không hạn'}</span>
                <span class="badge ${getStatusClass(t.status)}">${t.status}</span>
            </div>
        </div>
    `;
}

// --- RENDERING: DASHBOARD ---
function renderDashboard() {
    const selMonth = document.getElementById('dash-month')?.value || 'all';
    const selYear = document.getElementById('dash-year')?.value || 'all';

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Filter data based on Month/Year
    const filteredTasks = todoCache.filter(t => {
        if (!t.deadlineDate) {
            // If no deadline, check createdDate for year match if year is filtered
            if (selYear === 'all') return selMonth === 'all';
            return t.createdDate && t.createdDate.getFullYear() == selYear && selMonth === 'all';
        }

        const m = t.deadlineDate.getMonth();
        const y = t.deadlineDate.getFullYear();

        const monthMatch = selMonth === 'all' || m == selMonth;
        const yearMatch = selYear === 'all' || y == selYear;

        return monthMatch && yearMatch;
    });

    let total = filteredTasks.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let todayCount = 0;

    const priorityMap = { 'Khẩn cấp': 0, 'Cao': 0, 'Trung bình': 0, 'Thấp': 0 };
    const statusMap = {};

    filteredTasks.forEach(t => {
        const isDone = t.status === 'Hoàn thành' || t.status === 'Hủy bỏ';
        if (t.status === 'Hoàn thành') completed++;
        else if (t.status === 'Đang thực hiện') inProgress++;
        else pending++;

        if (t.deadlineDate && t.deadlineDate.getTime() === now.getTime()) todayCount++;

        priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
        statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    // Delayed tasks should be counted globally (not just in the selected month) 
    // because a task delayed from last month is still a priority today.
    let globalDelayedCount = 0;
    todoCache.forEach(t => {
        const isDone = t.status === 'Hoàn thành' || t.status === 'Hủy bỏ';
        if (t.deadlineDate && t.deadlineDate.getTime() < now.getTime() && !isDone) {
            globalDelayedCount++;
        }
    });

    // Update Counters
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-inprogress').innerText = inProgress;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-today').innerText = todayCount;
    if (document.getElementById('stat-delayed')) {
        document.getElementById('stat-delayed').innerText = globalDelayedCount;
    }

    // Charts
    initChart('statusChart', 'doughnut', Object.keys(statusMap), Object.values(statusMap), ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#94a3b8', '#8b5cf6'], 'status');
    initChart('priorityChart', 'bar', Object.keys(priorityMap), Object.values(priorityMap), ['#ef4444', '#f59e0b', '#6366f1', '#10b981'], 'priority');
}

function initChart(id, type, labels, data, colors, filterKey) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    if (todoCharts[id]) todoCharts[id].destroy();

    todoCharts[id] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng',
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: type === 'doughnut' ? '#fff' : '#475569',
                    anchor: type === 'doughnut' ? 'center' : 'end',
                    align: type === 'doughnut' ? 'center' : 'top',
                    offset: type === 'doughnut' ? 0 : 4,
                    font: { weight: 'bold', size: 11 },
                    formatter: (value, ctx) => {
                        if (!value || value === 0) return null;
                        if (type === 'doughnut') {
                            const dataset = ctx.chart.data.datasets[0];
                            const sum = dataset.data.reduce((a, b) => a + b, 0);
                            return ((value * 100) / sum).toFixed(0) + "%";
                        }
                        return value;
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    footerFont: { size: 12, weight: 'normal', italic: true },
                    callbacks: {
                        footer: function (tooltipItems) {
                            const hoveredLabel = tooltipItems[0].label;
                            const matchingTasks = todoCache
                                .filter(t => t[filterKey] === hoveredLabel)
                                .sort((a, b) => {
                                    const dA = parseLocalDate(a.createdAt || a.deadline) || new Date(0);
                                    const dB = parseLocalDate(b.createdAt || b.deadline) || new Date(0);
                                    return dB - dA;
                                })
                                .slice(0, 5);

                            if (matchingTasks.length === 0) return '';
                            return '\n5 VIỆC GẦN NHẤT:\n' + matchingTasks.map(t => '• ' + t.task).join('\n');
                        }
                    }
                }
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const label = labels[index];
                    applyDashboardFilter(filterKey, label);
                }
            },
            scales: type === 'bar' ? {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            } : {}
        }
    });
}

// --- CRUD ACTIONS ---
function resetModal() {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    document.getElementById('task-id').value = "";
    document.getElementById('task-name').value = "";
    document.getElementById('task-deadline').value = todayStr;
    document.getElementById('task-category').value = "Farm";
    document.getElementById('task-note').value = "";
    document.getElementById('task-priority').value = "Trung bình";
    document.getElementById('task-status').value = "Chưa bắt đầu";
    
    // Hide delete button for new tasks
    const delBtn = document.getElementById('delete-task-btn');
    if (delBtn) delBtn.style.display = 'none';
}

window.editTask = function (id) {
    const t = todoCache.find(x => x.id === id);
    if (!t) return;

    resetModal();
    document.getElementById('modal-title').innerText = "Chỉnh Sửa Công Việc";
    document.getElementById('task-id').value = t.id;
    document.getElementById('task-name').value = t.task;
    if (t.deadline) {
        const d = parseLocalDate(t.deadline);
        if (d) {
            document.getElementById('task-deadline').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }
    }
    document.getElementById('task-category').value = t.category || "";
    document.getElementById('task-note').value = t.note || "";
    document.getElementById('task-priority').value = t.priority || "Trung bình";
    document.getElementById('task-status').value = t.status || "Chưa bắt đầu";

    // Show delete button for existing tasks
    const delBtn = document.getElementById('delete-task-btn');
    if (delBtn) delBtn.style.display = 'flex';

    document.getElementById('todo-modal').style.display = 'flex';
}

async function saveTask() {
    const id = document.getElementById('task-id').value;
    const task = document.getElementById('task-name').value.trim();
    const deadline = document.getElementById('task-deadline').value;
    const category = document.getElementById('task-category').value.trim();
    const note = document.getElementById('task-note').value.trim();
    const priority = document.getElementById('task-priority').value;
    const status = document.getElementById('task-status').value;

    if (!task) {
        alert("Vui lòng nhập tên công việc");
        return;
    }

    const taskObj = { id, task, deadline, category, note, priority, status };

    const btn = document.getElementById('save-task-btn');
    const originalText = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Đang lưu...";

        const res = await callApi("save_todo_task", { data: taskObj });

        if (res.status === "success") {
            document.getElementById('todo-modal').style.display = 'none';
            await loadTodoData();
        } else {
            alert("Lỗi khi lưu: " + (res.message || "Không rõ nguyên nhân"));
        }
    } catch (err) {
        console.error("Save error:", err);
        alert("Có lỗi xảy ra: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

window.updateTaskStatus = async function (id, newStatus) {
    const t = todoCache.find(x => x.id === id);
    if (!t) return;

    // Optimistic update
    t.status = newStatus;
    localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));
    renderActiveView();

    await callApi("save_todo_task", { data: { ...t, status: newStatus } });
}

window.deleteTask = async function (id) {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;

    const res = await callApi("delete_todo_task", { id: id });
    if (res.status === "success") {
        loadTodoData();
    } else {
        alert("Lỗi: " + res.message);
    }
}

// --- ACTION HELPERS ---
// --- ACTION HELPERS ---
window.applyDashboardFilter = function (type, value) {
    // Clear all filters first
    const searchInput = document.getElementById('filter-search');
    const statusInput = document.getElementById('filter-status');
    const priorityInput = document.getElementById('filter-priority');

    if (searchInput) searchInput.value = '';
    if (statusInput) statusInput.value = '';
    if (priorityInput) priorityInput.value = '';
    
    currentDateFilter = null; // Reset special date filter

    if (type === 'today') {
        currentDateFilter = new Date();
        // Optional: still show visual date in search but logic will use currentDateFilter
        if (searchInput) searchInput.value = currentDateFilter.getDate().toString().padStart(2, '0') + '/' + (currentDateFilter.getMonth() + 1).toString().padStart(2, '0') + '/' + currentDateFilter.getFullYear();
    } else if (type === 'status') {
        if (statusInput) statusInput.value = value;
    } else if (type === 'priority') {
        if (priorityInput) priorityInput.value = value;
    } else if (type === 'completed') {
        if (statusInput) statusInput.value = 'Hoàn thành';
    } else if (type === 'inprogress') {
        if (statusInput) statusInput.value = 'Đang thực hiện';
    } else if (type === 'pending') {
        if (statusInput) statusInput.value = 'Chưa bắt đầu';
    } else if (type === 'delayed') {
        if (statusInput) statusInput.value = 'Trễ';
    }

    // Switch view
    const listBtn = document.querySelector('.todo-nav-btn[data-target="view-list"]');
    if (listBtn) {
        listBtn.click();
    } else {
        // Fallback if button not found
        renderActiveView();
    }
}

window.toggleSort = function (key) {
    if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.key = key;
        currentSort.asc = true;
    }
    renderActiveView();
}

// --- HELPERS ---
function getPriorityClass(p) {
    if (p === 'Khẩn cấp') return 'badge-priority-urgent';
    if (p === 'Cao') return 'badge-priority-high';
    if (p === 'Trung bình') return 'badge-priority-medium';
    return 'badge-priority-low';
}

function getStatusClass(s) {
    if (s === 'Đang thực hiện') return 'badge-status-inprogress';
    if (s === 'Hoàn thành') return 'badge-status-completed';
    if (s === 'Hủy bỏ') return 'badge-status-cancelled';
    if (s === 'Đang chờ duyệt') return 'badge-status-waiting';
    return 'badge-status-notstarted';
}

function formatDate(dateStr) {
    const d = parseLocalDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    // Handle ISO YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }

    // Handle DD/MM/YYYY
    const vnMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (vnMatch) {
        return new Date(parseInt(vnMatch[3]), parseInt(vnMatch[2]) - 1, parseInt(vnMatch[1]));
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
