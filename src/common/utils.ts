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

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",") : [];

// Full name only when both parts are set — otherwise falls back to the
// portion of the email before "@", since a partial name ("Sam" with no
// last name) is treated the same as no name at all.
export const getDisplayName = (
  firstName?: string,
  lastName?: string,
  email?: string
): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  // `?? "User"` alone doesn't catch this: an empty-string email produces an
  // empty-string prefix (`"".split("@")[0] === ""`), which is falsy but not
  // null/undefined, so the `??` fallback never fires.
  return email?.split("@")[0] || "User";
};

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
