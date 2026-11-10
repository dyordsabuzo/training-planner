import { deleteDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getCollection, getDocumentReference } from "./firebase";

const path = (orgId: string) => `orgs/${orgId}/publicPlans`;

export const publicPlanRef = (orgId: string, token: string) => getDocumentReference(path(orgId), token);

// Plan id -> token for every plan the org has made public.
export const listPublicPlans = async (orgId: string): Promise<Record<string, string>> => {
  const snapshot = await getDocs(getCollection(path(orgId)));
  return Object.fromEntries(snapshot.docs.map((d) => [d.data().planId, d.id]));
};

export const savePublicPlan = (orgId: string, token: string, data: any) =>
  setDoc(publicPlanRef(orgId, token), JSON.parse(JSON.stringify(data)));

export const deletePublicPlan = (orgId: string, token: string) => deleteDoc(publicPlanRef(orgId, token));

// Deleting a plan must not leave its public copy reachable.
export const deletePublicPlansOf = async (orgId: string, planId: string) => {
  const snapshot = await getDocs(query(getCollection(path(orgId)), where("planId", "==", planId)));
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
};
