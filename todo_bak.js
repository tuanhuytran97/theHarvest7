let todoCache = [];
let todoCharts = {};

document.addEventListener('DOMContentLoaded', () => {
    const menuTodo = document.getElementById('menu-todo');
    const mobileMenuTodo = document.querySelector('.mobile-nav-item[data-view="todo"]');
    const viewTodo = document.getElementById('view-todo');

    // Main Menu routing
    const openTodoView = (e) => {
        if(e) e.preventDefault();
        document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');
        document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.mobile-nav-item').forEach(a => a.classList.remove('active'));
        
        viewTodo.style.display = 'block';
        if(menuTodo) menuTodo.classList.add('active');
        if(mobileMenuTodo) mobileMenuTodo.classList.add('active');
        
        loadTodoData();
    };

    if (menuTodo) menuTodo.addEventListener('click', openTodoView);
    if (mobileMenuTodo) mobileMenuTodo.addEventListener('click', openTodoView);

    // Sub-navigation Routing
    document.querySelectorAll('.todo-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.todo-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.todo-subview').forEach(v => v.style.display = 'none');
            
            const targetId = e.currentTarget.getAttribute('data-target');
            e.currentTarget.classList.add('active');
            document.getElementById(targetId).style.display = 'block';

            if(targetId === 'todo-subview-calendar') renderCalendar();
            if(targetId === 'todo-subview-dashboard') renderDashboard();
        });
    });

    // Refresh
    document.getElementById('refresh-todo-btn')?.addEventListener('click', () => loadTodoData(true));

    // Modal Add/Edit
    const modal = document.getElementById('todo-modal');
    document.getElementById('add-new-task-btn')?.addEventListener('click', () => {
        resetTodoModal();
        document.getElementById('todo-modal-title').innerText = "Th├¬m C├┤ng Viß╗çc Mß╗¢i";
        modal.style.display = 'flex';
    });

    document.getElementById('close-todo-modal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('btn-save-todo')?.addEventListener('click', async () => {
        await saveTodoTask();
    });

    // Calendar Controls
    document.getElementById('cal-month-select')?.addEventListener('change', renderCalendar);
    document.getElementById('cal-year-input')?.addEventListener('change', renderCalendar);

    // Set initial calendar controls to current month
    const now = new Date();
    const monthSel = document.getElementById('cal-month-select');
    const yearInp = document.getElementById('cal-year-input');
    if (monthSel) monthSel.value = now.getMonth();
    if (yearInp) yearInp.value = now.getFullYear();
});

// API Wrapper
async function callTodoApi(action, extraParams = {}) {
    let token = localStorage.getItem('farm_token');
    if (!token) token = "huytran97";
    
    if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL) {
        throw new Error("Missing Web App URL");
    }

    const payload = { action: action, token: token, ...extraParams };
    const res = await fetch(CONFIG.WEB_APP_URL, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
    });
    return await res.json();
}

// Data Fetching
async function loadTodoData(forceRefresh = false) {
    const tableBody = document.getElementById('todo-table-body');
    if (forceRefresh && tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 2rem;">─Éang tß║úi dß╗» liß╗çu...</td></tr>';
    } else if (todoCache.length > 0 && tableBody) {
        renderTable();
    }

    try {
        const res = await callTodoApi("get_todo_data");
        if (res.status === "success") {
            const data = res.data; // ["ID", "Task", "Deadline", "Priority", "Status", "Category", "CreatedAt"]
            const parsedTodos = [];
            
            if (data && data.length > 1) {
                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    parsedTodos.push({
                        id: row[0],
                        task: row[1],
                        deadline: row[2],
                        priority: row[3],
                        status: row[4],
                        category: row[5],
                        createdAt: row[6]
                    });
                }
            }
            todoCache = parsedTodos;
            
            // Re-render active view
            const activeNav = document.querySelector('.todo-nav-btn.active');
            if (activeNav) {
                const targetId = activeNav.getAttribute('data-target');
                if(targetId === 'todo-subview-list') renderTable();
                if(targetId === 'todo-subview-calendar') renderCalendar();
                if(targetId === 'todo-subview-dashboard') renderDashboard();
            } else {
                renderTable();
            }

            if (forceRefresh) showToast("─É├ú l├ám mß╗¢i dß╗» liß╗çu", "success");
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        console.error("Lß╗ùi tß║úi To-Do:", err);
        if (forceRefresh) showToast("Lß╗ùi tß║úi To-Do: " + err.message, "error");
    }
}

