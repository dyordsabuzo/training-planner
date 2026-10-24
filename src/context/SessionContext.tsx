import { createContext, ReactNode, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteField,
  FieldPath,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDocumentReference } from "../common/firebase";
import { saveToDB, SourceDbReferences } from "../common/utils";
import AuthContext from "./AuthContext";
import { Collections, progressKeys } from "../common/refs";

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
  saveRun: (data: any) => {},
  deleteRuns: (runs: any[]) => {},
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
  const { user: authUser, isImpersonating } = authContext;
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
          .getQueriesData<Record<string, any>>({ queryKey: ["sourceData", db] })
          .map(([, data]) => data ?? {})
      );
    return {
      exercises: collection(SourceDbReferences.EXERCISES),
      supersets: collection(SourceDbReferences.SUPERSETS),
      sessions: collection(SourceDbReferences.SESSIONS),
      plans: collection(SourceDbReferences.PLANS),
    };
  };

  const saveSessionUserData = async (
    data: any,
    sessionInfo: { plan: string; week: string; session: string }
  ) => {
    const { plan, week, session } = sessionInfo;

    if (user) {
      const keys = progressKeys(storedContent());
      const userData = {
        id: user.uid,
        [keys.plan(plan)]: {
          [week]: {
            [keys.session(session)]: {
              ...data,
            },
          },
        },
      };
      await saveToDB(SourceDbReferences.USERDATA, userData);
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
    setSessionData({ ...data, startedAt: new Date().toISOString() });

    // Persist the pre-session mood check-in (if provided) right away, using
    // the freshly-passed session info — sessionData state isn't updated yet
    // at this point in the render cycle.
    if (data?.moodBefore) {
      saveSessionUserData({ mood: { before: data.moodBefore } }, data);
    }
  };

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
    };
    try {
      await updateDoc(ref, "inProgress", payload);
    } catch {
      await setDoc(ref, { id: user.uid, inProgress: payload }, { merge: true });
    }
  };

  const clearProgress = async () => {
    if (!user) return;
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

  // Saves a finished run. Its units replace the earlier run's units for this
  // session (so a re-run doesn't keep stale sets) while mood check-ins stay.
  const saveRun = async (rawData: any) => {
    if (!user || !sessionData) return;
    const keys = progressKeys(storedContent());
    const named = toFirestoreData(rawData);
    const data = keys.run(named, sessionData.session);
    const week = sessionData.week;
    const plan = keys.plan(sessionData.plan);
    const session = keys.session(sessionData.session);
    const ref = getDocumentReference(SourceDbReferences.USERDATA, user.uid);
    const snapshot = await getDoc(ref);
    const meta = {
      completedAt: new Date().toISOString(),
      ...(sessionData.startedAt && { startedAt: sessionData.startedAt }),
      // Keeps history readable after anything here is renamed or deleted.
      labels: keys.labels({ plan: sessionData.plan, session: sessionData.session, run: named }),
    };

    if (snapshot.exists()) {
      const existing = snapshot.data()?.[plan]?.[week]?.[session] ?? {};
      const updates: any[] = [];
      Object.keys(existing)
        .filter((key) => !["mood", "meta"].includes(key) && !(key in data))
        .forEach((unit) => updates.push(new FieldPath(plan, week, session, unit), deleteField()));
      Object.entries(data).forEach(([unit, value]) =>
        updates.push(new FieldPath(plan, week, session, unit), value)
      );
      updates.push(new FieldPath(plan, week, session, "meta"), meta);
      updates.push("inProgress", deleteField());
      await (updateDoc as (...args: any[]) => Promise<void>)(ref, ...updates);
    } else {
      await setDoc(
        ref,
        { id: user.uid, [plan]: { [week]: { [session]: { ...data, meta } } } },
        { merge: true }
      );
    }

    queryClient.invalidateQueries({
      queryKey: ["sourceData", SourceDbReferences.USERDATA, user.uid],
    });
  };

  // Deletes completed runs from history. A week or plan left with nothing is
  // removed too, since the progress counts treat any week key as completed.
  const deleteRuns = async (runs: { plan: string; week: string; session: string }[]) => {
    if (!user || runs.length === 0) return;
    const ref = getDocumentReference(SourceDbReferences.USERDATA, user.uid);
    const snapshot = await getDoc(ref);
    const data: any = snapshot.data() ?? {};

    // History lists runs by name; find each one's stored keys (ids, or the
    // name for runs logged before ids were used).
    const keys = progressKeys(storedContent());
    const storedKey = (obj: any, id: string, name: string) => (obj && id in obj ? id : name);
    runs = runs.map((run) => {
      const plan = storedKey(data, keys.plan(run.plan), run.plan);
      const sessions = data[plan]?.[run.week];
      return { ...run, plan, session: storedKey(sessions, keys.session(run.session), run.session) };
    });

    const updates: any[] = [];
    const plans = Array.from(new Set(runs.map((r) => r.plan)));
    plans.forEach((plan) => {
      const weeks = Object.keys(data[plan] ?? {});
      const removedIn = (week: string) => runs.filter((r) => r.plan === plan && r.week === week);
      const fullyRemoved = weeks.filter(
        (week) =>
          removedIn(week).length > 0 &&
          removedIn(week).length >= Object.keys(data[plan][week] ?? {}).length
      );

      if (fullyRemoved.length === weeks.length) {
        updates.push(new FieldPath(plan), deleteField());
        return;
      }
      fullyRemoved.forEach((week) => updates.push(new FieldPath(plan, week), deleteField()));
      runs
        .filter((r) => r.plan === plan && !fullyRemoved.includes(r.week))
        .forEach((r) => updates.push(new FieldPath(plan, r.week, r.session), deleteField()));
    });

    if (updates.length > 0) {
      await (updateDoc as (...args: any[]) => Promise<void>)(ref, ...updates);
    }
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
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
