import type { Machine, Provider } from "./schema";

export type MachineImportRoot = { provider: Provider; path: string };
export type MachineImportDefaults = {
  machine: Machine;
  roots: MachineImportRoot[];
};
export type MachineImportRequest = MachineImportDefaults & {
  includePrompts?: boolean;
};
export type MachineImportSourceResult = {
  provider: Provider;
  filesRead: number;
  usageCount: number;
  promptCount: number;
  partial: boolean;
  diagnostics: { code: string; message: string; line?: number }[];
};
export type MachineImportResult = {
  status: "imported" | "empty";
  partial: boolean;
  filesRead: number;
  usageCount: number;
  promptCount: number;
  addedMachines: number;
  addedUsage: number;
  addedPrompts: number;
  duplicates: number;
  sources: MachineImportSourceResult[];
};
