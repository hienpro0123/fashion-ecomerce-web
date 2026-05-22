const admin = require('../firebaseAdmin');

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) return null;
  return token;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization token.' });
    }

    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid Authorization token.',
      detail: error.message
    });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.user.uid)
      .get();

    if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin permission required.' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to check admin permission.',
      detail: error.message
    });
  }
};

module.exports = {
  requireAuth,
  requireAdmin
};
