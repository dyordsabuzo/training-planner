import { GoogleAuth } from "google-auth-library";

type Policy = { bindings?: { role: string; members: string[] }[]; etag?: string };

const INVOKER = "roles/run.invoker";
const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

// Grants or removes `allUsers` as invoker on a v2 function's Cloud Run
// service. Without it, calls are refused by Cloud Run before any instance
// runs, so they aren't billed. Returns whether the policy changed.
export const setPublicInvoker = async (projectId: string, region: string, fn: string, enabled: boolean) => {
  const client = await auth.getClient();
  const service = `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/services/${fn.toLowerCase()}`;
  const { data: policy } = await client.request<Policy>({ url: `${service}:getIamPolicy` });

  const bindings = policy.bindings ?? [];
  let invoker = bindings.find((b) => b.role === INVOKER);
  if (!invoker) bindings.push((invoker = { role: INVOKER, members: [] }));
  if (invoker.members.includes("allUsers") === enabled) return false;

  invoker.members = enabled ? [...invoker.members, "allUsers"] : invoker.members.filter((m) => m !== "allUsers");
  await client.request({
    url: `${service}:setIamPolicy`,
    method: "POST",
    data: { policy: { ...policy, bindings: bindings.filter((b) => b.members.length) } },
  });
  return true;
};
