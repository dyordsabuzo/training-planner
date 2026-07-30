import { createContext, ReactNode, useContext, useState } from "react";
import { addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { getCollection, getDocumentReference } from "../common/firebase";
import AuthContext from "./AuthContext";
import { saveToDB, SourceDbReferences } from "../common/utils";
import { getEntitiesNeedingRenameUpdate } from "./renameCascade";

// type ContextData = {
//   sourceData?: any;
//   updateExercise?: (exercise: any) => void;
//   addExercise?: (exercise: any) => void;
//   deleteExercise?: (data: any) => void;
//   addSuperset?: (superset: any) => void;
//   editSuperset?: (superset: any) => void;
//   deleteSuperset?: (superset: any) => void;
//   addSession?: (session: any) => void;
//   editSession?: (session: any) => void;
//   deleteSession?: (session: any) => void;
//   addPlan?: (plan: any) => void;
//   editPlan?: (plan: any) => void;
//   deletePlan?: (plan: any) => void;
//   updateWeekPlan?: (planName: string, weekData: any) => void;
//   initialise?: () => void;
// };

const SourceDataContext = createContext({
  sourceData: {},
  updateExercise: (exercise: any) => {},
  addExercise: (exercise: any) => {},
  deleteExercise: (data: any) => {},
  addSuperset: (superset: any) => {},
  editSuperset: (superset: any) => {},
  deleteSuperset: (superset: any) => {},
  addSession: (session: any) => {},
  editSession: (session: any) => {},
  deleteSession: (session: any) => {},
  addPlan: (plan: any) => {},
  editPlan: (plan: any) => {},
  deletePlan: (plan: any) => {},
  updateWeekPlan: (planName: string, weekData: any) => {},
  initialise: () => {},
});

export default SourceDataContext;

type _Props = {
  children: ReactNode;
};

export const SourceDataContextProvider: React.FC<_Props> = ({ children }) => {
  const [sourceData, setSourceData] = useState<any>({});
  const authContext = useContext(AuthContext);
  const { user, userPermission } = authContext;

  const initialise = async () => {
    try {
      // getLocalStorage()
      const exercises = await getFromDB(SourceDbReferences.EXERCISES);
      const supersets = await getFromDB(SourceDbReferences.SUPERSETS);
      const sessions = await getFromDB(SourceDbReferences.SESSIONS);

      const userdata = user
        ? await getFromDB(SourceDbReferences.USERDATA, [user.uid])
        : null;

      // Admins see every plan; everyone else is restricted to the plans
      // explicitly granted on their users/{uid} doc — an empty/undefined
      // list here must mean "no plans", not "no filter".
      const planIdFilter =
        userPermission?.role === "admin" ? undefined : userPermission?.plans ?? [];
      const plans = await getFromDB(SourceDbReferences.PLANS, planIdFilter);

      setSourceData({
        ...sourceData,
        exercises,
        supersets,
        sessions,
        plans,
        userdata,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const deleteFromDB = (sourceDb: SourceDbReferences, data: any) => {
    deleteDoc(getDocumentReference(sourceDb, data.id)).then(() => {
      setSourceData((prev: any) => {
        const sourceDataElement = { ...(prev[sourceDb] ?? {}) };
        delete sourceDataElement[data.name];
        return { ...prev, [sourceDb]: sourceDataElement };
      });
    });
  };

  // const saveToDB = async (sourceDb: SourceDbReferences, data: any) => {
  //   const collection = getCollection(sourceDb);

  //   if (!(data.id ?? "")) {
  //     await addDoc(collection, data)
  //       .then((doc) => {
  //         const sourceDataElement = sourceData[sourceDb] ?? {};
  //         setSourceData({
  //           ...sourceData,
  //           [sourceDb]: {
  //             ...sourceDataElement,
  //             [data.name]: {
  //               ...data,
  //               id: doc.id,
  //             },
  //           },
  //         });
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //       });
  //   } else {
  //     const docRef = getDocumentReference(sourceDb, data.id);
  //     const { id, ...plainData } = data;

  //     await updateDoc(docRef, plainData).then((doc) => {
  //       const sourceDataElement = sourceData[sourceDb] ?? {};
  //       setSourceData({
  //         ...sourceData,
  //         [sourceDb]: {
  //           ...sourceDataElement,
  //           [data.name]: data,
  //         },
  //       });
  //     });
  //   }
  // };

  const getFromDB = async (
    sourceDb: SourceDbReferences,
    idFilters?: string[]
  ): Promise<any> => {
    try {
      const collection = getCollection(sourceDb);
      const snapshot = await getDocs(collection);

      let data = {};
      // `idFilters` omitted (undefined) means "no filter, return everything".
      // An explicit array (including an empty one) is a strict allow-list —
      // empty must mean zero results, not "same as no filter".
      const docs = idFilters
        ? snapshot.docs.filter((doc) => idFilters.includes(doc.id))
        : snapshot.docs;

      docs.forEach((doc) => {
        const docData = doc.data();

        if (docData.name) {
          data = {
            ...data,
            [docData.name]: { ...docData, id: doc.id },
          };
        } else {
          data = {
            ...data,
            [doc.id]: { ...docData, id: doc.id },
          };
        }
      });

      return data;
    } catch (error) {
      console.log(error);
    }
  };

  const linkExerciseWithSupersets = (exercise: any) => {
    exercise.supersets.forEach(async (s: string) => {
      if (s) {
        let superset: any = Object.values(sourceData.supersets ?? {}).find(
          (sObject: any) => sObject.name === s
        );

        // Only back-link an existing superset — never auto-create a new one
        // for a name that doesn't match anything (e.g. a typo/stray value
        // typed into the tag field).
        if (!superset) {
          return;
        }

        const exerciseList: string[] = superset?.exercises ?? [];
        if (!exerciseList.includes(exercise.name)) {
          exerciseList.push(exercise.name);
        }
        superset = {
          ...superset,
          exercises: exerciseList,
        };

        const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
        updateSourceData(SourceDbReferences.SUPERSETS, data);
      }
    });
  };

  const linkSupersetWithSessions = (superset: any) => {
    superset.sessions.forEach(async (session: string) => {
      if (session) {
        let sessionObject: any = Object.values(sourceData.sessions ?? {}).find(
          (s: any) => s.name === session
        );

        // Only back-link an existing session — never auto-create a new one
        // for a name that doesn't match anything (e.g. a typo/stray value
        // typed into the "Linked sessions" tag field). Sessions should only
        // be created via the Add Session button.
        if (!sessionObject) {
          return;
        }

        const supersetList: string[] = sessionObject?.supersets ?? [];
        if (!supersetList.includes(superset.name)) {
          supersetList.push(superset.name);
        }
        sessionObject = {
          ...sessionObject,
          supersets: supersetList,
        };

        const data = await saveToDB(SourceDbReferences.SESSIONS, sessionObject);
        updateSourceData(SourceDbReferences.SESSIONS, data);
      }
    });
  };

  const updateSourceData = (dbReference: SourceDbReferences, data: any) => {
    if (!data) {
      return;
    }
    setSourceData((prev: any) => ({
      ...prev,
      [dbReference]: {
        ...(prev[dbReference] ?? {}),
        [data.name]: data,
      },
    }));
  };

  // Renaming an entity keeps its old dictionary key around unless explicitly
  // removed — updateSourceData alone only ever adds/overwrites a key, never
  // deletes one, so a rename would otherwise leave a stale duplicate entry.
  const renameSourceData = (
    dbReference: SourceDbReferences,
    oldName: string,
    data: any
  ) => {
    if (!data) {
      return;
    }
    setSourceData((prev: any) => {
      const sourceDataElement = { ...(prev[dbReference] ?? {}) };
      delete sourceDataElement[oldName];
      sourceDataElement[data.name] = data;
      return { ...prev, [dbReference]: sourceDataElement };
    });
  };

  const findPrevious = (dict: any, id?: string) =>
    Object.values(dict ?? {}).find((entity: any) => entity.id === id) as any;

  // When an entity is renamed, every other entity that references its old
  // name by string (e.g. a Superset's `exercises` list) needs that string
  // updated to the new name, or the reference silently dangles.
  const applyRenameCascade = async (
    dbReference: SourceDbReferences,
    oldName: string,
    newName: string
  ) => {
    const updates = getEntitiesNeedingRenameUpdate(
      sourceData,
      dbReference,
      oldName,
      newName
    );
    for (const { collection, entity } of updates) {
      const saved = await saveToDB(collection, entity);
      updateSourceData(collection, saved);
    }
  };

  const saveRenamedEntity = async (
    dbReference: SourceDbReferences,
    previous: any,
    data: any
  ) => {
    if (!data) {
      return;
    }
    if (previous && previous.name !== data.name) {
      renameSourceData(dbReference, previous.name, data);
      await applyRenameCascade(dbReference, previous.name, data.name);
    } else {
      updateSourceData(dbReference, data);
    }
  };

  const updateExercise = async (exercise: any) => {
    const previous = findPrevious(sourceData.exercises, exercise.id);
    const data = await saveToDB(SourceDbReferences.EXERCISES, exercise);
    await saveRenamedEntity(SourceDbReferences.EXERCISES, previous, data);
    linkExerciseWithSupersets(exercise);
  };

  const addExercise = async (exercise: any) => {
    const data = await saveToDB(SourceDbReferences.EXERCISES, exercise);
    updateSourceData(SourceDbReferences.EXERCISES, data);
    linkExerciseWithSupersets(exercise);
  };

  const deleteExercise = (exercise: any) => {
    deleteFromDB(SourceDbReferences.EXERCISES, exercise);
    setSourceData((prev: any) => {
      const exercises = { ...(prev.exercises ?? {}) };
      delete exercises[exercise.name];
      return { ...prev, exercises };
    });
  };

  const addSuperset = async (superset: any) => {
    const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
    updateSourceData(SourceDbReferences.SUPERSETS, data);
    linkSupersetWithSessions(superset);
  };

  const editSuperset = async (superset: any) => {
    const previous = findPrevious(sourceData.supersets, superset.id);
    const exercises = Object.keys(sourceData.exercises ?? {});
    superset = {
      ...superset,
      exercises: (superset.exercises ?? []).filter((e: string) =>
        exercises.includes(e)
      ),
    };
    const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
    await saveRenamedEntity(SourceDbReferences.SUPERSETS, previous, data);
    linkSupersetWithSessions(superset);
  };

  const deleteSuperset = (superset: any) => {
    deleteFromDB(SourceDbReferences.SUPERSETS, superset);
    setSourceData((prev: any) => {
      const supersets = { ...(prev.supersets ?? {}) };
      delete supersets[superset.name];
      return { ...prev, supersets };
    });
  };

  const addSession = async (session: any) => {
    const data = await saveToDB(SourceDbReferences.SESSIONS, session);
    updateSourceData(SourceDbReferences.SESSIONS, data);
  };

  const editSession = async (session: any) => {
    const previous = findPrevious(sourceData.sessions, session.id);
    const data = await saveToDB(SourceDbReferences.SESSIONS, session);
    await saveRenamedEntity(SourceDbReferences.SESSIONS, previous, data);
  };

  const deleteSession = (session: any) => {
    deleteFromDB(SourceDbReferences.SESSIONS, session);
    setSourceData((prev: any) => {
      const sessions = { ...(prev.sessions ?? {}) };
      delete sessions[session.name];
      return { ...prev, sessions };
    });
  };

  const addPlan = async (plan: any) => {
    let weeks = {};
    Array.from(Array(parseInt(plan.numberOfWeeks ?? "0")).keys()).forEach(
      (week) => {
        weeks = {
          ...weeks,
          [`Week ${week + 1}`]: {
            weekNumber: week,
            targetRep: plan.baselineRep,
            targetSet: plan.baselineSet,
            targetTime: plan.baselineTime,
            annotation: "",
          },
        };
      }
    );

    plan = {
      ...plan,
      weeks,
    };
    const data = await saveToDB(SourceDbReferences.PLANS, plan);
    updateSourceData(SourceDbReferences.PLANS, data);
  };

  const editPlan = async (plan: any) => {
    const previous = findPrevious(sourceData.plans, plan.id);
    let currentWeeks = previous?.weeks ?? {};
    let currentWeeksLength = Object.keys(currentWeeks).length;

    if (parseInt(plan.numberOfWeeks || "0") > currentWeeksLength) {
      Array.from(
        Array(parseInt(plan.numberOfWeeks) - currentWeeksLength).keys()
      ).forEach((week) => {
        currentWeeks = {
          ...currentWeeks,
          [`Week ${week + 1 + currentWeeksLength}`]: {
            weekNumber: week + currentWeeksLength,
            targetRep: plan.baselineRep,
            targetSet: plan.baselineSet,
            targetTime: plan.baselineTime,
            annotation: "",
          },
        };
      });
    }
    plan = {
      ...plan,
      weeks: currentWeeks,
    };

    const data = await saveToDB(SourceDbReferences.PLANS, plan);
    await saveRenamedEntity(SourceDbReferences.PLANS, previous, data);
  };

  const deletePlan = (plan: any) => {
    deleteFromDB(SourceDbReferences.PLANS, plan);
    setSourceData((prev: any) => {
      const plans = { ...(prev.plans ?? {}) };
      delete plans[plan.name];
      return { ...prev, plans };
    });
  };

  const updateWeekPlan = async (planName: string, weekData: any) => {
    let plans = sourceData.plans ?? {};
    let plan: any = Object.values(plans as any).find(
      (obj) => (obj as any).name === planName
    );

    plan = {
      ...plan,
      weeks: {
        ...plan.weeks,
        [`Week ${weekData.weekNumber + 1}`]: weekData,
      },
    };

    const data = await saveToDB(SourceDbReferences.PLANS, plan);
    updateSourceData(SourceDbReferences.PLANS, data);

    setSourceData({
      ...sourceData,
      plans: {
        ...sourceData.plans,
        [planName]: plan,
      },
    });
  };

  return (
    <SourceDataContext.Provider
      value={{
        sourceData,
        addExercise,
        updateExercise,
        deleteExercise,
        addSuperset,
        editSuperset,
        deleteSuperset,
        addSession,
        editSession,
        deleteSession,
        addPlan,
        editPlan,
        deletePlan,
        updateWeekPlan,
        initialise,
      }}
    >
      {children}
    </SourceDataContext.Provider>
  );
};
