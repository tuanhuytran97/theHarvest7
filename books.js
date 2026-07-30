/**
 * Books Tracker - Tủ Sách Tinh Hoa Logic Module
 * Standalone book notes and summaries management for theHarvest7
 */

let booksCache = [];
let currentBookDetails = null;

// Mock data showcase for new installations
const MOCK_BOOKS = [
    {
        id: "BK_mock_1",
        title: "Đắc Nhân Tâm",
        author: "Dale Carnegie",
        category: "Phát triển bản thân",
        status: "Đã đọc xong",
        rating: 5,
        progress: 100,
        summary: "Cuốn sách nghệ thuật ứng xử kinh điển dạy cách hiểu lòng người, tạo thiện cảm và thuyết phục người khác một cách tự nhiên và chân thành.",
        contentDirectory: "### PHẦN I: NGHỆ THUẬT ỨNG XỬ CĂN BẢN\n- Chương 1: Muốn lấy mật thì đừng phá tổ ong\n- Chương 2: Bí mật lớn nhất trong phép ứng xử\n- Chương 3: Ai làm được điều này sẽ có cả thế giới\n\n### PHẦN II: 6 CÁCH TẠO THIỆN CẢM\n- Chương 1: Thành thật quan tâm đến người khác\n- Chương 2: Cách đơn giản để tạo ấn tượng tốt đẹp",
        lessons: "- Hãy thành thật quan tâm đến người khác.\n- Luôn mỉm cười và lắng nghe tích cực.\n- Gọi tên người khác một cách trân trọng.\n- Tránh chỉ trích hay oán trách một cách gay gắt.",
        quotes: "Cách duy nhất để có thể đạt được hiệu quả tốt nhất trong một cuộc tranh luận là tránh né nó.\nĐể có được thiện cảm của một ai đó, hãy để họ tự nói về bản thân họ nhiều hơn.",
        actions: JSON.stringify([
            { text: "Lắng nghe đồng nghiệp chia sẻ trong buổi họp tiếp theo mà không ngắt lời", completed: true },
            { text: "Mỉm cười thân thiện và gửi lời chào buổi sáng tới mọi người", completed: true },
            { text: "Khen ngợi chân thành một ý tưởng của cấp dưới", completed: false }
        ]),
        createdAt: "25/06/2026 08:00:00",
        coverUrl: "https://books.google.com/books/content?id=bOaWDwAAQBAJ&printsec=frontcover&img=1&zoom=1"
    },
    {
        id: "BK_mock_2",
        title: "Cha Giàu Cha Nghèo (Rich Dad Poor Dad)",
        author: "Robert Kiyosaki",
        category: "Đầu tư",
        status: "Đang đọc",
        rating: 4,
        progress: 60,
        summary: "Sách định hình lại tư duy tài chính cá nhân, chỉ ra sự khác biệt cơ bản giữa tài sản và tiêu sản, và cách bắt tiền làm việc cho mình thay vì làm việc vì tiền.",
        contentDirectory: "### PHẦN I: BÀI HỌC\n- Chương 1: Người giàu không làm việc vì tiền\n- Chương 2: Tại sao phải dạy về tài chính?\n- Chương 3: Hãy nghĩ đến việc kinh doanh của mình\n- Chương 4: Liên đoàn - Bí mật lớn nhất của người giàu",
        lessons: "- Người giàu mua tài sản, người nghèo mua tiêu sản.\n- Tư duy tài chính quan trọng hơn số tiền kiếm được.\n- Học cách quản lý rủi ro thay vì trốn tránh nó.\n- Bắt tiền làm việc cho mình thay vì làm việc chăm chỉ vì tiền.",
        quotes: "Người nghèo làm việc vì tiền. Người giàu bắt tiền làm việc cho mình.\nTài sản là thứ bỏ tiền vào túi bạn. Tiêu sản là thứ rút tiền khỏi túi bạn.",
        actions: JSON.stringify([
            { text: "Lập bảng cân đối thu chi cá nhân hàng tháng", completed: true },
            { text: "Trích ra 10% thu nhập chuyển vào quỹ tích lũy đầu tư", completed: false },
            { text: "Tìm hiểu 1 lớp học cơ bản về chứng khoán hoặc bất động sản", completed: false }
        ]),
        createdAt: "25/06/2026 08:15:00",
        coverUrl: "https://books.google.com/books/content?id=j5c2DwAAQBAJ&printsec=frontcover&img=1&zoom=1"
    },
    {
        id: "BK_mock_3",
        title: "Đế Chế Của Những Thói Quen (The Power of Habit)",
        author: "Charles Duhigg",
        category: "Phát triển bản thân",
        status: "Muốn đọc",
        rating: 0,
        progress: 0,
        summary: "Giải thích cơ chế hoạt động của thói quen cá nhân và tổ chức thông qua 'Vòng lặp thói quen' (Gợi ý - Hành động - Phần thưởng) và cách thay đổi chúng.",
        contentDirectory: "### PHẦN I: THÓI QUEN CỦA CÁ NHÂN\n- Chương 1: Vòng lặp thói quen - Hoạt động như thế nào?\n- Chương 2: Bộ não thèm khát - Cách tạo thói quen mới\n- Chương 3: Quy tắc vàng để thay đổi thói quen",
        lessons: "- Mọi thói quen đều có vòng lặp 3 bước: Gợi ý, Hành động và Phần thưởng.\n- Không thể xóa bỏ thói quen cũ, chỉ có thể thay thế nó bằng thói quen mới tốt hơn.\n- Tập trung vào các thói quen then chốt (Keystone Habits) tạo hiệu ứng domino tích cực.",
        quotes: "Nếu bạn tin rằng bạn có thể thay đổi - nếu bạn làm điều đó thành một thói quen - sự thay đổi đó sẽ trở thành sự thật.",
        actions: JSON.stringify([
            { text: "Viết ra vòng lặp của thói quen lướt điện thoại vô thức ban đêm", completed: false },
            { text: "Thay thế lướt điện thoại bằng việc đọc 2 trang sách trước khi đi ngủ", completed: false }
        ]),
        createdAt: "25/06/2026 08:30:00",
        coverUrl: "https://books.google.com/books/content?id=SZ7pAgAAQBAJ&printsec=frontcover&img=1&zoom=1"
    }
];

// Helper to call backend API
async function callBooksApi(action, extraParams = {}) {
    if (typeof callApi === 'function') {
        return await callApi(action, extraParams);
    }
    
    if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL.includes("YOUR_WEB_APP_URL_HERE")) {
        return { status: "error", message: "Config missing" };
    }
    
    const token = localStorage.getItem('farm_token') || "huytran97";
    try {
        const res = await fetch(CONFIG.WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action, token, ...extraParams })
        });
        return await res.json();
    } catch (e) {
        console.error("Fetch Books API Error:", e);
        return { status: "error", message: e.message };
    }
}

