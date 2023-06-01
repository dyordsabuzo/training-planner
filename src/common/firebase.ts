import {initializeApp} from "firebase/app";
import {getFirestore, collection, doc} from "firebase/firestore";

const config = {
    apiKey: process.env.REACT_APP_FBASE_APIKEY,
    authDomain: process.env.REACT_APP_FBASE_AUTHDOMAIN,
    projectId: process.env.REACT_APP_FBASE_PROJECTID,
    appId: process.env.REACT_APP_FBASE_APPID,
}

const app = initializeApp(config)
export const database = getFirestore(app)

export const getCollection = (collectionName: string) => {
    return collection(database, collectionName)
}

export const getDocumentReference = (collectionName: string, id: string) => {
    return doc(database, collectionName, id)
}
