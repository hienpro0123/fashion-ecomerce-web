# Modern E-commerce Platform

A full-stack B2C/B2B online shopping application built with React and Firebase. This university project demonstrates a production-quality front-end user experience and an administrative dashboard, powered by Firebase services for authentication, data storage, and serverless functions. It also includes an AI-powered chat assistant (Stylist AI) that helps users search for products using natural language.

**Live Demo:**  
https://fashion-ecomerce-web.vercel.app/

---

## Introduction

This project implements a modern e-commerce platform that allows customers to browse products, manage a shopping cart, and complete a secure checkout process. An administrator can manage the product catalogue, monitor users, and track basic sales information. The application solves the problem of providing a responsive, stateful web shop without requiring a traditional server backend by leveraging Firebase cloud services.

The current codebase is a client-heavy React application with Firebase Authentication, Cloud Firestore, Cloud Storage, Firebase Hosting configuration, and a small Cloud Functions workspace. It also includes a Gemini-powered stylist assistant that reads the live product catalogue and responds with product-aware recommendations in Vietnamese and English.

---

## Project Overview

`LORDMEN` is a men's fashion storefront with two primary experiences:

- A customer-facing shop for browsing products, adding items to a basket, completing checkout, and viewing account/order information.
- An admin-facing dashboard for managing products and reviewing customer orders.

The app is built as a single-page application using React Router. Most business data lives in Cloud Firestore:

- `users` stores profile information, basket state, and user roles.
- `products` stores catalogue data, merchandising flags, and image metadata.
- `orders` stores submitted checkout orders and their status.

There is no traditional REST API layer. The frontend talks directly to Firebase through the wrapper in `src/services/firebase.js`, while asynchronous UI flows are coordinated with Redux Saga.

---

## Tech Stack

| Category | Technologies | Purpose |
|----------|--------------|---------|
| **Frontend** | React 17, React DOM, Vite | SPA rendering and local development/build tooling |
| **Routing** | React Router DOM 5, history 4 | Public, client-only, and admin-only route protection |
| **State Management** | Redux, Redux Persist, Redux Saga, Redux Thunk | Global state, persistence, and side effects |
| **Forms & Validation** | Formik, Yup, react-phone-input-2, react-select | Form state, validation, phone input, and select inputs |
| **UI / Styling** | SCSS, normalize.css, Ant Design Icons, react-modal, react-loading-skeleton | Styling system and reusable UI primitives |
| **Backend / Services** | Firebase Auth, Cloud Firestore, Cloud Storage | Authentication, data persistence, and asset storage |
| **AI Assistant** | Google Gemini API via `src/services/chatService.jsx` | Product-aware chat assistant with prompt engineering and ranking logic |
| **Serverless / Ops** | Firebase Hosting, Firebase Cloud Functions, Firebase security rules | Hosting, Firestore trigger, and security configuration |
| **Testing** | Jest, Enzyme | Component test setup |

### Firebase SDK usage in this repo

- Firebase client SDK v8 is used in the web app.
- `firebase-admin` is used for the migration script and Cloud Functions workspace.
- The project contains both `firestore.rules` and `database.rules.json`, but the implemented ecommerce data flow in the app uses **Cloud Firestore**, not Realtime Database.

---

## Key Features

### Customer Side

- **Home landing page** with branded banner plus featured and recommended product sections.
- **Product browsing** through `/shop`, `/featured`, `/recommended`, and `/product/:id`.
- **Search and filtering** with keyword search, brand filter, price range filter, and sort order.
- **Accent-insensitive search** in both shop filtering and Firestore search logic.
- **Product detail selection** for size and color before adding to basket.
- **Basket management** with add/remove toggling, quantity controls, subtotal calculation, and persisted basket data for signed-in users.
- **Three-step checkout** covering order summary, shipping details, and payment selection.
- **Cash on delivery order creation** with Firestore order persistence.
- **Account management** for profile viewing and editing, including avatar/banner uploads and optional email update with reauthentication.
- **Order history** in the account area, including customer-side cancellation for pending orders.
- **OAuth sign-in** with Google, Facebook, and GitHub in addition to email/password auth.
- **Password reset** via Firebase Authentication.
- **AI Stylist assistant** available globally as a floating chat widget with quick prompts, chat session persistence, product recommendations, and streamed responses.

