import { useRef, useState } from "react";
import { createBackup, parseBackup, restoreBackup, serializeTextBackup, type AppBackup } from "../services/backupStorage";

type SettingsTab = "general" | "data";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [backup, setBackup] = useState<AppBackup | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportBackup = () => {
    try {
      const backupFile = createBackup();
      const blob = new Blob([serializeTextBackup(backupFile)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `protocol-tracker-backup-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
      setMessage("Backup downloaded. Keep the file somewhere safe so you can restore it later.");
    } catch {
      setMessage("");
      setError("Could not create a backup. Check that your browser storage is available.");
    }
  };

  const readBackup = async (file?: File) => {
    setBackup(null);
    setMessage("");
    setError("");
    if (!file) return;

    try {
      const parsed = parseBackup(await file.text());
      setBackup(parsed);
      setMessage(`Ready to restore ${parsed.data.tasks.length} tasks, ${parsed.data.projects.length} projects, and ${parsed.data.calendarEvents.length} calendar items.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read this backup file.");
    }
  };

  const applyRestore = () => {
    if (!backup) return;
    const confirmed = window.confirm(
      "Restore this backup? It will replace the tasks, projects, and calendar items currently stored in this browser."
    );
    if (!confirmed) return;

    try {
      restoreBackup(backup);
      setBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError("");
      setMessage("Backup restored. Your tasks, projects, and calendar are ready to use.");
    } catch {
      setMessage("");
      setError("Could not restore the backup. Your existing data was kept.");
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <p className="settings-eyebrow">Workspace</p>
        <h1>Settings</h1>
        <p>Manage your Protocol Tracker preferences and data.</p>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "general"}
          className={activeTab === "general" ? "active" : ""}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "data"}
          className={activeTab === "data" ? "active" : ""}
          onClick={() => setActiveTab("data")}
        >
          Data &amp; Backup
        </button>
      </div>

      {activeTab === "general" ? (
        <section className="settings-empty-card" role="tabpanel">
          <div className="settings-empty-icon" aria-hidden="true">⚙</div>
          <div>
            <h2>No preferences to change yet</h2>
            <p>Workspace preferences will appear here as they become available.</p>
          </div>
        </section>
      ) : (
        <section className="settings-data-panel" role="tabpanel">
          <div className="settings-section-heading">
            <div>
              <h2>Back up your workspace</h2>
              <p>Save your tasks, projects, notes, action items, and calendar schedule to a readable text file.</p>
            </div>
            <button type="button" className="settings-primary-button" onClick={exportBackup}>
              Export backup
            </button>
          </div>

          <div className="settings-divider" />

          <div className="settings-section-heading settings-restore-heading">
            <div>
              <h2>Restore a backup</h2>
              <p>Choose a text backup to review and restore. Earlier JSON backups are still supported.</p>
            </div>
          </div>
          <div className="settings-import-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,text/plain,application/json"
              aria-label="Choose a Protocol Tracker backup file"
              onChange={(event) => void readBackup(event.currentTarget.files?.[0])}
            />
            {backup && (
              <button type="button" className="settings-restore-button" onClick={applyRestore}>
                Restore backup
              </button>
            )}
          </div>
          {backup && <p className="settings-replace-note">Restoring will replace the data currently saved in this browser.</p>}
          {message && <p className="settings-feedback" role="status">{message}</p>}
          {error && <p className="settings-error" role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
