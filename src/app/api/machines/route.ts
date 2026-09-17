import { z } from "zod";
import { apiResponse, assertLocalRequest, HttpError, readJsonRequest } from "@/lib/http";
import { getDisplayBundle, parseQuery, queryMachines } from "@/lib/queries";
import { MachineSchema } from "@/lib/schema";
import { withLedger } from "@/lib/storage";

const identity = z.strictObject({ machineId: MachineSchema.shape.id });
const names = identity.extend({ member: MachineSchema.shape.member, label: MachineSchema.shape.label });

function result(machineId: string) {
  const machine = queryMachines(getDisplayBundle("local")).find((item) => item.id === machineId)!;
  return {
    machineId, member: machine.member, label: machine.label,
    importedMember: machine.importedMember, importedLabel: machine.importedLabel,
    hasDisplayOverride: machine.hasDisplayOverride,
  };
}

export const runtime = "nodejs";
export async function GET(request: Request) {
  return apiResponse(() => {
    assertLocalRequest(request);
    return queryMachines(getDisplayBundle(parseQuery(new URL(request.url).searchParams).source));
  });
}

export async function PATCH(request: Request) {
  return apiResponse(async () => {
    const { machineId, ...displayNames } = names.parse(await readJsonRequest(request));
    const found = withLedger((ledger) => ledger.setDisplayNames(machineId, displayNames));
    if (!found) throw new HttpError(404, "This imported machine was not found.");
    return result(machineId);
  });
}

export async function DELETE(request: Request) {
  return apiResponse(async () => {
    const { machineId } = identity.parse(await readJsonRequest(request));
    const found = withLedger((ledger) => ledger.resetDisplayNames(machineId));
    if (!found) throw new HttpError(404, "This imported machine was not found.");
    return result(machineId);
  });
}
