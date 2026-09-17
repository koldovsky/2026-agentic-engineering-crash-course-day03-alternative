import { HardDrive, LockKeyhole, Terminal } from "lucide-react";
import type { MachineSummary, Source } from "@/lib/queries";
import { Avatar, dateTime, number, ProviderBadge, SectionHeading } from "./ui";
import { ImportPanel } from "./transfer-controls";
import { MachineImportPanel } from "./machine-import-panel";
import { MachineDisplayEditor } from "./machine-display-editor";

export function SourcesView({
  machines,
  source,
}: {
  machines: MachineSummary[];
  source: Source;
}) {
  return (
    <>
      <MachineImportPanel source={source} />
      <div className="sources-grid">
        <ImportPanel source={source} />
        <section className="card source-guide">
          <SectionHeading
            title="From individual work to team insight"
            detail="A simple, local workflow"
          />
          <div className="card-body">
            <ol className="source-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>Import this computer</strong>
                  <p>
                    Use the button above to save local usage. Optional settings
                    let you choose smaller project or date folders.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Bring a file from another machine</strong>
                  <p>
                    Use the file importer to preview a teammate’s export or a
                    completed transcript before saving it.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Share on your terms</strong>
                  <p>
                    Export a portable file for a teammate. Prompts are excluded
                    unless you choose to include them.
                  </p>
                </div>
              </li>
            </ol>
            <div className="source-privacy">
              <LockKeyhole size={17} />
              <p>
                No automatic scans or cloud sync. Importing the same records
                again won’t count them twice.
              </p>
            </div>
            <details className="cli-help">
              <summary>
                <Terminal size={15} /> Collect from a local folder
              </summary>
              <p>
                From the project directory, see the supported collection
                options:
              </p>
              <pre>npm run collect -- --help</pre>
              <p>
                Use the same machine ID and member attribution for future
                exports from that machine.
              </p>
            </details>
          </div>
        </section>
      </div>
      <section className="card">
        <SectionHeading
          title="Machines in this workspace"
          detail={`All machines in ${source === "demo" ? "the synthetic demo" : "your local data"}. These are imported snapshots, not live connections.`}
        >
          <span className="count-badge">{machines.length} machines</span>
        </SectionHeading>
        <p className="attribution-explainer">
          Member is the person assigned to the usage; provider is the
          application that recorded it. One person can use both Claude Code and
          Codex. If a member is shown as Local user, set their display name
          below.
        </p>
        {machines.length ? (
          <div className="table-scroll">
            <table className="machine-table">
              <caption className="sr-only">
                Imported machines and observed activity
              </caption>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Member</th>
                  <th>Providers</th>
                  <th className="numeric">Usage events</th>
                  <th className="numeric">Sessions</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id} data-testid={`machine-${machine.id}`}>
                    <td>
                      <div className="machine-name">
                        <HardDrive size={17} />
                        <div>
                          <strong>{machine.label}</strong>
                        </div>
                      </div>
                      {source === "local" ? (
                        <MachineDisplayEditor machine={machine} />
                      ) : null}
                      <details className="identity-details">
                        <summary>Imported attribution</summary>
                        <dl>
                          <dt>Member in original import</dt>
                          <dd>{machine.importedMember}</dd>
                          <dt>Computer in original import</dt>
                          <dd>{machine.importedLabel}</dd>
                          <dt>Machine ID</dt>
                          <dd>
                            <code>{machine.id}</code>
                          </dd>
                        </dl>
                      </details>
                    </td>
                    <td>
                      <div className="session-member">
                        <Avatar name={machine.member} />
                        <span>{machine.member}</span>
                      </div>
                    </td>
                    <td>
                      <div className="provider-list">
                        {machine.providers.length ? (
                          machine.providers.map((provider) => (
                            <ProviderBadge key={provider} provider={provider} />
                          ))
                        ) : (
                          <span className="muted">No usage</span>
                        )}
                      </div>
                    </td>
                    <td className="numeric">{number(machine.usage)}</td>
                    <td className="numeric">{number(machine.sessions)}</td>
                    <td className="date-cell">
                      {machine.lastAt
                        ? dateTime(machine.lastAt)
                        : "No usage yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sources-empty">
            <HardDrive size={25} />
            <p>
              No machines imported yet. Import this computer above, or preview a
              usage file to get started.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
