# BÁO CÁO ĐỒ ÁN PHÁT TRIỂN ỨNG DỤNG WEB

## Đề tài: Xây dựng website bán hàng thời trang nam LORDMEN bằng React và Firebase

---

## 1. Giới thiệu đề tài

### 1.1 Mô tả bài toán

Trong bối cảnh mua sắm trực tuyến ngày càng phổ biến, người dùng có nhu cầu tìm kiếm sản phẩm nhanh, xem thông tin chi tiết, lựa chọn màu sắc và kích thước, thêm sản phẩm vào giỏ hàng và đặt mua ngay trên website. Đối với phía quản trị, hệ thống cần hỗ trợ cập nhật danh mục sản phẩm, theo dõi đơn hàng và quản lý trạng thái giao hàng.

Project `ecommerce-react-master` hiện thực bài toán trên dưới dạng một website thương mại điện tử cho thời trang nam với tên hiển thị là **LORDMEN**. Hệ thống cho phép:

- Khách vãng lai xem sản phẩm, tìm kiếm và khám phá danh mục.
- Người dùng đã đăng nhập thực hiện mua hàng, quản lý hồ sơ cá nhân, xem và hủy đơn hàng khi còn ở trạng thái chờ.
- Quản trị viên thêm, sửa, xóa sản phẩm và xử lý đơn hàng.
- Tích hợp thêm một **Stylist AI Chatbox** để tư vấn sản phẩm dựa trên dữ liệu thật của cửa hàng.

### 1.2 Mục tiêu hệ thống

- Xây dựng website bán hàng một trang (SPA) với trải nghiệm mua sắm trực quan.
- Hỗ trợ đầy đủ các nghiệp vụ chính của một hệ thống thương mại điện tử cơ bản: đăng ký, đăng nhập, xem sản phẩm, thêm giỏ hàng, thanh toán COD, theo dõi đơn hàng.
- Cung cấp khu vực quản trị cho admin để quản lý sản phẩm và đơn hàng.
- Lưu trữ dữ liệu trên nền tảng cloud bằng Firebase để giảm chi phí xây dựng backend riêng.
- Ứng dụng AI vào tư vấn chọn đồ nam theo nhu cầu, mức giá, màu sắc, kích thước và thông tin người dùng.

### 1.3 Phạm vi hệ thống

**Trong phạm vi project**

- Xác thực người dùng bằng email/password và OAuth.
- Hiển thị sản phẩm nổi bật, sản phẩm đề xuất, danh sách cửa hàng và trang chi tiết sản phẩm.
- Tìm kiếm sản phẩm, lọc theo từ khóa/giá/thương hiệu.
- Quản lý giỏ hàng và lưu giỏ hàng theo tài khoản.
- Quy trình checkout 3 bước.
- Tạo đơn hàng với hình thức **Cash on Delivery (COD)**.
- Người dùng xem lịch sử đơn hàng và hủy đơn khi trạng thái còn `pending`.
- Admin quản lý sản phẩm, hình ảnh, trạng thái nổi bật/đề xuất và danh sách đơn hàng.
- Chatbox AI tư vấn sản phẩm thời trang.

**Ngoài phạm vi hiện tại**

- Chưa tích hợp cổng thanh toán thật cho Credit Card hoặc PayPal.
- Chưa có module đánh giá sản phẩm, mã giảm giá, tồn kho nâng cao, dashboard thống kê chuyên sâu.
- Tab Wish List mới là placeholder, chưa hoàn chỉnh chức năng lưu sản phẩm yêu thích.

---

## 2. Phân tích yêu cầu hệ thống

### 2.1 Actors

| Actor | Mô tả |
| --- | --- |
| Guest | Người chưa đăng nhập, có thể xem sản phẩm, tìm kiếm, xem trang chủ, đăng ký/đăng nhập. |
| User | Người dùng đã đăng nhập với vai trò `USER`, có thể mua hàng, cập nhật tài khoản, xem đơn hàng, dùng chatbox AI với ngữ cảnh cá nhân. |
| Admin | Người dùng có vai trò `ADMIN`, có thêm quyền truy cập khu vực quản trị để quản lý sản phẩm và đơn hàng. |

