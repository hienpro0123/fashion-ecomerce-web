const express = require('express');
const admin = require('../firebaseAdmin');
const firestoreRest = require('../firestoreRest');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = admin.firestore();
const productsRef = db.collection('products');

const normalizeText = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toProduct = (doc) => ({
  id: doc.id,
  ...doc.data()
});

const toLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 12;
  return Math.min(Math.max(parsed, 1), 50);
};

const filterProducts = (products, searchKey) => {
  const key = normalizeText(searchKey);
  if (!key) return products;

  return products.filter((product) => {
    const fields = [
      product.name,
      product.description,
      product.brand,
      ...(Array.isArray(product.keywords) ? product.keywords : [])
    ].map(normalizeText);

    return fields.some((field) => field.includes(key));
  });
};

const shouldUseRestFallback = () => true;

const getProductsFromAdmin = async ({
  after, featured, recommended, search, limit
}) => {
  if (search) {
    const snapshot = await productsRef.get();
    const products = filterProducts(snapshot.docs.map(toProduct), search);

    return {
      products: products.slice(0, limit),
      lastKey: null,
      total: products.length
    };
  }

  let query = productsRef.orderBy(admin.firestore.FieldPath.documentId());

  if (featured === 'true') {
    query = productsRef.where('isFeatured', '==', true).limit(limit);
  } else if (recommended === 'true') {
    query = productsRef.where('isRecommended', '==', true).limit(limit);
  } else {
    if (after) query = query.startAfter(after);
    query = query.limit(limit);
  }

  const [snapshot, totalSnapshot] = await Promise.all([
    query.get(),
    productsRef.get()
  ]);
  const products = snapshot.docs.map(toProduct);
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return {
    products,
    lastKey: lastDoc?.id || null,
    total: totalSnapshot.size
  };
};

const getProductsFromRest = async ({
  after, featured, recommended, search, limit
}) => {
  const allProducts = await firestoreRest.listProducts();
  let products = allProducts;

  if (search) {
    products = filterProducts(products, search);
  } else if (featured === 'true') {
    products = products.filter((product) => product.isFeatured === true);
  } else if (recommended === 'true') {
    products = products.filter((product) => product.isRecommended === true);
  } else if (after) {
    const afterIndex = products.findIndex((product) => product.id === after);
    products = afterIndex >= 0 ? products.slice(afterIndex + 1) : products;
  }

  const limited = products.slice(0, limit);

  return {
    products: limited,
    lastKey: limited[limited.length - 1]?.id || null,
    total: search || featured === 'true' || recommended === 'true'
      ? products.length
      : allProducts.length
  };
};

router.get('/', async (req, res) => {
  const params = {
    ...req.query,
    limit: toLimit(req.query.limit)
  };

  try {
    const result = await getProductsFromAdmin(params);
    return res.json(result);
  } catch (error) {
    if (shouldUseRestFallback(error)) {
      try {
        const result = await getProductsFromRest(params);
        return res.json({ ...result, source: 'firestore-rest' });
      } catch (fallbackError) {
        return res.status(500).json({
          message: 'Failed to fetch products with Firebase Admin and REST fallback.',
          detail: fallbackError.message,
          adminDetail: error.message
        });
      }
    }

    return res.status(500).json({
      message: 'Failed to fetch products.',
      detail: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await productsRef.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json({ product: toProduct(doc) });
  } catch (error) {
    if (shouldUseRestFallback(error)) {
      try {
        const product = await firestoreRest.getProduct(req.params.id);
        return res.json({ product, source: 'firestore-rest' });
      } catch (fallbackError) {
        if (/not found/i.test(fallbackError.message)) {
          return res.status(404).json({ message: 'Product not found.' });
        }

        return res.status(500).json({
          message: 'Failed to fetch product with Firebase Admin and REST fallback.',
          detail: fallbackError.message,
          adminDetail: error.message
        });
      }
    }

    return res.status(500).json({
      message: 'Failed to fetch product.',
      detail: error.message
    });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, product } = req.body;
    const docRef = id ? productsRef.doc(id) : productsRef.doc();
    const payload = {
      ...product,
      name_lower: String(product?.name || '').toLowerCase()
    };

    await docRef.set(payload);

    return res.status(201).json({
      product: {
        id: docRef.id,
        ...payload
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create product.',
      detail: error.message
    });
  }
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };

    if (typeof updates.name === 'string') {
      updates.name_lower = updates.name.toLowerCase();
    }

    await productsRef.doc(req.params.id).update(updates);

    return res.json({
      product: {
        id: req.params.id,
        ...updates
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update product.',
      detail: error.message
    });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await productsRef.doc(req.params.id).delete();
    return res.json({ id: req.params.id });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete product.',
      detail: error.message
    });
  }
});

module.exports = router;
