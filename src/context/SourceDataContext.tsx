import { createContext, ReactNode, useContext } from "react";
import { deleteDoc } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocumentReference } from "../common/firebase";
import { saveToDB, getFromDB, SourceDbReferences } from "../common/utils";
import AuthContext from "./AuthContext";
import { getEntitiesNeedingRenameUpdate } from "./renameCascade";

type SourceData = {
  exercises?: any;
  supersets?: any;
  sessions?: any;
  plans?: any;
  userdata?: any;
};

type SourceDataContextValue = {
  sourceData: SourceData;
  isLoading: boolean;
  error: unknown;
  updateExercise: (exercise: any) => void;
  addExercise: (exercise: any) => void;
  deleteExercise: (data: any) => void;
  addSuperset: (superset: any) => void;
  editSuperset: (superset: any) => void;
  deleteSuperset: (superset: any) => void;
  addSession: (session: any) => void;
  editSession: (session: any) => void;
  deleteSession: (session: any) => void;
  addPlan: (plan: any) => void;
  editPlan: (plan: any) => void;
  deletePlan: (plan: any) => void;
  updateWeekPlan: (planName: string, weekData: any) => void;
};

const noop = () => {};

const SourceDataContext = createContext<SourceDataContextValue>({
  sourceData: {},
  isLoading: false,
  error: null,
  updateExercise: noop,
  addExercise: noop,
  deleteExercise: noop,
  addSuperset: noop,
  editSuperset: noop,
  deleteSuperset: noop,
  addSession: noop,
  editSession: noop,
  deleteSession: noop,
  addPlan: noop,
  editPlan: noop,
  deletePlan: noop,
  updateWeekPlan: noop,
});

export default SourceDataContext;

type _Props = {
  children: ReactNode;
};