### 2.2 Danh sách Use Case

| Mã UC | Use Case | Actor | Mô tả ngắn |
| --- | --- | --- | --- |
| UC01 | Đăng ký tài khoản | Guest | Tạo tài khoản mới bằng họ tên, email, mật khẩu. |
| UC02 | Đăng nhập | Guest | Đăng nhập bằng email/password hoặc Google/Facebook/GitHub. |
| UC03 | Khôi phục mật khẩu | Guest | Gửi email reset mật khẩu qua Firebase Auth. |
| UC04 | Xem trang chủ | Guest, User | Xem banner, sản phẩm nổi bật và sản phẩm đề xuất. |
| UC05 | Xem danh sách sản phẩm | Guest, User | Vào trang Shop để xem toàn bộ sản phẩm. |
| UC06 | Tìm kiếm sản phẩm | Guest, User | Tìm kiếm theo từ khóa, mô tả hoặc keyword. |
| UC07 | Lọc sản phẩm | Guest, User | Lọc theo tên, thương hiệu, khoảng giá. |
| UC08 | Xem chi tiết sản phẩm | Guest, User | Xem ảnh, mô tả, size, màu, giá của sản phẩm. |
| UC09 | Thêm/xóa giỏ hàng | User | Chọn size, màu rồi thêm vào giỏ hàng hoặc bỏ khỏi giỏ. |
| UC10 | Cập nhật số lượng sản phẩm trong giỏ | User | Tăng/giảm số lượng từng sản phẩm. |
| UC11 | Nhập thông tin giao hàng | User | Nhập họ tên, email, địa chỉ, số điện thoại, loại giao hàng. |
| UC12 | Đặt hàng COD | User | Xác nhận đơn hàng và lưu vào Firestore. |
| UC13 | Xem đơn hàng cá nhân | User | Xem danh sách đơn hàng đã đặt. |
| UC14 | Hủy đơn hàng | User | Hủy đơn nếu đơn đang ở trạng thái `pending`. |
| UC15 | Cập nhật hồ sơ cá nhân | User | Sửa họ tên, email, địa chỉ, avatar, banner. |
| UC16 | Tư vấn bằng AI chatbox | Guest, User | Hỏi chatbot về giá, màu, size, sản phẩm phù hợp. |
| UC17 | Quản lý sản phẩm | Admin | Thêm, sửa, xóa sản phẩm; upload ảnh và gắn cờ featured/recommended. |
| UC18 | Quản lý đơn hàng | Admin | Xem toàn bộ đơn hàng, xác nhận đơn, đánh dấu đã giao. |

### 2.3 Mô tả chi tiết Use Case: Đặt hàng COD

**Tên use case:** Đặt hàng COD  
**Mã use case:** UC12  
**Actor chính:** User

**Tiền điều kiện**

- Người dùng đã đăng nhập.
- Giỏ hàng có ít nhất một sản phẩm.
- Người dùng đã hoàn thành bước nhập thông tin giao hàng.

**Hậu điều kiện**

- Một document mới được tạo trong collection `orders`.
- Giỏ hàng được xóa khỏi Redux store.
- Thông tin checkout được reset.
- Người dùng được chuyển tới tab `My Orders`.

**Luồng chính**

1. User vào trang checkout step 1 để xem lại giỏ hàng.
2. User chuyển sang step 2 và nhập `fullname`, `email`, `address`, `mobile`, `isInternational`.
3. Hệ thống lưu thông tin giao hàng vào Redux `checkout.shipping`.
4. User chuyển sang step 3 và chọn phương thức thanh toán `cod`.
5. Hệ thống tạo object đơn hàng gồm:
   - `userId`
   - `customer`
   - `items`
   - `shipping`
   - `payment`
   - `pricing`
   - `status = pending`
   - `createdAt`
6. Hàm `firebase.saveOrder(order)` ghi dữ liệu vào Firestore collection `orders`.
7. Nếu thành công, hệ thống hiển thị thông báo `COD order saved successfully`.
8. Hệ thống chuyển người dùng về `/account?tab=2` để xem đơn hàng.

**Luồng thay thế**

