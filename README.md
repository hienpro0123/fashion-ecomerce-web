# LORDMEN | E-commerce React + Firebase + Stylist AI

Ứng dụng e-commerce cho thời trang nam, tích hợp Firebase Firestore + Gemini API và chatbox Stylist AI.

## Yêu cầu
- Node.js 16+ (khuyến nghị 18)
- Firebase project
- Gemini API key

## Cài đặt
```sh
npm install
```

## Cấu hình môi trường
Tạo file `.env` ở root dự án:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DB_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MSG_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_GEMINI_API_KEY=...
#VITE_GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash
```

## Firestore rules (tham khảo)
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // sản phẩm cho mọi người xem
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // user chỉ sửa dữ liệu của mình
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

```

## Chạy dev
```sh
npm run dev
```

## Build
```sh
npm run build
```

## Search không ra kết quả?
Tìm kiếm dựa vào `name_lower` và `keywords` (token).  
Data cũ cần migrate để tự sinh `name_lower` và `keywords`.

### Migrate bằng Admin SDK
1. Tải service account JSON từ Firebase Console. (Firebase Console → Project Settings → Service Accounts → Manage keys → Delete key cũ → Generate new key)
2. Set biến môi trường:
```sh
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\service-account.json
```
3. Chạy migrate:
```sh
npm run migrate:products
```

## Lưu ý khi push Git
Không commit:
- `.env`, `.env.*`
- `node_modules/`
- `dist/`
- `*adminsdk*.json` (service account private key)

