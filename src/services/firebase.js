import app from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import firebaseConfig from "./config";

const createProductDocSnapshot = (product) => ({
  exists: Boolean(product),
  data: () => product,
  ref: {
    id: product?.id
  }
});

const createProductQuerySnapshot = (products = []) => ({
  empty: products.length === 0,
  docs: products.map(createProductDocSnapshot),
  forEach: (callback) => {
    products.forEach((product) => callback(createProductDocSnapshot(product)));
  }
});

class Firebase {
  constructor() {
    app.initializeApp(firebaseConfig);

    this.storage = app.storage();
    this.db = app.firestore();
    this.auth = app.auth();
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || "";
  }

  apiFetch = async (path, options = {}) => {
    const {
      method = "GET",
      body,
      params = {},
      auth = ["POST", "PATCH", "DELETE"].includes(method)
    } = options;
    const normalizedBaseUrl = this.backendUrl.replace(/\/$/, "");
    const baseUrl = normalizedBaseUrl.endsWith("/api")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api`;
    const cleanPath = path.replace(/^\//, "");
    const url = new URL(`${baseUrl}/${cleanPath}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const headers = {
      "Content-Type": "application/json"
    };

    if (auth) {
      const token = await this.auth.currentUser?.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || "Backend request failed.");
      error.status = response.status;
      error.detail = data.detail;
      throw error;
    }

