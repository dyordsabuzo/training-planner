import { createContext, ReactNode, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteField,
  FieldPath,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { database, getDocumentReference } from "../common/firebase";
import { SourceDbReferences } from "../common/utils";
import AuthContext from "./AuthContext";
import { Collections, progressKeys, userdataPlansPath } from "../common/refs";

const SessionContext = createContext({
  sessionData: null,
  isRunning: false,
  isSessionOn: false,
  exitPath: "/training-planner/train",
  useSessionUrl: true,
  setIsSessionOn: (flag: boolean) => {},
  setIsRunning: (flag: boolean) => {},
  initialiseSession: (data: any) => {},
  setSessionData: (data: any) => {},
  updateUserData: (data: any) => {},
  saveProgress: (data: any) => {},
  saveRun: (data: any, options?: { incomplete?: boolean }) => {},
  deleteRuns: (runs: any[]) => {},
  // Marks a session as skipped (see isSkipped); undone with deleteRuns.
  skipSession: async (session: { plan: string; week: string; session: string }) => {},
  // Saves a run with no results; undone with deleteRuns.
  completeSession: async (session: { plan: string; week: string; session: string }) => {},
  // Saves or drops the sets of a run that never finished (see unsavedRun).
  recoverRun: async (
    run: { plan: string; week: string; session: string; data: any; savedAt?: string; moodBefore?: any },
    options?: { incomplete?: boolean }
  ) => {},
  discardProgress: async () => {},
  // Clears the Incomplete label from a saved run.
  markRunFinished: async (run: { plan: string; week: string; session: string }) => {},
  wrapSession: () => {},
});

export default SessionContext;

type _Props = {
  children: ReactNode;
};

export const SessionContextProvider: React.FC<_Props> = ({ children }) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSessionOn, setIsSessionOn] = useState(false);

  const authContext = useContext(AuthContext);
  // Writes are no-ops while an admin is impersonating another user (read-only).
  const { user: authUser, isImpersonating, activeOrgId } = authContext;
  const user = isImpersonating ? null : authUser;
  const queryClient = useQueryClient();

  // Session data uses names (as shown in the UI); progress is stored keyed by
  // ids (see refs.ts). Content is read from SourceDataContext's caches, since
  // this provider sits outside it.
  const storedContent = (): Collections => {
    const collection = (db: SourceDbReferences) =>
      Object.assign(
        {},
        ...queryClient
          .getQueriesData<Record<string, any>>({ queryKey: ["sourceData", db, activeOrgId] })
          .map(([, data]) => data ?? {})
      );
    return {
      exercises: collection(SourceDbReferences.EXERCISES),
      supersets: collection(SourceDbReferences.SUPERSETS),
      sessions: collection(SourceDbReferences.SESSIONS),
      plans: collection(SourceDbReferences.PLANS),
    };
  };

  // A plan's runs: userdata/{uid}/plans/{planId}, tagged with the org (refs.ts).
  const planRef = (planId: string) => getDocumentReference(userdataPlansPath(user!.uid), planId);
  const rootRef = () => getDocumentReference(SourceDbReferences.USERDATA, user!.uid);

  const saveSessionUserData = async (
    data: any,
    sessionInfo: { plan: string; week: string; session: string }
  ) => {
    const { plan, week, session } = sessionInfo;

    if (user) {
      const keys = progressKeys(storedContent());
      await setDoc(
        planRef(keys.plan(plan)),
        { orgId: activeOrgId, [week]: { [keys.session(session)]: { ...data } } },
        { merge: true }
      );
      // SourceDataContext caches userdata separately (used by SessionPage's
      // completedWeeks) — invalidate it so a just-finished/logged workout is
      // reflected immediately instead of waiting for a full page reload.
      queryClient.invalidateQueries({
        queryKey: ["sourceData", SourceDbReferences.USERDATA, user.uid],
      });
    }
  };

  const initialiseSession = (data: any) => {
    // Start time is kept so a finished run can show roughly how long it took.
    // The pre-session mood is saved with the run: writing it now would make
    // a session that's started and then abandoned look done.
    setSessionData({ ...data, startedAt: new Date().toISOString() });
  };

  const hasMood = (mood: any) => !!mood && Object.keys(mood).length > 0;

  // Firestore rejects `undefined` values, which a distance group's missing
  // reps target produces. Dropping them keeps the write from failing silently.
  const toFirestoreData = (value: any) => JSON.parse(JSON.stringify(value ?? {}));

  // Writes the unit data a finished set/group produced so far. It lives in
  // its own slot, so a half-finished run doesn't count as completed in the
  // week/session pickers.
  const saveProgress = async (data: any) => {
    if (!user || !sessionData) return;
    const ref = getDocumentReference(SourceDbReferences.USERDATA, user.uid);
    const keys = progressKeys(storedContent());
    const payload = {
      plan: keys.plan(sessionData.plan),
      week: sessionData.week,
      session: keys.session(sessionData.session),
      data: keys.run(toFirestoreData(data), sessionData.session),
      savedAt: new Date().toISOString(),
      ...(hasMood(sessionData.moodBefore) && { moodBefore: toFirestoreData(sessionData.moodBefore) }),
    };
    try {
      await updateDoc(ref, "inProgress", payload);
    } catch {
      await setDoc(ref, { id: user.uid, inProgress: payload }, { merge: true });
    }
  };

  // The cached copy can hold a slot just cleared on the server, which would
  // briefly offer the finished run for recovery.
  const dropCachedProgress = () =>
    queryClient.setQueriesData(
      { queryKey: ["sourceData", SourceDbReferences.USERDATA, user!.uid] },
      (data: any) =>
        data &&
        Object.fromEntries(
          Object.entries(data).map(([uid, { inProgress, ...doc }]: [string, any]) => [uid, doc])
        )
    );

  const clearProgress = async () => {
    if (!user) return;
    dropCachedProgress();
    try {
      await updateDoc(
        getDocumentReference(SourceDbReferences.USERDATA, user.uid),
        "inProgress",
        deleteField()
      );
    } catch {
      // Nothing in progress to clear.
    }
  };

  // Writes a run under stored ids and clears the in-progress slot. Its units
  // replace the earlier run's units for this session (so a re-run doesn't keep
  // stale sets) while mood check-ins stay.
  const writeRun = async (plan: string, week: string, session: string, data: any, meta: any) => {
    const ref = planRef(plan);
    const snapshot = await getDoc(ref);
    const batch = writeBatch(database);
    if (snapshot.exists()) {
      const existing = snapshot.data()?.[week]?.[session] ?? {};
      const updates: any[] = [];
      Object.keys(existing)
        .filter((key) => !["mood", "meta"].includes(key) && !(key in data))
        .forEach((unit) => updates.push(new FieldPath(week, session, unit), deleteField()));
      Object.entries(data).forEach(([unit, value]) =>
        updates.push(new FieldPath(week, session, unit), value)
      );
      updates.push(new FieldPath(week, session, "meta"), meta);
      const [field, value, ...rest] = updates;
      batch.update(ref, field, value, ...rest);
    } else {
      batch.set(ref, { orgId: activeOrgId, [week]: { [session]: { ...data, meta } } });
    }
    batch.set(rootRef(), { inProgress: deleteField() }, { merge: true });
    await batch.commit();

    dropCachedProgress();
    queryClient.invalidateQueries({
      queryKey: ["sourceData", SourceDbReferences.USERDATA, user!.uid],
    });
  };

  // Saves a finished run. An incomplete run (ended early) is flagged in meta
  // but still counts.
  const saveRun = async (rawData: any, options?: { incomplete?: boolean }) => {
    if (!user || !sessionData) return;
    const keys = progressKeys(storedContent());
    const named = toFirestoreData(rawData);
    await writeRun(
      keys.plan(sessionData.plan),
      sessionData.week,
      keys.session(sessionData.session),
      {
        ...keys.run(named, sessionData.session),
        ...(hasMood(sessionData.moodBefore) && { mood: { before: toFirestoreData(sessionData.moodBefore) } }),
      },
      {
        completedAt: new Date().toISOString(),
        ...(sessionData.startedAt && { startedAt: sessionData.startedAt }),
        ...(options?.incomplete && { incomplete: true }),
        // Keeps history readable after anything here is renamed or deleted.
        labels: keys.labels({ plan: sessionData.plan, session: sessionData.session, run: named }),
      }
    );
  };

  // Runs from before savedAt was recorded are dated when they're recovered.
  const recoverRun = async (
    {
      plan,
      week,
      session,
      data,
      savedAt,
      moodBefore,
    }: {
      plan: string;
      week: string;
      session: string;
      data: any;
      savedAt?: string;
      moodBefore?: any;
    },
    options?: { incomplete?: boolean }
  ) => {
    if (!user) return;
    const keys = progressKeys(storedContent());
    const run = { ...keys.run(data, session), ...(hasMood(moodBefore) && { mood: { before: moodBefore } }) };
    await writeRun(keys.plan(plan), week, keys.session(session), run, {
      completedAt: savedAt ?? new Date().toISOString(),
      ...(options?.incomplete && { incomplete: true }),
      labels: keys.labels({ plan, session, run: data }),
    });
  };

  // A session's stored key: its id, or the name for runs logged before ids were used.
  const storedKey = (obj: any, id: string, name: string) => (obj && id in obj ? id : name);

  const markRunFinished = async (run: { plan: string; week: string; session: string }) => {
    if (!user) return;
    const keys = progressKeys(storedContent());
    const ref = planRef(keys.plan(run.plan));
    const data = (await getDoc(ref)).data();
    const session = storedKey(data?.[run.week], keys.session(run.session), run.session);
    await updateDoc(ref, new FieldPath(run.week, session, "meta", "incomplete"), deleteField());
    queryClient.invalidateQueries({
      queryKey: ["sourceData", SourceDbReferences.USERDATA, user.uid],
    });
  };

  // Deletes completed runs from history. A week or plan left with nothing is
  // removed too, since the progress counts treat any week key as completed.
  const deleteRuns = async (runs: { plan: string; week: string; session: string }[]) => {
    if (!user || runs.length === 0) return;
    // History lists runs by name; find each one's stored keys (ids, or the
    // name for runs logged before ids were used).
    const keys = progressKeys(storedContent());
    const planIds = Array.from(new Set(runs.map((run) => keys.plan(run.plan))));
    const batch = writeBatch(database);

    for (const plan of planIds) {
      const ref = planRef(plan);
      const { orgId, ...data }: any = (await getDoc(ref)).data() ?? {};
      const planRuns = runs
        .filter((run) => keys.plan(run.plan) === plan)
        .map((run) => ({
          ...run,
          session: storedKey(data[run.week], keys.session(run.session), run.session),
        }));
      const weeks = Object.keys(data);
      const removedIn = (week: string) => planRuns.filter((r) => r.week === week);
      const fullyRemoved = weeks.filter(
        (week) =>
          removedIn(week).length > 0 &&
          removedIn(week).length >= Object.keys(data[week] ?? {}).length
      );

      if (weeks.length === 0) continue;
      if (fullyRemoved.length === weeks.length) {
        batch.delete(ref);
        continue;
      }
      const updates: any[] = [];
      fullyRemoved.forEach((week) => updates.push(new FieldPath(week), deleteField()));
      planRuns
        .filter((r) => !fullyRemoved.includes(r.week))
        .forEach((r) => updates.push(new FieldPath(r.week, r.session), deleteField()));
      if (updates.length > 0) {
        const [field, value, ...rest] = updates;
        batch.update(ref, field, value, ...rest);
      }
    }
    await batch.commit();
    queryClient.invalidateQueries({
      queryKey: ["sourceData", SourceDbReferences.USERDATA, user.uid],
    });
  };

  const wrapSession = () => {
    clearProgress();
    setSessionData(null);
    setIsRunning(false);
  };

  const updateUserData = async (data: any) => {
    await saveSessionUserData(data, sessionData);
  };

  // Saved in the run's meta slot, so running the session later (saveRun
  // replaces meta) clears the skip.
  const skipSession = async (info: { plan: string; week: string; session: string }) => {
    const keys = progressKeys(storedContent());
    await saveSessionUserData(
      {
        meta: {
          skipped: true,
          skippedAt: new Date().toISOString(),
          labels: keys.labels({ plan: info.plan, session: info.session, run: {} }),
        },
      },
      info
    );
  };

  const completeSession = async (info: { plan: string; week: string; session: string }) => {
    const keys = progressKeys(storedContent());
    await saveSessionUserData(
      {
        meta: {
          completedAt: new Date().toISOString(),
          labels: keys.labels({ plan: info.plan, session: info.session, run: {} }),
          // This write merges into meta, so an earlier skip must be cleared explicitly.
          skipped: deleteField(),
          skippedAt: deleteField(),
        },
      },
      info
    );
  };

  return (
    <SessionContext.Provider
      value={{
        sessionData,
        isRunning,
        isSessionOn,
        exitPath: "/training-planner/train",
        useSessionUrl: true,
        setIsSessionOn,
        setIsRunning,
        initialiseSession,
        setSessionData,
        wrapSession,
        updateUserData,
        saveProgress,
        saveRun,
        deleteRuns,
        skipSession,
        completeSession,
        recoverRun,
        discardProgress: clearProgress,
        markRunFinished,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