// 1. INITIALIZE BOOKS TAB
function initBooksTab() {
    // Setup listeners if not already attached
    const initialized = document.getElementById('view-books').dataset.initialized;
    if (initialized) {
        renderBooks();
        return;
    }
    
    // Add Add Book Button listener
    document.getElementById('add-book-btn')?.addEventListener('click', () => {
        openBookFormModal();
    });
    
    // Search input listener
    document.getElementById('book-search-input')?.addEventListener('input', renderBooks);
    
    // Title & Author blur listeners for auto cover fetch
    document.getElementById('book-form-title')?.addEventListener('blur', triggerAutoCoverFetch);
    document.getElementById('book-form-author')?.addEventListener('blur', triggerAutoCoverFetch);
    
    // Status dropdown listener
    document.getElementById('book-filter-status')?.addEventListener('change', renderBooks);
    
    // Filter pills listeners
    document.querySelectorAll('.book-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.book-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderBooks();
        });
    });

    // Rating filter listener
    document.getElementById('book-filter-rating')?.addEventListener('change', renderBooks);
    
    // Form submission listener
    document.getElementById('book-form')?.addEventListener('submit', saveBook);
    
    // Autofill AI button listener
    document.getElementById('btn-autofill-book-ai')?.addEventListener('click', generateBookInsightsAI);

    // Toggle AI mode Search
    document.getElementById('btn-ai-mode-search')?.addEventListener('click', () => {
        const btnSearch = document.getElementById('btn-ai-mode-search');
        const btnExtract = document.getElementById('btn-ai-mode-extract');
        const searchDiv = document.getElementById('ai-container-search');
        const extractDiv = document.getElementById('ai-container-extract');
        
        if (btnSearch && btnExtract && searchDiv && extractDiv) {
            btnSearch.classList.add('active');
            btnSearch.style.background = 'white';
            btnSearch.style.color = '#4338ca';
            
            btnExtract.classList.remove('active');
            btnExtract.style.background = 'transparent';
            btnExtract.style.color = '#64748b';
            
            searchDiv.style.display = 'flex';
            extractDiv.style.display = 'none';
        }
    });
    
    // Toggle AI mode Extract
    document.getElementById('btn-ai-mode-extract')?.addEventListener('click', () => {
        const btnSearch = document.getElementById('btn-ai-mode-search');
        const btnExtract = document.getElementById('btn-ai-mode-extract');
        const searchDiv = document.getElementById('ai-container-search');
        const extractDiv = document.getElementById('ai-container-extract');
        
        if (btnSearch && btnExtract && searchDiv && extractDiv) {
            btnExtract.classList.add('active');
            btnExtract.style.background = 'white';
            btnExtract.style.color = '#4338ca';
            
            btnSearch.classList.remove('active');
            btnSearch.style.background = 'transparent';
            btnSearch.style.color = '#64748b';
            
            extractDiv.style.display = 'flex';
            searchDiv.style.display = 'none';
        }
    });

    // Extract book insights from raw document input using AI
    document.getElementById('btn-extract-book-ai')?.addEventListener('click', extractBookInsightsAI);

    // Star rating color synchronizer in details tab
    setupFormRatingListener();

    // Tab switcher in Book details modal
    setupDetailTabListeners();

    // Segmented tab switcher listener
    document.querySelectorAll('.segmented-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.segmented-tab-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#64748b';
            });
            btn.classList.add('active');
            btn.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
            btn.style.color = 'white';
            
            const view = btn.getAttribute('data-view');
            const bookshelfWrapper = document.getElementById('books-grid-wrapper');
            const wisdomWrapper = document.getElementById('categories-summary-wrapper');
            const congQuaCachWrapper = document.getElementById('cong-qua-cach-wrapper');
            
            if (view === 'bookshelf') {
                if (bookshelfWrapper) bookshelfWrapper.style.display = 'block';
                if (wisdomWrapper) wisdomWrapper.style.display = 'none';
                if (congQuaCachWrapper) congQuaCachWrapper.style.display = 'none';
                renderBooks();
            } else if (view === 'wisdom-hub') {
                if (bookshelfWrapper) bookshelfWrapper.style.display = 'none';
                if (wisdomWrapper) wisdomWrapper.style.display = 'block';
                if (congQuaCachWrapper) congQuaCachWrapper.style.display = 'none';
                renderCategorySummaries();
            } else if (view === 'cong-qua-cach') {
                if (bookshelfWrapper) bookshelfWrapper.style.display = 'none';
                if (wisdomWrapper) wisdomWrapper.style.display = 'none';
                if (congQuaCachWrapper) congQuaCachWrapper.style.display = 'block';
                initCongQuaCach();
            }
        });
    });

    // Category summary tab buttons listener
    document.querySelectorAll('.cat-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.getAttribute('data-target');
            document.querySelectorAll('.cat-tab-content').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            const targetEl = document.getElementById(target);
            if (targetEl) {
                targetEl.classList.add('active');
                targetEl.style.display = target === 'cat-tab-user' ? 'flex' : 'block';
            }
        });
    });

    // Category summary AI synthesize button
    document.getElementById('btn-synthesize-category-ai')?.addEventListener('click', synthesizeCategoryAI);

    // Category summary raw notes AI extract button
    document.getElementById('btn-extract-cat-ai')?.addEventListener('click', extractCategoryInsightsAI);

    // Category summary Sửa nhanh (Quick Edit) toggle
    document.getElementById('btn-quick-edit-cat-summary')?.addEventListener('click', () => {
        const viewWrapper = document.getElementById('cat-summary-view-wrapper');
        const editWrapper = document.getElementById('cat-summary-edit-wrapper');
        const editBtn = document.getElementById('btn-quick-edit-cat-summary');
        const closeBtn = document.getElementById('cat-summary-close-btn');
        const cancelBtn = document.getElementById('cat-summary-cancel-btn');
        const saveBtn = document.getElementById('cat-summary-save-btn');
        
        if (viewWrapper && editWrapper && editBtn && closeBtn && cancelBtn && saveBtn) {
            viewWrapper.style.display = 'none';
            editWrapper.style.display = 'flex';
            editBtn.style.display = 'none';
            closeBtn.style.display = 'none';
            cancelBtn.style.display = 'block';
            saveBtn.style.display = 'block';
            
            // Focus on raw notes text area
            document.getElementById('cat-summary-raw-input')?.focus();
        }
    });

    // Category summary Cancel Edit
    document.getElementById('cat-summary-cancel-btn')?.addEventListener('click', () => {
        const viewWrapper = document.getElementById('cat-summary-view-wrapper');
        const editWrapper = document.getElementById('cat-summary-edit-wrapper');
        const editBtn = document.getElementById('btn-quick-edit-cat-summary');
        const closeBtn = document.getElementById('cat-summary-close-btn');
        const cancelBtn = document.getElementById('cat-summary-cancel-btn');
        const saveBtn = document.getElementById('cat-summary-save-btn');
        
        if (viewWrapper && editWrapper && editBtn && closeBtn && cancelBtn && saveBtn) {
            editWrapper.style.display = 'none';
            viewWrapper.style.display = 'block';
            editBtn.style.display = 'flex';
            closeBtn.style.display = 'block';
            cancelBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            
            // Revert changes in editor to cache
            const record = categorySummariesCache.find(c => c.category === currentCategorySummary);
            document.getElementById('cat-summary-user-text').value = record ? (record.userSummary || '') : '';
        }
    });

    // Category summary personal note AI format layout button
    document.getElementById('btn-ai-format-cat-summary')?.addEventListener('click', async () => {
        const textarea = document.getElementById('cat-summary-user-text');
        if (!textarea) return;
        
        const rawText = textarea.value.trim();
        if (!rawText) {
            alert("Đúc kết cá nhân hiện tại đang trống. Vui lòng nhập nội dung trước khi yêu cầu AI định dạng!");
            return;
        }
        
        const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
        if (!apiKey || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
            alert("Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình Key để sử dụng tính năng AI!");
            return;
        }
        
        const aiBtn = document.getElementById('btn-ai-format-cat-summary');
        const origHtml = aiBtn.innerHTML;
        aiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang định dạng...';
        aiBtn.disabled = true;
        
        const prompt = `Bạn là một chuyên gia hiệu chỉnh và định dạng văn bản chuyên nghiệp.
Hãy định dạng lại nội dung đúc kết, ghi chép triết lý chủ đề ở dạng Markdown cho đẹp mắt, khoa học và dễ đọc.
QUY TẮC QUAN TRỌNG NHẤT:
- Bạn KHÔNG ĐƯỢC PHÉP thay đổi bất kỳ từ ngữ hay nội dung văn bản nào của ghi chép hiện tại. Giữ nguyên 100% nội dung chữ, chữ số, câu văn. Chỉ được phép sắp xếp lại bố cục, thụt đầu dòng (indentation), thêm/bớt khoảng trắng, xuống dòng, và chèn các thẻ định dạng phù hợp.
- Định dạng các tiêu đề phần chính bằng ký hiệu '### ' (đặt trên dòng riêng biệt).
- Định dạng các tiêu đề phụ/đề mục con bằng ký hiệu '#### ' (đặt trên dòng riêng biệt).
- Thụt lề các nội dung chi tiết/đoạn văn bản/mục liệt kê bằng dấu gạch đầu dòng '- ' hoặc danh sách số '1. ' (để thụt đầu dòng một tab, chèn thêm 2 hoặc 4 khoảng trắng ở trước dấu gạch đầu dòng, ví dụ: '  - ').
- Dùng các thẻ định dạng in đậm (**), in nghiêng (*), gạch chân (<u>...</u>), highlight (<mark>...</mark>), canh giữa (<center>...</center>) một cách hợp lý và thẩm mỹ cao để làm nổi bật các đề mục, từ khóa quan trọng hoặc số thứ tự đầu câu.
- Thêm khoảng trống dòng trống hợp lý giữa các phần để văn bản thoáng đãng, không bị dồn cục.
- Chỉ trả về nội dung Markdown đã được định dạng xong, tuyệt đối không chứa lời giải thích, không bao quanh bằng \`\`\`markdown hay \`\`\` hay bất kỳ ký tự nào khác.

NỘI DUNG GHI CHÉP CẦN ĐỊNH DẠNG:
---
${rawText}
---`;
        
        try {
            const payload = {
                contents: [{ parts: [{ text: prompt }] }]
            };
            const result = await callGeminiAPI(payload, apiKey);
            let text = result.candidates[0].content.parts[0].text.trim();
            
            // Clean markdown block wrapper if any
            if (text.startsWith("```markdown")) {
                text = text.substring(11);
            } else if (text.startsWith("```")) {
                text = text.substring(3);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length - 3);
            }
            text = text.trim();
            
            textarea.value = text;
            if (window.showToast) window.showToast("Đã dùng Gemini AI định dạng lại bố cục đúc kết thành công!", "success");
        } catch(err) {
            console.error("AI Formatting error:", err);
            alert(`Lỗi định dạng AI: ${err.message}`);
        } finally {
            aiBtn.innerHTML = origHtml;
            aiBtn.disabled = false;
        }
    });

    // --- QUICK EDIT CONTENTS EVENT HANDLERS ---
    // Open Quick Edit
    document.getElementById('btn-quick-edit-contents')?.addEventListener('click', () => {
        const textEl = document.getElementById('detail-contents-text');
        const editWrapper = document.getElementById('detail-contents-edit-wrapper');
        const textarea = document.getElementById('detail-contents-textarea');
        const editBtn = document.getElementById('btn-quick-edit-contents');
        
        if (textEl && editWrapper && textarea && editBtn) {
            textarea.value = currentBookDetails ? (currentBookDetails.contentDirectory || '') : '';
            editWrapper.style.display = 'flex';
            textEl.style.display = 'none';
            editBtn.style.display = 'none';
        }
    });

    // Cancel Quick Edit
    document.getElementById('btn-quick-cancel-contents')?.addEventListener('click', () => {
        const textEl = document.getElementById('detail-contents-text');
        const editWrapper = document.getElementById('detail-contents-edit-wrapper');
        const editBtn = document.getElementById('btn-quick-edit-contents');
        
        if (textEl && editWrapper && editBtn) {
            editWrapper.style.display = 'none';
            textEl.style.display = 'block';
            editBtn.style.display = 'flex';
        }
    });

    // Save Quick Edit
    document.getElementById('btn-quick-save-contents')?.addEventListener('click', () => {
        const textEl = document.getElementById('detail-contents-text');
        const editWrapper = document.getElementById('detail-contents-edit-wrapper');
        const textarea = document.getElementById('detail-contents-textarea');
        const editBtn = document.getElementById('btn-quick-edit-contents');
        
        if (textEl && editWrapper && textarea && editBtn && currentBookDetails) {
            const newVal = textarea.value;
            
            // Update cache
            const book = booksCache.find(b => b.id === currentBookDetails.id);
            if (book) {
                book.contentDirectory = newVal;
                currentBookDetails.contentDirectory = newVal;
                localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
                renderBooks();
                
                // Render view
                textEl.innerHTML = parseMarkdownToHtml(newVal);
                
                // Push to sync queue
                try {
                    const bookQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
                    const filteredQueue = bookQueue.filter(item => item.bookId !== book.id);
                    filteredQueue.push({
                        action: 'book_save',
                        bookId: book.id,
                        data: book,
                        clientId: 'BOOK_' + book.id + '_' + Date.now(),
                        addedAt: new Date().toISOString()
                    });
                    localStorage.setItem('books_sync_queue', JSON.stringify(filteredQueue));
                } catch(qErr) {
                    console.warn('[BooksQueue] Failed to queue quick save:', qErr);
                }
                
                if (window.showToast) {
                    window.showToast("Đã lưu mục lục thành công cục bộ — đang đồng bộ... ☁️", "success");
                }
                setTimeout(() => {
                    if (typeof window.processBooksQueue === 'function') {
                        window.processBooksQueue();
                    }
                }, 100);
            }
            
            editWrapper.style.display = 'none';
            textEl.style.display = 'block';
            editBtn.style.display = 'flex';
        }
    });

    // AI Format Outline
    document.getElementById('btn-ai-format-layout')?.addEventListener('click', async () => {
        const textarea = document.getElementById('detail-contents-textarea');
        if (!textarea) return;
        
        const rawText = textarea.value.trim();
        if (!rawText) {
            alert("Mục lục hiện tại đang trống. Vui lòng nhập nội dung trước khi yêu cầu AI định dạng!");
            return;
        }
        
        const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
        if (!apiKey || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
            alert("Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình Key để sử dụng tính năng AI!");
            return;
        }
        
        const aiBtn = document.getElementById('btn-ai-format-layout');
        const origHtml = aiBtn.innerHTML;
        aiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang định dạng...';
        aiBtn.disabled = true;
        
        const prompt = `Bạn là một chuyên gia hiệu chỉnh và định dạng văn bản chuyên nghiệp.
Hãy định dạng lại nội dung mục lục/danh mục sách ở dạng Markdown cho đẹp mắt, khoa học và dễ đọc.
QUY TẮC QUAN TRỌNG NHẤT:
- Bạn KHÔNG ĐƯỢC PHÉP thay đổi bất kỳ từ ngữ hay nội dung văn bản nào của mục lục hiện tại. Giữ nguyên 100% nội dung chữ, chữ số, câu văn. Chỉ được phép sắp xếp lại bố cục, thụt đầu dòng (indentation), thêm/bớt khoảng trắng, xuống dòng, và chèn các thẻ định dạng phù hợp.
- Định dạng lại các tiêu đề chương/phần chính bằng ký hiệu '### ' (đặt trên dòng riêng biệt).
- Định dạng lại các tiêu đề phụ/mục con bằng ký hiệu '#### ' (đặt trên dòng riêng biệt).
- Thụt lề các nội dung chi tiết/đoạn văn bản/mục liệt kê bằng dấu gạch đầu dòng '- ' hoặc danh sách số '1. ' (để thụt đầu dòng một tab, chèn thêm 2 hoặc 4 khoảng trắng ở trước dấu gạch đầu dòng, ví dụ: '  - ').
- Dùng các thẻ định dạng in đậm (**), in nghiêng (*), gạch chân (<u>...</u>), highlight (<mark>...</mark>), canh giữa (<center>...</center>) một cách hợp lý và thẩm mỹ cao để làm nổi bật các đề mục, từ khóa quan trọng hoặc số thứ tự đầu câu.
- Thêm khoảng trống dòng trống hợp lý giữa các chương để văn bản thoáng đãng, không bị dồn cục.
- Chỉ trả về nội dung Markdown đã được định dạng xong, tuyệt đối không chứa lời giải thích, không bao quanh bằng \`\`\`markdown hay \`\`\` hay bất kỳ ký tự nào khác.

NỘI DUNG MỤC LỤC CẦN ĐỊNH DẠNG:
---
${rawText}
---`;
        
        try {
            const payload = {
                contents: [{ parts: [{ text: prompt }] }]
            };
            const result = await callGeminiAPI(payload, apiKey);
            let text = result.candidates[0].content.parts[0].text.trim();
            
            // Clean markdown block wrapper if any
            if (text.startsWith("```markdown")) {
                text = text.substring(11);
            } else if (text.startsWith("```")) {
                text = text.substring(3);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length - 3);
            }
            text = text.trim();
            
            textarea.value = text;
            if (window.showToast) window.showToast("Đã dùng Gemini AI định dạng lại bố cục mục lục thành công!", "success");
        } catch(err) {
            console.error("AI Formatting error:", err);
            alert(`Lỗi định dạng AI: ${err.message}`);
        } finally {
            aiBtn.innerHTML = origHtml;
            aiBtn.disabled = false;
        }
    });

    // Formatting Toolbar text insertion helper
    window.insertFormattingIntoTextarea = function(tagOpen, tagClose = "", textareaId = 'detail-contents-textarea') {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        const selectedText = text.substring(start, end);
        let replacement = "";
        
        if (tagClose) {
            replacement = tagOpen + selectedText + tagClose;
            textarea.value = text.substring(0, start) + replacement + text.substring(end);
            textarea.focus();
            textarea.selectionStart = start + tagOpen.length;
            textarea.selectionEnd = start + tagOpen.length + selectedText.length;
        } else {
            if (selectedText.includes('\n')) {
                const lines = selectedText.split('\n');
                const prefixedLines = lines.map(line => tagOpen + line);
                replacement = prefixedLines.join('\n');
                textarea.value = text.substring(0, start) + replacement + text.substring(end);
                textarea.focus();
                textarea.selectionStart = start;
                textarea.selectionEnd = start + replacement.length;
            } else {
                replacement = tagOpen + selectedText;
                textarea.value = text.substring(0, start) + replacement + text.substring(end);
                textarea.focus();
                textarea.selectionStart = start + tagOpen.length;
                textarea.selectionEnd = start + tagOpen.length + selectedText.length;
            }
        }
        textarea.dispatchEvent(new Event('input'));
    };

    // Mark as initialized
    document.getElementById('view-books').dataset.initialized = "true";
    
    // Load data
    loadBookData();
}

// Star select interaction helper
function setupFormRatingListener() {
    const rSelect = document.getElementById('book-form-rating');
    if (!rSelect) return;
    
    rSelect.addEventListener('change', () => {
        const val = parseInt(rSelect.value);
        if (val === 5) rSelect.style.color = '#fbbf24';
        else if (val === 4) rSelect.style.color = '#fbbf24';
        else if (val === 3) rSelect.style.color = '#fbbf24';
        else if (val === 2) rSelect.style.color = '#fbbf24';
        else if (val === 1) rSelect.style.color = '#fbbf24';
        else rSelect.style.color = '#64748b';
    });
    
    // Status change progress helper
    const statusSelect = document.getElementById('book-form-status');
    const progressRange = document.getElementById('book-form-progress');
    const progressVal = document.getElementById('form-progress-val');
    
    if (statusSelect && progressRange) {
        statusSelect.addEventListener('change', () => {
            const status = statusSelect.value;
            if (status === 'Đã đọc xong') {
                progressRange.value = 100;
            } else if (status === 'Muốn đọc') {
                progressRange.value = 0;
            } else if (status === 'Đang đọc' && parseInt(progressRange.value) === 100) {
                progressRange.value = 50;
            }
            if (progressVal) progressVal.innerText = progressRange.value + '%';
        });
    }
}

// Switch tabs inside detail view
function setupDetailTabListeners() {
    const tabButtons = document.querySelectorAll('.book-tab-btn');
    const tabContents = document.querySelectorAll('.book-tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(target)?.classList.add('active');
        });
    });
}

// 2. DATA LAYER (LOAD, SYNC, SAVE, DELETE)
async function loadBookData() {
    // Attempt local storage loading first
    const cachedData = localStorage.getItem('books_cache_v2');
    if (cachedData) {
        try {
            booksCache = JSON.parse(cachedData);
            renderBooks();
            updateBooksKPI();
        } catch (e) {
            console.error("Parse books cache error", e);
        }
    } else {
        // Fallback placeholder/mock books for clean initial view
        booksCache = [...MOCK_BOOKS];
        localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
        renderBooks();
        updateBooksKPI();
    }
    // Load category summaries
    loadCategorySummaries();
    
    // Load Cong Qua Cach logs
    loadCongQuaCachData();
    
    // Fetch from Google Sheet
    const res = await callBooksApi("get_book_data");
    if (res && res.status === "success") {
        const rawData = res.data;
        const parsed = [];
        if (rawData && rawData.length > 1) {
            for (let i = 1; i < rawData.length; i++) {
                const r = rawData[i];
                if (!r[0]) continue;
                parsed.push({
                    id: r[0],
                    title: r[1],
                    author: r[2],
                    category: r[3],
                    status: r[4],
                    rating: parseInt(r[5]) || 0,
                    progress: parseInt(r[6]) || 0,
                    summary: r[7],
                    lessons: r[8],
                    quotes: r[9],
                    actions: r[10] || "[]",
                    createdAt: r[11],
                    coverUrl: r[12] || "",
                    contentDirectory: r[13] || ""
                });
            }
            booksCache = parsed;
            localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
            renderBooks();
            updateBooksKPI();
        }
    } else {
        console.warn("Failed to load book data from cloud sheet, using local database cache.");
    }
}

