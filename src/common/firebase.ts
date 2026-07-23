import { initializeApp } from "firebase/app";
import { connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  connectFirestoreEmulator,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FBASE_APIKEY,
  authDomain: import.meta.env.VITE_FBASE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FBASE_PROJECTID,
  appId: import.meta.env.VITE_FBASE_APPID,
};

const app = initializeApp(config);
export const database = getFirestore(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(database, "127.0.0.1", 8080);
}

export const getCollection = (collectionName: string) => {
  return collection(database, collectionName);
};

export const getDocumentReference = (collectionName: string, id: string) => {
  return doc(database, collectionName, id);
};