- Nếu chưa đăng nhập, user không thể vào checkout do route được bảo vệ bởi `ClientRoute`.
- Nếu dữ liệu giao hàng chưa hoàn tất, step 3 sẽ redirect về step 1.
- Nếu lưu đơn thất bại, hệ thống hiển thị thông báo lỗi `Failed to save COD order`.

---

## 3. Thiết kế hệ thống

### 3.1 System Architecture

Hệ thống được xây dựng theo kiến trúc **Frontend + Firebase BaaS + AI Service**:

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Frontend | React 17, Vite, React Router DOM | Hiển thị giao diện, xử lý tương tác người dùng, định tuyến SPA |
| State Management | Redux, Redux Saga, Redux Persist | Quản lý trạng thái đăng nhập, giỏ hàng, checkout, sản phẩm |
| Authentication | Firebase Authentication | Đăng ký, đăng nhập, OAuth, reset mật khẩu |
| Database | Cloud Firestore | Lưu `users`, `products`, `orders` |
| File Storage | Firebase Storage | Lưu avatar, banner, ảnh thumbnail, bộ ảnh sản phẩm |
| Cloud Function | Firebase Functions | Chuẩn hóa tên sản phẩm viết thường khi tạo mới |
| AI Service | Gemini API | Tư vấn sản phẩm qua chatbox |

**Luồng tổng quát**

`React UI -> Redux/Saga -> Firebase Auth/Firestore/Storage -> Render dữ liệu ra giao diện`

Riêng phần chatbox AI:

`ChatBox -> chatService -> Gemini API + dữ liệu products từ Firestore -> phản hồi tư vấn`

### 3.2 Database Design

Project không dùng MySQL/PostgreSQL mà dùng **Cloud Firestore** theo mô hình document.

#### Collection `users`

| Trường | Kiểu dữ liệu | Ý nghĩa |
| --- | --- | --- |
| `fullname` | string | Họ tên người dùng |
| `avatar` | string | URL ảnh đại diện |
| `banner` | string | URL ảnh banner cá nhân |
| `email` | string | Email đăng nhập |
| `address` | string | Địa chỉ giao hàng mặc định |
| `basket` | array | Danh sách sản phẩm trong giỏ hàng |
| `mobile` | object | Thông tin số điện thoại |
| `role` | string | `USER` hoặc `ADMIN` |
| `dateJoined` | number/string | Thời điểm tạo tài khoản |

#### Collection `products`

| Trường | Kiểu dữ liệu | Ý nghĩa |
| --- | --- | --- |
| `name` | string | Tên sản phẩm |
| `name_lower` | string | Tên chuẩn hóa để hỗ trợ tìm kiếm |
| `brand` | string | Thương hiệu |
| `price` | number | Giá bán |
| `maxQuantity` | number | Số lượng tối đa/tồn kho cấu hình |
| `quantity` | number | Số lượng chọn mặc định khi thêm giỏ |
| `description` | string | Mô tả sản phẩm |
| `keywords` | array | Từ khóa hỗ trợ tìm kiếm/AI |
| `sizes` | array | Danh sách size |
| `availableColors` | array | Danh sách màu |
| `image` | string | Ảnh thumbnail |
| `imageCollection` | array | Bộ ảnh chi tiết |
| `isFeatured` | boolean | Cờ sản phẩm nổi bật |
| `isRecommended` | boolean | Cờ sản phẩm đề xuất |
| `dateAdded` | number | Thời điểm thêm sản phẩm |

#### Collection `orders`

| Trường | Kiểu dữ liệu | Ý nghĩa |
| --- | --- | --- |
| `userId` | string | ID người đặt hàng |
| `customer` | object | Snapshot thông tin khách hàng tại thời điểm đặt |
| `items` | array | Danh sách sản phẩm đã mua |
| `shipping` | object | Thông tin giao hàng, phí ship |
| `payment` | object | Phương thức thanh toán |
| `pricing` | object | Tạm tính, phí ship, tổng tiền |
| `status` | string | `pending`, `confirmed`, `delivered`, `cancelled` |
| `createdAt` | number | Thời gian tạo đơn |

### 3.3 Mô tả quan hệ dữ liệu

Do Firestore là NoSQL, hệ thống không dùng khóa ngoại cứng, nhưng quan hệ logic như sau:

