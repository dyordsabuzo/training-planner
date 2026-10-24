import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Shared setup for one-off Admin SDK scripts (data migrations).
//
// Targets the emulator when FIRESTORE_EMULATOR_HOST is set, otherwise the
// real project using Application Default Credentials
// (`gcloud auth application-default login`). Scripts are dry-run unless
// `--apply` is passed, so a mistyped command can't change production.
export const projectId = process.env.GCLOUD_PROJECT ?? "training-planner-387200";

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

initializeApp(usingEmulator ? { projectId } : { projectId, credential: applicationDefault() });

export const db = getFirestore();

export const isDryRun = !process.argv.includes("--apply");

export const logTarget = (scriptName: string) => {
  const target = usingEmulator ? `emulator (${process.env.FIRESTORE_EMULATOR_HOST})` : projectId;
  console.log(`${scriptName} → ${target}${isDryRun ? " [dry run, pass --apply to write]" : ""}`);
};