    return data;
  }

  getLastKeyValue = (lastRefKey) => {
    if (!lastRefKey) return null;
    if (typeof lastRefKey === "string") return lastRefKey;
    if (lastRefKey.id) return lastRefKey.id;
    if (lastRefKey.ref?.id) return lastRefKey.ref.id;
    return null;
  }

  // AUTH ACTIONS ------------

  createAccount = (email, password) =>
    this.auth.createUserWithEmailAndPassword(email, password);

  signIn = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password);

  signInWithGoogle = () =>
    this.auth.signInWithPopup(new app.auth.GoogleAuthProvider());

  signInWithFacebook = () =>
    this.auth.signInWithPopup(new app.auth.FacebookAuthProvider());

  signInWithGithub = () =>
    this.auth.signInWithPopup(new app.auth.GithubAuthProvider());

  signOut = () => this.auth.signOut();

  passwordReset = (email) => this.auth.sendPasswordResetEmail(email);

  addUser = (id, user) => this.db.collection("users").doc(id).set(user);

  getUser = (id) => this.db.collection("users").doc(id).get();

  passwordUpdate = (password) => this.auth.currentUser.updatePassword(password);

  changePassword = (currentPassword, newPassword) =>
    new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          user
            .updatePassword(newPassword)
            .then(() => {
              resolve("Password updated successfully!");
            })
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });

  reauthenticate = (currentPassword) => {
    const user = this.auth.currentUser;
    const cred = app.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    return user.reauthenticateWithCredential(cred);
  };

  updateEmail = (currentPassword, newEmail) =>
    new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          user
            .updateEmail(newEmail)
            .then(() => {
              resolve("Email Successfully updated");
            })
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });

  updateProfile = (id, updates) =>
    this.db.collection("users").doc(id).update(updates);

  getCurrentUserId = () => this.auth.currentUser?.uid || null;

  saveOrder = (order) => {
    const userId = order?.userId || this.getCurrentUserId();

    if (!userId) {
      return Promise.reject(new Error("You must be signed in to place an order."));
    }

    return this.db.collection("orders").add({
      ...order,
      userId
    });
  };

  updateOrderStatus = async (orderId, status) => {
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error("You must be signed in to update an order.");
    }

    const orderRef = this.db.collection("orders").doc(orderId);
    const snapshot = await orderRef.get();

    if (!snapshot.exists) {
      throw new Error("Order not found.");
    }

    const order = snapshot.data();

    if (!order?.userId) {
      throw new Error("Order is missing a userId. Update the stored order data before changing its status.");
    }

    return orderRef.update({ status });
  };

  getOrdersByUser = (userId) =>
    this.db.collection("orders").where("userId", "==", userId).get();

  getOrders = () => this.db.collection("orders").get();

  onAuthStateChanged = () =>
    new Promise((resolve, reject) => {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Auth State Changed failed"));
        }
      });
    });

  saveBasketItems = (items, userId) =>
    this.db.collection("users").doc(userId).update({ basket: items });

  setAuthPersistence = () =>
    this.auth.setPersistence(app.auth.Auth.Persistence.LOCAL);

  // // PRODUCT ACTIONS --------------

  getSingleProduct = async (id) => {
    if (this.backendUrl) {
      try {
        const result = await this.apiFetch(`/products/${id}`, { auth: false });
        return createProductDocSnapshot(result.product);
      } catch (error) {
        if (error.status === 404) return createProductDocSnapshot(null);
        throw error;
      }
    }

    return this.db.collection("products").doc(id).get();
  };

  getProducts = (lastRefKey) => {
    if (this.backendUrl) {
      return this.apiFetch("/products", {
        auth: false,
        params: {
          limit: 12,
          after: this.getLastKeyValue(lastRefKey)
        }
      });
    }

    let didTimeout = false;

    return new Promise((resolve, reject) => {
      (async () => {
        if (lastRefKey) {
          try {
            const query = this.db
              .collection("products")
              .orderBy(app.firestore.FieldPath.documentId())
              .startAfter(lastRefKey)
              .limit(12);

            const snapshot = await query.get();
            const products = [];
            snapshot.forEach((doc) =>
              products.push({ id: doc.id, ...doc.data() })
            );
            const lastKey = snapshot.docs[snapshot.docs.length - 1];

            resolve({ products, lastKey });
          } catch (e) {
            reject(e?.message || ":( Failed to fetch products.");
          }
        } else {
          const timeout = setTimeout(() => {
            didTimeout = true;
            reject(new Error("Request timeout, please try again"));
          }, 15000);

          try {
            const totalQuery = await this.db.collection("products").get();
            const total = totalQuery.docs.length;
            const query = this.db
              .collection("products")
              .orderBy(app.firestore.FieldPath.documentId())
              .limit(12);
            const snapshot = await query.get();

            clearTimeout(timeout);
            if (!didTimeout) {
              const products = [];
              snapshot.forEach((doc) =>
                products.push({ id: doc.id, ...doc.data() })
              );
              const lastKey = snapshot.docs[snapshot.docs.length - 1];

              resolve({ products, lastKey, total });
            }
          } catch (e) {
            if (didTimeout) return;
            reject(e?.message || ":( Failed to fetch products.");
          }
        }
      })();
    });
  };

  searchProducts = (searchKey) => {
    if (this.backendUrl) {
      return this.apiFetch("/products", {
        auth: false,
        params: {
          limit: 12,
          search: searchKey
        }
      });
    }

    // normalization helper: lowercase + strip diacritics
    const normalize = (str) => {
      if (!str) return '';
      return str
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
    };

    const normKey = normalize(searchKey || '');
    let didTimeout = false;

    return new Promise((resolve, reject) => {
      (async () => {
        const productsRef = this.db.collection('products');

        const timeout = setTimeout(() => {
          didTimeout = true;
          reject(new Error('Request timeout, please try again'));
        }, 15000);

        try {
          // pull all products and apply client-side filter for accurate accent- and
          // partial-search behavior. This simplifies logic and avoids relying on
          // Firestore string-range queries which are sensitive to diacritics.
          const allSnaps = await productsRef.get();
          clearTimeout(timeout);

          if (!didTimeout) {
            const allProducts = [];
            allSnaps.forEach((doc) => allProducts.push({ id: doc.id, ...doc.data() }));

            const filtered = allProducts.filter((product) => {
              const name = normalize(product.name);
              const desc = normalize(product.description);
              let keywordsList = [];
              if (product.keywords) {
                keywordsList = Array.isArray(product.keywords)
                  ? product.keywords.map(normalize)
                  : [normalize(product.keywords)];
              }

              if (!normKey) return true;

              return (
                name.includes(normKey) ||
                desc.includes(normKey) ||
                keywordsList.some((k) => k.includes(normKey))
              );
            });

            // limit to 12 items for consistency with previous behavior
            const limited = filtered.slice(0, 12);
            resolve({ products: limited, lastKey: null });
          }
        } catch (e) {
          if (didTimeout) return;
          reject(e);
        }
      })();
    });
  };

  getFeaturedProducts = async (itemsCount = 12) => {
    if (this.backendUrl) {
      const result = await this.apiFetch("/products", {
        auth: false,
        params: {
          limit: itemsCount,
          featured: true
        }
      });

      return createProductQuerySnapshot(result.products);
    }

    return this.db
      .collection("products")
      .where("isFeatured", "==", true)
      .limit(itemsCount)
      .get();
  }

  getRecommendedProducts = async (itemsCount = 12) => {
    if (this.backendUrl) {
      const result = await this.apiFetch("/products", {
        auth: false,
        params: {
          limit: itemsCount,
          recommended: true
        }
      });

      return createProductQuerySnapshot(result.products);
    }

    return this.db
      .collection("products")
      .where("isRecommended", "==", true)
      .limit(itemsCount)
      .get();
  }

  addProduct = (id, product) => {
    if (this.backendUrl) {
      return this.apiFetch("/products", {
        method: "POST",
        body: {
          id,
          product
        }
      });
    }

    return this.db.collection("products").doc(id).set(product);
  }

  generateKey = () => this.db.collection("products").doc().id;

  storeImage = async (id, folder, imageFile) => {
    const snapshot = await this.storage.ref(folder).child(id).put(imageFile);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return downloadURL;
  };

  deleteImage = (id) => this.storage.ref("products").child(id).delete();

  editProduct = (id, updates) => {
    if (this.backendUrl) {
      return this.apiFetch(`/products/${id}`, {
        method: "PATCH",
        body: updates
      });
    }

    return this.db.collection("products").doc(id).update(updates);
  }

  removeProduct = (id) => {
    if (this.backendUrl) {
      return this.apiFetch(`/products/${id}`, {
        method: "DELETE"
      });
    }

    return this.db.collection("products").doc(id).delete();
  }
}

const firebaseInstance = new Firebase();

export default firebaseInstance;
