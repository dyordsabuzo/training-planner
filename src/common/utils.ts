import {
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  database,
  getCollection,
  getDocumentReference,
} from "../common/firebase";

export enum SourceDbReferences {
  EXERCISES = "exercises",
  SUPERSETS = "supersets",
  SESSIONS = "sessions",
  PLANS = "plans",
  USERDATA = "userdata",
}

export const sortObject = (data: any) => {
  return Object.keys(data)
    .sort((a, b) => {
      const [textA, numA] = a.split(" ");
      const [textB, numB] = b.split(" ");

      // Compare the text part first (alphabetical order)
      if (textA !== textB) {
        return textA.localeCompare(textB);
      }

      // Compare the numeric part (numerical order)
      return Number(numA) - Number(numB);
    })
    .reduce((accumulator: any, key: string) => {
      accumulator[key] = data[key];
      return accumulator;
    }, {});
};

export const saveToDB = async (sourceDb: SourceDbReferences, data: any) => {
  const collection = getCollection(sourceDb);

  if (!(data.id ?? "")) {
    try {
      const doc = await addDoc(collection, data);
      return {
        ...data,
        id: doc.id,
      };
    } catch (error) {
      console.error(`Unable to save to db: ${sourceDb}`, error);
    }
  } else {
    try {
      const { id, ...plaindata } = data;
      const docRef = doc(database, sourceDb, id);
      await setDoc(docRef, plaindata, { merge: true });
      return data;
    } catch (error) {
      console.error(`Unable to update db: ${sourceDb}`, error);
    }
  }
  return null;
};

export const getFromDB = async (
  sourceDb: SourceDbReferences,
  idFilters: string[] = []
): Promise<any> => {
  try {
    const collection = getCollection(sourceDb);
    const snapshot = await getDocs(collection);

    let data = {};
    const docs =
      idFilters.length > 0
        ? snapshot.docs.filter((doc) => idFilters.includes(doc.id))
        : snapshot.docs;

    docs.forEach((doc) => {
      const docData = doc.data();
      data = {
        ...data,
        [docData.name]: { ...docData, id: doc.id },
      };
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};
