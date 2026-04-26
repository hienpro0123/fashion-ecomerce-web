require('dotenv').config();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const baseUrl = projectId
  ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  : '';

const decodeFields = (fields = {}) => Object.entries(fields).reduce((acc, [key, value]) => ({
  ...acc,
  [key]: decodeValue(value)
}), {});

const decodeValue = (value = {}) => {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields);
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('bytesValue' in value) return value.bytesValue;

  return null;
};

const toProduct = (document) => ({
  id: document.name.split('/').pop(),
  ...decodeFields(document.fields)
});

const assertRestConfig = () => {
  if (!projectId || !apiKey) {
    throw new Error('Missing VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY for Firestore REST fallback.');
  }
};

const requestJson = async (url) => {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || `Firestore REST request failed with ${response.status}.`);
  }

  return data;
};

const listProducts = async () => {
  assertRestConfig();

  const products = [];
  let pageToken = '';

  do {
    const url = new URL(`${baseUrl}/products`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await requestJson(url);
    products.push(...(data.documents || []).map(toProduct));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return products.sort((a, b) => a.id.localeCompare(b.id));
};

const getProduct = async (id) => {
  assertRestConfig();

  const url = new URL(`${baseUrl}/products/${encodeURIComponent(id)}`);
  url.searchParams.set('key', apiKey);

  const data = await requestJson(url);
  return toProduct(data);
};

module.exports = {
  listProducts,
  getProduct
};