// Save or Update Book record
async function saveBook(e) {
    if (e) e.preventDefault();
    
    const id = document.getElementById('book-form-id').value;
    const title = document.getElementById('book-form-title').value.trim();
    const author = document.getElementById('book-form-author').value.trim();
    const category = document.getElementById('book-form-category').value;
    const status = document.getElementById('book-form-status').value;
    const rating = parseInt(document.getElementById('book-form-rating').value) || 0;
    const progress = parseInt(document.getElementById('book-form-progress').value) || 0;
    const summary = document.getElementById('book-form-summary').value.trim();
    const contentDirectory = document.getElementById('book-form-content-directory') ? document.getElementById('book-form-content-directory').value.trim() : '';
    const lessons = document.getElementById('book-form-lessons').value.trim();
    const quotes = document.getElementById('book-form-quotes').value.trim();
    const coverUrl = document.getElementById('book-form-cover-url').value.trim();
    
    // Maintain existing action checkboxes if editing
    let actionsList = [];
    const actionsRaw = document.getElementById('book-form-actions').value.trim();
    
    if (actionsRaw) {
        // split by newline
        const textLines = actionsRaw.split('\n').map(l => l.trim()).filter(Boolean);
        
        let existingActions = [];
        if (id) {
            const currentBook = booksCache.find(b => b.id === id);
            if (currentBook && currentBook.actions) {
                try {
                    existingActions = JSON.parse(currentBook.actions);
                } catch(e) {}
            }
        }
        
        actionsList = textLines.map(line => {
            const cleanLine = line.replace(/^[\-\*]\s*/, '').trim(); // Remove leading bullets
            const match = existingActions.find(a => a.text === cleanLine);
            return {
                text: cleanLine,
                completed: match ? match.completed : false
            };
        });
    }

    const payload = {
        id: id || "BK_" + new Date().getTime(),
        title,
        author,
        category,
        status,
        rating,
        progress,
        summary,
        contentDirectory,
        lessons,
        quotes,
        actions: JSON.stringify(actionsList),
        coverUrl
    };

    // Preserve isFavorite when editing
    if (id) {
        const existing = booksCache.find(b => b.id === id);
        if (existing) payload.isFavorite = existing.isFavorite || false;
    }

    // Lưu qua queue — không cần cursor chờ, modal đóng ngay lập tức
    
    // Save to Cache immediately (optimistic UI)
    const idx = booksCache.findIndex(b => b.id === payload.id);
    if (idx > -1) {
        payload.createdAt = booksCache[idx].createdAt;
        booksCache[idx] = payload;
    } else {
        payload.createdAt = new Date().toLocaleString('vi-VN');
        booksCache.unshift(payload);
    }
    
    localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
    renderBooks();
    updateBooksKPI();
    
    // Close modal
    closeBookForm();
    
    // Queue the save action for reliable offline sync (same harvest_sync_queue as farm data)
    try {
        const bookQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
        // Remove any previous pending save for the same book ID
        const filteredQueue = bookQueue.filter(item => item.bookId !== payload.id);
        filteredQueue.push({
            action: 'book_save',
            bookId: payload.id,
            data: payload,
            clientId: 'BOOK_' + payload.id + '_' + Date.now(),
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('books_sync_queue', JSON.stringify(filteredQueue));
    } catch(qErr) {
        console.warn('[BooksQueue] Failed to queue book save:', qErr);
    }

    // Trigger background sync queue processing without blocking the UI
    if (window.showToast) {
        window.showToast("Đã lưu sách cục bộ — đang đồng bộ lên đám mây trong nền... ☁️", "info");
    }
    
    // Process queue asynchronously
    setTimeout(() => {
        if (typeof window.processBooksQueue === 'function') {
            window.processBooksQueue();
        }
    }, 100);
}


// Delete Book record
async function deleteTaskBook(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa cuốn sách này cùng tất cả ghi chú bài học của nó?")) return;
    
    document.body.style.cursor = 'wait';
    
    // Optimistic cache update
    booksCache = booksCache.filter(b => b.id !== id);
    localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
    renderBooks();
    updateBooksKPI();
    
    closeBookDetail();

    try {
        const res = await callBooksApi("delete_book_record", { id: id });
        if (res && res.status === "success") {
            if (window.showToast) window.showToast("Đã xóa sách thành công khỏi Đám Mây!", "success");
        } else {
            if (window.showToast) window.showToast("Đã xóa sách khỏi bộ nhớ cục bộ!", "info");
        }
    } catch(err) {
        if (window.showToast) window.showToast("Đã xóa sách khỏi bộ nhớ cục bộ!", "info");
    } finally {
        document.body.style.cursor = 'default';
    }
}

// Settle an action item in the checklist (Mark complete/incomplete)
async function toggleActionState(bookId, actionIndex, checkbox) {
    const book = booksCache.find(b => b.id === bookId);
    if (!book) return;
    
    let actions = [];
    try {
        actions = JSON.parse(book.actions);
    } catch (e) {
        return;
    }
    
    if (actions[actionIndex]) {
        actions[actionIndex].completed = checkbox.checked;
        book.actions = JSON.stringify(actions);
        
        // Auto update progress based on action completion if it was 100% or 0% read
        const completedCount = actions.filter(a => a.completed).length;
        const total = actions.length;
        
        // Save to cache
        localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
        
        // Update detail view actions badge
        const badge = document.getElementById('actions-progress-badge');
        if (badge) {
            badge.innerText = `${completedCount}/${total} Hoàn thành`;
        }
        
        // Update element visual style
        const itemEl = checkbox.closest('.book-action-item');
        if (itemEl) {
            if (checkbox.checked) itemEl.classList.add('completed');
            else itemEl.classList.remove('completed');
        }
        
        // Send updates to cloud
        try {
            await callBooksApi("save_book_record", { data: book });
        } catch(e) {}
    }
}

// 3. UI RENDERING AND LOGIC
function renderBooks() {
    const grid = document.getElementById('books-grid');
    if (!grid) return;
    
    const searchQuery = document.getElementById('book-search-input')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('book-filter-status')?.value || '';
    const ratingFilter = document.getElementById('book-filter-rating')?.value || 'all';
    const activePill = document.querySelector('.book-filter-pill.active');
    const categoryFilter = activePill ? activePill.getAttribute('data-category') : 'all';
    const favoritesOnly = categoryFilter === '__favorites__';
    
    let filtered = booksCache.filter(book => {
        const matchesSearch = !searchQuery || 
            book.title.toLowerCase().includes(searchQuery) ||
            book.author.toLowerCase().includes(searchQuery) ||
            (book.summary && book.summary.toLowerCase().includes(searchQuery)) ||
            (book.lessons && book.lessons.toLowerCase().includes(searchQuery));
            
        const matchesStatus = !statusFilter || statusFilter === 'all' || book.status === statusFilter;
        const matchesCategory = favoritesOnly ? book.isFavorite === true : (categoryFilter === 'all' || book.category === categoryFilter);
        const matchesRating = ratingFilter === 'all' || book.rating >= parseInt(ratingFilter);
        
        return matchesSearch && matchesStatus && matchesCategory && matchesRating;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 4rem 1rem; color: var(--text-light); font-weight:600;">
            <i class="fa-solid fa-book-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem; display:block;"></i>
            Không tìm thấy cuốn sách nào. Thêm sách mới để bắt đầu lưu trữ tinh hoa!
        </div>`;
        return;
    }
    
    grid.innerHTML = '';
    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.onclick = (e) => {
            if (e.target.closest('.book-card-actions-dropdown') || e.target.closest('button')) {
                // Prevent detail view on action buttons
                return;
            }
            openBookDetail(book.id);
        };
        
        // Category styling class
        let themeClass = 'theme-other';
        let categoryIcon = '<i class="fa-solid fa-puzzle-piece"></i>';
        if (book.category === 'Phát triển bản thân') {
            themeClass = 'theme-self-dev';
            categoryIcon = '<i class="fa-solid fa-seedling"></i>';
        } else if (book.category === 'Kinh doanh') {
            themeClass = 'theme-business';
            categoryIcon = '<i class="fa-solid fa-briefcase"></i>';
        } else if (book.category === 'Đầu tư') {
            themeClass = 'theme-investment';
            categoryIcon = '<i class="fa-solid fa-chart-line"></i>';
        } else if (book.category === 'Marketing') {
            themeClass = 'theme-marketing';
            categoryIcon = '<i class="fa-solid fa-bullhorn"></i>';
        } else if (book.category === 'Tình yêu') {
            themeClass = 'theme-love';
            categoryIcon = '<i class="fa-solid fa-heart"></i>';
        }
        
        // Status class
        let statusClass = 'status-want-to-read';
        if (book.status === 'Đang đọc') statusClass = 'status-reading';
        else if (book.status === 'Đã đọc xong') statusClass = 'status-completed';
        
        // Stars HTML
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= book.rating) starsHtml += '★';
            else starsHtml += '☆';
        }
        
        // Count actions
        let actionsCountText = '0 hành động';
        if (book.actions) {
            try {
                const arr = JSON.parse(book.actions);
                actionsCountText = `${arr.length} hành động`;
            } catch (e) {}
        }
        
        // Count lessons
        const lessonsCount = book.lessons ? book.lessons.split('\n').filter(Boolean).length : 0;
        
        // Dynamic cover wrapper HTML
        let coverHtml = '';
        let bodyTitleHtml = '';
        if (book.coverUrl) {
            coverHtml = `
            <div class="book-card-cover-wrapper has-cover">
                <div class="book-card-cover-blur-bg" style="background-image: url('${escapeHtml(book.coverUrl)}');"></div>
                <img class="book-card-cover-img" src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)}">
                <div class="book-card-cover-badge-icon">${categoryIcon}</div>
            </div>`;
            bodyTitleHtml = `
            <div class="book-card-body-title-wrapper" style="margin-bottom: 10px;">
                <h3 class="book-card-body-title" style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-dark); line-height: 1.3;" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                <p class="book-card-body-author" style="margin: 2px 0 0 0; font-size: 0.8rem; font-weight: 600; color: var(--text-light);">${escapeHtml(book.author)}</p>
            </div>`;
        } else {
            coverHtml = `
            <div class="book-card-cover-wrapper ${themeClass}">
                <div class="book-card-cover-icon">${categoryIcon}</div>
                <div class="book-card-cover-content">
                    <h3 class="book-card-cover-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
                    <p class="book-card-cover-author">${escapeHtml(book.author)}</p>
                </div>
            </div>`;
        }

        card.innerHTML = `
            <span class="book-card-badge-status ${statusClass}">${book.status}</span>
            ${book.isFavorite ? '<span class="book-card-fav-badge" title="Yêu thích"><i class="fa-solid fa-heart"></i></span>' : ''}
            ${coverHtml}
            <div class="book-card-body">
                ${bodyTitleHtml}
                <p class="book-card-summary">${escapeHtml(book.summary || "Chưa cập nhật tóm tắt sơ lược cho cuốn sách này.")}</p>
                
                <div class="book-card-progress-wrapper">
                    <div class="book-card-progress-header">
                        <span>Tiến trình đọc</span>
                        <span>${book.progress}%</span>
                    </div>
                    <div class="book-card-progress-track">
                        <div class="book-card-progress-fill" style="width: ${book.progress}%;"></div>
                    </div>
                </div>
            </div>
            <div class="book-card-footer">
                <div class="book-card-rating" title="${book.rating} sao">${starsHtml}</div>
                <div class="book-card-stats">
                    <span><i class="fa-solid fa-lightbulb"></i> ${lessonsCount}</span>
                    <span><i class="fa-solid fa-circle-check"></i> ${actionsCountText}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateBooksKPI() {
    const total = booksCache.length;
    const completed = booksCache.filter(b => b.status === 'Đã đọc xong').length;
    
    let totalLessons = 0;
    booksCache.forEach(book => {
        if (book.lessons) {
            totalLessons += book.lessons.split('\n').filter(Boolean).length;
        }
    });
    
    const kpiTotal = document.getElementById('books-kpi-total');
    const kpiCompleted = document.getElementById('books-kpi-completed');
    const kpiLessons = document.getElementById('books-kpi-lessons');
    
    if (kpiTotal) kpiTotal.innerText = total;
    if (kpiCompleted) kpiCompleted.innerText = completed;
    if (kpiLessons) kpiLessons.innerText = totalLessons;
}

// 4. BOOK DETAIL POPUP
function openBookDetail(id) {
    const book = booksCache.find(b => b.id === id);
    if (!book) return;
    
    currentBookDetails = book;
    
    // Reset Quick Edit mode back to View mode
    const textEl = document.getElementById('detail-contents-text');
    const editWrapper = document.getElementById('detail-contents-edit-wrapper');
    const quickEditBtn = document.getElementById('btn-quick-edit-contents');
    if (textEl && editWrapper && quickEditBtn) {
        editWrapper.style.display = 'none';
        textEl.style.display = 'block';
        quickEditBtn.style.display = 'flex';
    }
    
    // Fill left meta data
    document.getElementById('detail-title').innerText = book.title;
    document.getElementById('detail-author').innerText = book.author;
    document.getElementById('detail-category').innerText = book.category;
    document.getElementById('detail-status').innerText = book.status;
    document.getElementById('detail-progress-percent').innerText = `${book.progress}%`;
    document.getElementById('detail-progress-bar').style.width = `${book.progress}%`;
    
    // Star rating
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += i <= book.rating ? '★' : '☆';
    }
    document.getElementById('detail-rating').innerText = starsHtml;
    
    // Cover Card color/image mapping
    const coverEl = document.getElementById('detail-book-cover');
    if (coverEl) {
        coverEl.innerHTML = '';
        coverEl.className = 'book-cover-large';
        
        if (book.coverUrl) {
            coverEl.style.background = '#f1f5f9';
            coverEl.style.padding = '0';
            coverEl.innerHTML = `<img src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
        } else {
            coverEl.style.padding = '1rem';
            coverEl.innerHTML = `
                <i class="fa-solid fa-book" style="font-size: 2.5rem; margin-bottom: 8px; opacity:0.8;"></i>
                <div style="font-size: 0.85rem; font-weight: 800; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;" id="detail-cover-title">Title</div>
            `;
            const coverTitle = document.getElementById('detail-cover-title');
            if (coverTitle) coverTitle.innerText = book.title;
            
            if (book.category === 'Phát triển bản thân') coverEl.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            else if (book.category === 'Kinh doanh') coverEl.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
            else if (book.category === 'Đầu tư') coverEl.style.background = 'linear-gradient(135deg, #10b981, #047857)';
            else if (book.category === 'Marketing') coverEl.style.background = 'linear-gradient(135deg, #ec4899, #be185d)';
            else if (book.category === 'Tình yêu') coverEl.style.background = 'linear-gradient(135deg, #f43f5e, #be123c)';
            else coverEl.style.background = 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
        }
    }

    // Set Summary text
    document.getElementById('detail-summary-text').innerText = book.summary || "Chưa có tóm tắt cốt lõi.";
    
    // Set Content Directory text
    const contentsTextEl = document.getElementById('detail-contents-text');
    if (contentsTextEl) {
        if (book.contentDirectory) {
            contentsTextEl.innerHTML = parseMarkdownToHtml(book.contentDirectory);
        } else {
            contentsTextEl.innerHTML = `<div class="book-content-directory-empty">
            <i class="fa-solid fa-list-ol"></i>
            <p>Chưa có danh mục nội dung cho cuốn sách này.<br>
            Dùng nút chỉnh sửa để thêm hoặc dùng trợ lý AI để tự động tạo danh mục.</p>
        </div>`;
        }
    }
    
    // Set Lessons
    const lessonsList = document.getElementById('detail-lessons-list');
    if (lessonsList) {
        lessonsList.innerHTML = '';
        if (book.lessons) {
            const arr = book.lessons.split('\n').filter(Boolean);
            arr.forEach(lesson => {
                const cleanLesson = lesson.replace(/^[\-\*]\s*/, '').trim();
                const item = document.createElement('div');
                item.className = 'book-lesson-item';
                item.innerHTML = `<i class="fa-solid fa-lightbulb"></i> <span>${escapeHtml(cleanLesson)}</span>`;
                lessonsList.appendChild(item);
            });
        } else {
            lessonsList.innerHTML = `<p style="color:var(--text-light); font-style:italic;">Chưa ghi lại bài học nào.</p>`;
        }
    }
    
    // Set Quotes
    const quotesList = document.getElementById('detail-quotes-list');
    if (quotesList) {
        quotesList.innerHTML = '';
        if (book.quotes) {
            const arr = book.quotes.split('\n').filter(Boolean);
            arr.forEach(quote => {
                const cleanQuote = quote.replace(/^[\-\*“"”]\s*/, '').replace(/[\-\*“"”]$/, '').trim();
                const item = document.createElement('div');
                item.className = 'book-quote-item';
                item.innerText = cleanQuote;
                quotesList.appendChild(item);
            });
        } else {
            quotesList.innerHTML = `<p style="color:var(--text-light); font-style:italic;">Chưa ghi lại trích dẫn nào.</p>`;
        }
    }
    
    // Set Actions Checklist
    const actionsList = document.getElementById('detail-actions-list');
    const badge = document.getElementById('actions-progress-badge');
    if (actionsList) {
        actionsList.innerHTML = '';
        let actArr = [];
        try {
            actArr = JSON.parse(book.actions || '[]');
        } catch (e) {}
        
        if (actArr.length > 0) {
            const completedCount = actArr.filter(a => a.completed).length;
            if (badge) badge.innerText = `${completedCount}/${actArr.length} Hoàn thành`;
            
            actArr.forEach((action, idx) => {
                const item = document.createElement('div');
                item.className = 'book-action-item';
                if (action.completed) item.classList.add('completed');
                
                item.innerHTML = `
                    <input type="checkbox" class="book-action-item-checkbox" ${action.completed ? 'checked' : ''} 
                           onchange="toggleActionState('${book.id}', ${idx}, this)">
                    <span>${escapeHtml(action.text)}</span>
                `;
                actionsList.appendChild(item);
            });
        } else {
            if (badge) badge.innerText = '0/0 Hoàn thành';
            actionsList.innerHTML = `<p style="color:var(--text-light); font-style:italic;">Chưa thiết lập kế hoạch hành động cụ thể.</p>`;
        }
    }
    
    // Edit action in detail view
    const editBtn = document.getElementById('detail-edit-btn');
    if (editBtn) {
        editBtn.onclick = () => {
            openBookFormModal(book);
        };
    }
    
    // Set favorite state in detail modal
    const favIcon = document.getElementById('detail-favorite-icon');
    const favBtn = document.getElementById('detail-favorite-btn');
    if (favIcon && favBtn) {
        if (book.isFavorite) {
            favIcon.className = 'fa-solid fa-heart';
            favBtn.style.background = '#ffe4e6';
            favBtn.title = 'Bỏ yêu thích';
        } else {
            favIcon.className = 'fa-regular fa-heart';
            favBtn.style.background = '#fff0f3';
            favBtn.title = 'Đánh dấu yêu thích';
        }
    }

    // Show Modal
    const modal = document.getElementById('book-detail-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset tab view to Summary
        const firstTab = document.querySelector('.book-tab-btn[data-target="tab-summary"]');
        if (firstTab) firstTab.click();
    }
}

function toggleBookFavorite() {
    if (!currentBookDetails) return;
    const book = booksCache.find(b => b.id === currentBookDetails.id);
    if (!book) return;
    book.isFavorite = !book.isFavorite;
    currentBookDetails = book;

    // Update UI
    const favIcon = document.getElementById('detail-favorite-icon');
    const favBtn = document.getElementById('detail-favorite-btn');
    if (favIcon && favBtn) {
        if (book.isFavorite) {
            favIcon.className = 'fa-solid fa-heart';
            favBtn.style.background = '#ffe4e6';
            favBtn.title = 'Bỏ yêu thích';
        } else {
            favIcon.className = 'fa-regular fa-heart';
            favBtn.style.background = '#fff0f3';
            favBtn.title = 'Đánh dấu yêu thích';
        }
    }

    // Save to cache & localStorage
    localStorage.setItem('books_cache_v2', JSON.stringify(booksCache));
    renderBooks();

    // Queue the update for sync
    try {
        const bookQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
        bookQueue.push({ id: book.id, data: book, ts: Date.now() });
        localStorage.setItem('books_sync_queue', JSON.stringify(bookQueue));
    } catch(e) {}
}

function closeBookDetail() {
    const modal = document.getElementById('book-detail-modal');
    if (modal) modal.style.display = 'none';
}

// 5. BOOK ENTRY FORM POPUP
function openBookFormModal(bookToEdit = null) {
    const modal = document.getElementById('book-form-modal');
    if (!modal) return;
    
    // Reset form
    document.getElementById('book-form').reset();
    document.getElementById('book-form-id').value = '';
    document.getElementById('book-form-cover-url').value = '';
    updateFormCoverPreview('');
    document.getElementById('form-modal-title').innerText = 'Thêm Sách Mới';
    document.getElementById('form-progress-val').innerText = '0%';
    document.getElementById('book-form-rating').value = '0';
    document.getElementById('book-form-rating').style.color = '#64748b';
    if (document.getElementById('book-form-content-directory')) {
        document.getElementById('book-form-content-directory').value = '';
    }
    
    // Add delete button inside form footer if editing
    let deleteBtn = document.getElementById('book-form-delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    if (bookToEdit) {
        document.getElementById('book-form-id').value = bookToEdit.id;
        document.getElementById('form-modal-title').innerText = 'Chỉnh Sửa Sách';
        document.getElementById('book-form-title').value = bookToEdit.title;
        document.getElementById('book-form-author').value = bookToEdit.author;
        document.getElementById('book-form-category').value = bookToEdit.category;
        document.getElementById('book-form-status').value = bookToEdit.status;
        document.getElementById('book-form-rating').value = bookToEdit.rating.toString();
        document.getElementById('book-form-progress').value = bookToEdit.progress;
        document.getElementById('form-progress-val').innerText = `${bookToEdit.progress}%`;
        document.getElementById('book-form-cover-url').value = bookToEdit.coverUrl || '';
        updateFormCoverPreview(bookToEdit.coverUrl || '');
        
        // Stars color syncer
        if (bookToEdit.rating > 0) document.getElementById('book-form-rating').style.color = '#fbbf24';
        
        document.getElementById('book-form-summary').value = bookToEdit.summary || '';
        if (document.getElementById('book-form-content-directory')) {
            document.getElementById('book-form-content-directory').value = bookToEdit.contentDirectory || '';
        }
        document.getElementById('book-form-lessons').value = bookToEdit.lessons || '';
        document.getElementById('book-form-quotes').value = bookToEdit.quotes || '';
        
        // Actions mapping
        let actArr = [];
        try {
            actArr = JSON.parse(bookToEdit.actions || '[]');
        } catch(e) {}
        
        if (actArr.length > 0) {
            document.getElementById('book-form-actions').value = actArr.map(a => a.text).join('\n');
        } else {
            document.getElementById('book-form-actions').value = '';
        }
        
        // Inject delete button if not exists
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'book-form-delete-btn';
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn-primary';
            deleteBtn.style.background = 'var(--danger)';
            deleteBtn.style.color = 'white';
            deleteBtn.style.marginRight = 'auto';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Xóa Sách';
            
            const footer = document.querySelector('#book-form div[style*="justify-content: flex-end"]');
            if (footer) {
                footer.insertBefore(deleteBtn, footer.firstChild);
            }
        }
        
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = () => {
            deleteTaskBook(bookToEdit.id);
            closeBookForm();
        };
    }
    
    modal.style.display = 'flex';
}

function closeBookForm() {
    const modal = document.getElementById('book-form-modal');
    if (modal) modal.style.display = 'none';
}

// Status selection auto changes progress slider value
function adjustProgressByStatus() {
    const status = document.getElementById('book-form-status').value;
    const progressInput = document.getElementById('book-form-progress');
    const valText = document.getElementById('form-progress-val');
    
    if (status === 'Đã đọc xong') {
        progressInput.value = 100;
    } else if (status === 'Muốn đọc') {
        progressInput.value = 0;
    } else if (status === 'Đang đọc' && parseInt(progressInput.value) === 100) {
        progressInput.value = 50;
    }
    if (valText) valText.innerText = progressInput.value + '%';
}

// 6. GEMINI AI ASSISTANT AUTOFILL
async function generateBookInsightsAI() {
    const title = document.getElementById('book-form-title').value.trim();
    const author = document.getElementById('book-form-author').value.trim();
    
    if (!title) {
        alert("Vui lòng nhập Tên Sách trước khi sử dụng trợ lý AI!");
        document.getElementById('book-form-title').focus();
        return;
    }
    
    const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
    if (!apiKey || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
        alert("Chuưa cấu hình GEMINI_API_KEY trong file config.js hoặc biến môi trường. Vui lòng cấu hình Key để kích hoạt tính năng này!");
        return;
    }
    
    const loadingOverlay = document.getElementById('book-form-loading');
    const loadingText = document.getElementById('book-form-loading-text');
    if (loadingOverlay) {
        loadingText.innerText = `Đang kết nối Gemini AI để phön tích sách "${title}"...`;
        loadingOverlay.style.display = 'flex';
    }
    
    const authorPromptText = author ? ` của tác giả "${author}"` : "";
    const prompt = `Hãy đóng vai một chuyên gia tóm tắt sách tinh hoa. Tôi cung cấp cuốn sách: "${title}"${authorPromptText}.
Hãy viết tóm tắt ngắn gọn, lập Danh mục nội dung chính xác của sách (liệt kê NGUYÊ N VẸN tên các chương/phần chính, KHÔNG paraphrase), chiết xuất các bài học hay, trích dẫn vàng, và hành động thực tế.
Vui lòng trả về ĐÚNG định dạng JSON sau, không chứa markdown, không bao quanh bằng \`\`\`json, chỉ chuỗi JSON thô:
{
  "summary": "Tóm tắt cốt lõi ngắn gọn dưới 3 dòng, súc tích và khơi gợi tư duy tốt nhất",
  "category": "Chọn 1 trong các phân loại sau: Phát triển bản thân, Kinh doanh, Đầu tư, Marketing, Tình yêu, Khác",
  "contentDirectory": "Danh mục nội dung chính xác của sách. Liệt kê NGUYÊ N VẸN tên các chương/phần chính (KHÔNG diễn giải lại, KHÔNG paraphrase, giữ nguyên tên gốc). Sử dụng ### cho tiêu đề chương/phần (đặt trên dòng riêng biệt), và dùng dấu gạch đầu dòng - cho các chủ đề hoặc nội dung con bên dưới mỗi chương (liệt kê nguyên văn, không diễn giải). LUƯ U Ý: Phải sử dụng ĐÚNG các chương thực tế từ tri thức của bạn về cuốn sách đó.",
  "lessons": ["Bài học tâm đắc 1", "Bài học tâm đắc 2", "Bài học tâm đắc 3", "Bài học tâm đắc 4"],
  "quotes": ["Trích dẫn nổi tiếng 1", "Trích dẫn nổi tiếng 2", "Trích dẫn nổi tiếng 3"],
  "actions": ["Hành động thực tế áp dụng 1", "Hành động thực tế áp dụng 2", "Hành động thực tế áp dụng 3", "Hành động thực tế áp dụng 4"]
}
Lưu ý: 
- Ngôn ngữ bắt buộc: Tiếng Việt.
- Phần lessons, quotes, actions KHÔNG được chứa số thứ tự ở đầu dòng hay ký tự đầu dòng như '-' hay '*'. Trả về mảng các câu văn thô.
- Hãy cố gắng lấy các bài học thực sự có chiều sâu của cuốn sách này.`

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        summary: { type: "STRING" },
                        category: { type: "STRING" },
                        contentDirectory: { type: "STRING" },
                        lessons: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        quotes: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        actions: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["summary", "category", "contentDirectory", "lessons", "quotes", "actions"]
                }
            }
        };

        const result = await callGeminiAPI(payload, apiKey);
        let jsonText = result.candidates[0].content.parts[0].text;
        
        // Clean markdown wrapper if any
        jsonText = jsonText.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.substring(7);
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.substring(3);
        }
        if (jsonText.endsWith("```")) {
            jsonText = jsonText.substring(0, jsonText.length - 3);
        }
        jsonText = jsonText.trim();
        
        const data = JSON.parse(jsonText);
        
        // Populate inputs
        if (data.summary) document.getElementById('book-form-summary').value = data.summary;
        if (data.contentDirectory && document.getElementById('book-form-content-directory')) {
            document.getElementById('book-form-content-directory').value = data.contentDirectory;
        }
        if (data.category) document.getElementById('book-form-category').value = data.category;
        
        if (data.lessons && Array.isArray(data.lessons)) {
            document.getElementById('book-form-lessons').value = data.lessons.map(l => `- ${l}`).join('\n');
        }
        
        if (data.quotes && Array.isArray(data.quotes)) {
            document.getElementById('book-form-quotes').value = data.quotes.map(q => `“${q}”`).join('\n');
        }
        
        if (data.actions && Array.isArray(data.actions)) {
            document.getElementById('book-form-actions').value = data.actions.map(a => `- ${a}`).join('\n');
        }
        
        // Also fetch book cover automatically
        triggerAutoCoverFetch();
        
        if (window.showToast) window.showToast("Đã phân tích và điền thông tin tóm tắt bằng Gemini AI!", "success");

    } catch (e) {
        console.error("Gemini AI API call failed:", e);
        // Fallback fallback error alert
        alert(`Không thể tự động tóm tắt bằng AI. Lỗi: ${e.message}. Bạn vẫn có thể điền các thông tin thủ công!`);
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Extract book insights from raw document/Word inputs using AI rephrasing
async function extractBookInsightsAI() {
    const rawText = document.getElementById('book-form-raw-input').value.trim();
    if (!rawText) {
        alert("Vui lòng dán nội dung tài liệu hoặc ghi chú thô của bạn vào ô trống!");
        document.getElementById('book-form-raw-input').focus();
        return;
    }

    const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
    if (!apiKey || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
        alert("Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình Key trong file config.js để kích hoạt tính năng AI!");
        return;
    }

    const loadingOverlay = document.getElementById('book-form-loading');
    const loadingText = document.getElementById('book-form-loading-text');
    if (loadingOverlay) {
        loadingText.innerText = "Đang dùng Gemini AI phân tích, đúc kết và sắp xếp tài liệu thô...";
        loadingOverlay.style.display = 'flex';
    }

    const prompt = `Bạn là một trợ lý đọc sách thông minh và chuyên gia tóm tắt sách tinh hoa.
Người dùng cung cấp cho bạn một tài liệu ghi chép thô, trích đoạn, ghi chú sao chép hoặc một liên kết URL (Notion, website) sau đây:
---
${rawText}
---

Hãy phân tích kỹ nội dung trên và thực hiện các nhiệm vụ sau:
1. Nhận diện Tên Sách (title) và Tác Giả (author) từ nội dung hoặc liên kết trên. Nếu đầu vào là liên kết Notion (ví dụ: https://www.notion.so/4-Thu-t-y-u-ng-36aad33da669805887d2db54bca2ac7e), hãy nhận diện cuốn sách được đề cập trong slug liên kết (ở đây là "Thuật yêu đương" của tác giả Thu Giang Nguyễn Duy Cần).
2. Viết một Tóm tắt cốt lõi (summary) ngắn gọn dưới 3 dòng, diễn giải thật cô đọng ý nghĩa sâu xa của nội dung này.
3. Chọn một Chủ Đề (category) phù hợp nhất trong 6 lựa chọn: 'Phát triển bản thân', 'Kinh doanh', 'Đầu tư', 'Marketing', 'Tình yêu', hoặc 'Khác'.
4. Đối với Danh mục nội dung (contentDirectory): Hãy giữ NGUYÊN VẸN 100% toàn bộ nội dung văn bản thô được cung cấp (bao gồm tất cả các đoạn văn, lý thuyết, lời giải thích, ví dụ, thơ ca, trích dẫn, chú thích, tuyệt đối không được viết tắt, không lược bỏ hay tóm tắt bất kỳ câu chữ nào). Chỉ điều chỉnh lại bố cục của văn bản thô này cho thật đẹp mắt: thêm tiêu đề dạng "### " cho tên các Chương hoặc tiêu đề lớn (đặt trên một dòng riêng biệt), sử dụng "#### " cho các tiêu đề/đề mục phụ bên trong mỗi chương (đặt trên một dòng riêng biệt), và sử dụng dấu gạch đầu dòng "- " hoặc số thứ tự "1. " cho các mục liệt kê chi tiết (đặt trên các dòng riêng biệt). Bắt buộc phải chèn các ký tự xuống dòng (\n) thực tế giữa các phần để khi hiển thị trong ứng dụng sẽ xuống dòng đẹp mắt, tuyệt đối không được dồn tất cả nội dung thành một dòng.
5. Rút ra 3-5 Bài học hay nhất (lessons) từ nội dung hoặc tri thức sách đó (mỗi bài học 1 dòng). Diễn giải chi tiết, sâu sắc và thuyết phục theo đúng tinh thần và lời dạy trong sách.
6. Trích lọc 2-4 Trích dẫn hay nhất (quotes) có trong tài liệu hoặc tri thức sách đó.
7. Thiết lập 3-4 Hành động thực tế (actions) cụ thể và khả thi mà người đọc nên áp dụng ngay vào cuộc sống/công việc dựa trên bài học trên.

Hãy trả về ĐÚNG định dạng JSON sau, không chứa markdown, không bao quanh bằng \`\`\`json, chỉ chuỗi JSON thô:
{
  "title": "Tên sách",
  "author": "Tác giả",
  "category": "Chủ đề",
  "summary": "Tóm tắt cốt lõi",
  "contentDirectory": "Danh mục nội dung",
  "lessons": ["Bài học 1", "Bài học 2", "Bài học 3"],
  "quotes": ["Trích dẫn 1", "Trích dẫn 2"],
  "actions": ["Hành động 1", "Hành động 2"]
}

Lưu ý:
- Ngôn ngữ bắt buộc: Tiếng Việt.
- Các mục lessons, quotes, actions là mảng chứa các chuỗi thô, KHÔNG bắt đầu bằng dấu gạch ngang '-', dấu sao '*' hay số thứ tự.`;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        author: { type: "STRING" },
                        category: { type: "STRING" },
                        summary: { type: "STRING" },
                        contentDirectory: { type: "STRING" },
                        lessons: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        quotes: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        actions: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["title", "author", "category", "summary", "contentDirectory", "lessons", "quotes", "actions"]
                }
            }
        };

        const result = await callGeminiAPI(payload, apiKey);
        let jsonText = result.candidates[0].content.parts[0].text.trim();

        // Clean markdown block wrapper
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.substring(7);
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.substring(3);
        }
        if (jsonText.endsWith("```")) {
            jsonText = jsonText.substring(0, jsonText.length - 3);
        }
        jsonText = jsonText.trim();

        const data = JSON.parse(jsonText);

        // Populate fields
        if (data.title) document.getElementById('book-form-title').value = data.title;
        if (data.author) document.getElementById('book-form-author').value = data.author;
        if (data.category) document.getElementById('book-form-category').value = data.category;
        if (data.summary) document.getElementById('book-form-summary').value = data.summary;
        if (data.contentDirectory && document.getElementById('book-form-content-directory')) {
            document.getElementById('book-form-content-directory').value = data.contentDirectory;
        }

        if (data.lessons && Array.isArray(data.lessons)) {
            document.getElementById('book-form-lessons').value = data.lessons.map(l => `- ${l}`).join('\n');
        }

        if (data.quotes && Array.isArray(data.quotes)) {
            document.getElementById('book-form-quotes').value = data.quotes.map(q => `“${q}”`).join('\n');
        }

        if (data.actions && Array.isArray(data.actions)) {
            document.getElementById('book-form-actions').value = data.actions.map(a => `- ${a}`).join('\n');
        }

        // Also fetch book cover automatically
        triggerAutoCoverFetch();

        if (window.showToast) window.showToast("Đã phân tích tài liệu và điền các trường tự động!", "success");

    } catch (e) {
        console.error("Gemini AI extraction failed:", e);
        alert(`Không thể trích lọc tài liệu bằng AI. Lỗi: ${e.message}`);
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Extract category insights from raw document input (Notion/Word) using AI
async function extractCategoryInsightsAI() {
    const rawText = document.getElementById('cat-summary-raw-input').value.trim();
    if (!rawText) {
        alert("Vui lòng dán nội dung tài liệu hoặc ghi chú thô của bạn vào ô trống!");
        document.getElementById('cat-summary-raw-input').focus();
        return;
    }

    const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
    if (!apiKey || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
        alert("Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình Key trong file config.js để kích hoạt tính năng AI!");
        return;
    }

    const loadingOverlay = document.getElementById('category-summary-loading');
    const loadingText = document.getElementById('category-summary-loading-text');
    if (loadingOverlay) {
        loadingText.innerText = "Đang dùng Gemini AI phân tích và đúc kết tài liệu thô...";
        loadingOverlay.style.display = 'flex';
    }

    const prompt = `Bạn là một trợ lý đúc kết tri thức thông minh và chuyên gia xử lý tài liệu thô cho chủ đề "${currentCategorySummary}".
Người dùng cung cấp cho bạn một tài liệu ghi chép thô, trích đoạn, ghi chú sao chép hoặc một liên kết URL (Notion, website) sau đây:
---
${rawText}
---

Nhiệm vụ của bạn là:
Hãy phân tích kỹ tài liệu thô trên, giữ NGUYÊN VẸN 100% toàn bộ nội dung văn bản thô được cung cấp (bao gồm tất cả các đoạn văn, lý thuyết, ý kiến, ví dụ, thơ ca, trích dẫn, chú thích, tuyệt đối không được viết tắt, không lược bỏ hay tóm tắt bất kỳ câu chữ nào).
Chỉ thực hiện việc điều chỉnh lại cấu trúc, bố cục văn bản cho thật đẹp mắt và khoa học ở định dạng Markdown:
1. Định dạng các tiêu đề chương hoặc phần lớn bằng ký hiệu '### ' (đặt trên dòng riêng biệt).
2. Định dạng các đề mục nhỏ, tiêu đề phụ bằng ký hiệu '#### ' (đặt trên dòng riêng biệt).
3. Thụt lề các nội dung chi tiết/đoạn văn bản/mục liệt kê bằng dấu gạch đầu dòng '- ' hoặc danh sách số '1. ' (để thụt đầu dòng một tab, chèn thêm 2 hoặc 4 khoảng trắng ở trước dấu gạch đầu dòng, ví dụ: '  - ').
4. Dùng các thẻ định dạng in đậm (**), in nghiêng (*), gạch chân (<u>...</u>), highlight (<mark>...</mark>), canh giữa (<center>...</center>) một cách hợp lý và thẩm mỹ cao để làm nổi bật các đề mục, từ khóa quan trọng hoặc số thứ tự đầu câu.
5. Bắt buộc phải chèn các ký tự xuống dòng (\n) thực tế giữa các phần để khi hiển thị trong ứng dụng sẽ xuống dòng đẹp mắt, tuyệt đối không được dồn tất cả nội dung thành một dòng.

Lưu ý:
- Ngôn ngữ bắt buộc: Tiếng Việt.
- Chỉ trả về nội dung Markdown đã được định dạng và cấu trúc lại, tuyệt đối không kèm theo bất kỳ lời giới thiệu, lời giải thích hay bất kỳ ký tự nào bên ngoài văn bản, không bao quanh bằng \`\`\`markdown hay \`\`\` hay bất kỳ ký tự nào khác.`;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const result = await callGeminiAPI(payload, apiKey);
        let text = result.candidates[0].content.parts[0].text.trim();

        // Clean markdown block wrapper if any
        if (text.startsWith("```markdown")) {
            text = text.substring(11);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length - 3);
        }
        text = text.trim();

        document.getElementById('cat-summary-user-text').value = text;
        if (window.showToast) window.showToast("Đã phân tích tài liệu và điền đúc kết tự động!", "success");

    } catch (e) {
        console.error("Gemini AI category extraction failed:", e);
        alert(`Không thể trích lọc tài liệu bằng AI. Lỗi: ${e.message}`);
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Helper to parse Gemini error response if request was not successful
async function checkResponseOk(response) {
    if (!response.ok) {
        let errorMsg = `status: ${response.status}`;
        try {
            const errJson = await response.json();
            if (errJson && errJson.error && errJson.error.message) {
                errorMsg = errJson.error.message;
            }
        } catch (_) {}
        throw new Error(`Gemini API HTTP error! ${errorMsg}`);
    }
}

// Helper to apply inline formatting styles
function applyInlineStyles(text) {
    if (!text) return '';
    // 1. Underline
    text = text.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<span style="text-decoration: underline;">$1</span>');
    // 2. Highlight
    text = text.replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, '<mark class="markdown-mark" style="background-color: #fef08a; color: #854d0e; padding: 0.1rem 0.2rem; border-radius: 4px;">$1</mark>');
    // 3. Strikethrough
    text = text.replace(/~~([\s\S]*?)~~/g, '<del class="markdown-del" style="text-decoration: line-through;">$1</del>');
    // 4. Alignments
    text = text.replace(/&lt;left&gt;([\s\S]*?)&lt;\/left&gt;/gi, '<span style="display: block; text-align: left;">$1</span>');
    text = text.replace(/&lt;center&gt;([\s\S]*?)&lt;\/center&gt;/gi, '<span style="display: block; text-align: center;">$1</span>');
    text = text.replace(/&lt;right&gt;([\s\S]*?)&lt;\/right&gt;/gi, '<span style="display: block; text-align: right;">$1</span>');
    text = text.replace(/&lt;justify&gt;([\s\S]*?)&lt;\/justify&gt;/gi, '<span style="display: block; text-align: justify; text-justify: inter-word;">$1</span>');
    // 5. Bold (double asterisks)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>');
    // 6. Italic (single asterisk)
    text = text.replace(/\*(.*?)\*/g, '<em class="markdown-em" style="font-style: italic;">$1</em>');
    return text;
}

