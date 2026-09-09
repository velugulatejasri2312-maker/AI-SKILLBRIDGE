import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";

// Firebase web app configuration from environment variables
// VITE_ prefixed variables are automatically exposed to Vite client-side
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID
};

let app: any = null;
let dbFirestore: any = null;
let isFirestoreConnected = false;

// Attempt initialization and capture details
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbFirestore = getFirestore(app);
    isFirestoreConnected = true;
    console.log("🔥 Firebase Firestore connected successfully!");
  } else {
    console.log("ℹ️ No Firebase credentials found. Operating in local storage database mode.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
}

/**
 * Syncs a single collection from local storage to Firestore
 */
export async function syncLocalCollectionToFirestore(collectionName: string, items: any[]) {
  if (!isFirestoreConnected || !dbFirestore) return;
  try {
    const colRef = collection(dbFirestore, collectionName);
    
    // We can write items in batches for performance
    const batch = writeBatch(dbFirestore);
    items.forEach((item) => {
      if (!item.id) return;
      const docRef = doc(colRef, item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
    console.log(`Synced ${items.length} items to Firestore collection: "${collectionName}"`);
  } catch (err) {
    console.error(`Error syncing "${collectionName}" to Firestore:`, err);
  }
}

/**
 * Downloads a collection from Firestore and updates localStorage if items exist
 */
export async function downloadCollectionFromFirestore(collectionName: string, storageKey: string): Promise<any[]> {
  if (!isFirestoreConnected || !dbFirestore) return [];
  try {
    const colRef = collection(dbFirestore, collectionName);
    const querySnapshot = await getDocs(colRef);
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    if (items.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(items));
      console.log(`Downloaded ${items.length} items from Firestore collection: "${collectionName}"`);
      return items;
    }
  } catch (err) {
    console.error(`Error downloading "${collectionName}" from Firestore:`, err);
  }
  return [];
}

/**
 * Sync helper to upload a single document to Firestore
 */
export async function syncDocToFirestore(collectionName: string, docId: string, data: any) {
  if (!isFirestoreConnected || !dbFirestore) return;
  try {
    const docRef = doc(dbFirestore, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    console.log(`Uploaded single document "${docId}" to Firestore collection: "${collectionName}"`);
  } catch (err) {
    console.error(`Error uploading doc "${docId}" in "${collectionName}":`, err);
  }
}

/**
 * Sync helper to delete a document from Firestore
 */
export async function deleteDocFromFirestore(collectionName: string, docId: string) {
  if (!isFirestoreConnected || !dbFirestore) return;
  try {
    const docRef = doc(dbFirestore, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Deleted document "${docId}" from Firestore collection: "${collectionName}"`);
  } catch (err) {
    console.error(`Error deleting doc "${docId}" in "${collectionName}":`, err);
  }
}

export { dbFirestore, isFirestoreConnected };
