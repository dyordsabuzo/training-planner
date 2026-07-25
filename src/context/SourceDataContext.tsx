import { createContext, ReactNode, useContext, useState } from "react";
import { addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { getCollection, getDocumentReference } from "../common/firebase";
import AuthContext from "./AuthContext";
import { saveToDB, SourceDbReferences } from "../common/utils";

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

      const plans = await getFromDB(
        SourceDbReferences.PLANS,
        userPermission?.plans
      );

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
      let sourceDataElement = sourceData[sourceDb] ?? {};
      delete sourceDataElement[data.name];
      setSourceData({
        ...sourceData,
        [sourceDb]: sourceDataElement,
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

        const exerciseList: string[] = superset?.exercises ?? [];
        if (!exerciseList.includes(exercise.name)) {
          exerciseList.push(exercise.name);
        }
        superset = {
          ...superset,
          name: s,
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

        const supersetList: string[] = sessionObject?.supersets ?? [];
        if (!supersetList.includes(superset.name)) {
          supersetList.push(superset.name);
        }
        sessionObject = {
          ...sessionObject,
          name: session,
          supersets: supersetList,
        };

        const data = await saveToDB(SourceDbReferences.SESSIONS, sessionObject);
        updateSourceData(SourceDbReferences.SESSIONS, data);
      }
    });
  };

  const updateSourceData = (dbReference: SourceDbReferences, data: any) => {
    if (data) {
      const sourceDataElement = sourceData[dbReference];
      setSourceData({
        ...sourceData,
        [dbReference]: {
          ...sourceDataElement,
          [data?.name]: data,
        },
      });
    }
  };

  const updateExercise = async (exercise: any) => {
    const data = await saveToDB(SourceDbReferences.EXERCISES, exercise);
    updateSourceData(SourceDbReferences.EXERCISES, data);
    linkExerciseWithSupersets(exercise);
  };

  const addExercise = async (exercise: any) => {
    const data = await saveToDB(SourceDbReferences.EXERCISES, exercise);
    updateSourceData(SourceDbReferences.EXERCISES, data);
    linkExerciseWithSupersets(exercise);
  };

  const deleteExercise = (exercise: any) => {
    deleteFromDB(SourceDbReferences.EXERCISES, exercise);
    let _srcData = sourceData;
    delete _srcData.exercises[exercise.name];
    setSourceData(_srcData);
  };

  const addSuperset = async (superset: any) => {
    const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
    updateSourceData(SourceDbReferences.SUPERSETS, data);
    linkSupersetWithSessions(superset);
  };

  const editSuperset = async (superset: any) => {
    const exercises = Object.keys(sourceData.exercises ?? {});
    superset = {
      ...superset,
      exercises: (superset.exercises ?? []).filter((e: string) =>
        exercises.includes(e)
      ),
    };
    const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
    updateSourceData(SourceDbReferences.SUPERSETS, data);
    linkSupersetWithSessions(superset);
  };

  const deleteSuperset = (superset: any) => {
    deleteFromDB(SourceDbReferences.SUPERSETS, superset);
    let _srcData = sourceData;
    delete _srcData.supersets[superset.name];
    setSourceData(_srcData);
  };

  const addSession = async (session: any) => {
    const data = await saveToDB(SourceDbReferences.SESSIONS, session);
    updateSourceData(SourceDbReferences.SESSIONS, data);
  };

  const editSession = async (session: any) => {
    const data = await saveToDB(SourceDbReferences.SESSIONS, session);
    updateSourceData(SourceDbReferences.SESSIONS, data);
  };

  const deleteSession = (session: any) => {
    deleteFromDB(SourceDbReferences.SESSIONS, session);
    let _srcData = sourceData;
    delete _srcData.sessions[session.name];
    setSourceData(_srcData);
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
    let currentWeeks = sourceData.plans[plan.originalName].weeks;
    let currentWeeksLength = Object.keys(currentWeeks).length;

    if (parseInt(plan.numberOfWeeks || "0") > currentWeeksLength) {
      Array.from(
        Array(parseInt(plan.numberOfWeeks) - currentWeeksLength).keys()
      ).forEach((week) => {
        console.log(week);
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
    updateSourceData(SourceDbReferences.PLANS, data);
  };

  const deletePlan = (plan: any) => {
    deleteFromDB(SourceDbReferences.PLANS, plan);
    let _srcData = sourceData;
    delete _srcData.plans[plan.name];
    setSourceData(_srcData);
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
