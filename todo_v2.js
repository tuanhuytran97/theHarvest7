/**
 * Todo V2 - Premium Logic Module
 * Standalone task management for theHarvest7
 */

let todoCache = [];
let todoCharts = {};
let currentSort = { key: 'deadline', asc: true };
let selectedFocusDate = new Date();
selectedFocusDate.setHours(0, 0, 0, 0);
let selectedCalCategories = [];
let selectedCalStickers = [];
let selectedListStickers = [];


// Register Chart.js Plugins
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

var getRole = () => sessionStorage.getItem("user-role");

function isRestricted() {
    if (getRole() === 'EMP_LV2') {
        alert("Tài khoản của bạn là tài khoản bậc 2, không được thực hiện chức năng này. Vui lòng liên hệ admin để nâng cấp hạng tài khoản");
        return true;
    }
    return false;
}

window.toggleMultidayFields = function() {
    const isMultiday = document.getElementById('task-is-multiday')?.checked;
    const startDateGroup = document.getElementById('start-date-group');
    const deadlineLabel = document.getElementById('deadline-label');
    const grid = document.getElementById('date-category-grid');
    
    const container = document.querySelector('.multiday-toggle-container');
    if (container) {
        if (isMultiday) {
            container.classList.add('active-multiday');
        } else {
            container.classList.remove('active-multiday');
        }
    }
    
    if (isMultiday) {
        if (startDateGroup) startDateGroup.style.display = 'block';
        if (deadlineLabel) deadlineLabel.innerText = 'Đến ngày';
        if (grid) grid.classList.add('grid-3-cols');
        
        const startDateInput = document.getElementById('task-start-date');
        const deadlineInput = document.getElementById('task-deadline');
        if (startDateInput && deadlineInput && !startDateInput.value) {
            startDateInput.value = deadlineInput.value;
        }
    } else {
        if (startDateGroup) startDateGroup.style.display = 'none';
        if (deadlineLabel) deadlineLabel.innerText = 'Deadline at';
        if (grid) grid.classList.remove('grid-3-cols');
    }
};

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
                if (targetId === 'view-ai-scheduler') renderAIScheduler();
            }
        });
    });

    // Modal Handlers
    const modal = document.getElementById('todo-modal');
    const closeBtn = document.getElementById('close-modal');
    const addBtn = document.getElementById('add-task-btn');

    addBtn?.addEventListener('click', () => {
        if (isRestricted()) return;
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

    // Event listeners for Ứng Tiền Thợ
    const isAdvanceCb = document.getElementById('task-is-advance');
    const advanceFieldsGrid = document.getElementById('advance-fields-grid');
    const workerSelect = document.getElementById('task-worker-select');
    const workerCustom = document.getElementById('task-worker-custom');

    if (isAdvanceCb) {
        isAdvanceCb.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (advanceFieldsGrid) advanceFieldsGrid.style.display = 'grid';
                const catInput = document.getElementById('task-category');
                if (catInput) catInput.value = "Farm";
                
                // Auto check Sticker "Thợ"
                document.querySelectorAll('.sticker-checkbox').forEach(cb => {
                    if (cb.value === "Thợ") cb.checked = true;
                });
                updateStickerLabel();
                toggleStickerFieldVisibility();

                const taskNameInput = document.getElementById('task-name');
                if (taskNameInput && (!taskNameInput.value.trim() || taskNameInput.value.trim() === 'Thợ')) {
                    taskNameInput.value = "Ứng tiền thợ";
                }
            } else {
                if (advanceFieldsGrid) advanceFieldsGrid.style.display = 'none';
            }
        });
    }

    if (workerSelect) {
        workerSelect.addEventListener('change', (e) => {
            if (e.target.value === '__NEW__') {
                if (workerCustom) {
                    workerCustom.style.display = 'block';
                    workerCustom.focus();
                }
            } else {
                if (workerCustom) workerCustom.style.display = 'none';
                const taskNameInput = document.getElementById('task-name');
                if (taskNameInput && e.target.value) {
                    taskNameInput.value = `Ứng tiền thợ: ${e.target.value}`;
                }
            }
        });
    }

    // Event listeners for Chấm Công Nghỉ Thợ
    const isLeaveCb = document.getElementById('task-is-leave');
    const leaveFieldsGrid = document.getElementById('leave-fields-grid');
    const leaveWorkerSelect = document.getElementById('task-leave-worker-select');
    const leaveWorkerCustom = document.getElementById('task-leave-worker-custom');
    const leaveDaysInput = document.getElementById('task-leave-days');

    function updateLeaveTaskName() {
        const isLeave = document.getElementById('task-is-leave')?.checked;
        if (!isLeave) return;
        const workerSelectVal = document.getElementById('task-leave-worker-select')?.value || "";
        const workerCustomVal = document.getElementById('task-leave-worker-custom')?.value.trim() || "";
        const workerName = workerSelectVal === '__NEW__' ? (workerCustomVal || "Thợ mới") : (workerSelectVal || "Thợ");
        const leaveDaysVal = document.getElementById('task-leave-days')?.value || "1";
        const taskNameInput = document.getElementById('task-name');
        if (taskNameInput) {
            taskNameInput.value = `Thợ nghỉ: ${workerName} (${leaveDaysVal} công)`;
        }
    }

    if (isLeaveCb) {
        isLeaveCb.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (leaveFieldsGrid) leaveFieldsGrid.style.display = 'grid';
                const catInput = document.getElementById('task-category');
                if (catInput) catInput.value = "Farm";
                
                // Auto check Sticker "Thợ"
                document.querySelectorAll('.sticker-checkbox').forEach(cb => {
                    if (cb.value === "Thợ") cb.checked = true;
                });
                updateStickerLabel();
                toggleStickerFieldVisibility();

                updateLeaveTaskName();
            } else {
                if (leaveFieldsGrid) leaveFieldsGrid.style.display = 'none';
            }
        });
    }

    if (leaveWorkerSelect) {
        leaveWorkerSelect.addEventListener('change', (e) => {
            if (e.target.value === '__NEW__') {
                if (leaveWorkerCustom) {
                    leaveWorkerCustom.style.display = 'block';
                    leaveWorkerCustom.focus();
                }
            } else {
                if (leaveWorkerCustom) leaveWorkerCustom.style.display = 'none';
            }
            updateLeaveTaskName();
        });
    }

    if (leaveWorkerCustom) {
        leaveWorkerCustom.addEventListener('input', updateLeaveTaskName);
    }

    if (leaveDaysInput) {
        leaveDaysInput.addEventListener('input', updateLeaveTaskName);
    }

    // Multiday Toggle Listener
    document.getElementById('task-is-multiday')?.addEventListener('change', toggleMultidayFields);

    // Task Category Visibility & Auto-fill Trigger
    document.getElementById('task-category')?.addEventListener('change', () => {
        toggleStickerFieldVisibility();
        autoFillTaskNamePrefix();
        autoFillStickersSuffix();
    });

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

    // Calendar Sticker Multi-Select Trigger logic
    const calStickerMS = document.getElementById('cal-sticker-multiselect');
    if (calStickerMS) {
        const trigger = calStickerMS.querySelector('.multiselect-trigger');
        const dropdown = calStickerMS.querySelector('.multiselect-dropdown');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.style.display === 'block';
                dropdown.style.display = isOpen ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#cal-sticker-multiselect')) {
                    dropdown.style.display = 'none';
                }
            });
        }
    }

    // Export Calendar text listener
    document.getElementById('btn-export-text')?.addEventListener('click', openExportTextModal);
    document.getElementById('btn-copy-export')?.addEventListener('click', copyExportText);

    // Worker Filter Select listeners
    const calWorkerSel = document.getElementById('cal-worker-select');
    const filterWorkerSel = document.getElementById('filter-worker-select');

    if (calWorkerSel) {
        calWorkerSel.addEventListener('change', (e) => {
            if (filterWorkerSel) filterWorkerSel.value = e.target.value;
            renderActiveView();
        });
    }

    if (filterWorkerSel) {
        filterWorkerSel.addEventListener('change', (e) => {
            if (calWorkerSel) calWorkerSel.value = e.target.value;
            renderActiveView();
        });
    }

    // Populate worker options for modal and filters
    populateWorkerSelectOptions();

    // Custom Multi-Select Trigger logic
    const msContainer = document.getElementById('cal-category-multiselect');
    if (msContainer) {
        const trigger = msContainer.querySelector('.multiselect-trigger');
        const dropdown = msContainer.querySelector('.multiselect-dropdown');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.style.display === 'block';
                dropdown.style.display = isOpen ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#cal-category-multiselect')) {
                    dropdown.style.display = 'none';
                }
            });
        }
    }

    // Custom Multi-Select Sticker Trigger logic in modal
    const modalStickerContainer = document.getElementById('task-sticker-multiselect');
    if (modalStickerContainer) {
        const trigger = modalStickerContainer.querySelector('.multiselect-trigger');
        const dropdown = modalStickerContainer.querySelector('.multiselect-dropdown');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.style.display === 'block';
                dropdown.style.display = isOpen ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#task-sticker-multiselect')) {
                    dropdown.style.display = 'none';
                }
            });
        }
    }

    // Attach change event listener to all sticker checkboxes
    document.querySelectorAll('.sticker-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            updateStickerLabel();
            autoFillStickersSuffix();
        });
    });

    // Filter Controls
    document.getElementById('filter-search')?.addEventListener('input', renderTable);
    document.getElementById('filter-status')?.addEventListener('change', renderTable);
    document.getElementById('filter-priority')?.addEventListener('change', renderTable);
    document.getElementById('filter-category')?.addEventListener('change', renderTable);
    document.getElementById('filter-month')?.addEventListener('change', renderTable);
    document.getElementById('filter-year')?.addEventListener('change', renderTable);

    // List Sticker Multi-Select Trigger logic
    const filterStickerMS = document.getElementById('filter-sticker-multiselect');
    if (filterStickerMS) {
        const trigger = filterStickerMS.querySelector('.multiselect-trigger');
        const dropdown = filterStickerMS.querySelector('.multiselect-dropdown');
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.style.display === 'block';
                dropdown.style.display = isOpen ? 'none' : 'block';
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#filter-sticker-multiselect')) {
                    dropdown.style.display = 'none';
                }
            });
        }
    }
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-category').value = '';
        selectedListStickers = [];
        updateListStickerTriggerLabel();
        renderListStickerMultiSelect();
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
        if (document.getElementById('view-calendar')?.style.display !== 'none') {
            renderCalendar();
        } else if (document.getElementById('view-focus')?.style.display !== 'none') {
            renderFocus();
        }
    }, 1500);

    // Setup planning mode switcher
    window.currentSchedMode = 'backward';
    const backwardBtns = document.querySelectorAll('#btn-sched-mode-backward, #btn-sched-mode-backward-main');
    const forwardBtns = document.querySelectorAll('#btn-sched-mode-forward, #btn-sched-mode-forward-main');

    const setMode = (mode) => {
        window.currentSchedMode = mode;
        if (mode === 'backward') {
            backwardBtns.forEach(btn => {
                btn.classList.add('active');
                btn.style.background = 'white';
                btn.style.color = '#4f46e5';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            });
            forwardBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = '#64748b';
                btn.style.boxShadow = 'none';
            });
            const el1 = document.getElementById('sched-holiday-preset-group');
            const el2 = document.getElementById('sched-holiday-date-group');
            const el3 = document.getElementById('sched-days-before-group');
            const el4 = document.getElementById('sched-cut-date-group');
            const el5 = document.getElementById('sched-actual-date-group');
            if (el1) el1.style.display = 'block';
            if (el2) el2.style.display = 'block';
            if (el3) el3.style.display = 'block';
            if (el4) el4.style.display = 'none';
            if (el5) el5.style.display = 'none';
            
            const label3 = document.getElementById('sched-timeline-holiday-label');
            if (label3) label3.innerText = 'Ngày Lễ';
            const dot3 = document.getElementById('sched-timeline-holiday-dot');
            if (dot3) dot3.style.background = '#f59e0b';
        } else {
            forwardBtns.forEach(btn => {
                btn.classList.add('active');
                btn.style.background = 'white';
                btn.style.color = '#4f46e5';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            });
            backwardBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = '#64748b';
                btn.style.boxShadow = 'none';
            });
            const el1 = document.getElementById('sched-holiday-preset-group');
            const el2 = document.getElementById('sched-holiday-date-group');
            const el3 = document.getElementById('sched-days-before-group');
            const el4 = document.getElementById('sched-cut-date-group');
            const el5 = document.getElementById('sched-actual-date-group');
            if (el1) el1.style.display = 'none';
            if (el2) el2.style.display = 'none';
            if (el3) el3.style.display = 'none';
            if (el4) el4.style.display = 'block';
            if (el5) el5.style.display = 'block';

            const cutDateInput = document.getElementById('sched-cut-date');
            if (cutDateInput && !cutDateInput.value) {
                const todayStr = new Date().toISOString().split('T')[0];
                cutDateInput.value = todayStr;
            }

            const label3 = document.getElementById('sched-timeline-holiday-label');
            if (label3) label3.innerText = 'Rộ Thực Tế';
            const dot3 = document.getElementById('sched-timeline-holiday-dot');
            if (dot3) dot3.style.background = '#8b5cf6';
        }
    };

    backwardBtns.forEach(btn => btn.addEventListener('click', () => setMode('backward')));
    forwardBtns.forEach(btn => btn.addEventListener('click', () => setMode('forward')));

    // Setup variety pill selectors for AI Scheduler
    const schedPillButtons = document.querySelectorAll('.sched-flower-pill-btn');
    schedPillButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            schedPillButtons.forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            const varietyVal = btn.getAttribute('data-value');
            const hiddenInput = document.getElementById('sched-selected-variety');
            if (hiddenInput) hiddenInput.value = varietyVal;

            // No auto-run on selection, wait for user to click the blue button
        });
    });

    // Listeners for manual date input changes
    const schedHolidayDateInput = document.getElementById('sched-holiday-date');
    if (schedHolidayDateInput) {
        const handleDateChange = () => {
            const presetSelect = document.getElementById('sched-holiday-preset');
            if (presetSelect && presetSelect.value !== 'custom') {
                presetSelect.value = 'custom';
            }
            // No auto-run on date change, wait for user to click the blue button
        };
        schedHolidayDateInput.addEventListener('change', handleDateChange);
        schedHolidayDateInput.addEventListener('input', handleDateChange);
    }

    // Initialize Gemini API Key field
    const geminiKeyInput = document.getElementById('sched-gemini-key');
    if (geminiKeyInput) {
        geminiKeyInput.value = localStorage.getItem('sched_gemini_key') || (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
    }

    // Run analysis button
    const runAnalysisBtn = document.getElementById('btn-run-sched-analysis');
    if (runAnalysisBtn) {
        runAnalysisBtn.addEventListener('click', () => {
            if (typeof window.runAIScheduleAnalysis === 'function') {
                window.runAIScheduleAnalysis();
            }
        });
    }

    // Save tasks button
    const saveSchedTasksBtn = document.getElementById('btn-save-sched-tasks');
    if (saveSchedTasksBtn) {
        saveSchedTasksBtn.addEventListener('click', () => {
            if (typeof window.saveAIScheduleTasks === 'function') {
                window.saveAIScheduleTasks();
            }
        });
    }

    // Reset button
    const resetSchedBtn = document.getElementById('btn-reset-sched');
    if (resetSchedBtn) {
        resetSchedBtn.addEventListener('click', () => {
            if (typeof window.cancelAIScheduleAnalysis === 'function') {
                window.cancelAIScheduleAnalysis();
            }
        });
    }

    // Initial check and listeners on sync queue
    window.addEventListener('online', () => {
        updateTodoConnectionStatus();
        processTodoSyncQueue();
    });
    window.addEventListener('offline', updateTodoConnectionStatus);

    setTimeout(() => {
        updateTodoConnectionStatus();
        processTodoSyncQueue();
    }, 1500);
});

// --- API LAYER ---
async function callApi(action, extraParams = {}) {
    // Check if CONFIG is available
    if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL === "NOT_CONFIGURED" || CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
        console.warn("CONFIG.WEB_APP_URL not configured. Skipping API call.");
        return { status: "error", message: "Config missing" };
    }

    const token = localStorage.getItem('farm_token') || "huytran97";
    const payload = { action: action, token: token, ...extraParams };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for Google Apps Script

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
        return { status: "error", message: error.name === 'AbortError' ? "Yêu cầu hết thời gian kết nối (30s)" : error.message };
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
                if (t.startDateDate) t.startDateDate = new Date(t.startDateDate);
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
                    createdDate: parseLocalDate(r[7]), // Pre-parse for speed
                    sticker: r[8] || "",
                    startDate: r[9] || r[2],
                    startDateDate: parseLocalDate(r[9] || r[2])
                });
            }
        }
        todoCache = parsed;
        localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));
        updateCategoryFilterOptions();
        renderCalStickerMultiSelect();
        renderListStickerMultiSelect();
        renderActiveView();
    } else {
        if (res.message === "Config missing") {
            console.warn("Skipping todo data load because CONFIG.WEB_APP_URL is not configured.");
        } else {
            console.error("Failed to load data:", res.message);
        }
        if (!todoCache.length && tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 3rem; color: var(--danger);">Không thể tải dữ liệu từ máy chủ.</td></tr>';
        }
    }
}

function renderActiveView() {
    const activeBtn = document.querySelector('.todo-nav-btn.active');
    const targetId = activeBtn?.getAttribute('data-target') || 'view-calendar';

    if (targetId === 'view-list') renderTable();
    else if (targetId === 'view-calendar') renderCalendar();
    else if (targetId === 'view-dashboard') renderDashboard();
    else if (targetId === 'view-focus') renderFocus();
    else if (targetId === 'view-ai-scheduler') renderAIScheduler();
}