// A simple, elegant markdown-to-HTML parser for AI generated content
function parseMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    // First, escape HTML characters to avoid injection/formatting issues
    let escaped = escapeHtml(markdown.trim());
    
    // Split into lines
    const lines = escaped.split('\n');
    
    let inList = false;
    let inDetails = false;
    let newLines = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        
        // 1. Parse horizontal rules: --- or ***
        if (trimmed === '---' || trimmed === '***') {
            if (inList) { newLines.push('</ul>'); inList = false; }
            newLines.push('<hr class="markdown-hr">');
            return;
        }
        
        // 2. Parse Chapter Headings (interactive toggles): ### Title
        const matchH3 = trimmed.match(/^###\s+(.*)$/);
        if (matchH3) {
            if (inList) { newLines.push('</ul>'); inList = false; }
            if (inDetails) { newLines.push('</details>'); }
            
            const title = applyInlineStyles(matchH3[1]);
            newLines.push(`<details class="markdown-details"><summary class="markdown-summary">${title}</summary>`);
            inDetails = true;
            return;
        }

        // 2.5. Parse Headings: #### Title (Subheadings inside chapter)
        const matchH4 = trimmed.match(/^####\s+(.*)$/);
        if (matchH4) {
            if (inList) { newLines.push('</ul>'); inList = false; }
            const title = applyInlineStyles(matchH4[1]);
            newLines.push(`<h4 class="markdown-h3">${title}</h4>`);
            return;
        }
        
        // 3. Parse Headings: ## Title
        const matchH2 = trimmed.match(/^##\s+(.*)$/);
        if (matchH2) {
            if (inList) { newLines.push('</ul>'); inList = false; }
            if (inDetails) { newLines.push('</details>'); inDetails = false; }
            
            const title = applyInlineStyles(matchH2[1]);
            newLines.push(`<h3 class="markdown-h2">${title}</h3>`);
            return;
        }
        
        // 4. Parse Headings: # Title
        const matchH1 = trimmed.match(/^#\s+(.*)$/);
        if (matchH1) {
            if (inList) { newLines.push('</ul>'); inList = false; }
            if (inDetails) { newLines.push('</details>'); inDetails = false; }
            
            const title = applyInlineStyles(matchH1[1]);
            newLines.push(`<h2 class="markdown-h1">${title}</h2>`);
            return;
        }
        
        // 5. Parse bullet items: - item or * item
        const matchBullet = trimmed.match(/^[-*]\s+(.*)$/);
        if (matchBullet) {
            let itemContent = applyInlineStyles(matchBullet[1]);
            
            if (!inList) {
                newLines.push('<ul class="markdown-ul">');
                inList = true;
            }
            newLines.push(`<li class="markdown-li">${itemContent}</li>`);
            return;
        }
        
        // 6. Parse numbered list items: 1. item
        const matchNum = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (matchNum) {
            if (inList) { newLines.push('</ul>'); inList = false; }
            
            const num = matchNum[1];
            let itemContent = applyInlineStyles(matchNum[2]);
            
            newLines.push(`<p class="markdown-p"><strong class="markdown-strong markdown-num-prefix" style="text-decoration: underline;">${num}.</strong> ${itemContent}</p>`);
            return;
        }
        
        // 7. Empty lines
        if (trimmed === '') {
            if (inList) { newLines.push('</ul>'); inList = false; }
            newLines.push('<div class="markdown-spacer"></div>');
            return;
        }
        
        // 8. Normal text lines
        if (inList) { newLines.push('</ul>'); inList = false; }
        
        let content = applyInlineStyles(trimmed);
        newLines.push(`<p class="markdown-p">${content}</p>`);
    });
    
    // Close any open tags at the end
    if (inList) { newLines.push('</ul>'); }
    if (inDetails) { newLines.push('</details>'); }
    
    return newLines.join('\n');
}

// Generic fetch wrapper with automatic retry for 503 (Service Unavailable) and 429 (Rate Limit) errors
async function fetchWithRetry(url, options, retries = 4, delay = 2000) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            if ((response.status === 503 || response.status === 429) && i < retries) {
                console.warn(`Gemini API returned ${response.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // exponential backoff
                continue;
            }
            return response;
        } catch (e) {
            if (i === retries) throw e;
            console.warn(`Fetch failed with error: ${e.message}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
}

// Utility function to escape HTML characters
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Fetch book cover from Google Books API
async function fetchBookCover(title, author) {
    if (!title) return null;
    try {
        const query = encodeURIComponent(`intitle:${title}${author ? ' inauthor:' + author : ''}`);
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const volumeInfo = data.items[0].volumeInfo;
            if (volumeInfo.imageLinks) {
                let url = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
                if (url) {
                    return url.replace('http://', 'https://');
                }
            }
        }
    } catch (e) {
        console.error("Error fetching cover from Google Books API:", e);
    }
    return null;
}

// Update the book form cover preview UI
function updateFormCoverPreview(url) {
    const previewImg = document.getElementById('book-form-cover-preview-img');
    const inputCoverUrl = document.getElementById('book-form-cover-url');
    
    if (inputCoverUrl) inputCoverUrl.value = url || '';
    
    if (previewImg) {
        if (url) {
            previewImg.src = url;
            previewImg.style.display = 'block';
        } else {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
    }
}

let lastFetchedKey = "";

// Trigger automatic search for book cover
async function triggerAutoCoverFetch() {
    const title = document.getElementById('book-form-title').value.trim();
    const author = document.getElementById('book-form-author').value.trim();
    
    if (!title) return;
    
    const key = `${title.toLowerCase()}||${author.toLowerCase()}`;
    if (key === lastFetchedKey) return;
    
    lastFetchedKey = key;
    const url = await fetchBookCover(title, author);
    if (url) {
        updateFormCoverPreview(url);
    }
}

let categorySummariesCache = [];
let currentCategorySummary = null;

const CATEGORY_META = {
    "Phát triển bản thân": { icon: "🌱", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", class: "theme-self-dev" },
    "Kinh doanh": { icon: "💼", gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)", class: "theme-business" },
    "Đầu tư": { icon: "📈", gradient: "linear-gradient(135deg, #10b981, #047857)", class: "theme-investment" },
    "Marketing": { icon: "📣", gradient: "linear-gradient(135deg, #ec4899, #be185d)", class: "theme-marketing" },
    "Tình yêu": { icon: "❤️", gradient: "linear-gradient(135deg, #f43f5e, #be123c)", class: "theme-love" },
    "Khác": { icon: "🧩", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)", class: "theme-other" }
};

// 7. WISDOM HUB (CATEGORY SUMMARIES) DATA LAYER
async function loadCategorySummaries() {
    // Read from localStorage
    const local = localStorage.getItem('category_summaries_cache_v2');
    if (local) {
        try {
            categorySummariesCache = JSON.parse(local);
        } catch(e) {}
    }
    
    // Rerender cards if wisdom wrapper is visible
    const wisdomWrapper = document.getElementById('categories-summary-wrapper');
    if (wisdomWrapper && wisdomWrapper.style.display !== 'none') {
        renderCategorySummaries();
    }
    
    // Fetch from sheet API
    try {
        const res = await callBooksApi("get_category_summaries");
        if (res && res.status === "success" && res.data && res.data.length > 1) {
            const parsed = [];
            for (let i = 1; i < res.data.length; i++) {
                const r = res.data[i];
                if (!r[0]) continue;
                parsed.push({
                    category: r[0],
                    userSummary: r[1] || "",
                    aiSummary: r[2] || "",
                    updatedAt: r[3] || ""
                });
            }
            categorySummariesCache = parsed;
            localStorage.setItem('category_summaries_cache_v2', JSON.stringify(categorySummariesCache));
            if (wisdomWrapper && wisdomWrapper.style.display !== 'none') {
                renderCategorySummaries();
            }
        }
    } catch(e) {
        console.error("Error loading category summaries from sheet:", e);
    }
}

// Save Category Summary
async function saveCategorySummary() {
    if (!currentCategorySummary) return;
    
    const userVal = document.getElementById('cat-summary-user-text').value.trim();
    
    // Get existing record
    let record = categorySummariesCache.find(c => c.category === currentCategorySummary);
    if (!record) {
        record = {
            category: currentCategorySummary,
            userSummary: userVal,
            aiSummary: "",
            updatedAt: new Date().toLocaleString('vi-VN')
        };
        categorySummariesCache.push(record);
    } else {
        record.userSummary = userVal;
        record.updatedAt = new Date().toLocaleString('vi-VN');
    }
    
    // Save to Cache immediately
    localStorage.setItem('category_summaries_cache_v2', JSON.stringify(categorySummariesCache));
    renderCategorySummaries();
    
    // Render Markdown to HTML and update View Mode Content
    const viewWrapper = document.getElementById('cat-summary-view-wrapper');
    if (viewWrapper) {
        viewWrapper.innerHTML = userVal ? parseMarkdownToHtml(userVal) : '<p class="markdown-p" style="color: #94a3b8; font-style: italic;">Chưa có đúc kết cá nhân cho chủ đề này. Bấm "Sửa nhanh" để bắt đầu viết đúc kết!</p>';
    }
    
    // Switch back to View Mode
    const editWrapper = document.getElementById('cat-summary-edit-wrapper');
    const editBtn = document.getElementById('btn-quick-edit-cat-summary');
    const closeBtn = document.getElementById('cat-summary-close-btn');
    const cancelBtn = document.getElementById('cat-summary-cancel-btn');
    const saveBtn = document.getElementById('cat-summary-save-btn');
    
    if (viewWrapper) viewWrapper.style.display = 'block';
    if (editWrapper) editWrapper.style.display = 'none';
    if (editBtn) editBtn.style.display = 'flex';
    if (closeBtn) closeBtn.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    
    // Đưa vào queue đồng bộ — không chờ API, không cursor wait
    try {
        const catQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
        // Xóa item cũ cùng category nếu có trong queue
        const filteredQueue = catQueue.filter(item =>
            !(item.action === 'category_summary_save' && item.data && item.data.category === record.category)
        );
        filteredQueue.push({
            action: 'category_summary_save',
            data: record,
            clientId: 'CATSUM_' + record.category + '_' + Date.now(),
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('books_sync_queue', JSON.stringify(filteredQueue));
    } catch(qErr) {
        console.warn('[BooksQueue] Failed to queue category summary save:', qErr);
    }

    if (window.showToast) {
        window.showToast("Đã lưu đúc kết cục bộ — đang đồng bộ lên đám mây trong nền... ☁️", "info");
    }

    // Xử lý queue trong nền
    setTimeout(() => {
        if (typeof window.processBooksQueue === 'function') {
            window.processBooksQueue();
        }
    }, 100);
}

// Synthesize Theme Wisdom using Gemini AI
async function synthesizeCategoryAI() {
    if (!currentCategorySummary) return;
    
    // Get all books in this category
    const categoryBooks = booksCache.filter(b => b.category === currentCategorySummary);
    if (categoryBooks.length === 0) {
        alert(`Bạn cần thêm ít nhất một cuốn sách vào chủ đề "${currentCategorySummary}" trước khi yêu cầu AI tổng hợp cẩm nang tri thức!`);
        return;
    }
    
    const apiKey = (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "") || "";
    if (!apiKey || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
        alert("Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình Key để sử dụng tính năng tổng hợp AI!");
        return;
    }
    
    const loadingOverlay = document.getElementById('category-summary-loading');
    const loadingText = document.getElementById('category-summary-loading-text');
    if (loadingOverlay) {
        loadingText.innerText = `Đang phân tích hệ thống bài học và trích dẫn từ ${categoryBooks.length} cuốn sách thuộc lĩnh vực "${currentCategorySummary}"...`;
        loadingOverlay.style.display = 'flex';
    }
    
    // Build books compilation text
    const booksCompilation = categoryBooks.map((b, idx) => {
        return `[CUỐN SÁCH #${idx + 1}]
Tiêu đề: ${b.title}
Tác giả: ${b.author}
Tóm tắt sơ lược: ${b.summary || "Chưa cập nhật"}
Bài học rút ra:
${b.lessons || "Chưa cập nhật"}
Trích dẫn tiêu biểu:
${b.quotes || "Chưa cập nhật"}`;
    }).join('\n\n====================\n\n');
    
    const prompt = `Bạn là một nhà tư tưởng lớn và một chuyên gia đúc kết tri thức siêu hạng.
Tôi cung cấp cho bạn danh sách ${categoryBooks.length} cuốn sách cùng tóm tắt và những bài học tôi đã học được từ chúng trong lĩnh vực "${currentCategorySummary}":

${booksCompilation}

Nhiệm vụ của bạn:
Hãy phân tích sâu sắc, xâu chuỗi toàn bộ bài học trên và viết một bài tổng hợp tinh hoa triết lý, cẩm nang tư duy bất biến cho lĩnh vực "${currentCategorySummary}".
Bài viết cần được chia làm các phần rõ ràng, mạch lạc, ngôn từ đúc kết đắt giá và truyền cảm hứng mạnh mẽ:
1. HỆ TƯ DUY CỐT LÕI (Tổng hợp thế giới quan cốt lõi nhất của lĩnh vực này)
2. CÁC NGUYÊN TẮC VÀNG BẤT BIẾN (3-5 luật lệ, nguyên lý xương máu bắt buộc phải tuân theo)
3. KẾ HOẠCH HÀNH ĐỘNG THỰC TẾ (Cách thức áp dụng tổng hợp vào thực tế cuộc sống)

Yêu cầu định dạng:
- Ngôn ngữ: Tiếng Việt.
- Dùng các ký hiệu markdown cơ bản như tiêu đề (###), danh sách gạch đầu dòng (-) để dễ đọc.
- Viết sâu sắc, chặt chẽ, không sáo rỗng. Tránh việc chỉ liệt kê lại từng quyển sách một cách rời rạc, hãy TỔNG HỢP chúng lại thành một triết lý thống nhất.`;

    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const result = await callGeminiAPI(payload, apiKey);
        let text = result.candidates[0].content.parts[0].text;
        
        // Clean markdown wrapper
        text = text.trim();
        
        // Save to cache
        let record = categorySummariesCache.find(c => c.category === currentCategorySummary);
        if (!record) {
            record = {
                category: currentCategorySummary,
                userSummary: "",
                aiSummary: text,
                updatedAt: new Date().toLocaleString('vi-VN')
            };
            categorySummariesCache.push(record);
        } else {
            record.aiSummary = text;
            record.updatedAt = new Date().toLocaleString('vi-VN');
        }
        
        localStorage.setItem('category_summaries_cache_v2', JSON.stringify(categorySummariesCache));
        
        // Populate DOM and switch tab to AI
        const aiTextEl = document.getElementById('cat-summary-ai-text');
        if (aiTextEl) {
            aiTextEl.innerHTML = parseMarkdownToHtml(text);
        }
        
        // Click the AI tab to show result immediately
        const aiTabBtn = document.querySelector('.cat-tab-btn[data-target="cat-tab-ai"]');
        if (aiTabBtn) aiTabBtn.click();
        
        // Save to Sheets online
        try {
            await callBooksApi("save_category_summary", { data: record });
        } catch(e) {}
        
        if (window.showToast) window.showToast("Gemini AI đã tổng hợp thành công triết lý chủ đề!", "success");

    } catch (e) {
        console.error("Synthesize Category AI Failed:", e);
        alert(`Không thể tổng hợp bằng AI. Lỗi: ${e.message}`);
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Render theme summary cards
function renderCategorySummaries() {
    const grid = document.getElementById('categories-summary-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const categories = Object.keys(CATEGORY_META);
    categories.forEach(cat => {
        const meta = CATEGORY_META[cat];
        
        // Count books belonging to this category
        const booksCount = booksCache.filter(b => b.category === cat).length;
        
        // Get summary record
        const record = categorySummariesCache.find(c => c.category === cat);
        let snippet = "Chưa có đúc kết nào cho chủ đề này. Hãy click để viết hoặc sử dụng trợ lý AI tổng hợp tinh túy từ các cuốn sách bạn đã đọc.";
        if (record) {
            snippet = record.userSummary || record.aiSummary || snippet;
        }
        
        // Limit snippet to 150 chars
        if (snippet.length > 150) {
            snippet = snippet.substring(0, 147) + "...";
        }
        
        const card = document.createElement('div');
        card.className = 'category-summary-card';
        card.onclick = () => openCategorySummaryDetail(cat);
        
        card.innerHTML = `
            <div class="category-summary-card-header">
                <div class="category-summary-card-header-bg" style="background: ${meta.gradient};"></div>
                <div class="category-summary-card-header-icon">${meta.icon}</div>
                <h3 class="category-summary-card-header-title">${cat}</h3>
            </div>
            <div class="category-summary-card-body">
                <span class="category-summary-card-books-badge">${booksCount} cuốn sách</span>
                <p class="category-summary-card-snippet">${escapeHtml(snippet)}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Open Category Summary Modal
function openCategorySummaryDetail(category) {
    currentCategorySummary = category;
    const meta = CATEGORY_META[category];
    if (!meta) return;
    
    // Fill left panel
    const modalTitleEl = document.getElementById('category-summary-modal-title');
    if (modalTitleEl) {
        modalTitleEl.innerText = `Tổng Hợp Tinh Hoa Lĩnh Vực: ${category}`;
    }
    document.getElementById('cat-summary-title').innerText = category;
    document.getElementById('cat-summary-cover-title').innerText = category;
    document.getElementById('cat-summary-cover-icon').innerText = meta.icon;
    document.getElementById('cat-summary-cover').style.background = meta.gradient;
    
    // Book count
    const booksCount = booksCache.filter(b => b.category === category).length;
    document.getElementById('cat-summary-books-count').innerText = `${booksCount} cuốn sách`;
    
    // Reset raw notes input area
    const rawInputEl = document.getElementById('cat-summary-raw-input');
    if (rawInputEl) {
        rawInputEl.value = '';
    }
    
    // Set default View Mode elements
    const viewWrapper = document.getElementById('cat-summary-view-wrapper');
    const editWrapper = document.getElementById('cat-summary-edit-wrapper');
    const editBtn = document.getElementById('btn-quick-edit-cat-summary');
    const closeBtn = document.getElementById('cat-summary-close-btn');
    const cancelBtn = document.getElementById('cat-summary-cancel-btn');
    const saveBtn = document.getElementById('cat-summary-save-btn');
    
    if (viewWrapper) viewWrapper.style.display = 'block';
    if (editWrapper) editWrapper.style.display = 'none';
    if (editBtn) editBtn.style.display = 'flex';
    if (closeBtn) closeBtn.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    
    // Load existing summary
    const record = categorySummariesCache.find(c => c.category === category);
    const userText = record ? (record.userSummary || '') : '';
    document.getElementById('cat-summary-user-text').value = userText;
    
    if (viewWrapper) {
        viewWrapper.innerHTML = userText ? parseMarkdownToHtml(userText) : '<p class="markdown-p" style="color: #94a3b8; font-style: italic;">Chưa có đúc kết cá nhân cho chủ đề này. Bấm "Sửa nhanh" để bắt đầu viết đúc kết!</p>';
    }
    
    // Display Modal
    const modal = document.getElementById('category-summary-modal');
    if (modal) modal.style.display = 'flex';
}

// Close Category Summary Modal
function closeCategorySummaryModal() {
    const modal = document.getElementById('category-summary-modal');
    if (modal) modal.style.display = 'none';
}

// 8. BOOKS OFFLINE SYNC QUEUE PROCESSOR
// Processes pending book saves from the books_sync_queue when network is available
async function processBooksQueue() {
    if (!navigator.onLine) return;
    
    const queue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
    if (queue.length === 0) return;
    
    console.log('[BooksQueue] Processing', queue.length, 'pending book saves...');
    
    for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (item.action === 'book_save') {
            try {
                const res = await callBooksApi('save_book_record', { data: item.data });
                if (res && res.status === 'success') {
                    // Remove from queue
                    const updatedQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
                    localStorage.setItem('books_sync_queue', JSON.stringify(
                        updatedQueue.filter(x => x.clientId !== item.clientId)
                    ));
                    console.log('[BooksQueue] Synced book:', item.bookId);
                } else {
                    console.warn('[BooksQueue] Failed to sync book:', item.bookId, res);
                    break; // Stop on failure, retry later
                }
            } catch(e) {
                console.warn('[BooksQueue] Network error syncing book:', e.message);
                break;
            }
        } else if (item.action === 'category_summary_save') {
            try {
                const res = await callBooksApi('save_category_summary', { data: item.data });
                if (res && res.status === 'success') {
                    const updatedQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
                    localStorage.setItem('books_sync_queue', JSON.stringify(
                        updatedQueue.filter(x => x.clientId !== item.clientId)
                    ));
                    console.log('[BooksQueue] Synced category summary:', item.data && item.data.category);
                } else {
                    console.warn('[BooksQueue] Failed to sync category summary:', item.data && item.data.category, res);
                    break;
                }
            } catch(e) {
                console.warn('[BooksQueue] Network error syncing category summary:', e.message);
                break;
            }
        } else if (item.action === 'cong_qua_cach_save') {
            try {
                const res = await callBooksApi('save_cong_qua_cach_record', { data: item.data });
                if (res && res.status === 'success') {
                    const updatedQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
                    localStorage.setItem('books_sync_queue', JSON.stringify(
                        updatedQueue.filter(x => x.clientId !== item.clientId)
                    ));
                    console.log('[BooksQueue] Synced cong qua cach log:', item.data.id);
                } else {
                    console.warn('[BooksQueue] Failed to sync cong qua cach log:', item.data.id, res);
                    break;
                }
            } catch(e) {
                console.warn('[BooksQueue] Network error syncing cong qua cach log:', e.message);
                break;
            }
        } else if (item.action === 'cong_qua_cach_delete') {
            try {
                const res = await callBooksApi('delete_cong_qua_cach_record', { id: item.data.id });
                if (res && res.status === 'success') {
                    const updatedQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
                    localStorage.setItem('books_sync_queue', JSON.stringify(
                        updatedQueue.filter(x => x.clientId !== item.clientId)
                    ));
                    console.log('[BooksQueue] Synced delete cong qua cach log:', item.data.id);
                } else {
                    console.warn('[BooksQueue] Failed to sync delete cong qua cach log:', item.data.id, res);
                    break;
                }
            } catch(e) {
                console.warn('[BooksQueue] Network error syncing delete cong qua cach log:', e.message);
                break;
            }
        } else if (item.action === 'cong_qua_cach_reset') {
            try {
                const res = await callBooksApi('reset_cong_qua_cach');
                if (res && res.status === 'success') {
                    const updatedQueue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
                    localStorage.setItem('books_sync_queue', JSON.stringify(
                        updatedQueue.filter(x => x.clientId !== item.clientId)
                    ));
                    console.log('[BooksQueue] Synced reset cong qua cach');
                } else {
                    console.warn('[BooksQueue] Failed to sync reset cong qua cach:', res);
                    break;
                }
            } catch(e) {
                console.warn('[BooksQueue] Network error syncing reset cong qua cach:', e.message);
                break;
            }
        }
    }
    
    const remaining = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
    if (remaining.length === 0) {
        if (window.showToast) {
            window.showToast('Đã đồng bộ tất cả dữ liệu sách lên đám mây! ☁️', 'success');
        }
        loadBookData();
    }
}

// Auto-process queue when coming back online
window.addEventListener('online', () => {
    setTimeout(processBooksQueue, 1000);
});

// =========================================================================
// CÔNG QUÁ CÁCH (LEDGER OF MERITS & DEMERITS) MODULE IMPLEMENTATION
// =========================================================================

let congQuaCachCache = [];

const QUICK_SUGGESTIONS_CONG = [
    { text: "Giúp đỡ người gặp khó khăn hoạn nạn", points: 3, area: "xa-hoi" },
    { text: "Lắng nghe ôn hòa, cẩn trọng khi bị phê bình", points: 2, area: "ban-than" },
    { text: "Sống tiết kiệm, giản dị, không hoang phí của cải", points: 1, area: "ban-than" },
    { text: "Quan tâm hỏi han, chăm sóc cha mẹ, gia đình", points: 5, area: "gia-dinh" },
    { text: "Làm việc có ích cho cộng đồng, không mưu cầu báo đáp", points: 3, area: "xa-hoi" },
    { text: "Kiên quyết cắt bỏ thói quen xấu, suy nghĩ độc hại", points: 5, area: "ban-than" }
];

const QUICK_SUGGESTIONS_QUA = [
    { text: "Nổi nóng vô cớ, cáu giận gây mệt mỏi cho người khác", points: 30, area: "ban-than", lesson: "Hít sâu 3 nhịp trước khi phản ứng, học cách lắng nghe ôn hòa và quản trị cơn giận." },
    { text: "Nói dối, nói lời ác ý gây tổn thương hoặc hiểu lầm", points: 30, area: "xa-hoi", lesson: "Nói lời chân thật, ái ngữ, cẩn trọng lời nói để xây dựng niềm tin." },
    { text: "Lười biếng, sa ngã vào thói quen độc hại, trì hoãn", points: 20, area: "ban-than", lesson: "Bắt tay vào việc ngay trong 5 giây đầu tiên, rèn luyện tính kỷ luật tự thân." },
    { text: "Lãng phí đồ ăn, thức uống, tiền bạc vô ích", points: 10, area: "ban-than", lesson: "Sử dụng của cải vừa đủ, trân quý thực phẩm và chi tiêu đúng mục đích." },
    { text: "Bất kính, vô lễ hoặc thiếu tôn trọng người lớn tuổi/cha mẹ", points: 50, area: "gia-dinh", lesson: "Giữ thái độ khiêm nhường, hiếu kính, lắng nghe lời dạy bảo của người lớn." },
    { text: "Ích kỷ, thờ ơ không giúp đỡ khi người khác gặp nạn", points: 30, area: "xa-hoi", lesson: "Mở lòng nhân ái, sẵn sàng chia sẻ và giúp đỡ mọi người xung quanh." }
];

function initCongQuaCach() {
    // 1. Initialise form dates
    const dateInputCong = document.getElementById('cqc-input-date-cong');
    const dateInputQua = document.getElementById('cqc-input-date-qua');
    const todayStr = new Date().toISOString().substring(0, 10);
    if (dateInputCong && !dateInputCong.value) dateInputCong.value = todayStr;
    if (dateInputQua && !dateInputQua.value) dateInputQua.value = todayStr;

    // 2. Render quick suggestions
    renderQuickSuggestions();

    // 3. Register Form Submit for Tích Đức
    const addFormCong = document.getElementById('cqc-add-form-cong');
    if (addFormCong) {
        addFormCong.onsubmit = (e) => {
            e.preventDefault();
            const desc = document.getElementById('cqc-input-desc-cong').value.trim();
            const area = document.getElementById('cqc-input-area-cong').value;
            const points = parseInt(document.getElementById('cqc-input-points-cong').value) || 1;
            const date = document.getElementById('cqc-input-date-cong').value;
            
            if (!desc) {
                alert("Vui lòng nhập chi tiết hành vi!");
                return;
            }

            const record = {
                id: 'CQC_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                type: 'cong',
                description: desc,
                area: area,
                points: points,
                date: date,
                createdAt: new Date().toLocaleString('vi-VN')
            };

            saveCongQuaCachLog(record);
            
            // Clear description
            document.getElementById('cqc-input-desc-cong').value = '';
            if (window.showToast) {
                window.showToast("Đã lưu việc thiện! Lành thay! 🙏", "success");
            }
        };
    }

    // 4. Register Form Submit for Sửa Mình
    const addFormQua = document.getElementById('cqc-add-form-qua');
    if (addFormQua) {
        addFormQua.onsubmit = (e) => {
            e.preventDefault();
            const desc = document.getElementById('cqc-input-desc-qua').value.trim();
            const area = document.getElementById('cqc-input-area-qua').value;
            let points = parseInt(document.getElementById('cqc-input-points-qua').value) || 10;
            if (points < 10) points = 10; // Trừ tối thiểu 10 điểm
            const lesson = document.getElementById('cqc-input-lesson-qua') ? document.getElementById('cqc-input-lesson-qua').value.trim() : '';
            const date = document.getElementById('cqc-input-date-qua').value;
            
            if (!desc) {
                alert("Vui lòng nhập chi tiết lỗi lầm!");
                return;
            }

            // Helper for description similarity check
            const getCleanDesc = (text) => {
                return text.toLowerCase()
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_\`~()?]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
            };

            const isSimilar = (str1, str2) => {
                const clean1 = getCleanDesc(str1);
                const clean2 = getCleanDesc(str2);
                if (clean1 === clean2) return true;
                if (clean1.length > 6 && clean2.length > 6) {
                    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
                }
                return false;
            };

            // Calculate progressive points for repeat occurrences within 7 days
            const cleanNew = getCleanDesc(desc);
            const inputDate = new Date(date);
            
            const recentMatches = (congQuaCachCache || []).filter(item => {
                if (item.type !== 'qua') return false;
                if (!isSimilar(item.description, desc)) return false;
                
                const itemDate = new Date(item.date);
                const diffTime = Math.abs(inputDate - itemDate);
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays <= 7;
            });

            const matchCount = recentMatches.length;
            let finalPoints = points;
            let progressive = null;
            
            if (matchCount > 0) {
                let multiplier = 1.0;
                if (matchCount === 1) {
                    multiplier = 1.5;
                } else if (matchCount === 2) {
                    multiplier = 2.0;
                } else {
                    multiplier = 3.0;
                }
                finalPoints = Math.round(points * multiplier);
                progressive = {
                    matchCount: matchCount,
                    originalPoints: points,
                    multiplier: multiplier
                };
            }

            const record = {
                id: 'CQC_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                type: 'qua',
                description: desc,
                area: area,
                points: finalPoints,
                date: date,
                lesson: lesson,
                progressive: progressive,
                createdAt: new Date().toLocaleString('vi-VN')
            };

            saveCongQuaCachLog(record);
            
            // Clear description and lesson
            document.getElementById('cqc-input-desc-qua').value = '';
            if (document.getElementById('cqc-input-lesson-qua')) {
                document.getElementById('cqc-input-lesson-qua').value = '';
            }
            if (window.showToast) {
                if (progressive) {
                    window.showToast(`Phát hiện lỗi lặp lại lần ${matchCount + 1} trong 7 ngày! Lũy tiến ${progressive.multiplier}x (Trừ ${finalPoints} điểm) 🧘`, "warning");
                } else {
                    window.showToast("Đã ghi nhận lỗi lầm & bài học sửa mình! 🧘", "warning");
                }
            }
        };
    }

    // 5. Register Reset Destiny button
    const resetBtn = document.getElementById('btn-reset-destiny');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (!confirm("Bạn có chắc chắn muốn 'Reset cuộc đời'?\nHành động này sẽ xóa sạch toàn bộ lịch sử điểm Công đức và Lỗi lầm để bạn bắt đầu lại từ đầu.")) return;
            if (!confirm("XÁC NHẬN LẦN CUỐI: Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn khỏi trình duyệt (và đám mây sau khi đồng bộ). Bạn vẫn muốn tiếp tục?")) return;
            
            resetCongQuaCach();
        };
    }

    // Load initial logs
    loadCongQuaCachData();
}

function renderQuickSuggestions() {
    const cContainer = document.getElementById('cqc-suggestions-cong');
    const qContainer = document.getElementById('cqc-suggestions-qua');
    
    if (cContainer) {
        cContainer.innerHTML = QUICK_SUGGESTIONS_CONG.map(s => {
            return `
                <button type="button" class="cqc-suggest-pill cqc-suggest-pill-cong" onclick="prefillCqcForm('cong', '${escapeHtml(s.text)}', '${s.area}', ${s.points})">
                    <span>${escapeHtml(s.text)}</span>
                    <span class="cqc-suggest-points cqc-suggest-points-cong">+${s.points}</span>
                </button>
            `;
        }).join('');
    }
    
    if (qContainer) {
        qContainer.innerHTML = QUICK_SUGGESTIONS_QUA.map(s => {
            return `
                <button type="button" class="cqc-suggest-pill cqc-suggest-pill-qua" onclick="prefillCqcForm('qua', '${escapeHtml(s.text)}', '${s.area}', ${s.points}, '${escapeHtml(s.lesson || '')}')">
                    <span>${escapeHtml(s.text)}</span>
                    <span class="cqc-suggest-points cqc-suggest-points-qua">-${s.points}</span>
                </button>
            `;
        }).join('');
    }
}

function prefillCqcForm(type, text, area, points, lesson = '') {
    if (type === 'cong') {
        const descTextarea = document.getElementById('cqc-input-desc-cong');
        if (descTextarea) {
            descTextarea.value = text;
            descTextarea.focus();
        }
        const areaSelect = document.getElementById('cqc-input-area-cong');
        if (areaSelect) areaSelect.value = area;
        
        const pointsSelect = document.getElementById('cqc-input-points-cong');
        if (pointsSelect) pointsSelect.value = points;
    } else {
        const descTextarea = document.getElementById('cqc-input-desc-qua');
        if (descTextarea) {
            descTextarea.value = text;
            descTextarea.focus();
        }
        const areaSelect = document.getElementById('cqc-input-area-qua');
        if (areaSelect) areaSelect.value = area;
        
        const pointsSelect = document.getElementById('cqc-input-points-qua');
        if (pointsSelect) pointsSelect.value = points;
        
        const lessonTextarea = document.getElementById('cqc-input-lesson-qua');
        if (lessonTextarea) {
            lessonTextarea.value = lesson;
        }
    }
    
    if (window.showToast) {
        window.showToast("Đã điền gợi ý nhanh — hãy bấm nút Lưu tương ứng để hoàn tất!", "info");
    }
}

async function loadCongQuaCachData() {
    // 1. Load from local cache
    const cached = localStorage.getItem('cong_qua_cach_logs');
    if (cached) {
        try {
            congQuaCachCache = JSON.parse(cached);
        } catch(e) {
            congQuaCachCache = [];
        }
    } else {
        congQuaCachCache = [];
    }
    
    renderCongQuaCach();
    
    // 2. Fetch from cloud
    if (navigator.onLine) {
        try {
            const res = await callBooksApi("get_cong_qua_cach_data");
            if (res && res.status === "success" && Array.isArray(res.data)) {
                const rawData = res.data;
                const parsed = [];
                if (rawData && rawData.length > 1) {
                    for (let i = 1; i < rawData.length; i++) {
                        const r = rawData[i];
                        if (!r[0]) continue;
                        parsed.push({
                            id: r[0],
                            type: r[1],
                            description: r[2],
                            area: r[3],
                            points: parseInt(r[4]) || 0,
                            date: r[5],
                            createdAt: r[6],
                            lesson: r[7] || ""
                        });
                    }
                    congQuaCachCache = parsed;
                    localStorage.setItem('cong_qua_cach_logs', JSON.stringify(congQuaCachCache));
                    renderCongQuaCach();
                }
            }
        } catch(e) {
            console.warn("Failed to fetch cong qua cach from cloud:", e.message);
        }
    }
}

function saveCongQuaCachLog(record) {
    congQuaCachCache.unshift(record);
    localStorage.setItem('cong_qua_cach_logs', JSON.stringify(congQuaCachCache));
    renderCongQuaCach();
    
    try {
        const queue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
        const filtered = queue.filter(item => !(item.action === 'cong_qua_cach_save' && item.data.id === record.id));
        filtered.push({
            action: 'cong_qua_cach_save',
            clientId: 'CQC_SAVE_' + record.id + '_' + Date.now(),
            data: record,
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('books_sync_queue', JSON.stringify(filtered));
    } catch(e) {
        console.warn("Failed to queue save:", e);
    }
    
    setTimeout(() => {
        if (typeof processBooksQueue === 'function') processBooksQueue();
    }, 100);
}

async function deleteCongQuaCachLog(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi nhận này?")) return;
    
    congQuaCachCache = congQuaCachCache.filter(item => item.id !== id);
    localStorage.setItem('cong_qua_cach_logs', JSON.stringify(congQuaCachCache));
    renderCongQuaCach();
    
    try {
        const queue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
        queue.push({
            action: 'cong_qua_cach_delete',
            clientId: 'CQC_DEL_' + id + '_' + Date.now(),
            data: { id: id },
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('books_sync_queue', JSON.stringify(queue));
    } catch(e) {
        console.warn("Failed to queue delete:", e);
    }
    
    setTimeout(() => {
        if (typeof processBooksQueue === 'function') processBooksQueue();
    }, 100);
}

function resetCongQuaCach() {
    congQuaCachCache = [];
    localStorage.setItem('cong_qua_cach_logs', JSON.stringify(congQuaCachCache));
    renderCongQuaCach();
    
    try {
        const queue = JSON.parse(localStorage.getItem('books_sync_queue') || '[]');
        const filtered = queue.filter(item => !item.action.startsWith('cong_qua_cach_'));
        filtered.push({
            action: 'cong_qua_cach_reset',
            clientId: 'CQC_RESET_' + Date.now(),
            addedAt: new Date().toISOString()
        });
        localStorage.setItem('books_sync_queue', JSON.stringify(filtered));
    } catch(e) {
        console.warn("Failed to queue reset:", e);
    }
    
    if (window.showToast) {
        window.showToast("Đã Reset cuộc đời thành công! Đang đồng bộ... ☁️", "success");
    }
    
    setTimeout(() => {
        if (typeof processBooksQueue === 'function') processBooksQueue();
    }, 100);
}

let cqcTargetGoal = parseInt(localStorage.getItem('cqc_target_goal')) || 3000;

function changeCqcTargetGoal() {
    const newGoal = prompt("Nhập mục tiêu tích lũy thiện nghiệp (số việc tốt mong muốn):", cqcTargetGoal);
    if (newGoal === null) return;
    const val = parseInt(newGoal);
    if (isNaN(val) || val <= 0) {
        alert("Mục tiêu phải là một số nguyên lớn hơn 0!");
        return;
    }
    cqcTargetGoal = val;
    localStorage.setItem('cqc_target_goal', val);
    renderCongQuaCach();
    if (window.showToast) {
        window.showToast("Đã cập nhật mục tiêu phát nguyện mới!", "success");
    }
}

function renderCongQuaCach() {
    const totalMeritsEl = document.getElementById('cqc-total-merits');
    const totalDemeritsEl = document.getElementById('cqc-total-demerits');
    const meritsCountEl = document.getElementById('cqc-merits-count');
    const demeritsCountEl = document.getElementById('cqc-demerits-count');
    const scoreEl = document.getElementById('cqc-destiny-score');
    const badgeEl = document.getElementById('cqc-destiny-badge');
    const adviceEl = document.getElementById('cqc-destiny-advice');
    const progressBar = document.getElementById('cqc-destiny-progress-bar');

    // Goal elements
    const goalTextEl = document.getElementById('cqc-target-goal-text');
    const goalProgressTextEl = document.getElementById('cqc-goal-progress-text');
    const goalPctTextEl = document.getElementById('cqc-goal-pct-text');
    const goalProgressBar = document.getElementById('cqc-goal-progress-bar');
    
    let sumCong = 0;
    let countCong = 0;
    let sumQua = 0;
    let countQua = 0;
    
    congQuaCachCache.forEach(item => {
        if (item.type === 'cong') {
            sumCong += item.points;
            countCong++;
        } else {
            sumQua += item.points;
            countQua++;
        }
    });
    
    const score = sumCong - sumQua;
    
    if (totalMeritsEl) totalMeritsEl.innerText = '+' + sumCong;
    if (totalDemeritsEl) totalDemeritsEl.innerText = '-' + sumQua;
    if (meritsCountEl) meritsCountEl.innerText = countCong + ' lượt';
    if (demeritsCountEl) demeritsCountEl.innerText = countQua + ' lượt';
    
    if (scoreEl) {
        scoreEl.innerText = (score >= 0 ? '+' : '') + score;
        if (score > 100) {
            scoreEl.style.background = 'linear-gradient(135deg, #7c3aed, #d97706)';
        } else if (score >= 21) {
            scoreEl.style.background = 'linear-gradient(135deg, #059669, #fbbf24)';
        } else if (score >= 0) {
            scoreEl.style.background = 'linear-gradient(135deg, #0284c7, #10b981)';
        } else {
            scoreEl.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
        }
        scoreEl.style.webkitBackgroundClip = 'text';
    }
    
    let badgeText = "Khởi Sự Tích Phúc 🌱";
    let badgeBg = "rgba(14, 165, 233, 0.15)";
    let badgeColor = "#0284c7";
    let adviceText = `"Phúc họa vô môn, duy nhân tự triệu." Hãy bắt đầu gieo hạt thiện lành.`;
    
    if (score < 0) {
        badgeText = "Trầm Tư Sửa Mình ⚠️";
        badgeBg = "rgba(239, 68, 68, 0.15)";
        badgeColor = "#ef4444";
        adviceText = `"Người không biết lỗi sai của mình cả đời không có tiến bộ." Hãy kiên quyết sửa đổi!`;
    } else if (score > 100) {
        badgeText = "Tự Lập Số Mệnh 🌟";
        badgeBg = "rgba(139, 92, 246, 0.15)";
        badgeColor = "#8b5cf6";
        adviceText = `"Đức năng thắng số." Bạn đã đập vỡ cái khung định sẵn để tự lập số mệnh!`;
    } else if (score >= 21) {
        badgeText = "Tích Lũy Nhân Tâm 🏵️";
        badgeBg = "rgba(245, 158, 11, 0.15)";
        badgeColor = "#d97706";
        adviceText = `Năng lượng phúc đức tích lũy đang làm thay đổi số mệnh của bạn mỗi ngày.`;
    }
    
    if (badgeEl) {
        badgeEl.innerText = badgeText;
        badgeEl.style.background = badgeBg;
        badgeEl.style.color = badgeColor;
    }
    if (adviceEl) adviceEl.innerText = adviceText;
    
    // Destiny Progress Bar
    if (progressBar) {
        const total = sumCong + sumQua;
        let percentage = 50;
        if (total > 0) {
            percentage = Math.round((sumCong / total) * 100);
        }
        progressBar.style.width = percentage + '%';
        if (percentage > 70) {
            progressBar.style.background = 'linear-gradient(90deg, #10b981, #8b5cf6)';
        } else if (percentage >= 50) {
            progressBar.style.background = 'linear-gradient(90deg, #0ea5e9, #10b981)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #dc2626, #f59e0b)';
        }
    }

    // Goal Progress Calculations
    if (goalTextEl) goalTextEl.innerText = cqcTargetGoal;
    if (goalProgressTextEl) goalProgressTextEl.innerText = countCong;
    const goalPct = Math.min(100, Math.round((countCong / cqcTargetGoal) * 100));
    if (goalPctTextEl) goalPctTextEl.innerText = goalPct + '%';
    if (goalProgressBar) {
        goalProgressBar.style.width = goalPct + '%';
    }
    
    renderCongQuaCachLogs();
    renderCqcLessonsList();
}

function renderCongQuaCachLogs() {
    const congContainer = document.getElementById('cqc-logs-list-cong');
    const quaContainer = document.getElementById('cqc-logs-list-qua');
    const congBadge = document.getElementById('cqc-list-count-badge-cong');
    const quaBadge = document.getElementById('cqc-list-count-badge-qua');
    
    if (!congContainer || !quaContainer) return;

    // Filtered lists
    const congLogs = congQuaCachCache.filter(item => item.type === 'cong');
    const quaLogs = congQuaCachCache.filter(item => item.type === 'qua');

    // Sort function
    const sortLogs = (list) => {
        return list.sort((a, b) => {
            if (a.date !== b.date) {
                return b.date.localeCompare(a.date);
            }
            return b.id.localeCompare(a.id);
        });
    };

    const sortedCong = sortLogs(congLogs);
    const sortedQua = sortLogs(quaLogs);

    if (congBadge) congBadge.innerText = sortedCong.length + ' bản ghi';
    if (quaBadge) quaBadge.innerText = sortedQua.length + ' bản ghi';

    const AREA_LABELS = {
        'ban-than': '🌱 Bản thân',
        'gia-dinh': '👨‍👩‍👧‍👦 Gia đình',
        'xa-hoi': '🤝 Xã hội',
        'dat-nuoc': '🇻🇳 Đất nước'
    };
    
    const AREA_ICONS = {
        'ban-than': 'fa-user',
        'gia-dinh': 'fa-house-user',
        'xa-hoi': 'fa-users',
        'dat-nuoc': 'fa-flag'
    };

    // Render helper
    const buildLogHtml = (item) => {
        const dateObj = new Date(item.date);
        const formattedDate = isNaN(dateObj.getTime()) ? item.date : dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const typeClass = item.type === 'cong' ? 'cqc-log-item-cong' : 'cqc-log-item-qua';
        const pointsClass = item.type === 'cong' ? 'cqc-log-points-cong' : 'cqc-log-points-qua';
        const pointsSign = item.type === 'cong' ? '+' : '-';
        const iconName = AREA_ICONS[item.area] || 'fa-heart';
        
        let lessonHtml = '';
        if (item.type === 'qua') {
            if (item.lesson && item.lesson.trim() !== '') {
                lessonHtml = `
                    <div style="margin-top: 6px; padding: 6px 8px; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 4px; font-size: 0.75rem; color: #0369a1; font-weight: 500; display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                        <span style="line-height: 1.3;"><i class="fa-solid fa-lightbulb" style="color: #0ea5e9; margin-right: 4px;"></i><strong>Bài học:</strong> ${escapeHtml(item.lesson)}</span>
                        <button type="button" onclick="editCqcLesson('${item.id}')" style="background: none; border: none; color: #0284c7; cursor: pointer; padding: 0 2px;" title="Sửa bài học">
                            <i class="fa-solid fa-pencil" style="font-size: 0.65rem;"></i>
                        </button>
                    </div>
                `;
            } else {
                lessonHtml = `
                    <div style="margin-top: 6px;">
                        <button type="button" onclick="editCqcLesson('${item.id}')" style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-size: 0.72rem; font-weight: 700; padding: 4px 8px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;" onmouseover="this.style.background='#f1f5f9'; this.style.color='#475569';" onmouseout="this.style.background='#f8fafc'; this.style.color='#64748b';">
                            <i class="fa-solid fa-plus" style="font-size: 0.65rem;"></i> Rút ra bài học sửa mình
                        </button>
                    </div>
                `;
            }
        }
        
        let progressiveHtml = '';
        if (item.progressive) {
            const multText = `${item.progressive.multiplier}x`;
            progressiveHtml = `
                <span style="display: inline-block; font-size: 0.65rem; font-weight: 800; background: #fff1f2; color: #e11d48; padding: 1px 4px; border-radius: 4px; margin-left: 6px; border: 1.5px solid rgba(225, 29, 72, 0.2);" title="Lũy tiến do lặp lại lỗi">
                    <i class="fa-solid fa-triangle-exclamation" style="margin-right: 2px;"></i>Lặp lần ${item.progressive.matchCount + 1} (${multText})
                </span>
            `;
        }

        return `
            <div class="cqc-log-item ${typeClass}" style="padding: 10px; margin-bottom: 6px;">
                <div class="cqc-log-icon cqc-log-icon-${item.area}" title="${AREA_LABELS[item.area]}" style="width: 28px; height: 28px; font-size: 0.75rem;">
                    <i class="fa-solid ${iconName}"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <span style="font-size: 0.72rem; font-weight: 700; color: #94a3b8;">${formattedDate}</span>
                        <span class="cqc-log-points ${pointsClass}" style="font-size: 0.75rem; padding: 1px 6px;">${pointsSign}${item.points}</span>
                    </div>
                    <p style="margin: 2px 0 0 0; font-size: 0.8rem; font-weight: 600; color: #334155; line-height: 1.35; word-break: break-word;">${escapeHtml(item.description)}</p>
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 4px;">
                        <div style="display: flex; align-items: center;">
                            <span style="display: inline-block; font-size: 0.65rem; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 1px 4px; border-radius: 4px;">${AREA_LABELS[item.area]}</span>
                            ${progressiveHtml}
                        </div>
                    </div>
                    ${lessonHtml}
                </div>
                <button type="button" class="cqc-log-delete-btn" onclick="deleteCongQuaCachLog('${item.id}')" title="Xóa ghi chép" style="padding: 2px 6px;">
                    <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
                </button>
            </div>
        `;
    };

    // Populate Cong Container
    if (sortedCong.length === 0) {
        congContainer.innerHTML = `
            <div style="text-align: center; padding: 1.5rem 1rem; color: #94a3b8; font-weight: 500; font-size: 0.78rem;">
                <i class="fa-solid fa-seedling" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 6px; display:block;"></i>
                Chưa ghi nhận việc thiện nào.
            </div>
        `;
    } else {
        congContainer.innerHTML = sortedCong.map(buildLogHtml).join('');
    }

    // Populate Qua Container
    if (sortedQua.length === 0) {
        quaContainer.innerHTML = `
            <div style="text-align: center; padding: 1.5rem 1rem; color: #94a3b8; font-weight: 500; font-size: 0.78rem;">
                <i class="fa-solid fa-spa" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 6px; display:block;"></i>
                Tuyệt vời! Không có lỗi lầm nào bị ghi nhận.
            </div>
        `;
    } else {
        quaContainer.innerHTML = sortedQua.map(buildLogHtml).join('');
    }
}

let currentLessonFilter = 'all';

function filterCqcLessons(area) {
    currentLessonFilter = area;
    const buttons = document.querySelectorAll('.btn-filter-lesson');
    buttons.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick');
        if (onClickAttr && onClickAttr.includes(`'${area}'`)) {
            btn.classList.add('active');
            btn.style.background = '#0284c7';
            btn.style.color = 'white';
        } else {
            btn.classList.remove('active');
            btn.style.background = '#f1f5f9';
            btn.style.color = '#475569';
        }
    });
    renderCqcLessonsList();
}

function renderCqcLessonsList() {
    const container = document.getElementById('cqc-lessons-list');
    const badge = document.getElementById('cqc-lessons-count-badge');
    if (!container) return;

    // Filter items that have type === 'qua' and a non-empty lesson
    const allLessons = congQuaCachCache.filter(item => item.type === 'qua' && item.lesson && item.lesson.trim() !== "");
    const filteredLessons = currentLessonFilter === 'all' 
        ? allLessons 
        : allLessons.filter(item => item.area === currentLessonFilter);

    if (badge) badge.innerText = allLessons.length + ' bài học';

    if (filteredLessons.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 1.5rem 1rem; color: #94a3b8; font-weight: 500; font-size: 0.78rem;">
                <i class="fa-solid fa-lightbulb" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 6px; display:block;"></i>
                Chưa có bài học nào được rút ra trong mục này.
            </div>
        `;
        return;
    }

    const AREA_LABELS = {
        'ban-than': '🌱 Bản thân',
        'gia-dinh': '👨‍👩‍👧‍👦 Gia đình',
        'xa-hoi': '🤝 Xã hội',
        'dat-nuoc': '🇻🇳 Đất nước'
    };

    container.innerHTML = filteredLessons.map(item => {
        const dateObj = new Date(item.date);
        const formattedDate = isNaN(dateObj.getTime()) ? item.date : dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
            <div style="padding: 10px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.68rem; font-weight: 700; color: #94a3b8;">${formattedDate} • ${AREA_LABELS[item.area] || item.area}</span>
                    <span style="font-size: 0.68rem; font-weight: 700; background: #fee2e2; color: #ef4444; padding: 1px 6px; border-radius: 4px;">-${item.points}đ</span>
                </div>
                <div style="font-size: 0.78rem; color: #64748b; border-left: 2px solid #cbd5e1; padding-left: 6px; font-style: italic; line-height: 1.3;">
                    Lỗi: ${escapeHtml(item.description)}
                </div>
                <div style="font-size: 0.8rem; font-weight: 600; color: #0284c7; display: flex; align-items: flex-start; gap: 4px; line-height: 1.35;">
                    <i class="fa-solid fa-circle-check" style="color: #0284c7; margin-top: 2px; font-size: 0.85rem;"></i>
                    <span>Bài học: ${escapeHtml(item.lesson)}</span>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="button" onclick="editCqcLesson('${item.id}')" style="background: none; border: none; color: #0284c7; font-size: 0.7rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 2px; padding: 2px 6px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='none'">
                        <i class="fa-solid fa-pen-to-square"></i> Cập nhật bài học
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function editCqcLesson(id) {
    const item = congQuaCachCache.find(x => x.id === id);
    if (!item) return;

    const newLesson = prompt("Nhập bài học rút ra & hành động sửa mình để hoàn thiện bản thân:", item.lesson || "");
    if (newLesson === null) return;

    item.lesson = newLesson.trim();
    saveCongQuaCachLog(item);
    
    if (window.showToast) {
        window.showToast("Đã cập nhật bài học rút ra! Cố gắng tinh tấn thực hiện! 💪", "success");
    }
}

// Bind to window for HTML accessibility
window.closeBookDetail = closeBookDetail;
window.closeBookForm = closeBookForm;
window.adjustProgressByStatus = adjustProgressByStatus;
window.initBooksTab = initBooksTab;
window.toggleActionState = toggleActionState;
window.extractBookInsightsAI = extractBookInsightsAI;
window.extractCategoryInsightsAI = extractCategoryInsightsAI;
window.saveCategorySummary = saveCategorySummary;
window.triggerAutoCoverFetch = triggerAutoCoverFetch;
window.closeCategorySummaryModal = closeCategorySummaryModal;
window.openCategorySummaryDetail = openCategorySummaryDetail;
window.processBooksQueue = processBooksQueue;

// Cong Qua Cach binds
window.initCongQuaCach = initCongQuaCach;
window.prefillCqcForm = prefillCqcForm;
window.deleteCongQuaCachLog = deleteCongQuaCachLog;
window.renderCongQuaCachLogs = renderCongQuaCachLogs;
window.loadCongQuaCachData = loadCongQuaCachData;
window.saveCongQuaCachLog = saveCongQuaCachLog;
window.resetCongQuaCach = resetCongQuaCach;
window.renderCongQuaCach = renderCongQuaCach;
window.changeCqcTargetGoal = changeCqcTargetGoal;
window.filterCqcLessons = filterCqcLessons;
window.renderCqcLessonsList = renderCqcLessonsList;
window.editCqcLesson = editCqcLesson;



