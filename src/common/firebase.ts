import { initializeApp } from "firebase/app";
import { connectAuthEmulator } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
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
// Same region as functions/src/config.ts.
const functions = getFunctions(app, "australia-southeast1");

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR !== "false") {
  connectFirestoreEmulator(database, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

// Calls one of the callables in functions/src and returns its result.
export const callFunction = async <T = unknown>(name: string, data: unknown): Promise<T> =>
  (await httpsCallable<unknown, T>(functions, name)(data)).data;

export const getCollection = (collectionName: string) => {
  return collection(database, collectionName);
};

export const getDocumentReference = (collectionName: string, id: string) => {
  return doc(database, collectionName, id);
};