### Admin Side

- **Protected admin routes** gated by the user profile role (`ADMIN`).
- **Product CRUD** including thumbnail upload, gallery upload, keyword normalization, featured/recommended flags, sizes, and color configuration.
- **Order management** through `/admin/orders` with status updates such as confirm, deliver, and customer cancellation visibility.
- **Basic admin dashboard shell** that acts as an entry point to admin tools.

### Implemented but Limited / Placeholder Areas

- **Wish list tab** exists in the account area, but is currently a placeholder and does not persist wish list data.
- **Admin dashboard analytics** are minimal; the current dashboard is informational rather than a full reporting screen.
- **Realtime payments** are not implemented. Checkout currently saves COD orders; credit card and PayPal screens are present as UI/payment-selection steps rather than live gateway integrations.

---

## Project Structure

The project follows a React + Vite feature-oriented layout. Files are organized by domain: reusable components, view pages, Redux state, Firebase services, and styles.

```text
.
|-- functions/                # Firebase Cloud Functions workspace
|-- public/                   # Static HTML shell
|-- scripts/                  # Node scripts for data migration / maintenance
|-- src/
|   |-- components/           # Reusable UI: basket, chatbox, common, product, formik
|   |-- constants/            # Route constants and Redux action constants
|   |-- helpers/              # Formatting helpers and UI utilities
|   |-- hooks/                # Custom hooks for basket, modal, product fetches, etc.
|   |-- images/               # Static image assets
|   |-- redux/
|   |   |-- actions/          # Redux action creators
|   |   |-- reducers/         # State slices for auth, basket, checkout, filter, products, profile
|   |   |-- sagas/            # Async side-effect flows for auth, products, profile
|   |   `-- store/            # Store + redux-persist bootstrap
|   |-- routers/              # Public/client/admin route wrappers
|   |-- selectors/            # Derived product filtering helpers
|   |-- services/             # Firebase config/wrapper and AI chat service
|   |-- styles/               # SCSS architecture and chatbox CSS
|   |-- views/                # Page-level screens (home, account, auth, admin, checkout, etc.)
|   |-- App.jsx               # Root app composition
|   |-- index.jsx             # Entry point, auth bootstrap, service worker registration
|   `-- sw.js                 # Service worker
|-- test/                     # Jest + Enzyme test setup
|-- firebase.json             # Firebase Hosting / Firestore / Functions config
|-- firestore.rules           # Firestore security rules
|-- database.rules.json       # Realtime Database rules
`-- storage.rules             # Firebase Storage rules
```

### Important files

- `src/services/firebase.js`  
  Central wrapper around Firebase Auth, Firestore, and Storage operations.
- `src/services/chatService.jsx`  
  Gemini prompt construction, product ranking, fallback logic, and AI reply validation.
- `src/components/chatbox/ChatBox.jsx`  
  Floating AI assistant UI with session persistence and streamed replies.
- `src/redux/sagas/authSaga.js`  
  Sign-in, sign-up, social login, auth bootstrap, and password reset flow.
- `src/redux/sagas/productSaga.js`  
  Product loading, search, add/edit/remove flows, and keyword normalization.
- `src/views/checkout/step3/index.jsx`  
  Checkout payment step and order creation logic.
- `src/views/account/components/UserOrdersTab.jsx`  
  User order listing and cancellation UI.
- `src/views/admin/orders/index.jsx`  
  Admin order list and status update UI.
- `functions/index.js`  
  Firestore trigger that writes `name_lower` when a product is created.
- `scripts/migrate-products-name-lower-admin.js`  
  One-off backfill script for `name_lower` and normalized keywords.

---

## Architecture Notes

### Frontend architecture

- The app is rendered through `src/index.jsx`, which waits for Firebase auth state before rendering the main application.
- `src/App.jsx` mounts both the main router and the floating `ChatBox`.
- Route access is split across:
  - `PublicRoute` for public pages like sign-in/sign-up
  - `ClientRoute` for signed-in customers
  - `AdminRoute` for administrators

### State management

Redux is used for app-wide state, and `redux-persist` keeps selected slices in browser storage.

Persisted slices:

- `auth`
- `profile`
- `basket`
- `checkout`

Primary state slices:

- `products`
- `basket`
- `auth`
- `profile`
- `filter`
- `users`
- `checkout`
- `app`

Redux Saga handles side effects for:

- authentication
- product fetching/search
- product CRUD
- profile updates

### Backend integration model

This project does not expose a custom backend API. Instead:

- the frontend reads and writes Firestore directly
- Firebase Auth manages identity
- Cloud Storage stores uploaded product/profile images
- Firebase rules control access
- a lightweight Cloud Function writes `name_lower` for new products
- the AI assistant calls Gemini directly from the frontend service layer

---

## Database Schema

The current application logic uses these Firestore collections:

- `users`
- `products`
- `orders`

### `users` document

```js
{
  fullname: string,
  avatar: string,
  banner: string,
  email: string,
  address: string,
  basket: Array<ProductInBasket>,
  mobile: {
    country?: string,
    countryCode?: string,
    dialCode?: string,
    value?: string
  },
  role: "USER" | "ADMIN",
  dateJoined: string | number
}
```

Notes:

- The `basket` is persisted under the user document for signed-in users.
- The `role` field controls access to admin routes.
- Social sign-in users are provisioned automatically if no profile document exists yet.

### `products` document

```js
{
  name: string,
  name_lower: string,
  brand: string,
  price: number,
  maxQuantity: number,
  quantity: number,
  description: string,
  keywords: string[],
  sizes: string[],
  availableColors: string[],
  image: string,
  imageCollection: Array<{ id: string, url: string }>,
  dateAdded: number,
  isFeatured: boolean,
  isRecommended: boolean
}
```

Notes:

- `name_lower` is created either by the Cloud Function or directly in admin product flows.
- `keywords` are normalized during admin add/edit operations and can also be backfilled with the migration script.
- `quantity` is used in AI ranking/filtering and defaults to `1` in the current product form flow.

### `orders` document

```js
{
  userId: string,
  customer: {
    fullname: string,
    email: string,
    address: string,
    mobile: object
  },
  items: Array<{
    id: string,
    name: string,
    image: string,
    price: number,
    quantity: number,
    selectedSize: string,
    selectedColor: string
  }>,
  shipping: {
    isInternational: boolean,
    shippingFee: number
  },
  payment: {
    type: string,
    label: string
  },
  pricing: {
    subtotal: number,
    shippingFee: number,
    total: number
  },
  status: "pending" | "confirmed" | "delivered" | "cancelled",
  createdAt: number
}
```

Notes:

- Orders are created from checkout step 3.
- Customer cancellation is implemented as a **status update**, not document deletion.
- Admin order management reads the same collection and updates status transitions from the dashboard.

---

## Features by Module

### Authentication

Implemented in:

- `src/views/auth/*`
- `src/redux/sagas/authSaga.js`
- `src/components/common/SocialLogin.jsx`

Capabilities:

- email/password sign-up
- email/password sign-in
- Google sign-in
- Facebook sign-in
- GitHub sign-in
- password reset
- auth persistence via Firebase local persistence
- automatic profile creation for OAuth users

### Product Catalogue

Implemented in:

- `src/views/home`
- `src/views/shop`
- `src/views/featured`
- `src/views/recommended`
- `src/views/view_product`
- `src/redux/sagas/productSaga.js`

Capabilities:

- paginated product loading
- featured/recommended product sections
- product detail view
- admin product add/edit/delete
- text search and client-side filter refinement
- keyword normalization for improved product search

### Basket and Checkout

Implemented in:

- `src/components/basket/*`
- `src/views/checkout/*`
- `src/redux/reducers/checkoutReducer.js`

Capabilities:

- add/remove basket items
- quantity controls
- persisted basket for signed-in users
- checkout shipping form with validation
- international shipping surcharge
- COD order creation and order persistence

### Orders

Implemented in:

- `src/views/account/components/UserOrdersTab.jsx`
- `src/views/admin/orders/index.jsx`
- `src/components/common/OrdersList.jsx`

Capabilities:

- customer order history
- customer cancellation for pending orders
- admin order overview
- admin status updates for confirmation and delivery

### AI Stylist Assistant

Implemented in:

- `src/components/chatbox/ChatBox.jsx`
- `src/services/chatService.jsx`

Capabilities:

- floating chat widget available globally
- quick suggestion buttons
- request throttling and cooldown
- session persistence in `sessionStorage`
- contextual prompts using current product, recent chat history, and optional height/weight clues
- product ranking based on keywords, color, size, price, featured/recommended flags, and brand matching
- streamed bot reply rendering
- Gemini model fallback support through `VITE_GEMINI_MODELS`

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ecommerce-react.git
cd ecommerce-react
```

### 2. Install dependencies

You can use either npm or yarn. The repository currently includes both `package-lock.json` and `yarn.lock`.

```bash
npm install
```

or

```bash
yarn install
```

### 3. Configure Firebase

Create a Firebase project and enable:

- **Authentication**
  - Email/Password
  - Google
  - Facebook
  - GitHub
- **Cloud Firestore**
- **Cloud Storage**
- **Firebase Hosting** if you want to deploy through Firebase
- **Cloud Functions** if you want to deploy the Firestore trigger

### 4. Create `.env`

The app reads Firebase config from `src/services/config.js` and AI config from `src/services/chatService.jsx`.

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DB_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MSG_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...

# Optional: comma-separated fallback model list for the chat assistant
VITE_GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash
```

### 5. Run the development server

```bash
npm run dev
```

or

```bash
yarn dev
```

The default Vite local URL is usually:

```text
http://localhost:5173
```

### 6. Configure an admin account

1. Create a user account from the app.
2. Open Firestore and locate the user document in `users`.
3. Change `role` from `USER` to `ADMIN`.
4. Refresh the app and access `/admin/dashboard`.

### 7. Apply Firebase rules and deploy services

Useful commands:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions
firebase deploy --only hosting
```

---

## Environment Variables

Detected in the current codebase:

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase client config | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase client config | Auth domain |
| `VITE_FIREBASE_DB_URL` | Yes | Firebase client config | Realtime Database URL field in config |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase client config, migration script | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase client config | Storage bucket |
| `VITE_FIREBASE_MSG_SENDER_ID` | Yes | Firebase client config | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase client config | Firebase app ID |
| `VITE_GEMINI_API_KEY` | Required for AI chat | `src/services/chatService.jsx` | Gemini API key for Stylist AI |
| `VITE_GEMINI_MODELS` | Optional | `src/services/chatService.jsx` | Comma-separated fallback model list |

### Important note about secrets

The `.env` file in the current workspace contains real-looking values. For a public repository, rotate and replace exposed secrets before publishing.

---

## Firebase Configuration Notes

### Firestore

The main application data path uses **Cloud Firestore** for:

- users
- products
- orders

### Realtime Database

The repo still contains:

- `database.rules.json`
- `databaseURL` in Firebase config

However, the implemented ecommerce logic in this app does not currently read or write order/product/user data through Realtime Database. Firestore is the active database integration for those flows.

### Storage

Firebase Storage is used for:

- product thumbnails
- product gallery images
- user avatar uploads
- user banner uploads

### Cloud Functions

The `functions/` workspace contains a Firestore trigger:

- `lowercaseProductName` writes `name_lower` for newly created products

Because the admin product flow already writes `name_lower` client-side, the function is useful as a safety net rather than the only source of normalization.

---

## Key Workflows

### Authentication workflow

1. The app starts in `src/index.jsx`.
2. Firebase auth state is checked before the main app is rendered.
3. If a user exists:
   - `ON_AUTHSTATE_SUCCESS` runs in `authSaga`
   - the user document is loaded from Firestore
   - profile and basket are hydrated into Redux
4. If an OAuth user exists without a Firestore profile:
   - a default user profile document is created automatically
5. Route access is then controlled by `PublicRoute`, `ClientRoute`, and `AdminRoute`.

### Product browsing workflow

1. Product pages request data through the Firebase service wrapper.
2. `GET_PRODUCTS` loads batches of products into Redux.
3. Filters are applied in selectors, not on the backend.
4. Search requests call `firebase.searchProducts`, which normalizes text and filters products client-side after loading Firestore results.
5. Product detail pages allow size/color selection and basket actions.

### Basket workflow

1. A product is added through `useBasket`.
2. The basket reducer updates local Redux state.
3. When signed in, `src/components/basket/Basket.jsx` persists basket contents back to the current Firestore user document.
4. Redux Persist also keeps basket state in browser storage.

### Checkout and order workflow

1. Step 1 reviews basket contents.
2. Step 2 collects shipping details and stores them in the checkout slice.
3. Step 3 saves payment metadata and creates an order document for COD orders.
4. The order includes:
   - `userId`
   - customer snapshot
   - item snapshot
   - pricing totals
   - shipping fee
   - status
5. On successful order save:
   - the user is redirected to the account orders tab
   - the basket is cleared
   - checkout state is reset

### Order management workflow

Customer side:

1. `UserOrdersTab` loads orders where `userId == current user`.
2. Pending orders can be cancelled.
3. Cancellation updates the order status to `cancelled`.

Admin side:

1. `/admin/orders` loads the full order collection.
2. Admins can move orders from `pending` to `confirmed`, then to `delivered`.
3. The UI uses the shared `OrdersList` component.

### AI chat workflow

1. `ChatBox` opens globally as a floating widget.
2. The current product context is inferred from the route when on `/product/:id`.
3. `chatService.jsx` loads products from Firestore.
4. The message is analyzed for intent such as:
   - price range
   - size
   - color
   - brand
   - featured/recommended preference
5. Matching products are ranked and inserted into the Gemini prompt.
6. Gemini returns a response plus a structured product recommendation payload.
7. The UI streams the reply and renders recommended product cards.

---

## Available Routes

### Public routes

- `/`
- `/shop`
- `/featured`
- `/recommended`
- `/search/:searchKey`
- `/product/:id`
- `/signin`
- `/signup`
- `/forgot_password`

### Customer routes

- `/account`
- `/account/edit`
- `/checkout/step1`
- `/checkout/step2`
- `/checkout/step3`

### Admin routes

- `/admin/dashboard`
- `/admin/products`
- `/admin/orders`
- `/admin/add`
- `/admin/edit/:id`

Note: `ADMIN_USERS` exists in route constants but does not currently have a page wired into the router.

---

## Scripts

Root scripts from `package.json`:

```bash
npm run dev
npm run build
npm run serve
npm run test
npm run migrate:products
```

### What each script does

- `dev`  
  Runs the Vite development server.
- `build`  
  Builds the Vite app, then attempts to copy `index.html` to `404.html`.
- `serve`  
  Runs `vite preview`.
- `test`  
  Runs Jest with `jest.config.json`.
- `migrate:products`  
  Uses `firebase-admin` to backfill `name_lower` and normalized `keywords`.

### Windows note for `build`

The current build script uses:

```bash
vite build && cd dist && cp index.html 404.html
```

On Windows shells that do not provide `cp`, the Vite build may succeed but the final copy step can fail. If needed, replace `cp` with a cross-platform alternative such as:

- `copy` in `cmd`
- `Copy-Item` in PowerShell
- a Node-based copy script

---

## Security Rules

This repo includes:

- `firestore.rules`
- `storage.rules`
- `database.rules.json`

For the implemented app behavior, the most important rules are the Firestore rules for:

- user profile access
- product reads/writes
- order reads/updates

If you change checkout or admin order logic, update Firestore rules accordingly before deploying.

---

## Testing

The repo includes Jest + Enzyme setup under `test/`.

Current testing footprint is light and appears focused on app/component bootstrapping rather than full workflow coverage. If you extend the project, good next candidates for tests are:

- auth saga flows
- product saga transformations
- checkout order creation
- order status transitions
- chat service intent parsing and product filtering

---

## Documentation Gaps Fixed In This README

Compared with the earlier README, the following areas were missing or outdated and are now documented accurately:

- order support is implemented and no longer "future work"
- admin order management exists
- the wish list is a placeholder, not a finished feature
- the AI assistant uses Gemini and has real product-ranking logic
- Firestore is the active data layer for orders/products/users
- environment variables now include Gemini configuration
- route structure and admin/customer guards are documented
- checkout and order workflows are described from the actual code
- the build script has a Windows-specific caveat

---

## Usage Notes

- The application uses Firebase directly from the client, so security rules are part of the functional behavior, not just infrastructure.
- Admin access depends on the `role` field inside the Firestore user document.
- The chat assistant relies on product-read access in Firestore; restrictive rules can cause the AI assistant to fail to load product context.
- OAuth providers must be enabled in Firebase Console before their buttons will work.

---

This README provides a more accurate code-aligned guide for development, deployment, academic review, and future extension of the project.