- `users (1) - (n) orders`: một user có thể có nhiều đơn hàng.
- `orders.items` lưu snapshot sản phẩm tại thời điểm mua để tránh lệ thuộc việc sản phẩm bị sửa/xóa sau này.
- `users.basket` lưu giỏ hàng trực tiếp trong document user.
- `products` được tham chiếu gián tiếp qua `product.id` trong giỏ hàng, đơn hàng và chatbox recommendation.

### 3.4 UI Design

Các trang giao diện chính theo code hiện tại:

| Trang | File chính | Chức năng |
| --- | --- | --- |
| Home | `src/views/home/index.jsx` | Banner giới thiệu, danh sách Featured và Recommended |
| Shop | `src/views/shop/index.jsx` | Hiển thị danh sách sản phẩm, lọc và phân trang tải thêm theo store |
| Search | `src/views/search/index.jsx` | Kết quả tìm kiếm theo từ khóa |
| Product Detail | `src/views/view_product/index.jsx` | Ảnh chi tiết, chọn size, chọn màu, thêm giỏ hàng |
| Sign In / Sign Up | `src/views/auth/...` | Đăng nhập, đăng ký, reset mật khẩu |
| Checkout Step 1 | `src/views/checkout/step1/index.jsx` | Xem lại giỏ hàng |
| Checkout Step 2 | `src/views/checkout/step2/index.jsx` | Nhập thông tin giao hàng |
| Checkout Step 3 | `src/views/checkout/step3/index.jsx` | Chọn thanh toán và xác nhận đơn |
| User Account | `src/views/account/user_account/index.jsx` | Tab tài khoản, wishlist placeholder, đơn hàng |
| Admin Products | `src/views/admin/products/index.jsx` | Quản lý danh sách sản phẩm |
| Admin Add/Edit Product | `src/views/admin/add_product`, `edit_product` | Form CRUD sản phẩm |
| Admin Orders | `src/views/admin/orders/index.jsx` | Xử lý trạng thái đơn hàng |

Ngoài ra, hệ thống có một **chatbox AI nổi** xuất hiện toàn cục thông qua component `src/components/chatbox/ChatBox.jsx`.

---

## 4. Triển khai hệ thống

### 4.1 Công nghệ sử dụng

| Nhóm | Công nghệ |
| --- | --- |
| Frontend | React 17, Vite 3, React Router DOM 5 |
| Quản lý state | Redux, Redux Saga, Redux Persist |
| Form & validation | Formik, Yup |
| Giao diện | SCSS, Ant Design Icons, react-select, react-modal, react-phone-input-2 |
| Backend as a Service | Firebase Authentication, Cloud Firestore, Cloud Storage |
| Serverless | Firebase Cloud Functions |
| AI | Gemini API |
| Testing | Jest, Enzyme |
| Build/Deploy | Vite build, Firebase config, README có demo deploy trên Vercel |

### 4.2 Cấu trúc thư mục project

