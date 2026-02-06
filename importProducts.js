import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import products from './products.json';


// 🔴 LẤY CONFIG Ở firebase.js CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyD_zsOPGlXoK6AJtGKC1U-08koblHl9Fkw",
  authDomain: "ecommerce-react-fashion.firebaseapp.com",
  projectId: "ecommerce-react-fashion",
  storageBucket: "ecommerce-react-fashion.firebasestorage.app",
  messagingSenderId: "589772531419",
  appId: "1:589772531419:web:28a7ebaf56a1ff351bcefe",
  measurementId: "G-V75HGERECQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importProducts() {
  const productsRef = collection(db, 'products');

  for (const product of products) {
    await addDoc(productsRef, {
      ...product,
      dateAdded: serverTimestamp()
    });

    console.log('✅ Imported:', product.name);
  }

  console.log('🎉 IMPORT XONG TẤT CẢ PRODUCTS');
}

importProducts()
  .then(() => process.exit())
  .catch(console.error);
