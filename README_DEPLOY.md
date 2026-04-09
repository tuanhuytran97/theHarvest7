# Hướng dẫn đưa ứng dụng lên Web để test trên điện thoại

Bạn có thể sử dụng **Vercel** - đây là cách nhanh nhất và hoàn toàn miễn phí cho các trang web tĩnh.

### Cách 1: Sử dụng Vercel CLI (Nhanh nhất)

1. Mở Terminal (PowerShell hoặc CMD) tại thư mục dự án này.
2. Chạy lệnh sau:
   ```bash
   npx vercel
   ```
3. Làm theo hướng dẫn trên màn hình (thường chỉ cần nhấn Enter cho các câu hỏi mặc định).
4. Sau khi xong, Vercel sẽ cung cấp cho bạn một đường dẫn (URL) dạng `https://farm-management-xxx.vercel.app`.
5. Bạn có thể mở URL này trên trình duyệt điện thoại để test.

### Cách 2: Sử dụng GitHub (Khuyên dùng lâu dài)

1. Đưa code này lên một repository trên GitHub.
2. Truy cập [vercel.com](https://vercel.com), đăng nhập bằng GitHub.
3. Chọn "Add New" -> "Project" và chọn repository của bạn.
4. Nhấn "Deploy". Mỗi khi bạn push code mới lên GitHub, trang web sẽ tự động cập nhật.

### Lưu ý cho Mobile:
- Ứng dụng đã được tối ưu giao diện điện thoại (Menu chuyển xuống dưới dạng thanh điều hướng).
- Nếu dữ liệu không hiển thị, hãy kiểm tra xem Google Sheets của bạn đã được "Publish to the web" (Công khai lên web) chưa.

---
**Antigravity** - Hỗ trợ bạn xây dựng ứng dụng chuyên nghiệp.