```text
ecommerce-react-master/
|-- functions/               # Cloud Functions cho Firebase
|-- public/                  # Tài nguyên public
|-- scripts/                 # Script migrate dữ liệu
|-- src/
|   |-- components/          # Component dùng lại: basket, common, chatbox, product, formik
|   |-- constants/           # Hằng số routes, action types, config
|   |-- helpers/             # Hàm tiện ích
|   |-- hooks/               # Custom hooks lấy dữ liệu và xử lý UI
|   |-- redux/
|   |   |-- actions/
|   |   |-- reducers/
|   |   |-- sagas/
|   |   `-- store/
|   |-- routers/             # Route guard cho Public, Client, Admin
|   |-- selectors/           # Bộ lọc sản phẩm
|   |-- services/            # Firebase service, config, AI chat service
|   |-- styles/              # SCSS và CSS chatbox
|   |-- views/               # Các trang giao diện
|   |-- App.jsx
|   `-- index.jsx
|-- static/                  # Ảnh minh họa và logo
|-- test/                    # Test Jest/Enzyme
|-- firestore.rules          # Luật bảo mật Firestore
|-- firebase.json            # Cấu hình Firebase
|-- package.json             # Scripts và dependencies
`-- README.md
```

### 4.3 Các chức năng đã implement

#### Chức năng cho Guest/User

- Đăng ký bằng email/password.
- Đăng nhập bằng email/password, Google, Facebook, GitHub.
- Gửi email quên mật khẩu.
- Xem sản phẩm nổi bật, sản phẩm đề xuất.
- Xem danh sách sản phẩm và trang chi tiết.
- Tìm kiếm sản phẩm theo từ khóa, mô tả, keyword.
- Lọc sản phẩm theo điều kiện.
- Chọn size, màu và thêm giỏ hàng.
- Tăng/giảm số lượng, xóa sản phẩm khỏi giỏ.
- Checkout 3 bước.
- Tạo đơn hàng COD.
- Xem đơn hàng cá nhân và hủy đơn `pending`.
- Chỉnh sửa hồ sơ cá nhân, đổi email, cập nhật avatar/banner.
- Tư vấn sản phẩm bằng AI chatbox.

#### Chức năng cho Admin

- Truy cập route riêng qua `AdminRoute`.
- Thêm sản phẩm mới.
- Chỉnh sửa sản phẩm.
- Xóa sản phẩm.
- Upload thumbnail và bộ ảnh sản phẩm.
- Gắn cờ `isFeatured`, `isRecommended`.
- Xem tất cả đơn hàng.
- Chuyển trạng thái đơn từ `pending -> confirmed -> delivered`.

### 4.4 API / dịch vụ dữ liệu

Project không xây dựng REST API riêng theo mô hình backend truyền thống. Thay vào đó, frontend gọi trực tiếp Firebase service.

#### Các thao tác dữ liệu chính

| Nhóm chức năng | Hàm chính | Mô tả |
| --- | --- | --- |
| Auth | `createAccount`, `signIn`, `signOut`, `signInWithGoogle`, ... | Gọi Firebase Authentication |
| User | `addUser`, `getUser`, `updateProfile`, `updateEmail` | Ghi/đọc collection `users` |
| Basket | `saveBasketItems` | Lưu giỏ hàng vào document user |
| Product | `getProducts`, `getSingleProduct`, `searchProducts`, `addProduct`, `editProduct`, `removeProduct` | Ghi/đọc collection `products` |
| Order | `saveOrder`, `getOrdersByUser`, `getOrders`, `updateOrderStatus` | Ghi/đọc collection `orders` |
| Storage | `storeImage`, `deleteImage` | Upload/xóa ảnh lên Firebase Storage |
| AI | `getAIReply` | Lấy dữ liệu sản phẩm và gọi Gemini API |

#### Cloud Function

`functions/index.js` định nghĩa function `lowercaseProductName`, kích hoạt khi tạo document mới trong `products` để bổ sung trường `name_lower`.

### 4.5 Luồng hoạt động tiêu biểu: User đặt hàng

1. User đăng nhập hệ thống.
2. User vào `Shop` hoặc `View Product` để chọn sản phẩm.
3. User chọn size, màu và thêm vào giỏ hàng.
4. Tại checkout step 1, user rà soát lại giỏ hàng.
5. Tại step 2, user nhập thông tin nhận hàng.
6. Tại step 3, user chọn `COD`.
7. Hệ thống tạo document đơn hàng trong Firestore collection `orders`.
8. Trạng thái ban đầu của đơn là `pending`.
9. User được chuyển sang tab `My Orders`.
10. Admin vào trang `Admin Orders` để xác nhận hoặc hoàn tất đơn.

---

## 5. Test Case

### 5.1 Các test case chức năng chính

| ID | Chức năng | Dữ liệu/Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC01 | Đăng ký | Nhập họ tên, email hợp lệ, mật khẩu đủ điều kiện | Tạo tài khoản Firebase và document `users` mới với role `USER` |
| TC02 | Đăng nhập email/password | Nhập đúng email và mật khẩu | Đăng nhập thành công, Redux nhận `auth` và `profile` |
| TC03 | Đăng nhập OAuth | Chọn Google/Facebook/GitHub | Đăng nhập thành công, nếu chưa có document user thì hệ thống tự tạo |
| TC04 | Tìm kiếm sản phẩm | Nhập từ khóa tên/mô tả/keyword | Hiển thị danh sách sản phẩm phù hợp |
| TC05 | Xem chi tiết sản phẩm | Truy cập `/product/:id` | Hiển thị ảnh, mô tả, size, màu, giá |
| TC06 | Thêm vào giỏ hàng | Chọn sản phẩm và nhấn `Add To Basket` | Sản phẩm xuất hiện trong basket |
| TC07 | Checkout step 2 | Bỏ trống `fullname` hoặc `address` | Form báo lỗi validation bằng Yup |
| TC08 | Đặt hàng COD | Chọn COD và xác nhận | Document `orders` được tạo với `status = pending` |
| TC09 | User hủy đơn | User nhấn `Cancel Order` trên đơn `pending` | Trạng thái đơn cập nhật thành `cancelled` |
| TC10 | Admin xác nhận đơn | Admin nhấn `Confirm Order` | Trạng thái đơn chuyển sang `confirmed` |
| TC11 | Admin giao hàng | Admin nhấn `Mark as Delivered` | Trạng thái đơn chuyển sang `delivered` |
| TC12 | Cập nhật hồ sơ | User sửa hồ sơ và upload avatar/banner | Dữ liệu `users` được cập nhật |
| TC13 | Chatbox AI | Nhập câu hỏi về sản phẩm, màu, size hoặc mức giá | AI phản hồi tư vấn và gợi ý sản phẩm liên quan |

### 5.2 Tình trạng test trong project

- Project có thư mục `test/` và file `test/components/App.test.js`.
- Tuy nhiên khi chạy `npm test -- --runInBand`, test **không chạy thành công** do thiếu dependency `@babel/preset-react`.
- Vì vậy hiện trạng kiểm thử tự động của project vẫn **chưa hoàn chỉnh**.

---

## 6. Demo hệ thống

### 6.1 Cách chạy project

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env` với các biến môi trường:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DB_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MSG_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash
```

3. Bật các dịch vụ Firebase cần thiết:

- Authentication
- Cloud Firestore
- Cloud Storage
- Cloud Functions

4. Chạy project:

```bash
npm run dev
```

5. Truy cập ứng dụng tại địa chỉ do Vite cung cấp, thường là:

```text
http://localhost:5173
```

### 6.2 Tài khoản test

- README không cung cấp sẵn tài khoản test cố định.
- Để có tài khoản admin, sau khi đăng ký tài khoản bình thường cần cập nhật trường `users/{uid}.role = "ADMIN"` trong Firestore.

### 6.3 Demo online

Theo `README.md`, project có demo tại:

```text
https://fashion-ecomerce-web.vercel.app/
```

---

## 7. Ứng dụng AI trong project

### 7.1 AI được sử dụng vào đâu

Project có tích hợp **Stylist AI Chatbox** tại `src/components/chatbox/ChatBox.jsx` và `src/services/chatService.jsx`.

Mục đích sử dụng AI:

- Tư vấn chọn sản phẩm theo mô tả nhu cầu của người dùng.
- Gợi ý sản phẩm theo mức giá, màu sắc, thương hiệu, size.
- Phân tích ngữ cảnh hội thoại trước đó để trả lời tự nhiên hơn.
- Đọc dữ liệu thật từ Firestore để chỉ đề xuất những sản phẩm đang có trong hệ thống.
- Trả về danh sách ID sản phẩm đề xuất để hiển thị trực tiếp card sản phẩm trong chatbox.

### 7.2 Cách hoạt động của AI

1. Chatbox lấy catalog sản phẩm từ Firestore.
2. Hệ thống chuẩn hóa câu hỏi người dùng: bỏ dấu, chuẩn hóa từ khóa, phát hiện mức giá, màu, size, thương hiệu.
3. `chatService.jsx` lọc các sản phẩm phù hợp nhất.
4. Dữ liệu sản phẩm, hồ sơ người dùng và lịch sử chat được ghép thành prompt.
5. Prompt được gửi tới Gemini API.
6. Phản hồi được làm sạch, tách JSON `recommendedProducts`, rồi render dạng tin nhắn và card sản phẩm.

### 7.3 Prompt sử dụng

Prompt trong code không phải một câu đơn giản mà là prompt nhiều phần. Nội dung chính của prompt gồm:

- Vai trò: “Bạn là Stylist AI cho shop thời trang nam”.
- Mục tiêu: tư vấn tự nhiên, không bịa sản phẩm, chỉ dùng dữ liệu có trong danh sách.
- Ngữ cảnh hội thoại.
- Thông tin khách hàng: chiều cao, cân nặng nếu có.
- Intent phát hiện: hỏi giá, màu, size, thương hiệu.
- Sản phẩm đang xét.
- Danh sách sản phẩm phù hợp hiện tại.
- Danh sách sản phẩm thay thế gần nhất.
- Ràng buộc đầu ra: phải trả lời đầy đủ, có mô tả phong cách/cách phối, kèm JSON `{ "recommendedProducts": [...] }`.

Ví dụ rút gọn theo đúng tinh thần prompt trong code:

```text
Bạn là Stylist AI cho shop thời trang nam.
Không bịa sản phẩm, không bịa giá, không bịa size/màu.
Chỉ dùng dữ liệu có trong danh sách sản phẩm đã cung cấp.
Nếu user hỏi size thì tư vấn theo chiều cao/cân nặng nếu có.
Sau phần tư vấn, thêm JSON object:
{"recommendedProducts":["id_1","id_2"]}
```

### 7.4 Đánh giá việc áp dụng AI

**Điểm mạnh**

- AI bám dữ liệu sản phẩm thật của shop thay vì trả lời chung chung.
- Có xử lý intent cho tiếng Việt như giá, màu, size, thương hiệu.
- Có fallback model, retry khi gặp lỗi `429`.
- Có lưu session chat theo user để giữ ngữ cảnh.

**Hạn chế**

- Vẫn phụ thuộc vào chất lượng prompt và model Gemini.
- Nếu Firestore rules hoặc API key cấu hình sai thì chatbox không hoạt động.
- Chưa có cá nhân hóa sâu theo lịch sử mua hàng thực tế.

---

## 8. Kết luận

### 8.1 Kết quả đạt được

Project đã xây dựng được một website bán hàng thời trang nam với các chức năng cốt lõi của hệ thống thương mại điện tử:

- Quản lý tài khoản người dùng.
- Duyệt và tìm kiếm sản phẩm.
- Quản lý giỏ hàng.
- Quy trình đặt hàng 3 bước.
- Quản lý đơn hàng cho user và admin.
- CRUD sản phẩm ở trang quản trị.
- Tích hợp AI tư vấn sản phẩm.

Điểm nổi bật của project là sử dụng Firebase để triển khai nhanh toàn bộ tầng backend và bổ sung chatbox AI có liên kết trực tiếp với dữ liệu sản phẩm thật.

### 8.2 Hạn chế

- Chưa có thanh toán online thật; Credit Card và PayPal mới dừng ở giao diện chọn phương thức.
- Tab Wish List chưa triển khai đầy đủ.
- Bộ test tự động hiện chưa chạy được do thiếu dependency Babel.
- `firestore.rules` đang cho phép mọi người dùng đã đăng nhập có quyền `create/update/delete` trên `products`, tức là chưa ràng buộc chặt theo vai trò `ADMIN` ở tầng dữ liệu.
- Dashboard admin còn đơn giản, chưa có thống kê doanh thu, số đơn, số lượng bán ra.

### 8.3 Hướng phát triển

- Tích hợp thanh toán online thực tế như PayPal, Stripe hoặc VNPay.
- Hoàn thiện wishlist và hệ thống đánh giá sản phẩm.
- Bổ sung dashboard phân tích cho admin.
- Cải thiện security rules để chỉ `ADMIN` mới được phép chỉnh sửa sản phẩm.
- Tối ưu recommendation theo lịch sử mua hàng và hành vi xem sản phẩm.
- Bổ sung unit test/integration test đầy đủ.
- Deploy đồng bộ frontend, Firebase rules/functions và cấu hình CI/CD.

---

## Tài liệu tham khảo

1. `README.md` trong project `ecommerce-react-master`.
2. Mã nguồn tại thư mục `src/`, `functions/`, `test/`.
3. Firebase Documentation.
4. React Documentation.
5. Gemini API Documentation.
