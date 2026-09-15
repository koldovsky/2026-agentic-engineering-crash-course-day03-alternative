import { HardDrive, LockKeyhole, Terminal } from "lucide-react";
import type { MachineSummary, Source } from "@/lib/queries";
import { Avatar, dateTime, number, ProviderBadge, SectionHeading } from "./ui";
import { ImportPanel } from "./transfer-controls";

export function SourcesView({
  machines,
  source,
}: {
  machines: MachineSummary[];
  source: Source;
}) {
  return (
    <>
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
                  <strong>Collect on each machine</strong>
                  <p>
                    Choose a completed Claude Code or Codex session, or collect
                    an explicit folder with the local CLI.
                  </p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Preview, then import</strong>
                  <p>
                    Check the record counts and diagnostics before saving
                    anything to your workspace.
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
        {machines.length ? (
          <div className="table-scroll">
            <table>
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
                  <tr key={machine.id}>
                    <td>
                      <div className="machine-name">
                        <HardDrive size={17} />
                        <div>
                          <strong>{machine.label}</strong>
                          <small>{machine.id}</small>
                        </div>
                      </div>
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
              No machines imported yet. Preview a usage file above to get
              started.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
