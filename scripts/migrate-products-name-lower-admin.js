/* eslint-disable no-console */
const admin = require('firebase-admin');

// # Ghi chú:
// Chạy script này với service account hoặc GOOGLE_APPLICATION_CREDENTIALS.
// Ví dụ:
//   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\serviceAccount.json
//   npm run migrate:products

const initAdmin = () => {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'Thiếu projectId hoặc GOOGLE_APPLICATION_CREDENTIALS. Vui lòng cấu hình service account.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  });
};

const normalizeKeyword = (value) => String(value || '').trim().toLowerCase();

const buildKeywords = (keywords) => {
  if (!Array.isArray(keywords)) return [];
  const normalized = keywords.map(normalizeKeyword).filter(Boolean);
  return Array.from(new Set(normalized));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  initAdmin();
  const db = admin.firestore();

  const snapshot = await db.collection('products').get();
  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  let batch = db.batch();
  let batchCount = 0;
  let updatedCount = 0;
  let processed = 0;

  for (const doc of snapshot.docs) {
    processed += 1;
    const data = doc.data() || {};
    const name = String(data.name || '').trim();
    const nameLower = name ? name.toLowerCase() : '';
    const keywords = buildKeywords(data.keywords);

    const updates = {};
    if (name && data.name_lower !== nameLower) updates.name_lower = nameLower;
    if (Array.isArray(data.keywords)) updates.keywords = keywords;

    if (Object.keys(updates).length) {
      batch.update(doc.ref, updates);
      batchCount += 1;
      updatedCount += 1;
    }

    if (batchCount >= 450) {
      await batch.commit();
      console.log(`Committed ${batchCount} updates so far...`);
      batch = db.batch();
      batchCount = 0;
      await sleep(250);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Processed: ${processed}, Updated: ${updatedCount}`);
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});

