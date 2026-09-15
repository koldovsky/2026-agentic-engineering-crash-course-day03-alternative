// Node-only: imported by server routes and the explicit CLI, never client components.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BundleSchema, MAX_RECORDS, emptyBundle, type Bundle } from "./schema";

export class ImportConflictError extends Error {
  constructor() { super("This file conflicts with existing data. Keep machine attribution consistent and export again."); }
}
export class DatasetLimitError extends Error {
  constructor() { super("The local dataset limit is 100 machines and 20,000 records of each kind."); }
}
export interface MergeResult { addedMachines: number; addedUsage: number; addedPrompts: number; duplicates: number }

export class Ledger {
  private db: DatabaseSync;

  constructor(path = process.env.TOKEN_ATLAS_DB ?? resolve("data", "token-atlas.sqlite")) {
    if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    const version = this.db.prepare("PRAGMA user_version").get() as { user_version: number };
    if (version.user_version > 1) { this.db.close(); throw new Error("Unsupported database version."); }
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS machines (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS usage (
        machine_id TEXT NOT NULL REFERENCES machines(id), provider TEXT NOT NULL,
        id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (machine_id, provider, id)
      );
      CREATE TABLE IF NOT EXISTS prompts (
        machine_id TEXT NOT NULL REFERENCES machines(id), provider TEXT NOT NULL,
        id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (machine_id, provider, id)
      );
      PRAGMA user_version = 1;
    `);
  }

  read(includePrompts = true): Bundle {
    this.db.exec("BEGIN");
    try {
      const result = emptyBundle();
      result.machines = this.db.prepare("SELECT payload FROM machines ORDER BY id").all().map(parsePayload);
      result.usage = this.db.prepare("SELECT payload FROM usage ORDER BY machine_id, provider, id").all().map(parsePayload);
      if (includePrompts) result.prompts = this.db.prepare("SELECT payload FROM prompts ORDER BY machine_id, provider, id").all().map(parsePayload);
      const bundle = BundleSchema.parse(result);
      this.db.exec("COMMIT");
      return bundle;
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  merge(input: unknown): MergeResult {
    const bundle = BundleSchema.parse(input);
    const result: MergeResult = { addedMachines: 0, addedUsage: 0, addedPrompts: 0, duplicates: 0 };
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const findMachine = this.db.prepare("SELECT payload FROM machines WHERE id = ?");
      const addMachine = this.db.prepare("INSERT INTO machines VALUES (?, ?)");
      for (const machine of bundle.machines) {
        const payload = JSON.stringify(machine);
        const existing = findMachine.get(machine.id);
        if (existing) { if (existing.payload !== payload) throw new ImportConflictError(); }
        else { addMachine.run(machine.id, payload); result.addedMachines++; }
      }
      for (const table of ["usage", "prompts"] as const) {
        const find = this.db.prepare(`SELECT payload FROM ${table} WHERE machine_id = ? AND provider = ? AND id = ?`);
        const insert = this.db.prepare(`INSERT INTO ${table} VALUES (?, ?, ?, ?)`);
        for (const record of bundle[table]) {
          const payload = JSON.stringify(record);
          const existing = find.get(record.machineId, record.provider, record.id);
          if (existing) {
            if (existing.payload !== payload) throw new ImportConflictError();
            result.duplicates++;
          } else {
            insert.run(record.machineId, record.provider, record.id, payload);
            if (table === "usage") result.addedUsage++; else result.addedPrompts++;
          }
        }
      }
      for (const table of ["machines", "usage", "prompts"]) {
        const row = this.db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number };
        if (row.n > (table === "machines" ? 100 : MAX_RECORDS)) throw new DatasetLimitError();
      }
      this.db.exec("COMMIT");
      return result;
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  close() { this.db.close(); }
}

function parsePayload(row: Record<string, unknown>) { return JSON.parse(String(row.payload)); }

export function withLedger<T>(action: (ledger: Ledger) => T): T {
  const ledger = new Ledger();
  try { return action(ledger); } finally { ledger.close(); }
}
