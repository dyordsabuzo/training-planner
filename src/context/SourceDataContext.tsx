import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { deleteDoc } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocumentReference } from "../common/firebase";
import { saveToDB, getFromDB, SourceDbReferences, toStringArray } from "../common/utils";
import { buildWeek } from "../common/planCycle";
import AuthContext from "./AuthContext";
import AppSettingsContext from "./AppSettingsContext";
import { CONTENT_VERSION_KEY } from "../common/queryCache";
import { Collections, contentView, idLookup, toStoredEntity, userdataView } from "../common/refs";

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
  const { user, userPermission, effectiveUid } = authContext;
  const queryClient = useQueryClient();
  const { contentVersion, updateContentVersion } = useContext(AppSettingsContext);

  // Content (exercises, supersets, sessions, plans) is kept on the device
  // and never goes stale on its own. Instead, settings/app.contentVersion —
  // already read on startup — changes on every admin edit, and only then is
  // content re-downloaded. Saves reading every collection on each app start.
  useEffect(() => {
    if (!contentVersion) {
      return;
    }
    const seenVersion = localStorage.getItem(CONTENT_VERSION_KEY);
    if (seenVersion === contentVersion) {
      return;
    }
    // No seen version means nothing is cached yet, so the queries are
    // already fetching fresh content.
    if (seenVersion !== null) {
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "sourceData" && queryKey[1] !== SourceDbReferences.USERDATA,
      });
    }
    localStorage.setItem(CONTENT_VERSION_KEY, contentVersion);
  }, [contentVersion, queryClient]);

  // Every mutation below edits content: publish a new version so other
  // devices refetch it. This device already has the edit in its cache, so it
  // records the version as seen.
  const markContentChanged = () => {
    const version = new Date().toISOString();
    localStorage.setItem(CONTENT_VERSION_KEY, version);
    updateContentVersion(version);
  };

  const exercisesQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.EXERCISES],
    queryFn: () => getFromDB(SourceDbReferences.EXERCISES),
    enabled: !!user,
    staleTime: Infinity,
  });
  const supersetsQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.SUPERSETS],
    queryFn: () => getFromDB(SourceDbReferences.SUPERSETS),
    enabled: !!user,
    staleTime: Infinity,
  });
  const sessionsQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.SESSIONS],
    queryFn: () => getFromDB(SourceDbReferences.SESSIONS),
    enabled: !!user,
    staleTime: Infinity,
  });

  // Admins see every plan; everyone else is restricted to the plans
  // explicitly granted on their users/{uid} doc — an empty/undefined list
  // here must mean "no plans", not "no filter". Including the permission in
  // the query key means a change in role/grants (e.g. permissions loading
  // in after the user) naturally refetches with the right filter.
  const planIdFilter =
    userPermission?.role === "admin" ? undefined : userPermission?.plans ?? [];
  const plansQueryKey = [
    "sourceData",
    SourceDbReferences.PLANS,
    userPermission?.role,
    userPermission?.plans,
  ];
  const plansQuery = useQuery({
    queryKey: plansQueryKey,
    queryFn: () => getFromDB(SourceDbReferences.PLANS, planIdFilter),
    enabled: !!user,
    staleTime: Infinity,
  });

  const userdataQuery = useQuery({
    queryKey: ["sourceData", SourceDbReferences.USERDATA, effectiveUid],
    queryFn: () => getFromDB(SourceDbReferences.USERDATA, [effectiveUid!]),
    enabled: !!user,
  });

  // The caches hold content as stored (references by id, see refs.ts); the
  // UI reads a view with names in their place.
  const contentData = useMemo(
    () =>
      contentView({
        exercises: exercisesQuery.data,
        supersets: supersetsQuery.data,
        sessions: sessionsQuery.data,
        plans: plansQuery.data,
      }),
    [exercisesQuery.data, supersetsQuery.data, sessionsQuery.data, plansQuery.data]
  );
  const userdata = useMemo(() => {
    if (!userdataQuery.data) return userdataQuery.data;
    const stored = {
      exercises: exercisesQuery.data,
      supersets: supersetsQuery.data,
      sessions: sessionsQuery.data,
      plans: plansQuery.data,
    };
    return Object.fromEntries(
      Object.entries(userdataQuery.data).map(([uid, doc]) => [uid, userdataView(doc, stored)])
    );
  }, [
    userdataQuery.data,
    exercisesQuery.data,
    supersetsQuery.data,
    sessionsQuery.data,
    plansQuery.data,
  ]);

  const sourceData: SourceData = { ...contentData, userdata };

  // Latest stored content, read from the cache at call time rather than this
  // render's closure — mutations save several entities in a row, and later
  // saves must see ids assigned by earlier ones.
  const getStored = (): Collections => ({
    exercises: queryClient.getQueryData(["sourceData", SourceDbReferences.EXERCISES]),
    supersets: queryClient.getQueryData(["sourceData", SourceDbReferences.SUPERSETS]),
    sessions: queryClient.getQueryData(["sourceData", SourceDbReferences.SESSIONS]),
    plans: queryClient.getQueryData(plansQueryKey),
  });

  // Saves an entity from the UI (name references) in its stored form.
  const save = (
    sourceDb:
      | SourceDbReferences.EXERCISES
      | SourceDbReferences.SUPERSETS
      | SourceDbReferences.SESSIONS
      | SourceDbReferences.PLANS,
    entity: any
  ) => saveToDB(sourceDb, toStoredEntity(sourceDb, entity, getStored()));

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
  // Works on stored data (ids), so it's unaffected by a rename in progress.
  const linkExerciseWithSupersets = (exerciseId: string, supersetNames: unknown) => {
    const stored = getStored();
    const toId = idLookup(stored);
    const selectedIds = toStringArray(supersetNames).map((name) =>
      toId(SourceDbReferences.SUPERSETS, name)
    );

    Object.values(stored.supersets ?? {}).forEach(async (supersetValue: any) => {
      const exerciseList = toStringArray(supersetValue?.exercises);
      const isSelected = selectedIds.includes(supersetValue.id);
      const isLinked = exerciseList.includes(exerciseId);

      if (isSelected === isLinked) {
        return;
      }

      const superset = {
        ...supersetValue,
        exercises: isSelected
          ? [...exerciseList, exerciseId]
          : exerciseList.filter((e: string) => e !== exerciseId),
      };

      const data = await saveToDB(SourceDbReferences.SUPERSETS, superset);
      updateSourceData(SourceDbReferences.SUPERSETS, data);
    });
  };

  const linkSupersetWithSessions = (supersetId: string, sessionNames: unknown) => {
    const stored = getStored();
    toStringArray(sessionNames).forEach(async (session: string) => {
      if (session) {
        let sessionObject: any = stored.sessions?.[session];

        // Only back-link an existing session — never auto-create a new one
        // for a name that doesn't match anything (e.g. a typo/stray value
        // typed into the "Linked sessions" tag field). Sessions should only
        // be created via the Add Session button.
        if (!sessionObject) {
          return;
        }

        const supersetList = toStringArray(sessionObject?.supersets);
        if (supersetList.includes(supersetId)) {
          return;
        }
        supersetList.push(supersetId);
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

  const saveRenamedEntity = async (
    dbReference: SourceDbReferences,
    previous: any,
    data: any
  ) => {
    if (!data) {
      return;
    }
    // Other entities reference this one by id, so a rename needs nothing
    // beyond re-keying the cache.
    if (previous && previous.name !== data.name) {
      renameSourceData(dbReference, previous.name, data);
    } else {
      updateSourceData(dbReference, data);
    }
  };

  const updateExerciseMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (exercise: any) => {
      const previous = findPrevious(sourceData.exercises, exercise.id);
      const data = await save(SourceDbReferences.EXERCISES, exercise);
      await saveRenamedEntity(SourceDbReferences.EXERCISES, previous, data);
      if (data) linkExerciseWithSupersets(data.id, exercise.supersets);
    },
  });

  const addExerciseMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (exercise: any) => {
      const data = await save(SourceDbReferences.EXERCISES, exercise);
      updateSourceData(SourceDbReferences.EXERCISES, data);
      if (data) linkExerciseWithSupersets(data.id, exercise.supersets);
    },
  });

  const deleteExerciseMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: (exercise: any) => deleteFromDB(SourceDbReferences.EXERCISES, exercise),
  });

  const addSupersetMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (superset: any) => {
      const data = await save(SourceDbReferences.SUPERSETS, superset);
      updateSourceData(SourceDbReferences.SUPERSETS, data);
      if (data) linkSupersetWithSessions(data.id, superset.sessions);
    },
  });

  const editSupersetMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (superset: any) => {
      const previous = findPrevious(sourceData.supersets, superset.id);
      const exercises = Object.keys(sourceData.exercises ?? {});
      superset = {
        ...superset,
        exercises: (superset.exercises ?? []).filter((e: string) =>
          exercises.includes(e)
        ),
      };
      const data = await save(SourceDbReferences.SUPERSETS, superset);
      await saveRenamedEntity(SourceDbReferences.SUPERSETS, previous, data);
      if (data) linkSupersetWithSessions(data.id, superset.sessions);
    },
  });

  const deleteSupersetMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: (superset: any) => deleteFromDB(SourceDbReferences.SUPERSETS, superset),
  });

  const addSessionMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (session: any) => {
      const data = await save(SourceDbReferences.SESSIONS, session);
      updateSourceData(SourceDbReferences.SESSIONS, data);
    },
  });

  const editSessionMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (session: any) => {
      const previous = findPrevious(sourceData.sessions, session.id);
      const data = await save(SourceDbReferences.SESSIONS, session);
      await saveRenamedEntity(SourceDbReferences.SESSIONS, previous, data);
    },
  });

  const deleteSessionMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: (session: any) => deleteFromDB(SourceDbReferences.SESSIONS, session),
  });

  const addPlanMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: async (plan: any) => {
      let weeks = {};
      Array.from(Array(parseInt(plan.numberOfWeeks ?? "0")).keys()).forEach(
        (week) => {
          weeks = {
            ...weeks,
            [`Week ${week + 1}`]: buildWeek(plan, week),
          };
        }
      );

      // Recorded so plan lists can be sorted by when each plan was created.
      const data = await save(SourceDbReferences.PLANS, {
        ...plan,
        weeks,
        createdAt: plan.createdAt ?? new Date().toISOString(),
      });
      updateSourceData(SourceDbReferences.PLANS, data);
    },
  });

  const editPlanMutation = useMutation({
    onSuccess: markContentChanged,
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
            [`Week ${week + 1 + currentWeeksLength}`]: buildWeek(
              plan,
              week + currentWeeksLength
            ),
          };
        });
      }

      const data = await save(SourceDbReferences.PLANS, {
        ...plan,
        weeks: plan.open ? {} : currentWeeks,
      });
      await saveRenamedEntity(SourceDbReferences.PLANS, previous, data);
    },
  });

  const deletePlanMutation = useMutation({
    onSuccess: markContentChanged,
    mutationFn: (plan: any) => deleteFromDB(SourceDbReferences.PLANS, plan),
  });

  const updateWeekPlanMutation = useMutation({
    onSuccess: markContentChanged,
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

      const data = await save(SourceDbReferences.PLANS, planWithWeek);
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
