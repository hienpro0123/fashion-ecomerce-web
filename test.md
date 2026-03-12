# Project Proposal

## THÔNG TIN

### Nhóm

* Thành viên 1: Trịnh Quang Hiên – 23632591  
* Thành viên 2: …  
* Thành viên 3: …  
* Thành viên 4: …

### Git

Git repository: `ecommerce-react-master` (placeholder for actual remote URL)

---

## MÔ TẢ DỰ ÁN

### Ý tưởng

Nhóm phát triển một **nền tảng thương mại điện tử** đầy đủ tính năng, hoạt động hoàn toàn phía client với Firebase làm “backend as a service”. Mục tiêu là mô phỏng một cửa hàng trực tuyến chuyên nghiệp dành cho cả khách hàng lẻ và doanh nghiệp nhỏ. Ý tưởng xuất phát từ nhu cầu thực tế của thị trường online và hi vọng tạo ra sản phẩm mẫu có thể mở rộng dễ dàng trong tương lai.

Dự án khác biệt ở chỗ:

* **Không cần máy chủ truyền thống** – dữ liệu người dùng, sản phẩm và giỏ hàng được quản lý qua Firebase Authentication, Firestore và Storage.
* **Tích hợp trí tuệ nhân tạo (Stylist AI)** – một chatbot nổi ở góc phải giúp người dùng tìm kiếm và đề xuất sản phẩm bằng ngôn ngữ tự nhiên, thay vì chỉ dựa vào bộ lọc tĩnh.

### Chi tiết

Người dùng truy cập trang web, duyệt sản phẩm qua lưới hoặc danh sách, có thể lọc theo giá, thương hiệu, từ khóa và sắp xếp. Khi xem trang chi tiết, họ thêm sản phẩm vào giỏ, giỏ hàng lưu cục bộ và đồng bộ khi đăng nhập.

Quy trình thanh toán gồm ba bước: tóm tắt đơn, thông tin vận chuyển và chọn phương thức thanh toán, với kiểm tra dữ liệu bằng Formik/Yup.

Người dùng đăng ký/đăng nhập bằng email hoặc OAuth (Google, Facebook, GitHub). Hồ sơ cá nhân chứa tên, hình đại diện, địa chỉ, số điện thoại; admin có thể thay đổi vai trò trong Firestore.

Admin dashboard cho phép CRUD sản phẩm, bao gồm upload ảnh, gán từ khóa, kích thước, màu sắc, và đánh dấu featured/recommended. Các phần cho quản lý đơn hàng và báo cáo doanh thu được để làm ví dụ mở rộng.

Widget **Stylist AI**: khi mở, hiển thị header cố định, khung tin nhắn cuộn, thanh gợi ý nhanh và ô nhập. Người dùng gửi yêu cầu, hệ thống gọi `chatService` để nhận phản hồi dạng streaming kèm sản phẩm gợi ý (dưới dạng cards). Trò chuyện lưu trong session storage theo mỗi user.

---

## PHÂN TÍCH & THIẾT KẾ

* **Kiến trúc**: React 17 với Vite, Redux/Redux‑Saga cho trạng thái. Mọi tương tác với backend diễn ra qua `src/services/firebase.js` hoặc `src/services/chatService.jsx`. Cloud Function nhỏ (`lowercaseProductName`) dùng để chuẩn hóa tên sản phẩm cho tìm kiếm.

* **Các thành phần chính**:
  * `components/` – UI tái sử dụng: basket, navigation, filters, formik inputs, chatbox…
  * `views/` – trang cấp cao: home, shop, search, admin, checkout, account.
  * `redux/` – actions, reducers, sagas, store.
  * `services/` – wrapper Firebase và logic AI.
  * `styles/` – SCSS theo kiến trúc 1‑6 với phần chat riêng.
  * `routers/` – định nghĩa route và các route component (AdminRoute, ClientRoute…).

* **Luồng dữ liệu**: UI → dispatch action → saga xử lý → gọi service → trả về dữ liệu → update store → render. Firestore là nguồn duy nhất cho sản phẩm/ người dùng; chat service gọi API AI nội bộ.

---

## KẾ HOẠCH

### MVP

* **Tính năng cốt lõi (đã hoàn thành trước 12.04.2026)**:
  * Duyệt sản phẩm theo grid/list với pagination, featured, recommended.
  * Tìm kiếm full‑text/từ khóa trong tên/ mô tả/ keywords, xử lý tiếng Việt có dấu/không dấu.
  * Giỏ hàng thêm/xóa, lưu khi đăng nhập.
  * Thanh toán ba bước với validation.
  * Chat assistant Stylist AI – nút nổi, scrollable message, gợi ý sản phẩm.
  * Admin CRUD sản phẩm và quản lý người dùng.

* **Kế hoạch kiểm thử**:
  * Unit tests cho selectors (`selectFilter`, `selectMax/Min`).
  * Kiểm tra thủ công luồng tìm kiếm, giỏ hàng, checkout, chat và admin.
  * Kiểm thử responsive trên thiết bị di động.

### Beta Version

* **Cải tiến dự kiến**:
  * Thêm lưu đơn hàng và hiển thị lịch sử.
  * Tối ưu hiệu năng tìm kiếm (trường `name_normalized`, index Firestore).
  * Nâng cấp chat: lưu lịch sử server‑side, hỗ trợ nhiều ngôn ngữ.
  * Tiếp nhận phản hồi người dùng về UX chat và tốc độ tải.

* **Kết quả kiểm thử mong đợi**:
  * Tất cả chức năng chính hoạt động ổn định, lỗi lớn được fix.
  * UI mượt mà trên màn hình nhỏ, chat không phủ quá nhiều nội dung.
  * Báo cáo nhỏ mô tả điểm mạnh/ điểm yếu và các bước hoàn thiện trước 10.05.2026.

---

## CÂU HỎI

1. Làm thế nào để mở rộng giải pháp chat AI hiện tại sang các yêu cầu phức tạp hơn (ví dụ: đặt hàng trực tiếp)?
2. Khi số lượng sản phẩm tăng lớn, chiến lược tối ưu hóa tìm kiếm trên Firestore nên như thế nào?
3. Có cách nào đồng bộ hóa giỏ hàng giữa nhiều thiết bị cho cùng một user mà không dùng server trung gian?
4. Phương pháp tốt nhất để triển khai xác thực và phân quyền cho các API Firebase khi mở rộng tính năng admin?
5. Trong bối cảnh bảo mật, cần lưu ý gì khi lưu trữ và gọi các khoá API chat từ phía client?