export const SourceDataContextProvider: React.FC<_Props> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const { user, userPermission } = authContext;
  const queryClient = useQueryClient();

  const exercisesQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.EXERCISES],
    queryFn: () => getFromDB(SourceDbReferences.EXERCISES),
    enabled: !!user,
  });
  const supersetsQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.SUPERSETS],
    queryFn: () => getFromDB(SourceDbReferences.SUPERSETS),
    enabled: !!user,
  });
  const sessionsQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.SESSIONS],
    queryFn: () => getFromDB(SourceDbReferences.SESSIONS),
    enabled: !!user,
  });

  // Admins see every plan; everyone else is restricted to the plans
  // explicitly granted on their users/{uid} doc — an empty/undefined list
  // here must mean "no plans", not "no filter". Including the permission in
  // the query key means a change in role/grants (e.g. permissions loading
  // in after the user) naturally refetches with the right filter.
  const planIdFilter =
    userPermission?.role === "admin" ? undefined : userPermission?.plans ?? [];
  const plansQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.PLANS, userPermission?.role, userPermission?.plans],
    queryFn: () => getFromDB(SourceDbReferences.PLANS, planIdFilter),
    enabled: !!user,
  });

  const userdataQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.USERDATA, user?.uid],
    queryFn: () => getFromDB(SourceDbReferences.USERDATA, [user!.uid]),
    enabled: !!user,
  });

  const sourceData: SourceData = {
    exercises: exercisesQuery.data,
    supersets: supersetsQuery.data,
    sessions: sessionsQuery.data,
    plans: plansQuery.data,
    userdata: userdataQuery.data,
  };

  const isLoading =
    exercisesQuery.isPending ||
    supersetsQuery.isPending ||
    sessionsQuery.isPending ||
    plansQuery.isPending ||
    userdataQuery.isPending;

  const error =
    exercisesQuery.error ||
    supersetsQuery.error ||
    sessionsQuery.error ||
    plansQuery.error ||
    userdataQuery.error ||
    null;

  const deleteFromDB = async (sourceDb: SourceDbReferences, data: any) => {
    await deleteDoc(getDocumentReference(sourceDb, data.id));
    queryClient.setQueriesData({ queryKey: ["sourceData", sourceDb] }, (prev: any) => {
      const sourceDataElement = { ...(prev ?? {}) };
      delete sourceDataElement[data.name];
      return sourceDataElement;
    });
  };

  // Reconciles every superset's `exercises` list against the exercise's own
  // `supersets` selection (the source of truth users edit) — adding the
  // exercise where newly selected AND removing it where deselected, unlike
  // a simple back-link that only ever adds and can never undo a link.
  const linkExerciseWithSupersets = (exercise: any) => {
    const selectedSupersets: string[] = exercise.supersets ?? [];

    Object.values(sourceData.supersets ?? {}).forEach(async (supersetValue: any) => {
      const exerciseList: string[] = supersetValue?.exercises ?? [];
      const isSelected = selectedSupersets.includes(supersetValue.name);
      const isLinked = exerciseList.includes(exercise.name);

      if (isSelected === isLinked) {
        return;
      }

      const superset = {
        ...supersetValue,
        exercises: isSelected
          ? [...exerciseList, exercise.name]
          : exerciseList.filter((e: string) => e !== exercise.name),
      };

      const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
      updateSourceData(SourceDbReferences.SUPERSETS, data);
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
    queryClient.setQueriesData({ queryKey: ["sourceData", dbReference] }, (prev: any) => ({
      ...(prev ?? {}),
      [data.name]: data,
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
    queryClient.setQueriesData({ queryKey: ["sourceData", dbReference] }, (prev: any) => {
      const sourceDataElement = { ...(prev ?? {}) };
      delete sourceDataElement[oldName];
      sourceDataElement[data.name] = data;
      return sourceDataElement;
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

  const updateExerciseMutation = useMutation({
    mutationFn: async (exercise: any) => {
      const previous = findPrevious(sourceData.exercises, exercise.id);
      const data = await saveToDB(SourceDbReferences.EXERCISES, exercise);
      await saveRenamedEntity(SourceDbReferences.EXERCISES, previous, data);
      linkExerciseWithSupersets(exercise);
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (exercise: any) => {
      const data = await saveToDB(SourceDbReferences.EXERCISES, exercise);
      updateSourceData(SourceDbReferences.EXERCISES, data);
      linkExerciseWithSupersets(exercise);
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (exercise: any) => deleteFromDB(SourceDbReferences.EXERCISES, exercise),
  });

  const addSupersetMutation = useMutation({
    mutationFn: async (superset: any) => {
      const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
      updateSourceData(SourceDbReferences.SUPERSETS, data);
      linkSupersetWithSessions(superset);
    },
  });

  const editSupersetMutation = useMutation({
    mutationFn: async (superset: any) => {
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
    },
  });

  const deleteSupersetMutation = useMutation({
    mutationFn: (superset: any) => deleteFromDB(SourceDbReferences.SUPERSETS, superset),
  });

  const addSessionMutation = useMutation({
    mutationFn: async (session: any) => {
      const data = await saveToDB(SourceDbReferences.SESSIONS, session);
      updateSourceData(SourceDbReferences.SESSIONS, data);
    },
  });

  const editSessionMutation = useMutation({
    mutationFn: async (session: any) => {
      const previous = findPrevious(sourceData.sessions, session.id);
      const data = await saveToDB(SourceDbReferences.SESSIONS, session);
      await saveRenamedEntity(SourceDbReferences.SESSIONS, previous, data);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (session: any) => deleteFromDB(SourceDbReferences.SESSIONS, session),
  });

  const addPlanMutation = useMutation({
    mutationFn: async (plan: any) => {
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

      const data = await saveToDB(SourceDbReferences.PLANS, { ...plan, weeks });
      updateSourceData(SourceDbReferences.PLANS, data);
    },
  });

  const editPlanMutation = useMutation({
    mutationFn: async (plan: any) => {
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

      const data = await saveToDB(SourceDbReferences.PLANS, {
        ...plan,
        weeks: currentWeeks,
      });
      await saveRenamedEntity(SourceDbReferences.PLANS, previous, data);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (plan: any) => deleteFromDB(SourceDbReferences.PLANS, plan),
  });

  const updateWeekPlanMutation = useMutation({
    mutationFn: async ({
      planName,
      weekData,
    }: {
      planName: string;
      weekData: any;
    }) => {
      const plan: any = Object.values(sourceData.plans ?? {}).find(
        (obj: any) => obj.name === planName
      );
      const planWithWeek = {
        ...plan,
        weeks: {
          ...plan.weeks,
          [`Week ${weekData.weekNumber + 1}`]: weekData,
        },
      };

      const data = await saveToDB(SourceDbReferences.PLANS, planWithWeek);
      updateSourceData(SourceDbReferences.PLANS, data);
    },
  });
  const updateWeekPlan = (planName: string, weekData: any) =>
    updateWeekPlanMutation.mutate({ planName, weekData });

  return (
    <SourceDataContext.Provider
      value={{
        sourceData,
        isLoading,
        error,
        addExercise: addExerciseMutation.mutate,
        updateExercise: updateExerciseMutation.mutate,
        deleteExercise: deleteExerciseMutation.mutate,
        addSuperset: addSupersetMutation.mutate,
        editSuperset: editSupersetMutation.mutate,
        deleteSuperset: deleteSupersetMutation.mutate,
        addSession: addSessionMutation.mutate,
        editSession: editSessionMutation.mutate,
        deleteSession: deleteSessionMutation.mutate,
        addPlan: addPlanMutation.mutate,
        editPlan: editPlanMutation.mutate,
        deletePlan: deletePlanMutation.mutate,
        updateWeekPlan,
      }}
    >
      {children}
    </SourceDataContext.Provider>
  );
};
