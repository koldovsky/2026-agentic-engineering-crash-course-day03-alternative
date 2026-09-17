import { MachineSchema, type Bundle, type Machine } from "./schema";

export const MachineDisplayNamesSchema = MachineSchema.pick({ member: true, label: true });
export type MachineDisplayNames = Pick<Machine, "member" | "label">;
export type MachineDisplayDetails = {
  importedMember: string;
  importedLabel: string;
  hasDisplayOverride: boolean;
};
export type DisplayBundle = Bundle & {
  machineDisplayDetails: ReadonlyMap<string, MachineDisplayDetails>;
};

/** Exact legacy process-account labels only; ordinary names containing Codex are people. */
export function displayMachine(machine: Machine, override?: MachineDisplayNames): Machine {
  return {
    ...machine,
    label: override?.label ?? machine.label,
    member: override?.member ?? (
      ["CodexSandboxOffline", "CodexSandboxOnline"].includes(machine.member)
        ? "Local user"
        : machine.member
    ),
  };
}

/** Presentation only. Never pass this bundle to the portable export or merge path. */
export function withDisplayNames(
  bundle: Bundle,
  overrides: ReadonlyMap<string, MachineDisplayNames> = new Map(),
): DisplayBundle {
  return {
    ...bundle,
    machines: bundle.machines.map((machine) => displayMachine(machine, overrides.get(machine.id))),
    machineDisplayDetails: new Map(bundle.machines.map((machine) => [machine.id, {
      importedMember: machine.member,
      importedLabel: machine.label,
      hasDisplayOverride: overrides.has(machine.id),
    }])),
  };
}