function updateCategoryFilterOptions() {
    const categories = [...new Set(todoCache.map(t => t.category || 'Chung'))].sort();

    const filterCat = document.getElementById('filter-category');
    if (filterCat) {
        const currentVal = filterCat.value;
        let html = '<option value="">Tất cả phân loại</option>';
        categories.forEach(c => {
            html += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`;
        });
        filterCat.innerHTML = html;
    }

    // Render custom multi-select checkbox component
    renderCalCategoryMultiSelect(categories);

    // Populate worker dropdown options
    populateWorkerSelectOptions();
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
        const matchesCategory = !categoryFilter || (t.category || 'Chung') === categoryFilter;
        const taskStickers = t.sticker ? t.sticker.split(',').map(s => s.trim()).filter(Boolean) : [];
        const matchesSticker = selectedListStickers.length === 0 || taskStickers.some(st => selectedListStickers.includes(st));

        const workerFilter = (document.getElementById('filter-worker-select')?.value || document.getElementById('cal-worker-select')?.value || "").trim();
        let matchesWorker = true;
        if (workerFilter) {
            const tWorker = (t.workerName || "").trim();
            const tTitle = (t.task || "") + " " + (t.note || "");
            matchesWorker = (tWorker === workerFilter) || tTitle.includes(workerFilter);
        }

        let matchesMonthYear = true;
        if (t.deadlineDate) {
            if (monthFilter !== '' && t.deadlineDate.getMonth() != monthFilter) matchesMonthYear = false;
            if (yearFilter !== '' && t.deadlineDate.getFullYear() != yearFilter) matchesMonthYear = false;
        } else if (monthFilter !== '' || yearFilter !== '') {
            matchesMonthYear = false; // If filter set but no deadline, exclude
        }

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesMonthYear && matchesSticker && matchesWorker;
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

        let stickerTagHtml = '';
        if (t.sticker) {
            const stickers = t.sticker.split(',').map(s => s.trim()).filter(Boolean);
            stickers.forEach(st => {
                const stickerClass = getStickerTagClass(st);
                stickerTagHtml += ` <span class="sticker-tag ${stickerClass}">${getStickerEmoji(st)}</span>`;
            });
        }

        tr.innerHTML = `
            <td>${isDone ? '<i class="fa-solid fa-check" style="color: var(--secondary-color); margin-right: 8px;"></i>' : ''}${escapeHtml(t.task)}${stickerTagHtml}${delayHtml}</td>
            <td>${t.startDate && t.startDate !== t.deadline ? formatDate(t.startDate) + ' - ' + formatDate(t.deadline) : (t.deadline ? formatDate(t.deadline) : '-')}</td>
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

function renderMonthlySummaryBanner(month, year) {
    const banner = document.getElementById('calendar-monthly-summary-banner');
    if (!banner) return;

    const workerTotals = getMonthlyWorkerAdvances(month, year);
    const leaveTotals = getMonthlyWorkerLeaveDays(month, year);
    const advanceEntries = Object.entries(workerTotals);
    const leaveEntries = Object.entries(leaveTotals);

    if (advanceEntries.length === 0 && leaveEntries.length === 0) {
        banner.style.display = 'none';
        return;
    }

    const workerFilter = (document.getElementById('cal-worker-select')?.value || document.getElementById('filter-worker-select')?.value || "").trim();
    const pad = (n) => String(n).padStart(2, '0');
    const displayMonth = pad(month + 1);

    let html = `
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 0.82rem; line-height: 1.4;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; color: #1e40af; border-right: 1px solid #93c5fd; padding-right: 10px;">
                <i class="fa-solid fa-chart-pie" style="color: #2563eb; font-size: 0.9rem;"></i>
                <span>TỔNG KẾT THÁNG ${displayMonth}/${year} ${workerFilter ? `(${escapeHtml(workerFilter)})` : ''}</span>
            </div>
    `;

    if (advanceEntries.length > 0) {
        let totalAdvance = 0;
        let advancesHtml = '<div style="display: flex; align-items: center; gap: 6px;"><span style="font-weight: 800; color: #991b1b;">💳 Ứng tiền thợ:</span>';
        const itemStrs = [];
        advanceEntries.forEach(([name, amount]) => {
            totalAdvance += amount;
            const formattedAmt = typeof formatMoneyStr === 'function' ? formatMoneyStr(amount) : amount.toLocaleString('vi-VN');
            itemStrs.push(`<span style="font-weight: 700; color: #7f1d1d;">${escapeHtml(name)}: <b style="color: #b91c1c;">${formattedAmt}đ</b></span>`);
        });
        advancesHtml += itemStrs.join('<span style="color: #93c5fd; margin: 0 4px;">|</span>');
        if (advanceEntries.length > 1) {
            const formattedTotal = typeof formatMoneyStr === 'function' ? formatMoneyStr(totalAdvance) : totalAdvance.toLocaleString('vi-VN');
            advancesHtml += `<span style="font-weight: 800; color: #991b1b; background: rgba(239,68,68,0.1); padding: 1px 6px; border-radius: 4px; margin-left: 4px;">Tổng: ${formattedTotal}đ</span>`;
        }
        advancesHtml += '</div>';
        html += advancesHtml;
    }

    if (leaveEntries.length > 0) {
        if (advanceEntries.length > 0) {
            html += `<span style="color: #93c5fd; font-weight: 300;">|</span>`;
        }
        let leavesHtml = '<div style="display: flex; align-items: center; gap: 6px;"><span style="font-weight: 800; color: #1d4ed8;">🏖️ Thợ nghỉ:</span>';
        const itemStrs = [];
        leaveEntries.forEach(([name, days]) => {
            itemStrs.push(`<span style="font-weight: 700; color: #1e3a8a;">${escapeHtml(name)}: <b style="color: #2563eb;">${days} công</b></span>`);
        });
        leavesHtml += itemStrs.join('<span style="color: #93c5fd; margin: 0 4px;">|</span>');
        leavesHtml += '</div>';
        html += leavesHtml;
    }

    html += `</div>`;

    banner.innerHTML = html;
    banner.style.display = 'block';
}

// --- RENDERING: CALENDAR ---
function renderCalendar() {
    const month = parseInt(document.getElementById('cal-month').value);
    const year = parseInt(document.getElementById('cal-year').value);
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    renderMonthlySummaryBanner(month, year);

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

    div.onclick = () => {
        if (isRestricted()) return;
        openAddTaskModalWithDate(date);
    };

    div.innerHTML = `<div class="calendar-day-num">${dayNum}</div>`;

    const m = date.getMonth();
    const y = date.getFullYear();

    // Find tasks: Tasks active on this date OR (if cell is today) overdue tasks
    const dayTasks = todoCache.filter(t => {
        if (!t.deadline) return false;
        const dl = parseLocalDate(t.deadline);
        if (!dl) return false;

        let sd = t.startDate ? parseLocalDate(t.startDate) : null;
        if (!sd) sd = dl;

        const cellTime = date.getTime();
        const startTime = sd.getTime();
        const endTime = dl.getTime();

        const isSameDay = cellTime >= startTime && cellTime <= endTime;

        // Logic for Overdue/Delayed: if this cell is TODAY, show all past incomplete tasks
        const isTodayCell = date.getTime() === today.getTime();
        const isOverdue = dl.getTime() < today.getTime() && t.status !== 'Hoàn thành' && t.status !== 'Hủy bỏ';

        if (!(isSameDay || (isTodayCell && isOverdue))) return false;

        // Apply category filter (falsy categories default to 'Chung')
        const tCategory = t.category || 'Chung';
        const matchesCategory = selectedCalCategories.length === 0 || selectedCalCategories.includes(tCategory);

        // Apply sticker filter
        const taskStickers = t.sticker ? t.sticker.split(',').map(s => s.trim()).filter(Boolean) : [];
        const matchesSticker = selectedCalStickers.length === 0 || taskStickers.some(st => selectedCalStickers.includes(st));

        // Apply Worker filter
        const workerFilter = (document.getElementById('cal-worker-select')?.value || document.getElementById('filter-worker-select')?.value || "").trim();
        let matchesWorker = true;
        if (workerFilter) {
            const tWorker = (t.workerName || "").trim();
            const tTitle = (t.task || "") + " " + (t.note || "");
            matchesWorker = (tWorker === workerFilter) || tTitle.includes(workerFilter);
        }

        return matchesCategory && matchesSticker && matchesWorker;
    });

    // Sort tasks by priority
    const priorityWeight = { 'Khẩn cấp': 1, 'Cao': 2, 'Trung bình': 3, 'Thấp': 4 };
    dayTasks.sort((a, b) => (priorityWeight[a.priority] || 99) - (priorityWeight[b.priority] || 99));

    dayTasks.forEach(t => {
        const isDone = t.status === 'Hoàn thành' || t.status === 'Hủy bỏ';
        const tDiv = document.createElement('div');
        tDiv.className = 'calendar-task';

        const dl = parseLocalDate(t.deadline);
        const isOverdue = dl && dl.getTime() < today.getTime() && !isDone;
        // Sticker Tag Logic
        let stickerTag = '';
        if (t.sticker) {
            const stickers = t.sticker.split(',').map(s => s.trim()).filter(Boolean);
            stickers.forEach(st => {
                const stickerClass = getStickerTagClass(st);
                stickerTag += ` <span class="sticker-tag ${stickerClass}">${getStickerEmoji(st)}</span>`;
            });
        }

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
        const taskNameHtml = isDone
            ? `<span style="text-decoration: line-through; color: #94a3b8;">${escapeHtml(t.task)}</span>`
            : `<span>${escapeHtml(t.task)}</span>`;

        tDiv.innerHTML = (isOverdue ? '<span style="color: #ef4444; font-weight: 800;">(Trễ)</span> ' : '') + checkIcon + taskNameHtml + stickerTag + catTag;
        tDiv.title = t.task + (t.category ? ` [${t.category}]` : '');

        // Color by priority if active, else grey out background only
        if (isDone) {
            tDiv.style.background = '#f8fafc';
            tDiv.style.border = '1px solid #cbd5e1';
            tDiv.style.textDecoration = 'none';
        } else {
            tDiv.style.textDecoration = 'none';
            if (t.priority === 'Khẩn cấp') {
                tDiv.style.background = '#fee2e2';
                tDiv.style.color = '#991b1b';
                tDiv.style.border = '1px solid #fecaca';
            } else if (t.priority === 'Cao') {
                tDiv.style.background = '#ffedd5';
                tDiv.style.color = '#c2410c';
                tDiv.style.border = '1px solid #fed7aa';
            } else {
                tDiv.style.background = '#ffffff';
                tDiv.style.color = '#334155';
                tDiv.style.border = '1px solid #e2e8f0';
            }
        }

        tDiv.onclick = (e) => {
            e.stopPropagation();
            if (isRestricted()) return;
            editTask(t.id);
        };
        div.appendChild(tDiv);
    });

    grid.appendChild(div);
}

function extractWorkerNameFromText(text, prefix) {
    if (!text || !text.includes(prefix)) return "";
    const idx = text.indexOf(prefix);
    let sub = text.substring(idx + prefix.length).trim();
    // Remove trailing parenthetical details like (1.000.000đ) or (0.5 công)
    sub = sub.replace(/\s*\([^\)]+\).*$/, '').trim();
    sub = sub.replace(/\s*-\s*.*$/, '').trim();
    return sub;
}

function getMonthlyWorkerLeaveDays(month, year) {
    const totals = {};
    const activeWorkerFilter = (document.getElementById('cal-worker-select')?.value || document.getElementById('filter-worker-select')?.value || "").trim();

    todoCache.forEach(t => {
        if (!t.deadline) return;
        const dl = parseLocalDate(t.deadline);
        if (!dl || dl.getMonth() !== month || dl.getFullYear() !== year) return;

        let isLeave = !!t.isLeave;
        let worker = t.workerName || "";
        let leaveDays = parseFloat(t.leaveDays) || 0;

        const taskText = (t.task || "") + " " + (t.note || "");
        if (taskText.includes("Thợ nghỉ:") || (taskText.includes("nghỉ") && (t.isLeave || (t.sticker && t.sticker.includes("Thợ"))))) {
            isLeave = true;
            if (!worker) {
                worker = extractWorkerNameFromText(taskText, "Thợ nghỉ:");
                if (!worker && taskText.includes("nghỉ")) {
                    const match = taskText.match(/([^\-\(\s]+)\s+nghỉ/);
                    if (match && match[1]) worker = match[1].trim();
                }
            }
            if (!leaveDays) {
                const matchDays = taskText.match(/([0-9\.,]+)\s*công/i);
                if (matchDays && matchDays[1]) leaveDays = parseFloat(matchDays[1].replace(',', '.')) || 0;
            }
        }

        if (isLeave && leaveDays <= 0) leaveDays = 1;
        if (!worker && isLeave) worker = "Thợ";

        // Apply active worker filter if set
        if (activeWorkerFilter) {
            const isMatch = (worker && worker.toLowerCase() === activeWorkerFilter.toLowerCase()) ||
                            (worker && activeWorkerFilter.toLowerCase().includes(worker.toLowerCase())) ||
                            (worker && worker.toLowerCase().includes(activeWorkerFilter.toLowerCase())) ||
                            taskText.toLowerCase().includes(activeWorkerFilter.toLowerCase());
            if (!isMatch) return;
        }

        if (isLeave && worker && leaveDays > 0) {
            totals[worker] = (totals[worker] || 0) + leaveDays;
        }
    });

    return totals;
}

function extractAdvanceAmountFromText(text) {
    if (!text) return 0;

    // Pattern 1: (500.000đ) or (500,000) or (500k)
    let match = text.match(/\(([0-9\.\,]+)\s*(k|kđ|đ|vnđ)?\)/i);
    if (match) {
        let valStr = match[1].replace(/[^\d]/g, '');
        let num = parseFloat(valStr) || 0;
        if (match[2] && match[2].toLowerCase().startsWith('k') && num < 10000) num *= 1000;
        if (num > 0) return num;
    }

    // Pattern 2: 500k or 500,000đ or 500.000đ
    match = text.match(/([0-9\.\,]{3,12})\s*(k|kđ|đ|vnđ)/i);
    if (match) {
        let valStr = match[1].replace(/[^\d]/g, '');
        let num = parseFloat(valStr) || 0;
        if (match[2].toLowerCase().startsWith('k') && num < 10000) num *= 1000;
        if (num > 0) return num;
    }

    // Pattern 3: Any standalone number >= 1000 e.g. 500000
    match = text.match(/([0-9]{4,10})/);
    if (match) {
        return parseFloat(match[1]) || 0;
    }

    return 0;
}

function getMonthlyWorkerAdvances(month, year) {
    const totals = {};
    const activeWorkerFilter = (document.getElementById('cal-worker-select')?.value || document.getElementById('filter-worker-select')?.value || "").trim();

    // 1. From todoCache
    todoCache.forEach(t => {
        if (!t.deadline) return;
        const dl = parseLocalDate(t.deadline);
        if (!dl || dl.getMonth() !== month || dl.getFullYear() !== year) return;

        let amount = parseFloat(t.advanceAmount) || 0;
        let worker = t.workerName || "";

        const taskText = (t.task || "") + " " + (t.note || "");
        if (!worker && taskText.includes("Ứng tiền thợ:")) {
            worker = extractWorkerNameFromText(taskText, "Ứng tiền thợ:");
        }

        if (!amount) {
            amount = extractAdvanceAmountFromText(taskText);
        }

        if (!worker && (t.isAdvance || (t.sticker && t.sticker.includes("Thợ")))) {
            worker = "Thợ";
        }

        // Apply active worker filter if set
        if (activeWorkerFilter) {
            const isMatch = (worker && worker.toLowerCase() === activeWorkerFilter.toLowerCase()) ||
                            (worker && activeWorkerFilter.toLowerCase().includes(worker.toLowerCase())) ||
                            (worker && worker.toLowerCase().includes(activeWorkerFilter.toLowerCase())) ||
                            taskText.toLowerCase().includes(activeWorkerFilter.toLowerCase());
            if (!isMatch) return;
        }

        if (worker && amount > 0) {
            totals[worker] = (totals[worker] || 0) + amount;
        }
    });

    // 2. From farmData
    if (typeof farmData !== 'undefined' && Array.isArray(farmData)) {
        farmData.forEach(row => {
            const expType = row["Loại CP"] || "";
            const amount = parseFloat(row["Chi Phí"]) || 0;
            const note = row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || "";
            const d = row.parsedDate || parseLocalDate(row["Ngày"]);

            if (expType === "Công" && amount > 0 && d && d.getMonth() === month && d.getFullYear() === year) {
                if (note.includes("Ứng tiền thợ:")) {
                    const name = extractWorkerNameFromText(note, "Ứng tiền thợ:");
                    if (name) {
                        if (activeWorkerFilter) {
                            const isMatch = (name.toLowerCase() === activeWorkerFilter.toLowerCase()) ||
                                            activeWorkerFilter.toLowerCase().includes(name.toLowerCase()) ||
                                            name.toLowerCase().includes(activeWorkerFilter.toLowerCase());
                            if (!isMatch) return;
                        }
                        if (!totals[name]) {
                            totals[name] = amount;
                        }
                    }
                }
            }
        });
    }

    return totals;
}

// --- RENDERING: FOCUS VIEW ---
function renderFocus() {
    console.log("Rendering Focus View... selected date:", selectedFocusDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const todayList = document.getElementById('focus-today-list');
    const upcomingList = document.getElementById('focus-upcoming-list');

    if (!todayList || !upcomingList) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Filter Việc Hôm Nay: tasks active on selected day + overdue if today is selected
    const todayTasks = todoCache.filter(t => {
        const dl = t.deadlineDate;
        if (!dl) return false;

        let sd = t.startDate ? parseLocalDate(t.startDate) : null;
        if (!sd) sd = dl;

        const cellTime = selectedFocusDate.getTime();
        const startTime = sd.getTime();
        const endTime = dl.getTime();

        const isSameDay = cellTime >= startTime && cellTime <= endTime;

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

    // 2. Filter Công Việc Sắp Tới: all in-progress & not started tasks
    const upcomingTasks = todoCache.filter(t => {
        return t.status === 'Đang thực hiện' || t.status === 'Chưa bắt đầu';
    }).sort((a, b) => {
        const dA = a.deadlineDate ? a.deadlineDate.getTime() : 8640000000000000;
        const dB = b.deadlineDate ? b.deadlineDate.getTime() : 8640000000000000;
        return dA - dB;
    });

    // Update Header Labels
    const todayHeader = document.querySelector('#view-focus .focus-column:first-child .focus-header');
    if (todayHeader) {
        const isToday = selectedFocusDate.getTime() === today.getTime();
        todayHeader.innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${isToday ? 'VIỆC HÔM NAY' : 'CÔNG VIỆC NGÀY ' + formatDate(selectedFocusDate)}`;
    }

    const upcomingHeader = document.querySelector('#view-focus .focus-column:nth-child(2) .focus-header');
    if (upcomingHeader) {
        upcomingHeader.innerHTML = `<i class="fa-solid fa-calendar-days"></i> CÔNG VIỆC SẮP TỚI`;
    }

    // Render Today
    const todayHtml = todayTasks.length
        ? todayTasks.map(t => createFocusItemHTML(t, 'var(--accent)')).join('')
        : `<div style="text-align:center; color: var(--text-light); padding: 2rem;">Ngày này không có việc.</div>`;
    todayList.innerHTML = todayHtml;

    // Render Upcoming
    const upcomingHtml = upcomingTasks.length
        ? upcomingTasks.map(t => createFocusItemHTML(t, 'var(--primary)')).join('')
        : '<div style="text-align:center; color: var(--text-light); padding: 2rem;">Không có việc sắp tới.</div>';
    upcomingList.innerHTML = upcomingHtml;

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
        d.setHours(0, 0, 0, 0);

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

    // Sticker Tag Logic
    let stickerTag = '';
    if (t.sticker) {
        const stickers = t.sticker.split(',').map(s => s.trim()).filter(Boolean);
        stickers.forEach(st => {
            const stickerClass = getStickerTagClass(st);
            stickerTag += ` <span class="sticker-tag ${stickerClass}">${getStickerEmoji(st)}</span>`;
        });
    }

    return `
        <div class="focus-item" style="border-left-color: ${borderColor}; opacity: ${isCompleted ? 0.6 : 1}" onclick="if(!isRestricted()) editTask('${t.id}')">
            <div class="focus-item-title" style="${titleStyle}">${escapeHtml(t.task)}${stickerTag}${delayHtml}</div>
            <div class="focus-item-meta">
                <span><i class="fa-regular fa-clock"></i> ${t.startDate && t.startDate !== t.deadline ? formatDate(t.startDate) + ' - ' + formatDate(t.deadline) : (t.deadline ? formatDate(t.deadline) : 'Không hạn')}</span>
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

        if (t.deadlineDate) {
            let sd = t.startDate ? parseLocalDate(t.startDate) : null;
            if (!sd) sd = t.deadlineDate;
            const todayTime = now.getTime();
            if (todayTime >= sd.getTime() && todayTime <= t.deadlineDate.getTime()) {
                todayCount++;
            }
        }

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
// --- CRUD ACTIONS ---
function resetModal() {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    document.getElementById('task-id').value = "";
    document.getElementById('task-name').value = "";
    document.getElementById('task-deadline').value = todayStr;
    
    const multidayCb = document.getElementById('task-is-multiday');
    if (multidayCb) multidayCb.checked = false;
    const startDateInput = document.getElementById('task-start-date');
    if (startDateInput) startDateInput.value = todayStr;
    toggleMultidayFields();

    document.getElementById('task-category').value = "Farm";
    document.getElementById('task-note').value = "";
    document.getElementById('task-priority').value = "Cao";
    document.getElementById('task-status').value = "Chưa bắt đầu";
    document.querySelectorAll('.sticker-checkbox').forEach(cb => cb.checked = false);
    updateStickerLabel();
    toggleStickerFieldVisibility();

    // Reset Ứng Tiền Thợ fields
    const isAdvanceCb = document.getElementById('task-is-advance');
    const advanceFieldsGrid = document.getElementById('advance-fields-grid');
    if (isAdvanceCb) isAdvanceCb.checked = false;
    if (advanceFieldsGrid) advanceFieldsGrid.style.display = 'none';

    const workerSelect = document.getElementById('task-worker-select');
    if (workerSelect) workerSelect.value = "";
    const workerCustom = document.getElementById('task-worker-custom');
    if (workerCustom) { workerCustom.value = ""; workerCustom.style.display = 'none'; }
    const advanceAmountInput = document.getElementById('task-advance-amount');
    if (advanceAmountInput) advanceAmountInput.value = "";

    // Reset Chấm Công Nghỉ Thợ fields
    const isLeaveCb = document.getElementById('task-is-leave');
    const leaveFieldsGrid = document.getElementById('leave-fields-grid');
    if (isLeaveCb) isLeaveCb.checked = false;
    if (leaveFieldsGrid) leaveFieldsGrid.style.display = 'none';

    const leaveWorkerSelect = document.getElementById('task-leave-worker-select');
    if (leaveWorkerSelect) leaveWorkerSelect.value = "";
    const leaveWorkerCustom = document.getElementById('task-leave-worker-custom');
    if (leaveWorkerCustom) { leaveWorkerCustom.value = ""; leaveWorkerCustom.style.display = 'none'; }
    const leaveDaysInput = document.getElementById('task-leave-days');
    if (leaveDaysInput) leaveDaysInput.value = "1";

    // Populate worker dropdown options dynamically
    populateWorkerSelectOptions();

    // Hide delete button for new tasks
    const delBtn = document.getElementById('delete-task-btn');
    if (delBtn) delBtn.style.display = 'none';
}

function populateWorkerSelectOptions() {
    const workerSelect = document.getElementById('task-worker-select');
    const leaveWorkerSelect = document.getElementById('task-leave-worker-select');

    const defaultWorkers = ["Hiếu", "V/c A. Táo"];
    const workerSet = new Set(defaultWorkers);

    // Collect workers from todoCache
    todoCache.forEach(t => {
        if (t.workerName) workerSet.add(t.workerName);
        const taskText = (t.task || "") + " " + (t.note || "");
        if (taskText.includes("Ứng tiền thợ:")) {
            const w = extractWorkerNameFromText(taskText, "Ứng tiền thợ:");
            if (w) workerSet.add(w);
        }
        if (taskText.includes("Thợ nghỉ:")) {
            const w = extractWorkerNameFromText(taskText, "Thợ nghỉ:");
            if (w) workerSet.add(w);
        }
    });

    // Collect workers from farmData if loaded
    if (typeof farmData !== 'undefined' && Array.isArray(farmData)) {
        farmData.forEach(r => {
            const note = r["Ghi Chú Chi Phí"] || r["Ghi Chú"] || "";
            if (note.includes("Ứng tiền thợ:")) {
                const w = extractWorkerNameFromText(note, "Ứng tiền thợ:");
                if (w) workerSet.add(w);
            }
        });
    }

    const workerList = Array.from(workerSet).sort();

    if (workerSelect) {
        const currentVal = workerSelect.value;
        let html = '<option value="">-- Chọn thợ ứng --</option>';
        workerList.forEach(w => {
            html += `<option value="${w}" ${w === currentVal ? 'selected' : ''}>👷 ${w}</option>`;
        });
        html += '<option value="__NEW__">+ Nhập tên thợ mới...</option>';
        workerSelect.innerHTML = html;
    }

    if (leaveWorkerSelect) {
        const currentVal = leaveWorkerSelect.value;
        let html = '<option value="">-- Chọn thợ nghỉ --</option>';
        workerList.forEach(w => {
            html += `<option value="${w}" ${w === currentVal ? 'selected' : ''}>👷 ${w}</option>`;
        });
        html += '<option value="__NEW__">+ Nhập tên thợ mới...</option>';
        leaveWorkerSelect.innerHTML = html;
    }

    // Also populate filter selects in calendar and list view
    const calWorkerSelect = document.getElementById('cal-worker-select');
    const filterWorkerSelect = document.getElementById('filter-worker-select');

    if (calWorkerSelect) {
        const currentVal = calWorkerSelect.value;
        let html = '<option value="">Tất cả Thợ</option>';
        workerList.forEach(w => {
            html += `<option value="${w}" ${w === currentVal ? 'selected' : ''}>👷 ${w}</option>`;
        });
        calWorkerSelect.innerHTML = html;
    }

    if (filterWorkerSelect) {
        const currentVal = filterWorkerSelect.value;
        let html = '<option value="">Tất cả Thợ</option>';
        workerList.forEach(w => {
            html += `<option value="${w}" ${w === currentVal ? 'selected' : ''}>👷 ${w}</option>`;
        });
        filterWorkerSelect.innerHTML = html;
    }
}

window.openAddTaskModalWithDate = function (date) {
    resetModal();
    document.getElementById('modal-title').innerText = "Thêm Công Việc Mới";

    // Format date as YYYY-MM-DD for input[type="date"]
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    document.getElementById('task-deadline').value = dateStr;
    const startDateInput = document.getElementById('task-start-date');
    if (startDateInput) startDateInput.value = dateStr;

    if (isRestricted()) return;
    document.getElementById('todo-modal').style.display = 'flex';
}

window.editTask = function (id) {
    if (isRestricted()) return;
    const t = todoCache.find(x => String(x.id) === String(id));
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
    
    const multidayCb = document.getElementById('task-is-multiday');
    const startDateInput = document.getElementById('task-start-date');
    if (t.startDate && t.startDate !== t.deadline) {
        if (multidayCb) multidayCb.checked = true;
        const sd = parseLocalDate(t.startDate);
        if (sd && startDateInput) {
            startDateInput.value = sd.getFullYear() + '-' + String(sd.getMonth() + 1).padStart(2, '0') + '-' + String(sd.getDate()).padStart(2, '0');
        }
    } else {
        if (multidayCb) multidayCb.checked = false;
        if (t.deadline && startDateInput) {
            const d = parseLocalDate(t.deadline);
            if (d) {
                startDateInput.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            }
        }
    }
    toggleMultidayFields();
    document.getElementById('task-category').value = t.category || "Farm";
    document.getElementById('task-note').value = t.note || "";
    document.getElementById('task-priority').value = t.priority || "Trung bình";
    document.getElementById('task-status').value = t.status || "Chưa bắt đầu";
    document.querySelectorAll('.sticker-checkbox').forEach(cb => cb.checked = false);
    if (t.sticker) {
        const list = t.sticker.split(',').map(s => s.trim());
        document.querySelectorAll('.sticker-checkbox').forEach(cb => {
            if (list.includes(cb.value)) cb.checked = true;
        });
    }
    updateStickerLabel();
    toggleStickerFieldVisibility();

    // Populate and restore Advance Money fields if task is worker advance
    const isAdvanceCb = document.getElementById('task-is-advance');
    const advanceFieldsGrid = document.getElementById('advance-fields-grid');
    const workerSelect = document.getElementById('task-worker-select');
    const advanceAmountInput = document.getElementById('task-advance-amount');

    let isAdvanceTask = !!t.isAdvance;
    let workerName = t.workerName || "";
    let advanceAmt = parseFloat(t.advanceAmount) || 0;

    // Smart inference if properties were missing in older task records
    const taskTitle = (t.task || "") + " " + (t.note || "");
    if (taskTitle.includes("Ứng tiền thợ:")) {
        isAdvanceTask = true;
        if (!workerName) {
            const match = taskTitle.match(/Ứng tiền thợ:\s*([^\-\(\s]+)/);
            if (match && match[1]) workerName = match[1].trim();
        }
    }

    if (!advanceAmt) {
        advanceAmt = extractAdvanceAmountFromText(taskTitle);
    }

    if (!advanceAmt && typeof farmData !== 'undefined' && Array.isArray(farmData)) {
        const tDate = parseLocalDate(t.deadline);
        const matchExp = farmData.find(row => {
            const expDate = row.parsedDate || parseLocalDate(row["Ngày"]);
            const note = row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || "";
            const isSameDate = tDate && expDate && tDate.getFullYear() === expDate.getFullYear() && tDate.getMonth() === expDate.getMonth() && tDate.getDate() === expDate.getDate();
            return row["Loại CP"] === "Công" && note.includes("Ứng tiền thợ:") && (workerName ? note.includes(workerName) : true) && isSameDate;
        });
        if (matchExp) {
            advanceAmt = parseFloat(matchExp["Chi Phí"]) || 0;
        }
    }

    if (isAdvanceTask) {
        if (isAdvanceCb) isAdvanceCb.checked = true;
        if (advanceFieldsGrid) advanceFieldsGrid.style.display = 'grid';
        const advanceContainer = document.getElementById('advance-money-container');
        if (advanceContainer) advanceContainer.style.display = 'block';
        
        if (workerSelect) {
            populateWorkerSelectOptions();
            if (workerName) {
                if (!Array.from(workerSelect.options).some(opt => opt.value === workerName)) {
                    const opt = document.createElement('option');
                    opt.value = workerName;
                    opt.innerText = '👷 ' + workerName;
                    workerSelect.appendChild(opt);
                }
                workerSelect.value = workerName;
            }
        }
        if (advanceAmountInput && advanceAmt) {
            const formatted = typeof formatMoneyStr === 'function' ? formatMoneyStr(advanceAmt) : advanceAmt.toString();
            advanceAmountInput.value = formatted;
        }
    }

    // Populate and restore Chấm Công Nghỉ fields if task is worker leave
    const isLeaveCb = document.getElementById('task-is-leave');
    const leaveFieldsGrid = document.getElementById('leave-fields-grid');
    const leaveWorkerSelect = document.getElementById('task-leave-worker-select');
    const leaveWorkerCustom = document.getElementById('task-leave-worker-custom');
    const leaveDaysInput = document.getElementById('task-leave-days');

    const isLeaveTask = !!t.isLeave || (t.task && t.task.includes("Thợ nghỉ:"));
    if (isLeaveCb) {
        isLeaveCb.checked = isLeaveTask;
        if (isLeaveTask) {
            if (leaveFieldsGrid) leaveFieldsGrid.style.display = 'grid';
            const leaveContainer = document.getElementById('leave-days-container');
            if (leaveContainer) leaveContainer.style.display = 'block';

            let lWorker = t.workerName || "";
            let lDays = parseFloat(t.leaveDays) || 1;

            if (!lWorker && t.task && t.task.includes("Thợ nghỉ:")) {
                const match = t.task.match(/Thợ nghỉ:\s*([^\-\(\s]+)/);
                if (match && match[1]) lWorker = match[1].trim();
            }
            if (!t.leaveDays && t.task) {
                const matchDays = t.task.match(/([0-9\.,]+)\s*công/i);
                if (matchDays && matchDays[1]) lDays = parseFloat(matchDays[1].replace(',', '.')) || 1;
            }

            if (leaveWorkerSelect) {
                populateWorkerSelectOptions();
                if (lWorker) {
                    if (!Array.from(leaveWorkerSelect.options).some(opt => opt.value === lWorker)) {
                        const opt = document.createElement('option');
                        opt.value = lWorker;
                        opt.innerText = '👷 ' + lWorker;
                        leaveWorkerSelect.appendChild(opt);
                    }
                    leaveWorkerSelect.value = lWorker;
                }
            }
            if (leaveDaysInput) {
                leaveDaysInput.value = lDays;
            }
        } else if (leaveFieldsGrid) {
            leaveFieldsGrid.style.display = 'none';
        }
    }

    // Show delete button for existing tasks
    const delBtn = document.getElementById('delete-task-btn');
    if (delBtn) delBtn.style.display = 'flex';

    document.getElementById('todo-modal').style.display = 'flex';
}

async function saveTask() {
    if (isRestricted()) return;
    let id = document.getElementById('task-id').value;
    const isNewTask = !id;
    let task = document.getElementById('task-name').value.trim();
    const deadline = document.getElementById('task-deadline').value;
    let category = document.getElementById('task-category').value.trim();
    const note = document.getElementById('task-note').value.trim();
    const priority = document.getElementById('task-priority').value;
    const status = document.getElementById('task-status').value;
    
    // Check Advance Money toggle & inputs
    const isAdvance = document.getElementById('task-is-advance')?.checked;
    const workerSelectVal = document.getElementById('task-worker-select')?.value || "";
    const workerCustomVal = document.getElementById('task-worker-custom')?.value.trim() || "";
    const workerName = workerSelectVal === '__NEW__' ? workerCustomVal : workerSelectVal;
    const advanceAmountRaw = document.getElementById('task-advance-amount')?.value || "0";
    const advanceAmount = typeof parseMoney === 'function' ? parseMoney(advanceAmountRaw) : (parseFloat(advanceAmountRaw.replace(/[^\d]/g, '')) || 0);

    // Strict Validation for Ứng Tiền Thợ
    if (isAdvance) {
        if (!workerName) {
            alert("Vui lòng chọn hoặc nhập tên Thợ ứng tiền!");
            const workerSelectEl = document.getElementById('task-worker-select');
            if (workerSelectEl && workerSelectVal === '__NEW__') {
                document.getElementById('task-worker-custom')?.focus();
            } else if (workerSelectEl) {
                workerSelectEl.focus();
            }
            return;
        }
        if (!advanceAmountRaw || advanceAmount <= 0) {
            alert("Vui lòng nhập Số tiền đã ứng (lớn hơn 0đ)!");
            const advanceAmountInputEl = document.getElementById('task-advance-amount');
            if (advanceAmountInputEl) advanceAmountInputEl.focus();
            return;
        }

        category = "Farm";
        const catSelect = document.getElementById('task-category');
        if (catSelect) catSelect.value = "Farm";

        // Auto check sticker "Thợ"
        document.querySelectorAll('.sticker-checkbox').forEach(cb => {
            if (cb.value === "Thợ") cb.checked = true;
        });
        updateStickerLabel();

        const formattedAmt = typeof formatMoneyStr === 'function' ? formatMoneyStr(advanceAmount) : advanceAmount.toLocaleString('vi-VN');
        const amtSuffix = advanceAmount > 0 ? ` (${formattedAmt}đ)` : '';

        if (!task || task === "Thợ" || task.startsWith("Ứng tiền thợ")) {
            task = workerName ? `Ứng tiền thợ: ${workerName}${amtSuffix}` : `Ứng tiền thợ${amtSuffix}`;
        }
    }

    // Check Leave Days toggle & inputs
    const isLeave = document.getElementById('task-is-leave')?.checked;
    const leaveWorkerSelectVal = document.getElementById('task-leave-worker-select')?.value || "";
    const leaveWorkerCustomVal = document.getElementById('task-leave-worker-custom')?.value.trim() || "";
    const leaveWorkerName = leaveWorkerSelectVal === '__NEW__' ? leaveWorkerCustomVal : leaveWorkerSelectVal;
    const leaveDaysRaw = document.getElementById('task-leave-days')?.value;
    const leaveDaysVal = parseFloat(leaveDaysRaw) || 0;

    let finalWorkerName = workerName;
    if (isLeave) {
        if (!leaveWorkerName) {
            alert("Vui lòng chọn hoặc nhập tên Thợ nghỉ!");
            const leaveWorkerSelectEl = document.getElementById('task-leave-worker-select');
            if (leaveWorkerSelectEl && leaveWorkerSelectVal === '__NEW__') {
                document.getElementById('task-leave-worker-custom')?.focus();
            } else if (leaveWorkerSelectEl) {
                leaveWorkerSelectEl.focus();
            }
            return;
        }
        if (!leaveDaysRaw || isNaN(leaveDaysVal) || leaveDaysVal <= 0) {
            alert("Vui lòng nhập Số công nghỉ hợp lệ (lớn hơn 0)!");
            const leaveDaysInputEl = document.getElementById('task-leave-days');
            if (leaveDaysInputEl) leaveDaysInputEl.focus();
            return;
        }

        category = "Farm";
        const catSelect = document.getElementById('task-category');
        if (catSelect) catSelect.value = "Farm";

        document.querySelectorAll('.sticker-checkbox').forEach(cb => {
            if (cb.value === "Thợ") cb.checked = true;
        });
        updateStickerLabel();

        if (leaveWorkerName) finalWorkerName = leaveWorkerName;
        if (!task || task === "Thợ" || task.startsWith("Thợ nghỉ")) {
            task = `Thợ nghỉ: ${finalWorkerName || 'Thợ'} (${leaveDaysVal} công)`;
        }
    }

    const selectedCheckboxes = document.querySelectorAll('.sticker-checkbox:checked');
    const sticker = Array.from(selectedCheckboxes).map(cb => cb.value).join(', ');

    if (!task) {
        alert("Vui lòng nhập tên công việc");
        return;
    }

    const isMultiday = document.getElementById('task-is-multiday')?.checked;
    const startDate = isMultiday ? document.getElementById('task-start-date').value : deadline;
    
    if (isMultiday && startDate && deadline) {
        const sdObj = parseLocalDate(startDate);
        const dlObj = parseLocalDate(deadline);
        if (sdObj && dlObj && sdObj.getTime() > dlObj.getTime()) {
            alert("Ngày bắt đầu không thể sau ngày kết thúc!");
            return;
        }
    }

    // Store old task values for edit mode matching
    let oldWorkerName = "";
    let oldDeadline = "";
    let expenseRowId = "";
    if (id) {
        const oldTaskObj = todoCache.find(x => String(x.id) === String(id));
        if (oldTaskObj) {
            expenseRowId = oldTaskObj.expenseRowId || "";
            oldWorkerName = oldTaskObj.workerName || "";
            oldDeadline = oldTaskObj.deadline || "";
            if (!oldWorkerName && oldTaskObj.task && oldTaskObj.task.includes("Ứng tiền thợ:")) {
                const match = oldTaskObj.task.match(/Ứng tiền thợ:\s*([^\-\(\s]+)/);
                if (match && match[1]) oldWorkerName = match[1].trim();
            }
        }
    }

    if ((isAdvance || advanceAmount > 0) && !expenseRowId) {
        expenseRowId = "OFFLINE_EXP_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    }

    const taskObj = { 
        id, task, deadline, category, note, priority, status, sticker, startDate,
        isAdvance: !!isAdvance,
        advanceAmount: advanceAmount,
        isLeave: !!isLeave,
        leaveDays: isLeave ? leaveDaysVal : 0,
        workerName: finalWorkerName,
        expenseRowId: expenseRowId
    };
    taskObj.deadlineDate = parseLocalDate(deadline);
    taskObj.startDateDate = parseLocalDate(startDate);

    // Optimistic UI updates
    if (!id) {
        // Create mode
        id = "TASK_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        taskObj.id = id;
        const now = new Date();
        const datePart = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
        const timePart = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        taskObj.createdAt = datePart + ' ' + timePart;
        taskObj.createdDate = now;
        todoCache.unshift(taskObj);
    } else {
        // Edit mode
        const idx = todoCache.findIndex(x => String(x.id) === String(id));
        if (idx > -1) {
            taskObj.createdAt = todoCache[idx].createdAt;
            taskObj.createdDate = todoCache[idx].createdDate;
            todoCache[idx] = taskObj;
        }
    }

    localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));
    renderActiveView();

    document.getElementById('todo-modal').style.display = 'none';

    // Queue synchronization in the background
    let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
    queue.push({ action: "save_todo_task", data: taskObj, clientId: id });
    localStorage.setItem('todo_sync_queue', JSON.stringify(queue));

    // TỰ ĐỘNG GHI NHẬN CHI PHÍ "CÔNG" VÀO SỔ THU CHI KHI TẠO MỚI CÔNG VIỆC
    if (isNewTask && (isAdvance || advanceAmount > 0)) {
        saveWorkerAdvanceExpense(taskObj);
    }
    // Note: Auto-update/delete when editing or deleting existing tasks is paused as requested.

    processTodoSyncQueue();
}

window.cleanDuplicateWorkerAdvanceExpenses = function() {
    if (typeof farmData === 'undefined' || !Array.isArray(farmData)) return;
    const seenRefs = new Set();
    for (let i = farmData.length - 1; i >= 0; i--) {
        const row = farmData[i];
        const note = row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || row["Ghi chú"] || "";
        const match = note.match(/\[Ref:(TASK_[^\]]+)\]/);
        if (match && match[1]) {
            const refId = match[1];
            if (seenRefs.has(refId)) {
                // Remove older duplicate row
                farmData.splice(i, 1);
            } else {
                seenRefs.add(refId);
            }
        }
    }
};

window.saveWorkerAdvanceExpense = function(taskObj) {
    if (!taskObj || !taskObj.id) return;
    cleanDuplicateWorkerAdvanceExpenses();

    const deadline = taskObj.deadline;
    const workerName = taskObj.workerName || "Thợ";
    const advanceAmount = parseFloat(taskObj.advanceAmount) || 0;
    const note = taskObj.note || "";
    const taskId = String(taskObj.id);
    const expRowId = "TASK_EXP_" + taskId;
    const refTag = `[Ref:${taskId}]`;
    const expNote = `Ứng tiền thợ: ${workerName}${note ? ' - ' + note : ''} ${refTag}`;
    const dInput = parseLocalDate(deadline) || new Date();
    const formattedAmtStr = typeof formatMoneyStr === 'function' ? formatMoneyStr(advanceAmount) : advanceAmount.toLocaleString('vi-VN');

    if (advanceAmount <= 0) {
        deleteWorkerAdvanceExpense(taskId, taskObj);
        return;
    }

    let harvestQueue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');

    // 1. Try to find existing matching expense row in-memory
    let matchRow = null;
    if (typeof farmData !== 'undefined' && Array.isArray(farmData)) {
        matchRow = farmData.find(row => {
            if (String(row._sheetRowNumber) === expRowId) return true;
            const expType = row["Loại CP"] || "";
            const rowNote = row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || row["Ghi chú"] || "";
            const expDate = row.parsedDate || parseLocalDate(row["Ngày"]);
            const isSameDate = !dInput || !expDate || (dInput.getFullYear() === expDate.getFullYear() && dInput.getMonth() === expDate.getMonth() && dInput.getDate() === expDate.getDate());

            const isRefMatch = rowNote.includes(`[Ref:${taskId}]`) || (taskId && rowNote.includes(taskId)) || (taskObj.expenseRowId && String(row._sheetRowNumber) === String(taskObj.expenseRowId));
            const isLegacyMatch = expType === "Công" && rowNote.includes("Ứng tiền thợ:") && (workerName ? rowNote.toLowerCase().includes(workerName.toLowerCase()) : true) && isSameDate;

            return isRefMatch || isLegacyMatch;
        });
    }

    if (matchRow) {
        // UPDATE IN-PLACE (guarantees ZERO duplicate creation)
        matchRow._sheetRowNumber = expRowId;
        matchRow["Chi Phí"] = advanceAmount;
        matchRow["Người Mua"] = workerName;
        matchRow["Ghi Chú Chi Phí"] = expNote;
        matchRow["Ghi Chú"] = expNote;
        matchRow["Ngày"] = deadline;
        matchRow.parsedDate = dInput;

        const queueIdx = harvestQueue.findIndex(x => x.clientId === expRowId);
        if (queueIdx > -1) {
            harvestQueue[queueIdx].payload = {
                action: "add_expense",
                data: {
                    "Ngày": deadline, "Status": "Xong", "Người Mua": workerName,
                    "Chi Phí": advanceAmount.toString(), "Loại CP": "Công", "Ghi Chú Chi Phí": expNote
                }
            };
        } else {
            const sheetRow = matchRow._sheetRowNumber;
            if (sheetRow && typeof sheetRow !== 'string') {
                harvestQueue.push({
                    action: 'update',
                    rowNumber: sheetRow,
                    updates: {
                        "Chi Phí": advanceAmount, "Người Mua": workerName,
                        "Ghi Chú Chi Phí": expNote, "Ghi Chú": expNote, "Ngày": deadline
                    },
                    clientId: "UPD_EXP_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
                });
            } else {
                harvestQueue.push({
                    action: 'add',
                    clientId: expRowId,
                    payload: {
                        action: "add_expense",
                        data: {
                            "Ngày": deadline, "Status": "Xong", "Người Mua": workerName,
                            "Chi Phí": advanceAmount.toString(), "Loại CP": "Công", "Ghi Chú Chi Phí": expNote
                        }
                    }
                });
            }
        }
        localStorage.setItem('harvest_sync_queue', JSON.stringify(harvestQueue));
        if (typeof applyFiltersAndRender === 'function') applyFiltersAndRender();
        if (typeof processSyncQueue === 'function') processSyncQueue();
        showToast(`Đã cập nhật Chi Phí "Công" ${formattedAmtStr}đ cho ${workerName}!`, "success");
    } else {
        // CREATE NEW ROW WITH DETERMINISTIC expRowId
        taskObj.expenseRowId = expRowId;

        // Clean out any old items for this clientId from queue first
        harvestQueue = harvestQueue.filter(x => x.clientId !== expRowId);
        harvestQueue.push({
            action: 'add',
            clientId: expRowId,
            payload: {
                action: "add_expense",
                data: {
                    "Ngày": deadline, "Status": "Xong", "Người Mua": workerName,
                    "Chi Phí": advanceAmount.toString(), "Loại CP": "Công", "Ghi Chú Chi Phí": expNote
                }
            }
        });
        localStorage.setItem('harvest_sync_queue', JSON.stringify(harvestQueue));

        if (typeof farmData !== 'undefined' && Array.isArray(farmData)) {
            farmData.unshift({
                "Ngày": deadline, "Status": "Xong", "Người Mua": workerName,
                "Chi Phí": advanceAmount, "Loại CP": "Công", "Ghi Chú Chi Phí": expNote,
                parsedDate: dInput, "Số lượng": 0, "Giá": 0, "Doanh Thu Bông": 0, "Tiền Phải Thu": 0, "Doanh Thu Khác": 0,
                _sheetRowNumber: expRowId
            });
            if (typeof applyFiltersAndRender === 'function') {
                applyFiltersAndRender();
            }
        }

        if (typeof processSyncQueue === 'function') {
            processSyncQueue();
        }

        showToast(`Đã ghi nhận Chi Phí "Công" ${formattedAmtStr}đ cho ${workerName}!`, "success");
    }
};

window.deleteWorkerAdvanceExpense = function(taskId, taskObj) {
    if (!taskId) return;
    const sId = String(taskId);
    const expRowId = "TASK_EXP_" + sId;
    let harvestQueue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');

    harvestQueue = harvestQueue.filter(x => x.clientId !== expRowId);

    let tWorker = (taskObj && taskObj.workerName) || "";
    let tDeadline = (taskObj && taskObj.deadline) || "";
    let tExpRowId = (taskObj && taskObj.expenseRowId) || "";

    if (!tWorker && taskObj && taskObj.task && taskObj.task.includes("Ứng tiền thợ:")) {
        const match = taskObj.task.match(/Ứng tiền thợ:\s*([^\-\(\s]+)/);
        if (match && match[1]) tWorker = match[1].trim();
    }

    const tDate = tDeadline ? parseLocalDate(tDeadline) : null;

    if (typeof farmData !== 'undefined' && Array.isArray(farmData)) {
        let deleted = false;
        for (let i = farmData.length - 1; i >= 0; i--) {
            const row = farmData[i];
            const expType = row["Loại CP"] || "";
            const rowNote = row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || row["Ghi chú"] || "";
            const expDate = row.parsedDate || parseLocalDate(row["Ngày"]);
            const isSameDate = !tDate || !expDate || (tDate.getFullYear() === expDate.getFullYear() && tDate.getMonth() === expDate.getMonth() && tDate.getDate() === expDate.getDate());

            const isIdMatch = String(row._sheetRowNumber) === expRowId || rowNote.includes(`[Ref:${sId}]`) || rowNote.includes(sId) || (tExpRowId && String(row._sheetRowNumber) === String(tExpRowId));
            const isLegacyMatch = expType === "Công" && rowNote.includes("Ứng tiền thợ:") && (tWorker ? rowNote.toLowerCase().includes(tWorker.toLowerCase()) : true) && isSameDate;

            if (isIdMatch || isLegacyMatch) {
                const sheetRow = row._sheetRowNumber;
                if (sheetRow && typeof sheetRow !== 'string') {
                    harvestQueue.push({ action: 'delete', rowNumber: sheetRow, context: 'expense', clientId: "DEL_" + sheetRow });
                }
                farmData.splice(i, 1);
                deleted = true;
            }
        }
        if (deleted) {
            localStorage.setItem('harvest_sync_queue', JSON.stringify(harvestQueue));
            if (typeof applyFiltersAndRender === 'function') {
                applyFiltersAndRender();
            }
            if (typeof processSyncQueue === 'function') {
                processSyncQueue();
            }
        }
    }
};

window.updateTaskStatus = async function (id, newStatus) {
    if (isRestricted()) {
        renderActiveView(); // Reset select value
        return;
    }
    const t = todoCache.find(x => String(x.id) === String(id));
    if (!t) return;

    // Optimistic update
    t.status = newStatus;
    localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));
    renderActiveView();

    // Queue synchronization in the background
    let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
    queue.push({ action: "save_todo_task", data: { ...t }, clientId: id });
    localStorage.setItem('todo_sync_queue', JSON.stringify(queue));

    showToast("Đang cập nhật trạng thái...", "success");
    processTodoSyncQueue();
}

window.deleteTask = async function (id) {
    if (isRestricted()) return;
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;

    const targetTask = todoCache.find(x => String(x.id) === String(id));

    // Optimistic update
    todoCache = todoCache.filter(x => String(x.id) !== String(id));
    localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));

    const modal = document.getElementById('todo-modal');
    if (modal) modal.style.display = 'none';

    renderActiveView();

    // Queue synchronization in the background for Todo Task
    let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
    const pendingSaveIndex = queue.findIndex(item => item.action === "save_todo_task" && String(item.clientId) === String(id));

    if (pendingSaveIndex > -1) {
        queue.splice(pendingSaveIndex, 1);
    } else {
        queue.push({ action: "delete_todo_task", id: id, clientId: id });
    }
    localStorage.setItem('todo_sync_queue', JSON.stringify(queue));

    // AUTOMATICALLY DELETE CORRESPONDING EXPENSE IN FARM DATA & GOOGLE SHEETS
    // [TẠM THỜI TẮT] Chức năng tự động xóa chi phí khi xóa công việc (Chờ quay lại xử lý sau)
    // deleteWorkerAdvanceExpense(id);
    showToast("Đã xóa công việc!", "success");
    processTodoSyncQueue();
};

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

function getStickerTagClass(sticker) {
    if (!sticker) return '';
    switch (sticker) {
        case 'Nấm': return 'sticker-tag-nam';
        case 'Nhện': return 'sticker-tag-nhen';
        case 'Sâu': return 'sticker-tag-sau';
        case 'Châm Kim': return 'sticker-tag-cham-kim';
        case 'Thối Cánh': return 'sticker-tag-thoi-canh';
        case 'Phấn Trắng': return 'sticker-tag-phan-trang';
        case 'Phân': return 'sticker-tag-phan';
        case 'Mò': return 'sticker-tag-mo';
        case 'Thợ': return 'sticker-tag-tho';
        default: return '';
    }
}

function getStickerEmoji(sticker) {
    if (!sticker) return '';
    switch (sticker) {
        case 'Nấm': return '🍄';
        case 'Nhện': return '🕷️';
        case 'Sâu': return '🐛';
        case 'Châm Kim': return '💮';
        case 'Thối Cánh': return '🥀';
        case 'Phấn Trắng': return '🍃⚪';
        case 'Phân': return '💦';
        case 'Mò': return '🪲';
        case 'Thợ': return '👷';
        default: return sticker;
    }
}

function toggleAdvanceMoneyContainerVisibility() {
    const category = document.getElementById('task-category')?.value || "";
    const advanceContainer = document.getElementById('advance-money-container');
    const leaveContainer = document.getElementById('leave-days-container');

    const isFarmCategory = category.startsWith("Farm") || category === "Farm I" || category === "Farm II";
    
    // Check if sticker "Thợ" is checked
    const selectedCheckboxes = document.querySelectorAll('.sticker-checkbox:checked');
    const hasThoSticker = Array.from(selectedCheckboxes).some(cb => cb.value === "Thợ");

    if (isFarmCategory && hasThoSticker) {
        if (advanceContainer) advanceContainer.style.display = "block";
        if (leaveContainer) leaveContainer.style.display = "block";
    } else {
        if (advanceContainer) {
            advanceContainer.style.display = "none";
            const isAdvanceCb = document.getElementById('task-is-advance');
            if (isAdvanceCb) {
                isAdvanceCb.checked = false;
                const advanceFieldsGrid = document.getElementById('advance-fields-grid');
                if (advanceFieldsGrid) advanceFieldsGrid.style.display = 'none';
            }
        }
        if (leaveContainer) {
            leaveContainer.style.display = "none";
            const isLeaveCb = document.getElementById('task-is-leave');
            if (isLeaveCb) {
                isLeaveCb.checked = false;
                const leaveFieldsGrid = document.getElementById('leave-fields-grid');
                if (leaveFieldsGrid) leaveFieldsGrid.style.display = 'none';
            }
        }
    }
}

function toggleStickerFieldVisibility() {
    const category = document.getElementById('task-category')?.value;
    const stickerWrapper = document.getElementById('task-sticker-wrapper');
    if (!stickerWrapper) return;

    const isFarmCategory = category === "Farm" || category === "Farm I" || category === "Farm II";
    if (isFarmCategory) {
        stickerWrapper.style.display = "grid";
    } else {
        stickerWrapper.style.display = "none";
        document.querySelectorAll('.sticker-checkbox').forEach(cb => cb.checked = false);
        updateStickerLabel();
    }
    toggleAdvanceMoneyContainerVisibility();
}

function autoFillTaskNamePrefix() {
    const category = document.getElementById('task-category')?.value;
    const taskNameInput = document.getElementById('task-name');
    if (!taskNameInput) return;

    let val = taskNameInput.value;
    if (category === "Farm I") {
        if (val.startsWith("Vườn II - ")) {
            taskNameInput.value = "Vườn I - " + val.substring("Vườn II - ".length);
        } else if (!val.startsWith("Vườn I - ")) {
            taskNameInput.value = "Vườn I - " + val;
        }
    } else if (category === "Farm II") {
        if (val.startsWith("Vườn I - ")) {
            taskNameInput.value = "Vườn II - " + val.substring("Vườn I - ".length);
        } else if (!val.startsWith("Vườn II - ")) {
            taskNameInput.value = "Vườn II - " + val;
        }
    } else {
        if (val.startsWith("Vườn I - ")) {
            taskNameInput.value = val.substring("Vườn I - ".length);
        } else if (val.startsWith("Vườn II - ")) {
            taskNameInput.value = val.substring("Vườn II - ".length);
        }
    }
}

function autoFillStickersSuffix() {
    const taskNameInput = document.getElementById('task-name');
    if (!taskNameInput) return;

    const stickerElements = document.querySelectorAll('.sticker-checkbox');
    const allStickers = Array.from(stickerElements).map(cb => cb.value);
    const selectedCheckboxes = document.querySelectorAll('.sticker-checkbox:checked');
    const selectedStickers = Array.from(selectedCheckboxes).map(cb => cb.value);

    let val = taskNameInput.value;

    // 1. Strip any existing sticker suffixes from the end of the task name
    let changed = true;
    while (changed) {
        changed = false;
        val = val.trimEnd();
        for (const sticker of allStickers) {
            const suffixWithSpace = " - " + sticker;
            if (val.endsWith(suffixWithSpace)) {
                val = val.substring(0, val.length - suffixWithSpace.length);
                changed = true;
                break;
            }
            if (val.endsWith(sticker)) {
                val = val.substring(0, val.length - sticker.length);
                changed = true;
                break;
            }
        }
    }

    // 2. Append currently selected stickers
    if (selectedStickers.length > 0) {
        const suffix = selectedStickers.join(" - ");
        val = val.trimEnd();
        if (val === "" || val.endsWith("-")) {
            if (val.endsWith("-")) {
                val = val + " " + suffix;
            } else {
                val = suffix;
            }
        } else {
            val = val + " - " + suffix;
        }
    }

    taskNameInput.value = val;
}

function updateStickerLabel() {
    const selectedCheckboxes = document.querySelectorAll('.sticker-checkbox:checked');
    const label = document.getElementById('task-sticker-label');
    if (label) {
        if (selectedCheckboxes.length === 0) {
            label.innerText = 'Chọn sticker...';
            label.style.color = '#64748b';
        } else {
            const texts = Array.from(selectedCheckboxes).map(cb => {
                return getStickerEmoji(cb.value) + ' ' + cb.value;
            });
            label.innerText = texts.join(', ');
            label.style.color = '#1e293b';
        }
    }
    toggleAdvanceMoneyContainerVisibility();
}

function formatDate(dateStr) {
    const d = parseLocalDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    dateStr = String(dateStr).trim();
    if (!dateStr) return null;

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

// --- MULTI-SELECT CATEGORY HELPERS ---
window.toggleCalCategory = function (cat, isChecked) {
    if (isChecked) {
        if (!selectedCalCategories.includes(cat)) {
            selectedCalCategories.push(cat);
        }
    } else {
        selectedCalCategories = selectedCalCategories.filter(c => c !== cat);
    }
    updateCalCategoryTriggerLabel();
    renderCalendar();
};

window.selectAllCalCategories = function (selectBool) {
    const checkboxes = document.querySelectorAll('#cal-category-multiselect .multiselect-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = selectBool;
    });

    if (selectBool) {
        const categories = [...new Set(todoCache.map(t => t.category || 'Chung'))].sort();
        selectedCalCategories = [...categories];
    } else {
        selectedCalCategories = [];
    }
    updateCalCategoryTriggerLabel();
    renderCalendar();
};

function updateCalCategoryTriggerLabel() {
    const label = document.querySelector('#cal-category-multiselect .multiselect-label');
    if (label) {
        if (selectedCalCategories.length === 0) {
            label.innerText = 'Tất cả phân loại';
            label.style.color = '#64748b';
        } else {
            const categories = [...new Set(todoCache.map(t => t.category || 'Chung'))].sort();
            if (selectedCalCategories.length === categories.length) {
                label.innerText = 'Tất cả phân loại';
                label.style.color = '#1e293b';
            } else {
                label.innerText = selectedCalCategories.join(', ');
                label.style.color = '#1e293b';
            }
        }
    }
}

function renderCalCategoryMultiSelect(categories) {
    // Keep only active categories
    selectedCalCategories = selectedCalCategories.filter(c => categories.includes(c));

    const dropdown = document.querySelector('#cal-category-multiselect .multiselect-dropdown');
    if (dropdown) {
        let html = '';
        // Actions header
        html += `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px; font-size: 0.8rem; user-select: none;">
                <span onclick="selectAllCalCategories(true); event.stopPropagation();" style="color: #6366f1; font-weight: 700; cursor: pointer; hover: opacity 0.8;">Chọn tất cả</span>
                <span onclick="selectAllCalCategories(false); event.stopPropagation();" style="color: #ef4444; font-weight: 700; cursor: pointer; hover: opacity 0.8;">Xóa chọn</span>
            </div>
        `;
        categories.forEach(c => {
            const isChecked = selectedCalCategories.includes(c);
            html += `
                <label class="multiselect-item" style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-size: 0.85rem; font-weight: 600; color: #334155;" onclick="event.stopPropagation();">
                    <input type="checkbox" value="${c}" ${isChecked ? 'checked' : ''} onchange="toggleCalCategory('${c}', this.checked)" style="width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer;">
                    <span>${c}</span>
                </label>
            `;
        });
        dropdown.innerHTML = html;

        // Add hover effects on items
        dropdown.querySelectorAll('.multiselect-item').forEach(item => {
            item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        });

        // Update trigger label
        updateCalCategoryTriggerLabel();
    }
}

/**
 * Export calendar schedule to plain text bullet-point format grouped by date
 * and sorted chronologically (lowest date to highest date)
 */
function openExportTextModal() {
    const monthVal = document.getElementById('cal-month')?.value;
    const yearVal = document.getElementById('cal-year')?.value;
    if (monthVal === undefined || yearVal === undefined) return;

    const month = parseInt(monthVal);
    const year = parseInt(yearVal);

    // Filter tasks based on month and year of deadline
    const filtered = todoCache.filter(t => {
        if (!t.deadline) return false;
        const dl = parseLocalDate(t.deadline);
        if (!dl) return false;

        // Match month and year
        const matchesDate = dl.getMonth() === month && dl.getFullYear() === year;
        if (!matchesDate) return false;

        // Match category filter
        const tCategory = t.category || 'Chung';
        const matchesCategory = selectedCalCategories.length === 0 || selectedCalCategories.includes(tCategory);

        // Match sticker filter
        const taskStickers = t.sticker ? t.sticker.split(',').map(s => s.trim()).filter(Boolean) : [];
        const matchesSticker = selectedCalStickers.length === 0 || taskStickers.some(st => selectedCalStickers.includes(st));

        // Match worker filter
        const workerFilter = (document.getElementById('cal-worker-select')?.value || document.getElementById('filter-worker-select')?.value || "").trim();
        let matchesWorker = true;
        if (workerFilter) {
            const tWorker = (t.workerName || "").trim();
            const tTitle = (t.task || "") + " " + (t.note || "");
            matchesWorker = (tWorker === workerFilter) || tTitle.includes(workerFilter);
        }

        return matchesCategory && matchesSticker && matchesWorker;
    });

    const workerFilter = (document.getElementById('cal-worker-select')?.value || document.getElementById('filter-worker-select')?.value || "").trim();
    const descEl = document.querySelector('#export-text-modal .modal-body p');
    if (descEl) {
        if (workerFilter) {
            descEl.innerHTML = `Dưới đây là danh sách lịch trình theo tháng hiện tại (<b>Lọc theo thợ: ${escapeHtml(workerFilter)}</b>):`;
        } else {
            descEl.innerText = "Dưới đây là danh sách lịch trình theo tháng hiện tại, sắp xếp theo thứ tự ngày từ thấp đến cao:";
        }
    }

    // Sort chronologically (lowest date to highest date)
    filtered.sort((a, b) => {
        const dlA = parseLocalDate(a.deadline);
        const dlB = parseLocalDate(b.deadline);
        return dlA.getTime() - dlB.getTime();
    });

    // Group by day of month
    const groups = {};
    filtered.forEach(t => {
        const dl = parseLocalDate(t.deadline);
        const day = dl.getDate();
        if (!groups[day]) {
            groups[day] = [];
        }
        groups[day].push(t);
    });

    // Priority weights for sorting within same day
    const priorityWeight = { 'Khẩn cấp': 1, 'Cao': 2, 'Trung bình': 3, 'Thấp': 4 };
    const pad = (n) => String(n).padStart(2, '0');
    const displayMonth = pad(month + 1);

    let textResult = "";

    // Sort day numbers ascending
    const sortedDays = Object.keys(groups).map(Number).sort((a, b) => a - b);

    if (sortedDays.length === 0) {
        textResult = `Lịch trình tháng ${displayMonth}/${year} không có công việc nào.`;
    } else {
        sortedDays.forEach(day => {
            const dayTasks = groups[day];

            // Sort by priority within the day
            dayTasks.sort((a, b) => (priorityWeight[a.priority] || 99) - (priorityWeight[b.priority] || 99));

            textResult += `ngày ${pad(day)}/${displayMonth}:\n`;
            dayTasks.forEach(t => {
                const noteStr = t.note ? ` (${t.note})` : '';
                textResult += `  - ${t.task}${noteStr}\n`;
            });
            textResult += `\n`;
        });

        // Trim trailing newlines
        textResult = textResult.trim();
    }

    // Append Phần Tổng Kết (Monthly Summary) for Advances & Leave Days
    // ONLY append summary if selectedCalStickers is empty/all OR includes 'Thợ'
    const isAllStickers = selectedCalStickers.length === 0 || selectedCalStickers.length >= 9;
    const hasThoSticker = selectedCalStickers.includes('Thợ');
    const shouldShowSummary = isAllStickers || hasThoSticker;

    if (shouldShowSummary) {
        const workerAdvances = getMonthlyWorkerAdvances(month, year);
        const workerLeaves = getMonthlyWorkerLeaveDays(month, year);
        const advanceEntries = Object.entries(workerAdvances);
        const leaveEntries = Object.entries(workerLeaves);

        if (advanceEntries.length > 0 || leaveEntries.length > 0) {
            textResult += `\n\n----------------------------------------\n`;
            textResult += `📊 PHẦN TỔNG KẾT THÁNG ${displayMonth}/${year}:\n`;

        if (advanceEntries.length > 0) {
            let totalAdvance = 0;
            textResult += `\n💳 Ứng tiền thợ:\n`;
            advanceEntries.forEach(([name, amt]) => {
                totalAdvance += amt;
                const formattedAmt = typeof formatMoneyStr === 'function' ? formatMoneyStr(amt) : amt.toLocaleString('vi-VN');
                textResult += `  • ${name}: ${formattedAmt}đ\n`;
            });
            const formattedTotal = typeof formatMoneyStr === 'function' ? formatMoneyStr(totalAdvance) : totalAdvance.toLocaleString('vi-VN');
            textResult += `  => Tổng cộng tiền ứng: ${formattedTotal}đ\n`;
        }

        if (leaveEntries.length > 0) {
            textResult += `\n🏖️ Thợ nghỉ (công):\n`;
            leaveEntries.forEach(([name, days]) => {
                textResult += `  • ${name}: ${days} công\n`;
            });
        }
        textResult += `----------------------------------------`;
        }
    }

    // Set text to textarea
    const contentTextarea = document.getElementById('export-text-content');
    if (contentTextarea) {
        contentTextarea.value = textResult;
    }

    // Open modal
    const modal = document.getElementById('export-text-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Copy the exported calendar text to clipboard with micro-interaction feedback
 */
async function copyExportText() {
    const textarea = document.getElementById('export-text-content');
    if (!textarea) return;

    const text = textarea.value;

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showCopySuccess();
        } else {
            textarea.select();
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            showCopySuccess();
        }
    } catch (err) {
        console.error("Failed to copy text: ", err);
        try {
            textarea.select();
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            showCopySuccess();
        } catch (fallbackErr) {
            alert("Không thể tự động sao chép. Vui lòng chọn và sao chép thủ công.");
        }
    }
}

/**
 * Display premium success state feedback on copy button
 */
function showCopySuccess() {
    const btn = document.getElementById('btn-copy-export');
    if (!btn) return;

    const originalBg = btn.style.background;
    const originalShadow = btn.style.boxShadow;
    const originalHtml = btn.innerHTML;

    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    btn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã sao chép!';
    btn.disabled = true;

    setTimeout(() => {
        btn.style.background = originalBg;
        btn.style.boxShadow = originalShadow;
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }, 2000);
}

// Expose helper functions globally
window.openExportTextModal = openExportTextModal;
window.copyExportText = copyExportText;

function renderCalStickerMultiSelect() {
    const stickers = ['Nấm', 'Nhện', 'Sâu', 'Châm Kim', 'Thối Cánh', 'Phấn Trắng', 'Phân', 'Mò', 'Thợ'];
    const dropdown = document.querySelector('#cal-sticker-multiselect .multiselect-dropdown');
    if (dropdown) {
        let html = '';
        html += `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px; font-size: 0.8rem; user-select: none;">
                <span onclick="selectAllCalStickers(true); event.stopPropagation();" style="color: #6366f1; font-weight: 700; cursor: pointer; hover: opacity 0.8;">Chọn tất cả</span>
                <span onclick="selectAllCalStickers(false); event.stopPropagation();" style="color: #ef4444; font-weight: 700; cursor: pointer; hover: opacity 0.8;">Xóa chọn</span>
            </div>
        `;
        stickers.forEach(s => {
            const isChecked = selectedCalStickers.includes(s);
            html += `
                <label class="multiselect-item" style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-size: 0.85rem; font-weight: 600; color: #334155;" onclick="event.stopPropagation();">
                    <input type="checkbox" value="${s}" ${isChecked ? 'checked' : ''} onchange="toggleCalSticker('${s}', this.checked)" style="width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer;">
                    <span>${getStickerEmoji(s)} ${s}</span>
                </label>
            `;
        });
        dropdown.innerHTML = html;
        dropdown.querySelectorAll('.multiselect-item').forEach(item => {
            item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        });
        updateCalStickerTriggerLabel();
    }
}

function updateWorkerFilterVisibility() {
    const calWorkerSelect = document.getElementById('cal-worker-select');
    const filterWorkerSelect = document.getElementById('filter-worker-select');

    const calHasTho = selectedCalStickers.includes("Thợ");
    const listHasTho = selectedListStickers.includes("Thợ");

    if (calWorkerSelect) {
        if (calHasTho) {
            calWorkerSelect.style.display = "inline-block";
        } else {
            calWorkerSelect.style.display = "none";
            calWorkerSelect.value = "";
        }
    }

    if (filterWorkerSelect) {
        if (listHasTho) {
            filterWorkerSelect.style.display = "inline-block";
        } else {
            filterWorkerSelect.style.display = "none";
            filterWorkerSelect.value = "";
        }
    }
}

window.toggleCalSticker = function (sticker, isChecked) {
    if (isChecked) {
        if (!selectedCalStickers.includes(sticker)) {
            selectedCalStickers.push(sticker);
        }
    } else {
        selectedCalStickers = selectedCalStickers.filter(s => s !== sticker);
    }
    updateCalStickerTriggerLabel();
    updateWorkerFilterVisibility();
    renderCalendar();
};

window.selectAllCalStickers = function (selectBool) {
    const checkboxes = document.querySelectorAll('#cal-sticker-multiselect .multiselect-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = selectBool;
    });

    if (selectBool) {
        selectedCalStickers = ['Nấm', 'Nhện', 'Sâu', 'Châm Kim', 'Thối Cánh', 'Phấn Trắng', 'Phân', 'Mò', 'Thợ'];
    } else {
        selectedCalStickers = [];
    }
    updateCalStickerTriggerLabel();
    updateWorkerFilterVisibility();
    renderCalendar();
};

function updateCalStickerTriggerLabel() {
    const label = document.querySelector('#cal-sticker-multiselect .multiselect-label');
    if (label) {
        if (selectedCalStickers.length === 0) {
            label.innerText = 'Tất cả sticker';
            label.style.color = '#64748b';
        } else {
            const stickers = ['Nấm', 'Nhện', 'Sâu', 'Châm Kim', 'Thối Cánh', 'Phấn Trắng', 'Phân', 'Mò', 'Thợ'];
            if (selectedCalStickers.length === stickers.length) {
                label.innerText = 'Tất cả sticker';
                label.style.color = '#1e293b';
            } else {
                label.innerText = selectedCalStickers.join(', ');
                label.style.color = '#1e293b';
            }
        }
    }
}

function renderListStickerMultiSelect() {
    const stickers = ['Nấm', 'Nhện', 'Sâu', 'Châm Kim', 'Thối Cánh', 'Phấn Trắng', 'Phân', 'Mò', 'Thợ'];
    const dropdown = document.querySelector('#filter-sticker-multiselect .multiselect-dropdown');
    if (dropdown) {
        let html = '';
        html += `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px; font-size: 0.8rem; user-select: none;">
                <span onclick="selectAllListStickers(true); event.stopPropagation();" style="color: #6366f1; font-weight: 700; cursor: pointer; hover: opacity 0.8;">Chọn tất cả</span>
                <span onclick="selectAllListStickers(false); event.stopPropagation();" style="color: #ef4444; font-weight: 700; cursor: pointer; hover: opacity 0.8;">Xóa chọn</span>
            </div>
        `;
        stickers.forEach(s => {
            const isChecked = selectedListStickers.includes(s);
            html += `
                <label class="multiselect-item" style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; font-size: 0.85rem; font-weight: 600; color: #334155;" onclick="event.stopPropagation();">
                    <input type="checkbox" value="${s}" ${isChecked ? 'checked' : ''} onchange="toggleListSticker('${s}', this.checked)" style="width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer;">
                    <span>${getStickerEmoji(s)} ${s}</span>
                </label>
            `;
        });
        dropdown.innerHTML = html;
        dropdown.querySelectorAll('.multiselect-item').forEach(item => {
            item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        });
        updateListStickerTriggerLabel();
    }
}

window.toggleListSticker = function (sticker, isChecked) {
    if (isChecked) {
        if (!selectedListStickers.includes(sticker)) {
            selectedListStickers.push(sticker);
        }
    } else {
        selectedListStickers = selectedListStickers.filter(s => s !== sticker);
    }
    updateListStickerTriggerLabel();
    updateWorkerFilterVisibility();
    renderTable();
};

window.selectAllListStickers = function (selectBool) {
    const checkboxes = document.querySelectorAll('#filter-sticker-multiselect .multiselect-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = selectBool;
    });

    if (selectBool) {
        selectedListStickers = ['Nấm', 'Nhện', 'Sâu', 'Châm Kim', 'Thối Cánh', 'Phấn Trắng', 'Phân', 'Mò', 'Thợ'];
    } else {
        selectedListStickers = [];
    }
    updateListStickerTriggerLabel();
    updateWorkerFilterVisibility();
    renderTable();
};

function updateListStickerTriggerLabel() {
    const label = document.querySelector('#filter-sticker-multiselect .multiselect-label');
    if (label) {
        if (selectedListStickers.length === 0) {
            label.innerText = 'Tất cả sticker';
            label.style.color = '#64748b';
        } else {
            const stickers = ['Nấm', 'Nhện', 'Sâu', 'Châm Kim', 'Thối Cánh', 'Phấn Trắng', 'Phân', 'Mò', 'Thợ'];
            if (selectedListStickers.length === stickers.length) {
                label.innerText = 'Tất cả sticker';
                label.style.color = '#1e293b';
            } else {
                label.innerText = selectedListStickers.join(', ');
                label.style.color = '#1e293b';
            }
        }
    }
}

// --- TODO SYNC QUEUE PROCESSING ---
let isProcessingTodoQueue = false;

function updateTodoConnectionStatus() {
    const indicator = document.getElementById('todo-conn-status-indicator') || document.getElementById('conn-status-indicator');
    if (!indicator) return;

    const isGlobal = indicator.id === 'conn-status-indicator';
    const queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
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
        if (isGlobal) {
            indicator.style.background = '#fef2f2';
            indicator.style.color = '#991b1b';
            indicator.style.borderColor = '#fecaca';
        }
    } else {
        if (hasPending) {
            indicator.className = 'conn-status-badge status-syncing';
            if (dot) dot.style.display = 'none';
            if (loader) {
                loader.style.display = 'inline-block';
                loader.style.color = '#f59e0b';
            }
            if (text) text.innerText = `Chờ đồng bộ (${queue.length})`;
            if (isGlobal) {
                indicator.style.background = '#fffbeb';
                indicator.style.color = '#92400e';
                indicator.style.borderColor = '#fef3c7';
            }
        } else {
            indicator.className = 'conn-status-badge status-online';
            if (dot) {
                dot.style.display = 'inline-block';
                dot.style.background = '#22c55e';
            }
            if (loader) loader.style.display = 'none';
            if (text) text.innerText = 'Trực tuyến';
            if (isGlobal) {
                indicator.style.background = '#f0fdf4';
                indicator.style.color = '#166534';
                indicator.style.borderColor = '#bbf7d0';
            }
        }
    }
}

async function processTodoSyncQueue() {
    if (!navigator.onLine) {
        updateTodoConnectionStatus();
        return;
    }
    if (isProcessingTodoQueue) return;
    isProcessingTodoQueue = true;

    try {
        updateTodoConnectionStatus();
        while (navigator.onLine) {
            let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
            if (queue.length === 0) break;

            const item = queue[0];
            let success = false;
            let response = null;

            const indicator = document.getElementById('todo-conn-status-indicator') || document.getElementById('conn-status-indicator');
            if (indicator) {
                const isGlobal = indicator.id === 'conn-status-indicator';
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
                if (isGlobal) {
                    indicator.style.background = '#fffbeb';
                    indicator.style.color = '#92400e';
                    indicator.style.borderColor = '#fef3c7';
                }
            }

            try {
                if (item.action === 'save_todo_task') {
                    response = await callApi("save_todo_task", { data: item.data });
                } else if (item.action === 'delete_todo_task') {
                    response = await callApi("delete_todo_task", { id: item.id });
                }

                if (response && response.status === "success") {
                    success = true;
                }
            } catch (err) {
                console.error("Error during todo queue item sync:", err);
            }

            if (success) {
                let updatedQueue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
                if (updatedQueue.length > 0) {
                    const first = updatedQueue[0];
                    if (first.clientId === item.clientId) {
                        updatedQueue.shift();
                    } else {
                        updatedQueue = updatedQueue.filter(x => x.clientId !== item.clientId);
                    }
                    localStorage.setItem('todo_sync_queue', JSON.stringify(updatedQueue));
                }
            } else {
                const errMsg = (response && response.message) ? response.message : "Lỗi kết nối mạng hoặc server Google Sheets.";
                showToast(`Đồng bộ thất bại: ${errMsg}`, "error");
                break;
            }
        }

        let checkQueue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
        if (checkQueue.length === 0) {
            showToast("Đồng bộ công việc lên Cloud thành công!", "success");
            await loadTodoData();
        }
    } catch (e) {
        console.error("Todo queue sync error:", e);
    } finally {
        isProcessingTodoQueue = false;
        updateTodoConnectionStatus();
    }
}

// Fallback Toast Support for standalone todo view
window.showToast = window.showToast || function (message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    const colors = {
        success: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', icon: '✔' },
        error: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: '❌' },
        info: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', icon: 'ℹ' },
        warning: { bg: '#fffbeb', color: '#92400e', border: '#fef3c7', icon: '⚠' }
    };
    const c = colors[type] || colors.info;

    Object.assign(toast.style, {
        padding: '12px 20px',
        borderRadius: '8px',
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontWeight: '600',
        fontSize: '0.9rem',
        opacity: '0',
        transform: 'translateY(-10px)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    });

    toast.innerHTML = `<span style="font-size: 1.1rem;">${c.icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    toast.offsetHeight; // Force reflow
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

window.updateTodoConnectionStatus = updateTodoConnectionStatus;
window.processTodoSyncQueue = processTodoSyncQueue;

// --- STANDALONE/INTEGRATED QUEUE MANAGER SUPPORT IN TODO_V2.JS ---
if (typeof window.renderQueueItems !== 'function') {
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

    window.renderQueueItems = function () {
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
    };

    window.removeQueueItem = function (source, index) {
        if (!confirm('Bạn có chắc muốn xóa mục này khỏi hàng chờ? Giao dịch/công việc này sẽ không được đồng bộ lên Cloud.')) return;

        if (source === 'harvest') {
            let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
            queue.splice(index, 1);
            localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));
            if (window.updateConnectionStatus) window.updateConnectionStatus();
        } else {
            let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
            queue.splice(index, 1);
            localStorage.setItem('todo_sync_queue', JSON.stringify(queue));
            if (window.updateTodoConnectionStatus) {
                window.updateTodoConnectionStatus();
            } else if (window.updateConnectionStatus) {
                window.updateConnectionStatus();
            }
        }
        window.renderQueueItems();
    };

    // Bind event listeners for standalone view buttons
    const btnClearQueue = document.getElementById('btn-clear-queue');
    if (btnClearQueue) {
        btnClearQueue.addEventListener('click', () => {
            if (!confirm('Cảnh báo: Bạn có chắc chắn muốn xóa TOÀN BỘ hàng chờ đồng bộ của cả Dữ liệu Farm và Công Việc? Tất cả thay đổi chưa lưu lên Cloud sẽ bị hủy bỏ.')) return;

            localStorage.setItem('harvest_sync_queue', '[]');
            localStorage.setItem('todo_sync_queue', '[]');

            showToast('Đã xóa toàn bộ hàng chờ đồng bộ!', 'info');
            document.getElementById('queue-manager-modal').style.display = 'none';

            if (window.updateConnectionStatus) window.updateConnectionStatus();
            if (window.updateTodoConnectionStatus) window.updateTodoConnectionStatus();
        });
    }

    const btnRetryQueue = document.getElementById('btn-retry-queue');
    if (btnRetryQueue) {
        btnRetryQueue.addEventListener('click', () => {
            showToast('Đang thực hiện đồng bộ lại...', 'info');
            document.getElementById('queue-manager-modal').style.display = 'none';

            if (window.processSyncQueue) window.processSyncQueue();
            if (window.processTodoSyncQueue) window.processTodoSyncQueue();
        });
    }
}

// Bind connection badge click events for both integrated and standalone scenarios
const todoConnBadge = document.getElementById('todo-conn-status-indicator');
if (todoConnBadge) {
    todoConnBadge.style.cursor = 'pointer';
    todoConnBadge.title = 'Nhấp để quản lý hàng chờ đồng bộ (Queue)';
    todoConnBadge.addEventListener('click', () => {
        const modal = document.getElementById('queue-manager-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (typeof window.renderQueueItems === 'function') {
                window.renderQueueItems();
            }
        }
    });
}


// ==========================================
// ==========================================
// AGRICULTURAL AI SCHEDULER ENGINE
// ==========================================

const FLOWER_CYCLES = window.FLOWER_CYCLES_DB || {
    "Ecuador": { base: 68, winter: 7, summer: -5 },
    "Pháp": { base: 62, winter: 6, summer: -4 },
    "Xô Đỏ": { base: 53, winter: 5, summer: -3 },
    "Xô ngoại": { base: 56, winter: 5, summer: -3 },
    "Xô nội": { base: 53, winter: 5, summer: -3 },
    "Trắng ù": { base: 60, winter: 6, summer: -4 },
    "Quốc Vương": { base: 64, winter: 6, summer: -4 },
    "Ô Hồng": { base: 63, winter: 6, summer: -4 },
    "Vàng Hà Lan": { base: 60, winter: 6, summer: -4 },
    "Kem": { base: 58, winter: 5, summer: -3 },
    "Simmo": { base: 55, winter: 5, summer: -3 },
    "Victor Vàng": { base: 57, winter: 5, summer: -3 },
    "Lạc Thần": { base: 59, winter: 5, summer: -3 },
    "Hỷ Trứng": { base: 54, winter: 5, summer: -3 },
    "Capu": { base: 61, winter: 6, summer: -4 }
};

const HOLIDAY_LABELS = {
    "valentine": "Valentine 14/02",
    "womensday_intl": "Quốc tế Phụ nữ 08/03",
    "womensday_vn": "Phụ nữ Việt Nam 20/10",
    "teachersday_vn": "Nhà giáo Việt Nam 20/11",
    "christmas": "Giáng Sinh 25/12",
    "custom": "Lịch tự chọn"
};

function formatDateString(d, format = 'YYYY-MM-DD') {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (format === 'DD/MM/YYYY') {
        return `${dd}/${mm}/${yyyy}`;
    }
    return `${yyyy}-${mm}-${dd}`;
}

function parseSchedulerNote(note) {
    if (!note || !note.includes('[AI Scheduler]')) return null;
    const parts = {};
    const regexes = {
        variety: /Giống:\s*(.*?)(?:\s*\||$)/,
        holidayLabel: /Lễ:\s*(.*?)(?:\s*\||$)/,
        holidayDateStr: /Ngày lễ:\s*(.*?)(?:\s*\||$)/,
        baseCycle: /Chu kỳ tiêu chuẩn:\s*(\d+)/,
        totalCycle: /Tổng chu kỳ:\s*(\d+)/,
        peakDateStr: /Ngày rộ:\s*(.*?)(?:\s*\||$)/,
        actualPeakDateStr: /Ngày rộ thực tế:\s*(.*?)(?:\s*\||$)/
    };
    for (const [key, regex] of Object.entries(regexes)) {
        const match = note.match(regex);
        if (match) {
            if (key === 'baseCycle' || key === 'totalCycle') {
                parts[key] = parseInt(match[1]);
            } else {
                parts[key] = match[1].trim();
            }
        }
    }
    return parts;
}

function getWeatherModifierInfo(variety, peakDate) {
    const db = window.FLOWER_CYCLES_DB || {};
    const cycleInfo = db[variety] || { base: 60, winter: 6, summer: -4 };
    const baseCycle = cycleInfo.base;
    const peakMonth = peakDate.getMonth(); // 0-11
    let modifier = 0;
    let reason = "";

    // Months mapping:
    // Winter: Nov (10), Dec (11), Jan (0), Feb (1)
    // Summer: May (4), June (5), July (6), August (7)
    // Spring: March (2), April (3)
    // Autumn / Rainy: Sept (8), Oct (9)

    if ([10, 11, 0, 1].includes(peakMonth)) {
        const baseMod = cycleInfo.winter || 6;
        const anomalyMod = 1; // La Nina cold winter anomaly
        modifier = baseMod + anomalyMod;
        reason = `Mùa đông Đà Lạt lạnh sâu làm cây sinh trưởng chậm. Dự báo mùa đông năm nay chịu ảnh hưởng của hiện tượng La Nina gây rét đậm kéo dài (nhiệt độ ban đêm hạ xuống dưới 14°C) kèm sương muối cục bộ làm chậm tốc độ phân hóa mầm hoa. Tổng bù trừ thời tiết là <b>+${modifier} ngày</b> (+${baseMod} ngày tiêu chuẩn mùa đông & +${anomalyMod} ngày do rét đậm & La Nina cực đoan).`;
    } else if ([4, 5, 6, 7].includes(peakMonth)) {
        const baseMod = cycleInfo.summer || -4;
        const anomalyMod = -2; // Global warming heatwave anomaly
        modifier = baseMod + anomalyMod;
        reason = `Thời tiết mùa hè Đà Lạt nắng nóng giúp cây phân hóa nụ nhanh hơn. Đặc biệt dự báo năm nay chịu ảnh hưởng của nắng nóng kỷ lục do biến đổi khí hậu toàn cầu, nhiệt độ trung bình trong nhà kính tăng 1.5 - 2°C làm tăng cường trao đổi chất của cây, rút ngắn chu kỳ sinh trưởng của hoa. Tổng bù trừ thời tiết là <b>${modifier} ngày</b> (${baseMod} ngày tiêu chuẩn mùa hè & ${anomalyMod} ngày do nắng nóng cực đoan).`;
    } else if ([2, 3].includes(peakMonth)) {
        const baseMod = Math.round((cycleInfo.summer || -4) * 0.6); // Spring is milder summer
        const anomalyMod = -1; // Warm spring anomaly
        modifier = baseMod + anomalyMod;
        reason = `Thời tiết mùa xuân Đà Lạt nắng nhiều, ấm áp tạo điều kiện thuận lợi cho chồi non phát triển sớm. Dự báo năm nay hiện tượng El Nino nhẹ làm bức xạ nhiệt tăng nhẹ vào tháng 3-4 và ít mưa, giúp đẩy nhanh quá trình sinh trưởng. Tổng bù trừ thời tiết là <b>${modifier} ngày</b> (${baseMod} ngày tiêu chuẩn mùa xuân & ${anomalyMod} ngày do nắng ấm gia tăng).`;
    } else {
        // September, October (Months 8, 9)
        const baseMod = 2; // Autumn rain delay
        const anomalyMod = 1; // Heavy rainfall La Nina anomaly
        modifier = baseMod + anomalyMod;
        reason = `Tháng 9-10 là đỉnh điểm mùa mưa bão tại Đà Lạt. Dự báo năm nay chịu tác động của La Nina hoạt động mạnh gây mưa lớn liên tiếp, độ ẩm không khí rất cao, bầu trời nhiều mây mù thiếu ánh nắng mặt trời làm hạn chế hiệu suất quang hợp tự nhiên. Tổng bù trừ thời tiết kéo dài thêm <b>+${modifier} ngày</b> (+${baseMod} ngày tiêu chuẩn mùa mưa & +${anomalyMod} ngày do mây mù thiếu nắng kéo dài).`;
    }

    return { modifier, reason };
}

function generateAIReportHTML(variety, baseCycle, seasonModifier, weatherReason, totalCycle, peakDate, cutDate, holidayDate, daysBefore) {
    const active = window.activeAIScheduleAnalysis || {};
    const docLinkHtml = window.FLOWER_CYCLES_DB && window.FLOWER_CYCLES_DB[variety] 
        ? `<a href="javascript:void(0)" onclick="window.showScientificDocs('${variety}')" style="color: #7c3aed; font-weight: 700; text-decoration: none; margin-left: 6px; font-size: 0.8rem; border-bottom: 1px dashed #7c3aed; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-graduation-cap"></i> Xem cơ sở khoa học & tài liệu chứng minh</a>` 
        : "";

    let detailListHtml = "";
    if (active.mode === 'forward') {
        const actualDateStr = active.actualDate ? formatDateString(active.actualDate, 'DD/MM/YYYY') : "Chưa chọn";
        let deviationHtml = "";
        if (active.actualDate) {
            const dev = active.deviationDays;
            const stdDev = active.standardDeviationDays;
            
            let devText = "";
            let devStyle = "";
            if (dev > 0) {
                devText = `⚠️ Muộn hơn dự báo AI <b>${dev} ngày</b>`;
                devStyle = "color: #d97706; font-weight: 700;";
            } else if (dev < 0) {
                devText = `⚡ Sớm hơn dự báo AI <b>${Math.abs(dev)} ngày</b>`;
                devStyle = "color: #3b82f6; font-weight: 700;";
            } else {
                devText = `🎉 Khớp hoàn hảo với dự báo AI!`;
                devStyle = "color: #10b981; font-weight: 700;";
            }

            let stdDevText = "";
            if (stdDev > 0) {
                stdDevText = `muộn hơn chu kỳ tiêu chuẩn <b>${stdDev} ngày</b>`;
            } else if (stdDev < 0) {
                stdDevText = `sớm hơn chu kỳ tiêu chuẩn <b>${Math.abs(stdDev)} ngày</b>`;
            } else {
                stdDevText = `trùng khớp chu kỳ tiêu chuẩn`;
            }

            // Đánh giá hiệu quả AI
            let aiComparison = "";
            if (Math.abs(dev) < Math.abs(stdDev)) {
                aiComparison = `<div style="margin-top: 6px; font-size: 0.8rem; color: #10b981; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Dự báo thời tiết AI chính xác hơn chu kỳ tiêu chuẩn (lệch ${Math.abs(dev)} ngày so với ${Math.abs(stdDev)} ngày).</div>`;
            } else if (Math.abs(dev) > Math.abs(stdDev)) {
                aiComparison = `<div style="margin-top: 6px; font-size: 0.8rem; color: #d97706; font-weight: 700;"><i class="fa-solid fa-circle-exclamation"></i> Chu kỳ tiêu chuẩn chính xác hơn dự báo AI ở trường hợp này.</div>`;
            } else {
                aiComparison = `<div style="margin-top: 6px; font-size: 0.8rem; color: #475569; font-weight: 700;"><i class="fa-solid fa-equals"></i> Dự báo AI và chu kỳ tiêu chuẩn cho kết quả sai số tương đương.</div>`;
            }

            deviationHtml = `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(124, 58, 237, 0.2);">
                    <div style="font-size: 0.82rem; color: #475569;">
                        Đánh giá sai lệch: <span style="${devStyle}">${devText}</span>
                    </div>
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                        (Thực tế ${stdDevText})
                    </div>
                    ${aiComparison}
                </div>
            `;
        }

        detailListHtml = `
            <ul style="margin: 0; padding-left: 20px;">
                <li>Ngày Hạ Cành: <b>${formatDateString(cutDate, 'DD/MM/YYYY')}</b></li>
                <li>Chu kỳ tiêu chuẩn: <b>${baseCycle} ngày</b></li>
                <li>Chu kỳ thực tế (có bù trừ): <b>${totalCycle} ngày</b></li>
                <li>Ngày Rộ Dự Kiến (AI): <b style="color: #10b981; font-size: 0.95rem;">${formatDateString(peakDate, 'DD/MM/YYYY')}</b></li>
                <li>Ngày Rộ Thực Tế: <b>${actualDateStr}</b></li>
            </ul>
            ${deviationHtml}
        `;
    } else {
        detailListHtml = `
            <ul style="margin: 0; padding-left: 20px;">
                <li>Ngày Lễ Mục Tiêu: <b>${holidayDate ? formatDateString(holidayDate, 'DD/MM/YYYY') : '--/--'}</b></li>
                <li>Ngày Rộ Hoa: <b>${formatDateString(peakDate, 'DD/MM/YYYY')}</b> (trước lễ ${daysBefore} ngày để đóng gói & xuất hàng)</li>
                <li>Chu kỳ thực tế: <b>${totalCycle} ngày</b></li>
                <li>Khuyến nghị ngày cắt cành: <b style="color: #7c3aed; font-size: 0.95rem;">${formatDateString(cutDate, 'DD/MM/YYYY')}</b></li>
            </ul>
        `;
    }

    return `
        <div style="font-size: 0.88rem; line-height: 1.5; color: #374151;">
            <p style="margin: 0 0 10px 0;">Giống hoa <b>${variety}</b> có chu kỳ sinh trưởng tiêu chuẩn là <b>${baseCycle} ngày</b>.${docLinkHtml}</p>
            <div style="margin: 0 0 12px 0; background: rgba(99, 102, 241, 0.03); border: 1px solid rgba(99, 102, 241, 0.1); padding: 10px; border-radius: 8px; font-size: 0.82rem; color: #4b5563; line-height: 1.45;">
                <strong style="color: #4f46e5; display: block; margin-bottom: 4px;"><i class="fa-solid fa-cloud-sun-rain"></i> Bù trừ thời tiết & Phân tích khí hậu:</strong>
                ${weatherReason}
            </div>
            <div style="background: rgba(124, 58, 237, 0.04); border-left: 3px solid #7c3aed; padding: 10px; border-radius: 4px; margin-top: 10px; margin-bottom: 10px;">
                ${detailListHtml}
            </div>
            <p style="margin: 10px 0 6px 0; font-weight: 800; color: #1e293b;">Quy trình kỹ thuật chăm sóc đi kèm:</p>
            <ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
                <li><strong style="color: #6366f1;">Ngày 0 - 15 (Sau cắt cành):</strong> Đi nước đầy đủ. Bón thúc đạm cao kết hợp Humic kích rễ để chồi bật mầm đồng đều, khỏe mạnh.</li>
                <li><strong style="color: #f59e0b;">Ngày 15 - 40 (Nuôi nụ):</strong> Phun thuốc phòng ngừa bọ trĩ và phấn trắng định kỳ. Khi chồi có nụ hạt đậu, tỉa bỏ nụ phụ để tập trung dinh dưỡng nuôi nụ chính.</li>
                <li><strong style="color: #10b981;">Ngày 40 đến rộ:</strong> Tăng hàm lượng Kali trắng (K2SO4) giúp bông dày cánh, màu sắc rực rỡ và phom hoa cứng cáp khi đóng thùng đi vựa.</li>
            </ul>
        </div>
    `;
}

window.showScientificDocs = function (variety) {
    const db = window.FLOWER_CYCLES_DB || {};
    const info = db[variety];
    if (!info) {
        alert("Không tìm thấy tài liệu nghiên cứu cho giống hoa này.");
        return;
    }

    const modal = document.getElementById('scientific-docs-modal');
    const nameEl = document.getElementById('scientific-flower-name');
    const basisEl = document.getElementById('scientific-basis-text');
    const listEl = document.getElementById('scientific-docs-list');

    if (!modal || !nameEl || !basisEl || !listEl) return;

    nameEl.innerText = `Giống hoa: ${variety}`;
    basisEl.innerText = info.scientificBasis || "Đặc tính sinh lý đang được tiếp tục cập nhật bởi chuyên gia nông nghiệp.";

    let listHtml = "";
    if (info.references && info.references.length > 0) {
        info.references.forEach(ref => {
            listHtml += `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 0.85rem;">
                    <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-regular fa-file-lines" style="color: #7c3aed;"></i> ${ref.title}
                    </div>
                    <p style="margin: 0 0 6px 0; color: #64748b; font-style: italic; line-height: 1.45;">
                        "${ref.snippet}"
                    </p>
                    <div style="text-align: right;">
                        <a href="${ref.url}" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Xem nguồn tài liệu
                        </a>
                    </div>
                </div>
            `;
        });
    } else {
        listHtml = `<p style="font-size: 0.85rem; color: #94a3b8; font-style: italic; margin: 0; text-align: center;">Tài liệu kiểm chứng đang được đồng bộ...</p>`;
    }
    listEl.innerHTML = listHtml;

    modal.style.display = 'flex';
};

window.handleHolidayPresetChange = function () {
    const preset = document.getElementById('sched-holiday-preset').value;
    if (preset === 'custom') return;

    const now = new Date();
    let year = now.getFullYear();
    let month = 0;
    let day = 1;

    switch (preset) {
        case 'valentine':
            month = 1; // February
            day = 14;
            break;
        case 'womensday_intl':
            month = 2; // March
            day = 8;
            break;
        case 'womensday_vn':
            month = 9; // October
            day = 20;
            break;
        case 'teachersday_vn':
            month = 10; // November
            day = 20;
            break;
        case 'christmas':
            month = 11; // December
            day = 25;
            break;
    }

    let holidayDate = new Date(year, month, day);
    const todayNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (holidayDate < todayNoTime) {
        year += 1;
        holidayDate = new Date(year, month, day);
    }

    const yyyy = holidayDate.getFullYear();
    const mm = String(holidayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(holidayDate.getDate()).padStart(2, '0');
    document.getElementById('sched-holiday-date').value = `${yyyy}-${mm}-${dd}`;

    // No auto-run on preset change, wait for user to click the blue button
};

window.openAISchedulerPreset = function (presetKey, holidayDateVal, variety) {
    // 1. Switch tab to scheduler
    const navBtn = document.querySelector('.todo-nav-btn[data-target="view-ai-scheduler"]');
    if (navBtn) {
        navBtn.click();
    } else {
        const schedulerTab = document.getElementById('view-ai-scheduler');
        if (schedulerTab) {
            const subviews = document.querySelectorAll('.subview');
            subviews.forEach(v => {
                v.style.display = 'none';
                v.classList.remove('active-subview');
            });
            schedulerTab.style.display = 'block';
            schedulerTab.classList.add('active-subview');
            const btns = document.querySelectorAll('.todo-nav-btn');
            btns.forEach(b => {
                if (b.getAttribute('data-target') === 'view-ai-scheduler') {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        }
    }

    // 2. Set form values
    const presetSelect = document.getElementById('sched-holiday-preset');
    if (presetSelect) presetSelect.value = presetKey;

    const dateInput = document.getElementById('sched-holiday-date');
    if (dateInput) dateInput.value = holidayDateVal;

    const varietyInput = document.getElementById('sched-selected-variety');
    if (varietyInput) varietyInput.value = variety;

    // Highlight selected variety pill
    const pills = document.querySelectorAll('.sched-flower-pill-btn');
    pills.forEach(pill => {
        if (pill.getAttribute('data-value') === variety) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // 3. Automatically run analysis
    window.runAIScheduleAnalysis();
};

window.runAIScheduleAnalysis = async function () {
    const variety = document.getElementById('sched-selected-variety').value;
    if (!variety) {
        alert("Vui lòng chọn giống hoa / màu.");
        return;
    }

    const resultPlaceholder = document.getElementById('sched-result-placeholder');
    const resultContent = document.getElementById('sched-result-content');
    if (resultPlaceholder) resultPlaceholder.style.display = 'none';
    if (resultContent) {
        resultContent.style.display = 'flex';
    }

    const reportTextDiv = document.getElementById('sched-ai-report-text');
    if (reportTextDiv) {
        reportTextDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 2rem; color: #6366f1; font-weight: 700;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem;"></i>
                <span>Trợ lý AI đang phân tích khí hậu và dự báo thời tiết real-time...</span>
            </div>
        `;
    }

    const cycleInfo = FLOWER_CYCLES[variety] || { base: 60, winter: 6, summer: -4 };
    const baseCycle = cycleInfo.base;
    const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";

    let cutDate, peakDate, holidayDate, daysBefore = 0, actualDate = null;
    let estimatedPeakDate;
    let preset = 'custom';
    let holidayLabel = '';

    if (window.currentSchedMode === 'forward') {
        const cutDateVal = document.getElementById('sched-cut-date').value;
        if (!cutDateVal) {
            alert("Vui lòng chọn ngày hạ cành.");
            return;
        }
        cutDate = parseLocalDate(cutDateVal);
        if (!cutDate || isNaN(cutDate.getTime())) {
            alert("Ngày hạ cành không hợp lệ.");
            return;
        }

        const actualDateVal = document.getElementById('sched-actual-date').value;
        if (actualDateVal) {
            actualDate = parseLocalDate(actualDateVal);
        }

        // Ước lượng ngày rộ tiêu chuẩn làm mốc phân tích khí hậu
        estimatedPeakDate = new Date(cutDate.getTime() + baseCycle * 24 * 60 * 60 * 1000);
        preset = 'forward_plan';
        holidayLabel = 'Tính xuôi từ ngày hạ cành';
    } else {
        const holidayDateVal = document.getElementById('sched-holiday-date').value;
        const daysBeforeVal = document.getElementById('sched-days-before').value;

        if (!holidayDateVal) {
            alert("Vui lòng chọn ngày lễ mục tiêu.");
            return;
        }

        daysBefore = parseInt(daysBeforeVal) || 0;
        holidayDate = parseLocalDate(holidayDateVal);
        if (!holidayDate || isNaN(holidayDate.getTime())) {
            alert("Ngày lễ mục tiêu không hợp lệ.");
            return;
        }

        peakDate = new Date(holidayDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));
        estimatedPeakDate = peakDate;
        preset = document.getElementById('sched-holiday-preset').value;
        holidayLabel = HOLIDAY_LABELS[preset] || `Ngày ${formatDateString(holidayDate, 'DD/MM/YYYY')}`;
    }

    let seasonModifier = 0;
    let weatherReason = "";

    // Check if we can reuse previous analysis
    const lastAnalysis = window.activeAIScheduleAnalysis;
    const canReuseAnalysis = lastAnalysis && 
                           lastAnalysis.peakDate && 
                           new Date(lastAnalysis.peakDate).getTime() === estimatedPeakDate.getTime() &&
                           lastAnalysis.weatherReason &&
                           lastAnalysis.weatherReason.includes("🤖") &&
                           !lastAnalysis.weatherReason.includes("Lỗi kết nối");

    if (canReuseAnalysis) {
        seasonModifier = lastAnalysis.seasonModifier;
        weatherReason = lastAnalysis.weatherReason;
        if (!weatherReason.includes("được dùng lại")) {
            weatherReason = weatherReason.replace(" (🤖 <i>Phân tích real-time bằng Gemini AI</i>)", " (🤖 <i>Phân tích thời tiết được dùng lại từ lần trước</i>)");
        }
        console.log("Reused previous weather analysis.");
    } else if (apiKey && apiKey.trim() !== "") {
        try {
            const formattedPeakDate = formatDateString(estimatedPeakDate, 'DD/MM/YYYY');
            let prompt = "";
            if (window.currentSchedMode === 'forward') {
                prompt = `Bạn là một chuyên gia nông nghiệp AI chuyên phân tích chu kỳ sinh trưởng của hoa hồng cắt cành tại Đà Lạt.
Hãy phân tích điều kiện thời tiết thực tế và dự báo khí hậu năm 2026/2027 để đưa ra con số ngày "Bù trừ thời tiết" (modifier) cho giống hoa hồng sau:
- Giống hoa: ${variety}
- Chu kỳ sinh trưởng tiêu chuẩn (base): ${baseCycle} ngày
- Ngày hoa nở rộ mục tiêu ước tính: ${formattedPeakDate} (tháng ${estimatedPeakDate.getMonth() + 1}) (được tính ước tính từ ngày hạ cành ${formatDateString(cutDate, 'DD/MM/YYYY')} cộng với chu kỳ tiêu chuẩn)

Yêu cầu phân tích chi tiết dựa trên:
1. Đặc điểm mùa vụ tại Đà Lạt vào tháng ${estimatedPeakDate.getMonth() + 1} (mùa mưa/khô, nhiệt độ ban ngày/ban đêm, ánh sáng).
2. Dự đoán thời tiết năm 2026/2027 (như đợt nắng nóng cực đoan do biến đổi khí hậu vào mùa xuân-hè, mưa dầm dề mây mù do La Nina vào mùa thu, lạnh sâu kèm sương muối vào mùa đông).
3. Đưa ra một số nguyên (modifier) là số ngày điều chỉnh (ví dụ: -7 ngày nếu hè nắng nóng, +3 ngày nếu mưa mây mù, +8 ngày nếu đông lạnh sâu). Đối với giống Victor Vàng vào mùa hè nóng gắt, modifier nằm trong khoảng từ -3 đến -5 ngày.
4. Viết thuyết minh ngắn gọn, khoa học bằng tiếng Việt (khoảng 3-4 câu) giải thích rõ ràng tại sao con số này được lựa chọn.

Trả về kết quả dưới định dạng JSON duy nhất, không kèm markdown khác:
{
  "modifier": <số nguyên ngày bù trừ>,
  "reason": "<chuỗi giải thích thuyết minh khí hậu>"
}`;
            } else {
                prompt = `Bạn là một chuyên gia nông nghiệp AI chuyên phân tích chu kỳ sinh trưởng của hoa hồng cắt cành tại Đà Lạt.
Hãy phân tích điều kiện thời tiết thực tế và dự báo khí hậu năm 2026/2027 để đưa ra con số ngày "Bù trừ thời tiết" (modifier) cho giống hoa hồng sau:
- Giống hoa: ${variety}
- Chu kỳ sinh trưởng tiêu chuẩn (base): ${baseCycle} ngày
- Ngày hoa nở rộ mục tiêu: ${formattedPeakDate} (tháng ${estimatedPeakDate.getMonth() + 1})

Yêu cầu phân tích chi tiết dựa trên:
1. Đặc điểm mùa vụ tại Đà Lạt vào tháng ${estimatedPeakDate.getMonth() + 1} (mùa mưa/khô, nhiệt độ ban ngày/ban đêm, ánh sáng).
2. Dự đoán thời tiết năm 2026/2027 (như đợt nắng nóng cực đoan do biến đổi khí hậu vào mùa xuân-hè, mưa dầm dề mây mù do La Nina vào mùa thu, lạnh sâu kèm sương muối vào mùa đông).
3. Đưa ra một số nguyên (modifier) là số ngày điều chỉnh (ví dụ: -7 ngày nếu hè nắng nóng, +3 ngày nếu mưa mây mù, +8 ngày nếu đông lạnh sâu). Đối với giống Ecuador vào mùa hè nóng gắt, modifier phải nằm trong khoảng từ -5 đến -8 ngày.
4. Viết thuyết minh ngắn gọn, khoa học bằng tiếng Việt (khoảng 3-4 câu) giải thích rõ ràng tại sao con số này được lựa chọn.

Trả về kết quả dưới định dạng JSON duy nhất, không kèm markdown khác:
{
  "modifier": <số nguyên ngày bù trừ>,
  "reason": "<chuỗi giải thích thuyết minh khí hậu>"
}`;
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorJson = await response.json();
                    if (errorJson && errorJson.error && errorJson.error.message) {
                        errorMsg = errorJson.error.message;
                    }
                } catch (_) {}
                throw new Error(errorMsg);
            }
            const apiResult = await response.json();
            const responseText = apiResult.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(responseText.trim());

            seasonModifier = parseInt(parsed.modifier) || 0;
            weatherReason = parsed.reason + " (🤖 <i>Phân tích real-time bằng Gemini AI</i>)";
        } catch (e) {
            console.error("Gemini API calculation failed, falling back to rules engine:", e);
            const fallback = getWeatherModifierInfo(variety, estimatedPeakDate);
            seasonModifier = fallback.modifier;
            
            let displayErr = "Lỗi kết nối Gemini API";
            if (e.message) {
                if (e.message.includes("not found") || e.message.includes("404") || e.message.includes("supported")) {
                    try {
                        const checkUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                        const checkResponse = await fetch(checkUrl);
                        if (!checkResponse.ok) {
                            const checkJson = await checkResponse.json();
                            if (checkJson && checkJson.error && checkJson.error.message) {
                                if (checkJson.error.message.includes("API key expired")) {
                                    displayErr = "Khóa API đã hết hạn (API key expired)";
                                } else if (checkJson.error.message.includes("API key not valid") || checkJson.error.message.includes("INVALID_ARGUMENT")) {
                                    displayErr = "Khóa API không hợp lệ (Invalid API key)";
                                } else {
                                    displayErr = `Lỗi API: ${checkJson.error.message}`;
                                }
                            }
                        }
                    } catch (_) {
                        displayErr = `Lỗi Gemini API: ${e.message}`;
                    }
                } else if (e.message.includes("API key expired")) {
                    displayErr = "Khóa API đã hết hạn (API key expired)";
                } else if (e.message.includes("API key not valid") || e.message.includes("INVALID_ARGUMENT") || e.message.includes("not valid")) {
                    displayErr = "Khóa API không hợp lệ (Invalid API key)";
                } else {
                    displayErr = `Lỗi Gemini API: ${e.message}`;
                }
            }
            weatherReason = fallback.reason + ` <span style='color: #ef4444; font-size: 0.75rem; font-weight: 500;'>(⚠️ ${displayErr}, tự động dùng bộ dự phòng)</span>`;
        }
    } else {
        const fallback = getWeatherModifierInfo(variety, estimatedPeakDate);
        seasonModifier = fallback.modifier;
        weatherReason = fallback.reason + " <span style='color: #64748b; font-size: 0.75rem; font-weight: 500;'>(💡 Vui lòng cấu hình biến môi trường GEMINI_API_KEY trên Vercel/Github để kích hoạt phân tích AI)</span>";
    }

    const totalCycle = baseCycle + seasonModifier;
    let predictedPeakDate;

    if (window.currentSchedMode === 'forward') {
        predictedPeakDate = new Date(cutDate.getTime() + totalCycle * 24 * 60 * 60 * 1000);
    } else {
        predictedPeakDate = peakDate;
        cutDate = new Date(predictedPeakDate.getTime() - (totalCycle * 24 * 60 * 60 * 1000));
    }

    // Tính chênh lệch nếu có ngày rộ thực tế
    let deviationDays = null;
    let standardDeviationDays = null;
    if (window.currentSchedMode === 'forward' && actualDate) {
        deviationDays = Math.round((actualDate.getTime() - predictedPeakDate.getTime()) / (24 * 60 * 60 * 1000));
        const standardPeakDate = new Date(cutDate.getTime() + baseCycle * 24 * 60 * 60 * 1000);
        standardDeviationDays = Math.round((actualDate.getTime() - standardPeakDate.getTime()) / (24 * 60 * 60 * 1000));
    }

    window.activeAIScheduleAnalysis = {
        mode: window.currentSchedMode,
        variety,
        holidayPreset: preset,
        holidayLabel,
        holidayDate: window.currentSchedMode === 'backward' ? holidayDate : null,
        daysBefore: window.currentSchedMode === 'backward' ? daysBefore : 0,
        baseCycle,
        seasonModifier,
        weatherReason,
        totalCycle,
        peakDate: predictedPeakDate,
        cutDate,
        actualDate,
        deviationDays,
        standardDeviationDays
    };

    const cutDateDiv = document.getElementById('sched-timeline-cut-date');
    if (cutDateDiv) cutDateDiv.innerText = formatDateString(cutDate, 'DD/MM/YYYY');

    const peakDateDiv = document.getElementById('sched-timeline-peak-date');
    if (peakDateDiv) peakDateDiv.innerText = formatDateString(predictedPeakDate, 'DD/MM/YYYY');

    const holidayDateDiv = document.getElementById('sched-timeline-holiday-date');
    if (holidayDateDiv) {
        if (window.currentSchedMode === 'backward') {
            holidayDateDiv.innerText = formatDateString(holidayDate, 'DD/MM/YYYY');
        } else {
            holidayDateDiv.innerText = actualDate ? formatDateString(actualDate, 'DD/MM/YYYY') : '--/--';
        }
    }

    const baseInput = document.getElementById('sched-timeline-days-base');
    if (baseInput) baseInput.value = baseCycle;

    const seasonModSpan = document.getElementById('sched-timeline-season-mod');
    if (seasonModSpan) {
        seasonModSpan.innerText = (seasonModifier >= 0 ? "+" : "") + seasonModifier;
    }

    const totalSpan = document.getElementById('sched-timeline-days-total');
    if (totalSpan) {
        totalSpan.innerText = totalCycle;
    }

    const progressDiv = document.getElementById('sched-timeline-progress');
    if (progressDiv) {
        progressDiv.style.width = "100%";
    }

    if (reportTextDiv) {
        reportTextDiv.innerHTML = generateAIReportHTML(
            variety,
            baseCycle,
            seasonModifier,
            weatherReason,
            totalCycle,
            predictedPeakDate,
            cutDate,
            holidayDate,
            daysBefore
        );
    }
};

window.onBaseCycleOverride = function () {
    const active = window.activeAIScheduleAnalysis;
    if (!active) return;

    const baseInput = document.getElementById('sched-timeline-days-base');
    if (!baseInput) return;

    let newBase = parseInt(baseInput.value);
    if (isNaN(newBase) || newBase <= 0) {
        newBase = active.baseCycle;
    }

    active.baseCycle = newBase;
    active.totalCycle = newBase + active.seasonModifier;

    if (active.mode === 'forward') {
        const cutDate = new Date(active.cutDate);
        const newPeakDate = new Date(cutDate.getTime() + active.totalCycle * 24 * 60 * 60 * 1000);
        active.peakDate = newPeakDate;

        const peakDateDiv = document.getElementById('sched-timeline-peak-date');
        if (peakDateDiv) peakDateDiv.innerText = formatDateString(newPeakDate, 'DD/MM/YYYY');

        if (active.actualDate) {
            active.deviationDays = Math.round((active.actualDate.getTime() - newPeakDate.getTime()) / (24 * 60 * 60 * 1000));
            const standardPeakDate = new Date(cutDate.getTime() + active.baseCycle * 24 * 60 * 60 * 1000);
            active.standardDeviationDays = Math.round((active.actualDate.getTime() - standardPeakDate.getTime()) / (24 * 60 * 60 * 1000));
        }
    } else {
        const peakDate = new Date(active.peakDate);
        const newCutDate = new Date(peakDate.getTime() - (active.totalCycle * 24 * 60 * 60 * 1000));
        active.cutDate = newCutDate;

        const cutDateDiv = document.getElementById('sched-timeline-cut-date');
        if (cutDateDiv) cutDateDiv.innerText = formatDateString(newCutDate, 'DD/MM/YYYY');
    }

    const totalSpan = document.getElementById('sched-timeline-days-total');
    if (totalSpan) totalSpan.innerText = active.totalCycle;

    const reportTextDiv = document.getElementById('sched-ai-report-text');
    if (reportTextDiv) {
        reportTextDiv.innerHTML = generateAIReportHTML(
            active.variety,
            active.baseCycle,
            active.seasonModifier,
            active.weatherReason,
            active.totalCycle,
            active.peakDate,
            active.cutDate,
            active.holidayDate,
            active.daysBefore
        );
    }
};


window.saveAIScheduleTasks = async function () {
    if (isRestricted()) return;
    const active = window.activeAIScheduleAnalysis;
    if (!active) {
        alert("Vui lòng thực hiện phân tích lịch trình trước khi lưu.");
        return;
    }

    const schedId = "AI_SCHED_" + Date.now();
    const isForward = active.mode === 'forward';
    const holidayLabel = active.holidayLabel || (isForward ? "Tính xuôi từ ngày hạ cành" : "Lịch tự chọn");
    const holidayDateStr = active.holidayDate ? formatDateString(active.holidayDate, 'DD/MM/YYYY') : "--";
    const peakDateStr = formatDateString(active.peakDate, 'DD/MM/YYYY');
    const actualDateStr = active.actualDate ? formatDateString(active.actualDate, 'DD/MM/YYYY') : "";

    // 1. Create Cut Cành task
    const cutTaskId = "OFFLINE_TODO_" + Date.now() + "_1";
    const cutTaskName = `[Cắt Cành] hoa ${active.variety} cho ${holidayLabel}`;
    let cutNote = `[AI Scheduler] Giống: ${active.variety} | Lễ: ${holidayLabel} | Ngày lễ: ${holidayDateStr} | Chu kỳ tiêu chuẩn: ${active.baseCycle} | Tổng chu kỳ: ${active.totalCycle} | Ngày rộ: ${peakDateStr} | [Mã Lịch AI: ${schedId}]`;
    if (isForward) {
        cutNote = `[AI Scheduler] Giống: ${active.variety} | Lễ: ${holidayLabel} | Ngày lễ: ${holidayDateStr} | Chu kỳ tiêu chuẩn: ${active.baseCycle} | Tổng chu kỳ: ${active.totalCycle} | Ngày rộ: ${peakDateStr} | Ngày rộ thực tế: ${actualDateStr} | [Mã Lịch AI: ${schedId}]`;
    }

    const cutTaskObj = {
        id: cutTaskId,
        task: cutTaskName,
        deadline: formatDateString(active.cutDate, 'YYYY-MM-DD'),
        category: "Lập Lịch AI",
        note: cutNote,
        priority: "Cao",
        status: isForward && active.cutDate < new Date() ? "Hoàn thành" : "Chưa bắt đầu",
        sticker: "Cắt Cành"
    };
    cutTaskObj.deadlineDate = parseLocalDate(cutTaskObj.deadline);

    // 2. Create Hoa Rộ task
    const peakTaskId = "OFFLINE_TODO_" + Date.now() + "_2";
    const peakTaskName = `[Hoa Rộ] hoa ${active.variety} cho ${holidayLabel}`;
    let peakNote = `Thời điểm hoa ${active.variety} đạt độ nở rộ phục vụ ${holidayLabel}.\nThu hoạch đóng gói gửi vựa.\n[Mã Lịch AI: ${schedId}]`;
    if (isForward) {
        peakNote = `Thời điểm hoa ${active.variety} dự kiến nở rộ sau khi hạ cành ngày ${formatDateString(active.cutDate, 'DD/MM/YYYY')}.`;
        if (actualDateStr) {
            let devText = active.deviationDays === 0 ? "Khớp hoàn hảo!" : (active.deviationDays > 0 ? `Trễ ${active.deviationDays} ngày` : `Sớm ${Math.abs(active.deviationDays)} ngày`);
            peakNote += `\nNgày rộ thực tế: ${actualDateStr}\nSai lệch dự báo: ${devText}`;
        }
        peakNote += `\n[Mã Lịch AI: ${schedId}]`;
    }

    const peakTaskObj = {
        id: peakTaskId,
        task: peakTaskName,
        deadline: formatDateString(active.peakDate, 'YYYY-MM-DD'),
        category: "Lập Lịch AI",
        note: peakNote,
        priority: "Khẩn cấp",
        status: isForward && active.peakDate < new Date() ? "Hoàn thành" : "Chưa bắt đầu",
        sticker: "Hoa Rộ"
    };
    peakTaskObj.deadlineDate = parseLocalDate(peakTaskObj.deadline);

    const now = new Date();
    const datePart = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
    const timePart = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    
    cutTaskObj.createdAt = datePart + ' ' + timePart;
    cutTaskObj.createdDate = now;
    
    peakTaskObj.createdAt = datePart + ' ' + timePart;
    peakTaskObj.createdDate = now;

    // Add both tasks
    todoCache.unshift(cutTaskObj);
    todoCache.unshift(peakTaskObj);
    localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));

    showToast("Đã lưu lịch trình cắt cành và ngày rộ hoa!", "success");
    window.renderAIScheduler();
    
    if (typeof renderActiveView === 'function') {
        renderActiveView();
    }

    // Push both to sync queue
    let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
    queue.push({ action: "save_todo_task", data: cutTaskObj, clientId: cutTaskId });
    queue.push({ action: "save_todo_task", data: peakTaskObj, clientId: peakTaskId });
    localStorage.setItem('todo_sync_queue', JSON.stringify(queue));
    processTodoSyncQueue();
};

window.cancelAIScheduleAnalysis = function () {
    window.activeAIScheduleAnalysis = null;
    document.getElementById('sched-result-content').style.display = 'none';
    document.getElementById('sched-result-placeholder').style.display = 'flex';
    document.getElementById('sched-selected-variety').value = "";
    document.getElementById('sched-holiday-preset').value = "custom";
    document.getElementById('sched-holiday-date').value = "";
    document.getElementById('sched-days-before').value = "7";
    
    document.querySelectorAll('.sched-flower-pill-btn').forEach(btn => btn.classList.remove('active'));
};

window.renderAIScheduler = function () {
    const tableBody = document.getElementById('sched-saved-list-body');
    if (!tableBody) return;

    const schedTasks = todoCache.filter(t => t.category === 'Lập Lịch AI' && t.task.startsWith('[Cắt Cành]'));

    if (schedTasks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">
                    Chưa có lịch trình cắt cành nào được lưu.
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    schedTasks.forEach(t => {
        const info = parseSchedulerNote(t.note) || {};
        const variety = info.variety || "Ecuador";
        const holidayLabel = info.holidayLabel || "Lịch tự chọn";
        const holidayDateStr = info.holidayDateStr || "";
        const peakDateStr = info.peakDateStr || "";
        const baseCycle = info.baseCycle || 60;
        const totalCycle = info.totalCycle || 60;
        const seasonModifier = totalCycle - baseCycle;
        const cutDateStr = formatDate(t.deadline);
        const actualPeakDateStr = info.actualPeakDateStr || "--";

        let deviationStr = "--";
        if (info.actualPeakDateStr && info.actualPeakDateStr !== "--") {
            const actualDate = parseLocalDate(info.actualPeakDateStr);
            const peakDate = parseLocalDate(peakDateStr);
            if (actualDate && peakDate && !isNaN(actualDate.getTime()) && !isNaN(peakDate.getTime())) {
                const diffTime = actualDate.getTime() - peakDate.getTime();
                const deviationDays = Math.round(diffTime / (24 * 60 * 60 * 1000));
                const actualCycleDays = totalCycle + deviationDays;
                
                const actualBadge = `<span style="color: #334155; font-weight: 800; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; font-size: 0.75rem; margin-left: 6px; font-style: normal; vertical-align: middle;">thực tế: ${actualCycleDays} ngày</span>`;
                
                if (deviationDays > 0) {
                    deviationStr = `<span style="color: #d97706; font-weight: 700; vertical-align: middle;">+${deviationDays} ngày</span>${actualBadge}`;
                } else if (deviationDays < 0) {
                    deviationStr = `<span style="color: #3b82f6; font-weight: 700; vertical-align: middle;">-${Math.abs(deviationDays)} ngày</span>${actualBadge}`;
                } else {
                    deviationStr = `<span style="color: #10b981; font-weight: 700; vertical-align: middle;">Chuẩn xác</span>${actualBadge}`;
                }
            }
        }

        let actualPeakDisplay = actualPeakDateStr;
        if (actualPeakDateStr && actualPeakDateStr !== "--") {
            actualPeakDisplay = `<span style="color: #1e3a8a; font-weight: 800; background: #eff6ff; padding: 4px 8px; border-radius: 6px; border: 1px solid #bfdbfe; display: inline-block;">${actualPeakDateStr}</span>`;
        }

        html += `
            <tr id="sched-row-${t.id}" data-id="${t.id}" data-variety="${variety}" data-basecycle="${baseCycle}" data-seasonmodifier="${seasonModifier}" data-peakdate="${peakDateStr}" data-holidaydate="${holidayDateStr}" data-holidaylabel="${holidayLabel}" style="border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">
                <td data-label="Giống hoa" style="padding: 12px 10px; font-weight: 700; color: #1e293b;">${variety}</td>
                <td data-label="Dịp lễ" style="padding: 12px 10px; color: #475569;">${holidayLabel}</td>
                <td data-label="Ngày lễ" style="padding: 12px 10px; color: #475569;">${holidayDateStr}</td>
                <td class="sched-cut-date-col" data-label="Ngày cắt cành" style="padding: 12px 10px; font-weight: 700; color: #6366f1;">${cutDateStr}</td>
                <td data-label="Ngày rộ hoa" style="padding: 12px 10px; font-weight: 700; color: #10b981;">${peakDateStr}</td>
                <td class="sched-cycle-col" data-label="Chu kỳ dự kiến" style="padding: 12px 10px; color: #475569;">
                    <span class="cycle-display">
                        ${baseCycle} ngày <span style="font-size:0.75rem; color:#94a3b8; font-style:italic;">(dự kiến: ${totalCycle} ngày)</span>
                    </span>
                </td>
                <td class="sched-actual-date-col" data-label="Rộ thực tế" style="padding: 12px 10px; color: #475569; vertical-align: middle;">${actualPeakDisplay}</td>
                <td class="sched-deviation-col" data-label="Sai lệch" style="padding: 12px 10px;">${deviationStr}</td>
                <td data-label="Thao tác" style="padding: 12px 10px; text-align: right; white-space: nowrap;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-action btn-edit-inline" onclick="window.inlineEditAISchedule('${t.id}')" title="Sửa chu kỳ sinh trưởng tiêu chuẩn" style="background: rgba(99, 102, 241, 0.1); color: #4f46e5; border: none; padding: 6px; border-radius: 6px; cursor: pointer;">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn-action" onclick="window.deleteAISchedule('${t.id}')" title="Xóa lịch trình" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 6px; border-radius: 6px; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

    });

    tableBody.innerHTML = html;
};

window.deleteAISchedule = async function (id) {
    if (isRestricted()) return;
    if (!confirm("Bạn có chắc chắn muốn xóa lịch trình này? Tất cả công việc liên quan sẽ bị xóa.")) return;

    const task = todoCache.find(x => x.id === id);
    if (!task) return;

    const match = task.note ? task.note.match(/\[Mã Lịch AI:\s*(.*?)\]/) : null;
    const schedId = match ? match[1] : null;

    if (schedId) {
        const tasksToDelete = todoCache.filter(t => 
            t.category === 'Lập Lịch AI' && 
            t.note && 
            t.note.includes(`[Mã Lịch AI: ${schedId}]`)
        );
        const deleteIds = tasksToDelete.map(t => t.id);

        todoCache = todoCache.filter(t => !deleteIds.includes(t.id));
        localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));

        let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
        deleteIds.forEach(delId => {
            queue.push({ action: "delete_todo_task", id: delId, clientId: delId });
        });
        localStorage.setItem('todo_sync_queue', JSON.stringify(queue));
    } else {
        todoCache = todoCache.filter(t => t.id !== id);
        localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));

        let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
        queue.push({ action: "delete_todo_task", id: id, clientId: id });
        localStorage.setItem('todo_sync_queue', JSON.stringify(queue));
    }

    showToast("Đã xóa lịch trình thành công!", "success");
    window.renderAIScheduler();
    
    if (typeof renderActiveView === 'function') {
        renderActiveView();
    }
    processTodoSyncQueue();
};

window.inlineEditAISchedule = function (taskId) {
    const row = document.getElementById(`sched-row-${taskId}`);
    if (!row) return;

    const variety = row.getAttribute('data-variety');
    const baseCycle = parseInt(row.getAttribute('data-basecycle'));
    const seasonModifier = parseInt(row.getAttribute('data-seasonmodifier'));
    const peakDateStr = row.getAttribute('data-peakdate');
    const holidayDateStr = row.getAttribute('data-holidaydate');
    const holidayLabel = row.getAttribute('data-holidaylabel');
    const totalCycle = baseCycle + seasonModifier;

    const cycleCol = row.querySelector('.sched-cycle-col');
    const actualCol = row.querySelector('.sched-actual-date-col');
    const actionCol = row.cells[row.cells.length - 1];

    if (!cycleCol || !actualCol || !actionCol) return;

    if (!row.dataset.originalCycleHtml) {
        row.dataset.originalCycleHtml = cycleCol.innerHTML;
        row.dataset.originalActualHtml = actualCol.innerHTML;
        row.dataset.originalActionHtml = actionCol.innerHTML;
    }

    row.classList.add('inline-editing');

    cycleCol.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <input type="number" class="inline-edit-base-cycle input-modern" 
                value="${baseCycle}" min="1" max="200" 
                style="width: 60px; padding: 4px 6px; text-align: center; font-weight: 800; border: 1px solid #cbd5e1; border-radius: 6px; color: #6366f1;" 
                oninput="window.previewInlineEdit('${taskId}')">
            <span style="font-size: 0.85rem; color: #475569;">ngày</span>
            <span style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">
                (thực tế: <span class="inline-preview-total-cycle">${totalCycle}</span> ngày)
            </span>
        </div>
    `;

    // Render actual date input
    const originalActualText = actualCol.innerText.trim();
    const actualDateObj = originalActualText && originalActualText !== '--' ? parseLocalDate(originalActualText) : null;
    const actualDateIso = actualDateObj ? formatDateString(actualDateObj, 'YYYY-MM-DD') : '';

    actualCol.innerHTML = `
        <input type="date" class="inline-edit-actual-date input-modern" 
            value="${actualDateIso}" 
            style="padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 6px; color: #475569; font-size: 0.85rem; width: 130px;"
            oninput="window.previewInlineEdit('${taskId}')">
    `;

    actionCol.innerHTML = `
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn-action" onclick="window.saveInlineAISchedule('${taskId}')" title="Lưu thay đổi" 
                style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: none; padding: 6px; border-radius: 6px; cursor: pointer;">
                <i class="fa-solid fa-check"></i>
            </button>
            <button class="btn-action" onclick="window.renderAIScheduler()" title="Hủy" 
                style="background: rgba(100, 116, 139, 0.1); color: #64748b; border: none; padding: 6px; border-radius: 6px; cursor: pointer;">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;
};

window.previewInlineEdit = function (taskId) {
    const row = document.getElementById(`sched-row-${taskId}`);
    if (!row) return;

    const seasonModifier = parseInt(row.getAttribute('data-seasonmodifier'));
    const peakDateStr = row.getAttribute('data-peakdate');
    const holidayLabel = row.getAttribute('data-holidaylabel');
    const isForward = holidayLabel === 'Tính xuôi từ ngày hạ cành';

    const baseInput = row.querySelector('.inline-edit-base-cycle');
    if (!baseInput) return;

    let newBase = parseInt(baseInput.value);
    if (isNaN(newBase) || newBase <= 0) {
        newBase = parseInt(row.getAttribute('data-basecycle'));
    }

    const newTotal = newBase + seasonModifier;

    const totalPreview = row.querySelector('.inline-preview-total-cycle');
    if (totalPreview) {
        totalPreview.innerText = newTotal;
    }

    let cutDate, peakDate;
    if (isForward) {
        // Forward mode: Cut date is fixed, peak date changes
        const cutDateCol = row.querySelector('.sched-cut-date-col');
        const cutDateStr = cutDateCol.dataset.originalVal || cutDateCol.innerText;
        if (!cutDateCol.dataset.originalVal) {
            cutDateCol.dataset.originalVal = cutDateStr;
        }
        cutDate = parseLocalDate(cutDateStr);
        peakDate = new Date(cutDate.getTime() + newTotal * 24 * 60 * 60 * 1000);
        
        const peakDateCell = row.querySelector('[data-label="Ngày rộ hoa"]');
        if (peakDateCell) {
            peakDateCell.innerText = formatDateString(peakDate, 'DD/MM/YYYY');
        }
    } else {
        // Backward mode: Peak date is fixed, cut date changes
        const cutDateCol = row.querySelector('.sched-cut-date-col');
        if (cutDateCol) {
            peakDate = parseLocalDate(peakDateStr);
            cutDate = new Date(peakDate.getTime() - (newTotal * 24 * 60 * 60 * 1000));
            cutDateCol.innerText = formatDateString(cutDate, 'DD/MM/YYYY');
        }
    }

    // Preview deviation
    const actualInput = row.querySelector('.inline-edit-actual-date');
    const deviationCell = row.querySelector('.sched-deviation-col') || row.querySelector('[data-label="Sai lệch"]');
    if (deviationCell) {
        if (actualInput && actualInput.value) {
            const actualDate = parseLocalDate(actualInput.value);
            if (actualDate && peakDate && !isNaN(actualDate.getTime()) && !isNaN(peakDate.getTime())) {
                const diffTime = actualDate.getTime() - peakDate.getTime();
                const deviationDays = Math.round(diffTime / (24 * 60 * 60 * 1000));
                const actualCycleDays = newTotal + deviationDays;
                if (deviationDays > 0) {
                    deviationCell.innerHTML = `<span style="color: #d97706; font-weight: 700;">+${deviationDays} ngày</span> <span style="font-size:0.75rem; color:#94a3b8; font-weight: normal; font-style:italic;">(thực tế: ${actualCycleDays} ngày)</span>`;
                } else if (deviationDays < 0) {
                    deviationCell.innerHTML = `<span style="color: #3b82f6; font-weight: 700;">-${Math.abs(deviationDays)} ngày</span> <span style="font-size:0.75rem; color:#94a3b8; font-weight: normal; font-style:italic;">(thực tế: ${actualCycleDays} ngày)</span>`;
                } else {
                    deviationCell.innerHTML = `<span style="color: #10b981; font-weight: 700;">Chuẩn xác</span> <span style="font-size:0.75rem; color:#94a3b8; font-weight: normal; font-style:italic;">(thực tế: ${actualCycleDays} ngày)</span>`;
                }
            } else {
                deviationCell.innerText = "--";
            }
        } else {
            deviationCell.innerText = "--";
        }
    }
};

window.saveInlineAISchedule = async function (taskId) {
    if (isRestricted()) return;
    const row = document.getElementById(`sched-row-${taskId}`);
    if (!row) return;

    const baseInput = row.querySelector('.inline-edit-base-cycle');
    if (!baseInput) return;

    const newBase = parseInt(baseInput.value);
    if (isNaN(newBase) || newBase <= 0) {
        alert("Vui lòng nhập chu kỳ sinh trưởng tiêu chuẩn hợp lệ.");
        return;
    }

    const variety = row.getAttribute('data-variety');
    const seasonModifier = parseInt(row.getAttribute('data-seasonmodifier'));
    const peakDateStr = row.getAttribute('data-peakdate');
    const holidayDateStr = row.getAttribute('data-holidaydate');
    const holidayLabel = row.getAttribute('data-holidaylabel');
    const isForward = holidayLabel === 'Tính xuôi từ ngày hạ cành';

    const newTotal = newBase + seasonModifier;

    // Get actual date input value
    const actualInput = row.querySelector('.inline-edit-actual-date');
    let actualDateStr = "";
    if (actualInput && actualInput.value) {
        const actualParsed = parseLocalDate(actualInput.value);
        if (actualParsed && !isNaN(actualParsed.getTime())) {
            actualDateStr = formatDateString(actualParsed, 'DD/MM/YYYY');
        }
    }

    const task = todoCache.find(x => x.id === taskId);
    if (!task) {
        alert("Không tìm thấy công việc tương ứng.");
        return;
    }

    const match = task.note ? task.note.match(/\[Mã Lịch AI:\s*(.*?)\]/) : null;
    const schedId = match ? match[1] : ("AI_SCHED_" + Date.now());

    let finalCutDate, finalPeakDate;

    if (isForward) {
        // Forward mode: Cut date is fixed (represented by task deadline), peak date is recalculated
        finalCutDate = parseLocalDate(task.deadline);
        finalPeakDate = new Date(finalCutDate.getTime() + newTotal * 24 * 60 * 60 * 1000);
        
        task.deadline = formatDateString(finalCutDate, 'YYYY-MM-DD');
        task.deadlineDate = finalCutDate;
    } else {
        // Backward mode: Peak date is fixed, cut date is recalculated
        finalPeakDate = parseLocalDate(peakDateStr);
        finalCutDate = new Date(finalPeakDate.getTime() - (newTotal * 24 * 60 * 60 * 1000));
        
        task.deadline = formatDateString(finalCutDate, 'YYYY-MM-DD');
        task.deadlineDate = finalCutDate;
    }

    // Now update task note
    let newNote = `[AI Scheduler] Giống: ${variety} | Lễ: ${holidayLabel} | Ngày lễ: ${holidayDateStr} | Chu kỳ tiêu chuẩn: ${newBase} | Tổng chu kỳ: ${newTotal} | Ngày rộ: ${formatDateString(finalPeakDate, 'DD/MM/YYYY')}`;
    if (actualDateStr) {
        newNote += ` | Ngày rộ thực tế: ${actualDateStr}`;
    }
    newNote += ` | [Mã Lịch AI: ${schedId}]`;
    task.note = newNote;

    // Update associated peak task ([Hoa Rộ])
    const peakTask = todoCache.find(t => 
        t.category === 'Lập Lịch AI' && 
        t.task.startsWith('[Hoa Rộ]') && 
        t.note && 
        t.note.includes(`[Mã Lịch AI: ${schedId}]`)
    );

    if (peakTask) {
        peakTask.deadline = formatDateString(finalPeakDate, 'YYYY-MM-DD');
        peakTask.deadlineDate = finalPeakDate;
        
        let peakNote = "";
        if (isForward) {
            peakNote = `Thời điểm hoa ${variety} dự kiến nở rộ sau khi hạ cành ngày ${formatDateString(finalCutDate, 'DD/MM/YYYY')}.`;
            if (actualDateStr) {
                const actualDateObj = parseLocalDate(actualDateStr);
                const devDays = Math.round((actualDateObj.getTime() - finalPeakDate.getTime()) / (24 * 60 * 60 * 1000));
                let devText = devDays === 0 ? "Khớp hoàn hảo!" : (devDays > 0 ? `Trễ ${devDays} ngày` : `Sớm ${Math.abs(devDays)} ngày`);
                peakNote += `\nNgày rộ thực tế: ${actualDateStr}\nSai lệch dự báo: ${devText}`;
            }
            peakNote += `\n[Mã Lịch AI: ${schedId}]`;
        } else {
            peakNote = `Thời điểm hoa ${variety} đạt độ nở rộ phục vụ ${holidayLabel}.\nThu hoạch đóng gói gửi vựa.\n[Mã Lịch AI: ${schedId}]`;
        }
        peakTask.note = peakNote;
    }

    localStorage.setItem('todo_cache_v2', JSON.stringify(todoCache));

    showToast("Đã cập nhật lịch trình thành công!", "success");
    window.renderAIScheduler();

    if (typeof renderActiveView === 'function') {
        renderActiveView();
    }

    let queue = JSON.parse(localStorage.getItem('todo_sync_queue') || '[]');
    queue.push({ action: "save_todo_task", data: { ...task }, clientId: taskId });
    if (peakTask) {
        queue.push({ action: "save_todo_task", data: { ...peakTask }, clientId: peakTask.id });
    }
    localStorage.setItem('todo_sync_queue', JSON.stringify(queue));
    processTodoSyncQueue();
};

// Bind elements
document.addEventListener('DOMContentLoaded', () => {
    const bindReset = () => {
        const btnReset = document.getElementById('btn-reset-sched');
        if (btnReset && !btnReset.dataset.resetBound) {
            btnReset.dataset.resetBound = 'true';
            btnReset.addEventListener('click', () => {
                window.cancelAIScheduleAnalysis();
            });
        }
    };
    bindReset();
    setTimeout(bindReset, 200);
});