// 1. RENDER TABLE VIEW
function renderTable() {
    const tableBody = document.getElementById('todo-table-body');
    if (!tableBody) return;

    if (todoCache.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 2rem;">Ch╞░a c├│ c├┤ng viß╗çc n├áo.</td></tr>';
        return;
    }

    // Sort by Deadline (asc), then created date (desc)
    const sortedTodos = [...todoCache].sort((a, b) => {
        const dA = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const dB = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        if (dA.getTime() !== dB.getTime()) return dA - dB;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    tableBody.innerHTML = '';
    const now = new Date();
    now.setHours(0,0,0,0);

    sortedTodos.forEach(task => {
        const tr = document.createElement('tr');
        
        // Calculate Days Left
        let daysLeftStr = "-";
        let daysLeftVal = 0;
        if (task.deadline) {
            const dlDate = new Date(task.deadline);
            dlDate.setHours(0,0,0,0);
            const diffTime = dlDate - now;
            daysLeftVal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (task.status === 'Ho├án th├ánh' || task.status === 'Hß╗ºy bß╗Å') {
                daysLeftStr = "-";
            } else if (daysLeftVal < 0) {
                daysLeftStr = `<span style="color: #ef4444; font-weight: bold;">Trß╗à ${Math.abs(daysLeftVal)} ng├áy</span>`;
            } else if (daysLeftVal === 0) {
                daysLeftStr = `<span style="color: #f59e0b; font-weight: bold;">H├┤m nay</span>`;
            } else {
                daysLeftStr = `C├▓n ${daysLeftVal} ng├áy`;
            }
        }

        // Badges HTML
        const priorityClass = getPriorityBadgeClass(task.priority);
        const statusClass = getStatusBadgeClass(task.status);
        const dlStrRaw = task.deadline ? formatDateCustom(new Date(task.deadline)) : "-";
        
        const isCompleted = task.status === 'Ho├án th├ánh' || task.status === 'Hß╗ºy bß╗Å';
        const taskNameStyle = isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : '';

        tr.innerHTML = `
            <td style="font-weight: 600; color: #1e293b; ${taskNameStyle}">${escapeHtml(task.task)}</td>
            <td>${dlStrRaw}</td>
            <td>${daysLeftStr}</td>
            <td><span class="badge ${priorityClass}">${escapeHtml(task.priority)}</span></td>
            <td>
                <select class="status-quick-select badge ${statusClass}" style="border: none; outline: none; cursor: pointer; font-family: inherit; -webkit-appearance: none; padding-right: 20px;">
                    <option value="Ch╞░a bß║»t ─æß║ºu" ${task.status === 'Ch╞░a bß║»t ─æß║ºu'?'selected':''}>Ch╞░a bß║»t ─æß║ºu</option>
                    <option value="─Éang thß╗▒c hiß╗çn" ${task.status === '─Éang thß╗▒c hiß╗çn'?'selected':''}>─Éang thß╗▒c hiß╗çn</option>
                    <option value="─Éang chß╗¥ duyß╗çt" ${task.status === '─Éang chß╗¥ duyß╗çt'?'selected':''}>─Éang chß╗¥ duyß╗çt</option>
                    <option value="Ho├án th├ánh" ${task.status === 'Ho├án th├ánh'?'selected':''}>Ho├án th├ánh</option>
                    <option value="Tß║ím dß╗½ng" ${task.status === 'Tß║ím dß╗½ng'?'selected':''}>Tß║ím dß╗½ng</option>
                    <option value="Hß╗ºy bß╗Å" ${task.status === 'Hß╗ºy bß╗Å'?'selected':''}>Hß╗ºy bß╗Å</option>
                </select>
            </td>
            <td>${escapeHtml(task.category || 'Chung')}</td>
            <td>
                <button class="btn-action-icon edit" onclick="editTodoTask('${task.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action-icon delete" onclick="deleteTodoTask('${task.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;

        // Handle Quick Status Change
        const selectEl = tr.querySelector('.status-quick-select');
        selectEl.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            selectEl.className = `status-quick-select badge ${getStatusBadgeClass(newStatus)}`;
            
            // Optimistic update
            const idx = todoCache.findIndex(t => t.id === task.id);
            if (idx > -1) todoCache[idx].status = newStatus;
            
            // Re-render to update strikethrough/days left visually
            renderTable(); 

            try {
                await callTodoApi("save_todo_task", { 
                    data: { ...task, status: newStatus } 
                });
            } catch (err) {
                console.error(err);
                showToast("Lß╗ùi l╞░u trß║íng th├íi", "error");
                loadTodoData(true);
            }
        });

        tableBody.appendChild(tr);
    });
}

// 2. RENDER CALENDAR VIEW
function renderCalendar() {
    const month = parseInt(document.getElementById('cal-month-select').value);
    const year = parseInt(document.getElementById('cal-year-input').value);
    const grid = document.getElementById('todo-calendar-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust starting day of week to Monday (1 = Mon, 0 = Sun -> 7)
    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7;
    
    // Add empty slots for previous month
    for (let i = 1; i < startDayOfWeek; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day other-month';
        grid.appendChild(div);
    }

    const today = new Date();
    let monthTotal = 0;
    let monthCompleted = 0;

    // Days in current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
        if (isToday) div.classList.add('today');

        div.innerHTML = `<div class="calendar-day-number">${d}</div>`;

        // Find tasks for this day
        const dayTasks = todoCache.filter(t => {
            if (!t.deadline) return false;
            const dl = new Date(t.deadline);
            return dl.getDate() === d && dl.getMonth() === month && dl.getFullYear() === year;
        });

        dayTasks.forEach(task => {
            monthTotal++;
            if (task.status === 'Ho├án th├ánh') monthCompleted++;

            const taskEl = document.createElement('div');
            taskEl.className = `cal-task-item ${task.status === 'Ho├án th├ánh' ? 'completed' : ''}`;
            
            // Color based on priority
            if (task.priority === 'Khß║⌐n cß║Ñp') taskEl.style.background = '#fecaca';
            else if (task.priority === 'Cao') taskEl.style.background = '#fed7aa';
            else if (task.priority === 'Thß║Ñp') taskEl.style.background = '#e0f2fe';
            else taskEl.style.background = '#f1f5f9';

            taskEl.innerText = task.task;
            taskEl.title = `${task.task} (${task.status})`;
            taskEl.onclick = () => editTodoTask(task.id);
            div.appendChild(taskEl);
        });

        grid.appendChild(div);
    }

    // Update Summary
    document.getElementById('cal-total-tasks').innerText = monthTotal;
    document.getElementById('cal-completed-tasks').innerText = monthCompleted;
}

// 3. RENDER DASHBOARD VIEW
function renderDashboard() {
    const now = new Date();
    
    // Metrics
    let total = todoCache.length;
    let completed = 0;
    let dueWeek = 0;
    let dueMonth = 0;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const statusCounts = {};
    const priorityCounts = {};
    const monthData = Array(12).fill().map(()=>({ todo: 0, completed: 0 }));

    todoCache.forEach(task => {
        if (task.status === 'Ho├án th├ánh') completed++;
        
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;

        if (task.deadline) {
            const dl = new Date(task.deadline);
            // Due this week
            if (dl >= startOfWeek && dl <= endOfWeek && task.status !== 'Ho├án th├ánh' && task.status !== 'Hß╗ºy bß╗Å') {
                dueWeek++;
            }
            // Due this month
            if (dl.getMonth() === now.getMonth() && dl.getFullYear() === now.getFullYear() && task.status !== 'Ho├án th├ánh' && task.status !== 'Hß╗ºy bß╗Å') {
                dueMonth++;
            }
            // Monthly Progress
            if (dl.getFullYear() === now.getFullYear()) {
                const mIdx = dl.getMonth();
                if (task.status === 'Ho├án th├ánh') monthData[mIdx].completed++;
                else monthData[mIdx].todo++;
            }
        }
    });

    document.getElementById('todo-dash-total').innerText = total;
    document.getElementById('todo-dash-completed').innerText = completed;
    document.getElementById('todo-dash-due-week').innerText = dueWeek;
    document.getElementById('todo-dash-due-month').innerText = dueMonth;

    // Render Charts
    renderChartJS('todoStatusChart', 'pie', Object.keys(statusCounts), Object.values(statusCounts), ['#f1f5f9', '#e0e7ff', '#ffedd5', '#dcfce7', '#cbd5e1', '#fee2e2']);
    renderChartJS('todoPriorityChart', 'doughnut', Object.keys(priorityCounts), Object.values(priorityCounts), ['#e0f2fe', '#fef08a', '#fed7aa', '#fecaca']);
    
    renderProgressChart('todoProgressChart', monthData);
}

function renderChartJS(canvasId, type, labels, data, colors) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    if (todoCharts[canvasId]) {
        todoCharts[canvasId].destroy();
    }

    todoCharts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function renderProgressChart(canvasId, monthData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (todoCharts[canvasId]) todoCharts[canvasId].destroy();

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todoArr = monthData.map(m => m.todo);
    const compArr = monthData.map(m => m.completed);

    todoCharts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'To do',
                    data: todoArr,
                    backgroundColor: '#e2e8f0'
                },
                {
                    label: 'Completed',
                    data: compArr,
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}


// MODAL & CRUD HANDLERS
function resetTodoModal() {
    document.getElementById('todo-input-id').value = "";
    document.getElementById('todo-input-task').value = "";
    document.getElementById('todo-input-deadline').value = "";
    document.getElementById('todo-input-category').value = "";
    document.getElementById('todo-input-priority').value = "Trung b├¼nh";
    document.getElementById('todo-input-status').value = "Ch╞░a bß║»t ─æß║ºu";
}

window.editTodoTask = function(taskId) {
    const task = todoCache.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('todo-modal-title').innerText = "Chß╗ënh Sß╗¡a C├┤ng Viß╗çc";
    document.getElementById('todo-input-id').value = task.id;
    document.getElementById('todo-input-task').value = task.task;
    
    // Format YYYY-MM-DD for input[type=date]
    if (task.deadline) {
        const d = new Date(task.deadline);
        if(!isNaN(d.getTime())) {
            document.getElementById('todo-input-deadline').value = d.toISOString().split('T')[0];
        }
    } else {
        document.getElementById('todo-input-deadline').value = "";
    }
    
    document.getElementById('todo-input-category').value = task.category || "";
    document.getElementById('todo-input-priority').value = task.priority || "Trung b├¼nh";
    document.getElementById('todo-input-status').value = task.status || "Ch╞░a bß║»t ─æß║ºu";

    document.getElementById('todo-modal').style.display = 'flex';
};

window.deleteTodoTask = async function(taskId) {
    if(!confirm('Bß║ín c├│ chß║»c chß║»n muß╗æn x├│a c├┤ng viß╗çc n├áy?')) return;
    
    // Optimistic delete
    todoCache = todoCache.filter(t => t.id !== taskId);
    renderTable();

    try {
        await callTodoApi("delete_todo_task", { id: taskId });
        showToast("─É├ú x├│a c├┤ng viß╗çc", "success");
    } catch(err) {
        console.error(err);
        showToast("Lß╗ùi x├│a c├┤ng viß╗çc", "error");
        loadTodoData(true); // Revert
    }
};

async function saveTodoTask() {
    const id = document.getElementById('todo-input-id').value;
    const taskText = document.getElementById('todo-input-task').value.trim();
    const deadline = document.getElementById('todo-input-deadline').value;
    const category = document.getElementById('todo-input-category').value.trim();
    const priority = document.getElementById('todo-input-priority').value;
    const status = document.getElementById('todo-input-status').value;

    if (!taskText) {
        showToast("Vui l├▓ng nhß║¡p t├¬n c├┤ng viß╗çc", "warning");
        return;
    }

    const taskObj = {
        id: id || "",
        task: taskText,
        deadline: deadline || "",
        category: category || "",
        priority: priority,
        status: status
    };

    const btn = document.getElementById('btn-save-todo');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ─Éang l╞░u...';
    btn.disabled = true;

    try {
        const res = await callTodoApi("save_todo_task", { data: taskObj });
        if (res.status !== "success") throw new Error(res.message);
        
        document.getElementById('todo-modal').style.display = 'none';
        showToast("─É├ú l╞░u c├┤ng viß╗çc th├ánh c├┤ng!", "success");
        loadTodoData(false); // Reload silently
    } catch (err) {
        showToast("Lß╗ùi l╞░u dß╗» liß╗çu: " + err.message, "error");
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// HELPERS
function getPriorityBadgeClass(p) {
    if (p === 'Khß║⌐n cß║Ñp') return 'badge-priority-urgent';
    if (p === 'Cao') return 'badge-priority-high';
    if (p === 'Trung b├¼nh') return 'badge-priority-medium';
    return 'badge-priority-low';
}

function getStatusBadgeClass(s) {
    if (s === '─Éang thß╗▒c hiß╗çn') return 'badge-status-inprogress';
    if (s === 'Ho├án th├ánh') return 'badge-status-completed';
    if (s === 'Hß╗ºy bß╗Å') return 'badge-status-cancelled';
    if (s === '─Éang chß╗¥ duyß╗çt') return 'badge-status-waiting';
    return 'badge-status-notstarted';
}

function formatDateCustom(d) {
    if (!d || isNaN(d.getTime())) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
