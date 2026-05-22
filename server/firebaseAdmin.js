const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const DEFAULT_SERVICE_ACCOUNT_FILE = 'ecommerce-react-fashion-firebase-adminsdk-fbsvc-9243901906.json';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountPath = explicitPath
    ? path.resolve(process.cwd(), explicitPath)
    : path.resolve(process.cwd(), DEFAULT_SERVICE_ACCOUNT_FILE);

  if (fs.existsSync(serviceAccountPath)) {
    return readJson(serviceAccountPath);
  }

  return null;
};

const initFirebaseAdmin = () => {
  if (admin.apps.length) return admin.app();

  const serviceAccount = loadServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID
    || process.env.VITE_FIREBASE_PROJECT_ID
    || serviceAccount?.project_id;

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        || process.env.VITE_FIREBASE_STORAGE_BUCKET
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  });
};

initFirebaseAdmin();

module.exports = admin;
