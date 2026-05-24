"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PATH,
  PATH_OPTIONS,
  buildYearOptions,
  formatBytes,
  formatFreigabeLabel,
  getEffectivePath,
  isPathValid,
  toIso8601WithOffsetFromDateAndTime,
} from "@/lib/constants";
import type { FileMetadataUpdate, FileRecord } from "@/lib/types";

type StatusKind = "info" | "success" | "error";

interface UploadMeta {
  reprotyp: string;
  titel: string;
  beschreibung: string;
  autoren: string;
  sachschlagwoerter: string;
  iab_themen: string;
  sperrfrist: string;
  reihenfolge: string;
  freigabe: string;
}

type EditFormState = FileMetadataUpdate & { aktiv_id: string; sperrfrist: string };

const emptyUploadMeta = (): UploadMeta => ({
  reprotyp: "",
  titel: "",
  beschreibung: "",
  autoren: "",
  sachschlagwoerter: "",
  iab_themen: "",
  sperrfrist: "",
  reihenfolge: "0",
  freigabe: "1",
});

function displayMeta(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function dateInputFromApi(value: unknown): string {
  if (!value) return "";
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function freigabeSelect(value: unknown): boolean {
  return !(value === false || value === 0 || value === "0");
}

function FieldWrapper({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`form-field ${className ?? ""}`.trim()}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function DetailGrid({ file }: { file: FileRecord }) {
  const items: [string, string, boolean?][] = [
    ["Pfad", displayMeta(file.path), true],
    ["reprotyp", displayMeta(file.reprotyp)],
    ["titel", displayMeta(file.titel)],
    ["autoren", displayMeta(file.autoren)],
    ["sachschlagwoerter", displayMeta(file.sachschlagwoerter)],
    ["iab_themen", displayMeta(file.iab_themen)],
    ["sperrfrist", displayMeta(file.sperrfrist)],
    ["reihenfolge", file.reihenfolge != null ? String(file.reihenfolge) : "—"],
    ["mime_type", displayMeta(file.mime_type)],
  ];
  return (
    <div className="doc-details-grid">
      {items.map(([label, val, wide]) => (
        <div key={label} className={wide ? "doc-detail-wide" : undefined}>
          <span className="doc-detail-label">{label}</span>
          <span className="doc-detail-value">{val}</span>
        </div>
      ))}
      <div className="doc-detail-wide">
        <span className="doc-detail-label">beschreibung</span>
        <span className="doc-detail-value">{displayMeta(file.beschreibung)}</span>
      </div>
    </div>
  );
}

export default function RepositoryApp() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [pathFilter, setPathFilter] = useState(DEFAULT_PATH);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [aktivIdFilter, setAktivIdFilter] = useState("");
  const [reprotypFilter, setReprotypFilter] = useState("");
  const [freigabeFilter, setFreigabeFilter] = useState("");
  const [sinceDate, setSinceDate] = useState("");
  const [sinceTime, setSinceTime] = useState("");

  const [uploadAktivId, setUploadAktivId] = useState("");
  const [uploadMeta, setUploadMeta] = useState<UploadMeta>(emptyUploadMeta);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("info");

  const [editFile, setEditFile] = useState<FileRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    aktiv_id: "",
    freigabe: true,
    reihenfolge: 0,
    sperrfrist: "",
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null
  );

  const years = useMemo(() => buildYearOptions(), []);
  const effectiveUploadPath = getEffectivePath(pathFilter, yearFilter);
  const canUpload = Boolean(pathFilter.trim());
  const hasSelectedFiles = Boolean(uploadFiles && uploadFiles.length > 0);

  const showStatus = useCallback((text: string, kind: StatusKind = "info", autoHide = 3000) => {
    setStatus(text);
    setStatusKind(kind);
    if (autoHide > 0 && kind !== "error") {
      window.setTimeout(() => setStatus(""), autoHide);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("repository-theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("repository-theme", theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pathFilter) params.set("path", pathFilter);
      if (yearFilter) params.set("year", yearFilter);
      if (aktivIdFilter.trim()) params.set("aktiv_id", aktivIdFilter.trim());
      if (reprotypFilter.trim()) params.set("reprotyp", reprotypFilter.trim());
      if (freigabeFilter) params.set("freigabe", freigabeFilter);
      const since = toIso8601WithOffsetFromDateAndTime(sinceDate, sinceTime);
      if (since) params.set("since", since);

      const res = await fetch(`/api/files?${params.toString()}`);
      if (res.status === 401) {
        setIsLoggedIn(false);
        setAuthOpen(true);
        showStatus("Bitte erneut anmelden.", "error", 0);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        showStatus(json.message || "Laden fehlgeschlagen.", "error", 0);
        return;
      }
      const list = Array.isArray(json.files)
        ? json.files
        : Array.isArray(json.data)
          ? json.data
          : [];
      setFiles(list);
      setExpanded({});
      setStatus("");
    } catch (err) {
      showStatus(`Fehler beim Laden: ${String(err)}`, "error", 0);
    } finally {
      setLoading(false);
    }
  }, [
    aktivIdFilter,
    freigabeFilter,
    pathFilter,
    reprotypFilter,
    showStatus,
    sinceDate,
    sinceTime,
    yearFilter,
  ]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const json = await res.json();
      if (json.isLoggedIn) {
        setIsLoggedIn(true);
        setAuthOpen(false);
        await loadDocuments();
      } else {
        setIsLoggedIn(false);
        setAuthOpen(true);
      }
    } catch {
      setAuthOpen(true);
    }
  }, [loadDocuments]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAuthError(json.message || "Anmeldung fehlgeschlagen.");
        return;
      }
      setIsLoggedIn(true);
      setAuthOpen(false);
      setAuthPassword("");
      showStatus("API-Verbindung hergestellt.", "success");
      await loadDocuments();
    } catch (err) {
      setAuthError(String(err));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setFiles([]);
    setAuthOpen(true);
    showStatus("Abgemeldet.", "success");
  }

  function resetFilters() {
    setPathFilter(DEFAULT_PATH);
    setYearFilter(String(new Date().getFullYear()));
    setAktivIdFilter("");
    setReprotypFilter("");
    setFreigabeFilter("");
    setSinceDate("");
    setSinceTime("");
  }

  function setMetaField<K extends keyof UploadMeta>(key: K, value: UploadMeta[K]) {
    setUploadMeta((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload() {
    if (!canUpload) {
      showStatus("Bitte zuerst im Filter einen Pfad auswählen (nicht 'Alle').", "error", 0);
      return;
    }
    if (!uploadFiles || uploadFiles.length === 0) {
      showStatus("Bitte mindestens eine Datei auswählen.", "error", 0);
      return;
    }
    if (uploadFiles.length > 25) {
      showStatus("Maximal 25 Dateien pro Upload.", "error", 0);
      return;
    }
    if (!isPathValid(effectiveUploadPath)) {
      showStatus("Ungültiger Pfad.", "error", 0);
      return;
    }

    const formData = new FormData();
    Array.from(uploadFiles).forEach((f) => formData.append("files[]", f));
    formData.append("path", effectiveUploadPath);
    if (uploadAktivId.trim()) formData.append("aktiv_id", uploadAktivId.trim());
    if (uploadMeta.reprotyp.trim()) formData.append("reprotyp", uploadMeta.reprotyp.trim());
    if (uploadMeta.titel.trim()) formData.append("titel", uploadMeta.titel.trim());
    if (uploadMeta.beschreibung.trim())
      formData.append("beschreibung", uploadMeta.beschreibung.trim());
    if (uploadMeta.autoren.trim()) formData.append("autoren", uploadMeta.autoren.trim());
    if (uploadMeta.sachschlagwoerter.trim())
      formData.append("sachschlagwoerter", uploadMeta.sachschlagwoerter.trim());
    if (uploadMeta.iab_themen.trim()) formData.append("iab_themen", uploadMeta.iab_themen.trim());
    if (uploadMeta.sperrfrist.trim()) formData.append("sperrfrist", uploadMeta.sperrfrist.trim());
    if (uploadMeta.reihenfolge.trim()) formData.append("reihenfolge", uploadMeta.reihenfolge.trim());
    formData.append("freigabe", uploadMeta.freigabe);

    showStatus("Upload läuft…", "info", 0);
    try {
      const res = await fetch("/api/files", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        showStatus(json.message || "Upload fehlgeschlagen.", "error", 0);
        return;
      }
      showStatus("Upload erfolgreich.", "success");
      setUploadFiles(null);
      const input = document.getElementById("upload-files-input") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadDocuments();
    } catch (err) {
      showStatus(`Upload-Fehler: ${String(err)}`, "error", 0);
    }
  }

  async function handleDownload(id: string, name: string) {
    showStatus("Download wird gestartet…", "info", 0);
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(id)}/download`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        showStatus(json.message || `Download fehlgeschlagen (${res.status}).`, "error", 0);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name || "download";
      a.click();
      URL.revokeObjectURL(url);
      showStatus("Download gestartet.", "success");
    } catch (err) {
      showStatus(`Download-Fehler: ${String(err)}`, "error", 0);
    }
  }

  function openEdit(file: FileRecord) {
    setEditFile(file);
    setEditError("");
    setEditForm({
      aktiv_id: file.aktiv_id ? String(file.aktiv_id) : "",
      reprotyp: file.reprotyp ? String(file.reprotyp) : "",
      titel: file.titel ? String(file.titel) : "",
      beschreibung: file.beschreibung ? String(file.beschreibung) : "",
      autoren: file.autoren ? String(file.autoren) : "",
      sachschlagwoerter: file.sachschlagwoerter ? String(file.sachschlagwoerter) : "",
      iab_themen: file.iab_themen ? String(file.iab_themen) : "",
      sperrfrist: dateInputFromApi(file.sperrfrist),
      reihenfolge: file.reihenfolge ?? 0,
      freigabe: freigabeSelect(file.freigabe),
    });
  }

  async function saveEdit() {
    if (!editFile) return;
    setEditSaving(true);
    setEditError("");
    try {
      const body: FileMetadataUpdate = {
        aktiv_id: editForm.aktiv_id?.trim() || null,
        reprotyp: editForm.reprotyp?.trim() || null,
        titel: editForm.titel?.trim() || null,
        beschreibung: editForm.beschreibung?.trim() || null,
        autoren: editForm.autoren?.trim() || null,
        sachschlagwoerter: editForm.sachschlagwoerter?.trim() || null,
        iab_themen: editForm.iab_themen?.trim() || null,
        sperrfrist: editForm.sperrfrist?.trim() || null,
        reihenfolge: Number(editForm.reihenfolge) || 0,
        freigabe: Boolean(editForm.freigabe),
      };
      const res = await fetch(`/api/files/${encodeURIComponent(editFile.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = json.message || "Speichern fehlgeschlagen.";
        if (res.status === 405) {
          msg =
            "Der DataHub unterstützt PATCH /api/files/{id} noch nicht. Metadaten können derzeit nur beim Upload gesetzt werden.";
        }
        setEditError(`${msg} (${res.status})`);
        return;
      }
      setEditFile(null);
      showStatus("Metadaten gespeichert.", "success");
      await loadDocuments();
    } catch (err) {
      setEditError(String(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        showStatus(json.message || "Löschen fehlgeschlagen.", "error", 0);
        return;
      }
      showStatus("Dokument gelöscht.", "success");
      setDeleteTarget(null);
      await loadDocuments();
    } catch (err) {
      showStatus(`Löschen fehlgeschlagen: ${String(err)}`, "error", 0);
    }
  }

  return (
    <main className="page">
      <header className="header-row">
        <div>
          <h1>
            IAB-Backend-Repository-Service
            <span className="badge-next">Next.js</span>
          </h1>
        </div>
        <div className="theme-switcher">
          <Link className="theme-btn icon-btn" href="/hilfe" title="Hilfe">
            ?
          </Link>
          <Link className="theme-btn icon-btn" href="/api-docs" title="API-Dokumentation">
            {"{ }"}
          </Link>
          {isLoggedIn && (
            <button type="button" className="theme-btn icon-btn" title="Abmelden" onClick={handleLogout}>
              ⎋
            </button>
          )}
          <button
            type="button"
            className={`theme-btn ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
          >
            Hell
          </button>
          <button
            type="button"
            className={`theme-btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            Dunkel
          </button>
        </div>
      </header>

      <fieldset className="panel-filter">
        <legend>Suche &amp; Filter</legend>
        <div className="filter-grid">
          <FieldWrapper label="Pfad-Filter (optional)" className="filter-field">
            <select value={pathFilter} onChange={(e) => setPathFilter(e.target.value)}>
              {PATH_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldWrapper>
          <FieldWrapper label="Jahr-Filter (optional)" className="filter-field">
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">Alle</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </FieldWrapper>
          <FieldWrapper label="aktiv_id-Filter (optional)" className="filter-field">
            <input
              type="text"
              value={aktivIdFilter}
              onChange={(e) => setAktivIdFilter(e.target.value)}
              placeholder="123456"
            />
          </FieldWrapper>
          <FieldWrapper label="reprotyp-Filter (optional)" className="filter-field">
            <input
              type="text"
              value={reprotypFilter}
              onChange={(e) => setReprotypFilter(e.target.value)}
              placeholder="forschungsbericht"
            />
          </FieldWrapper>
          <FieldWrapper label="freigabe-Filter (optional)" className="filter-field">
            <select value={freigabeFilter} onChange={(e) => setFreigabeFilter(e.target.value)}>
              <option value="">Alle</option>
              <option value="1">Freigegeben (1)</option>
              <option value="0">Nicht freigegeben (0)</option>
            </select>
          </FieldWrapper>
          <FieldWrapper label="since (optional)" className="filter-field filter-since-field">
            <div className="filter-date-time">
              <input type="date" value={sinceDate} onChange={(e) => setSinceDate(e.target.value)} />
              <input type="time" value={sinceTime} onChange={(e) => setSinceTime(e.target.value)} />
            </div>
          </FieldWrapper>
          <div className="filter-actions">
            <button type="button" className="btn-primary filter-btn" onClick={loadDocuments}>
              {loading ? "Lädt…" : "Filtern"}
            </button>
            <button
              type="button"
              className="btn-secondary filter-reset-btn"
              title="Filter zurücksetzen"
              onClick={() => {
                resetFilters();
                loadDocuments();
              }}
            >
              ↺
            </button>
          </div>
        </div>
      </fieldset>

      <fieldset className="panel-upload">
        <legend>Upload</legend>
        <label htmlFor="uploadAktivId">aktiv_id (optional)</label>
        <input
          id="uploadAktivId"
          type="text"
          value={uploadAktivId}
          onChange={(e) => setUploadAktivId(e.target.value)}
          placeholder="z. B. AKT-2026-001"
        />
        <div className={`target-path-note${hasSelectedFiles ? " attention" : ""}`} role="status">
          {canUpload
            ? `Upload-Zielpfad: ${effectiveUploadPath}`
            : "Upload-Zielpfad: nicht gesetzt (Pfad darf nicht 'Alle' sein)"}
        </div>

        <details className="upload-meta-details">
          <summary>Metadaten (optional, API-Felder)</summary>
          <div className="upload-meta-grid">
            <FieldWrapper label="reprotyp">
              <input
                type="text"
                value={uploadMeta.reprotyp}
                onChange={(e) => setMetaField("reprotyp", e.target.value)}
                placeholder="z. B. IAB-Kurzbericht"
              />
            </FieldWrapper>
            <FieldWrapper label="titel" className="upload-meta-span-2">
              <input type="text" value={uploadMeta.titel} onChange={(e) => setMetaField("titel", e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="beschreibung" className="upload-meta-full">
              <textarea
                rows={2}
                maxLength={5000}
                value={uploadMeta.beschreibung}
                onChange={(e) => setMetaField("beschreibung", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="autoren">
              <input type="text" value={uploadMeta.autoren} onChange={(e) => setMetaField("autoren", e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="sachschlagwoerter">
              <input
                type="text"
                value={uploadMeta.sachschlagwoerter}
                onChange={(e) => setMetaField("sachschlagwoerter", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="iab_themen">
              <input type="text" value={uploadMeta.iab_themen} onChange={(e) => setMetaField("iab_themen", e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="sperrfrist">
              <input
                type="date"
                value={uploadMeta.sperrfrist}
                onChange={(e) => setMetaField("sperrfrist", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="reihenfolge">
              <input
                type="number"
                value={uploadMeta.reihenfolge}
                onChange={(e) => setMetaField("reihenfolge", e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="freigabe">
              <select value={uploadMeta.freigabe} onChange={(e) => setMetaField("freigabe", e.target.value)}>
                <option value="1">Ja (abrufbar)</option>
                <option value="0">Nein (gesperrt)</option>
              </select>
            </FieldWrapper>
          </div>
        </details>

        <label htmlFor="upload-files-input">Dateien (1–25)</label>
        <input
          id="upload-files-input"
          type="file"
          multiple
          onChange={(e) => setUploadFiles(e.target.files)}
        />
        <button type="button" className="btn-primary" disabled={!canUpload} onClick={handleUpload}>
          Dateien hochladen
        </button>
      </fieldset>

      {status && (
        <div className={`status-bar show ${statusKind}`} role="status">
          <button type="button" className="status-close" onClick={() => setStatus("")} aria-label="Schließen">
            ×
          </button>
          {status}
        </div>
      )}

      <fieldset className="panel-documents">
        <legend>Hochgeladene Dokumente ({files.length})</legend>
        {!isLoggedIn ? (
          <p className="muted">Bitte anmelden, um Dokumente zu laden.</p>
        ) : files.length === 0 ? (
          <p className="muted">Keine Dokumente gefunden.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: "2.75rem" }} title="Details">
                  ▾
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>aktiv_id</th>
                <th>freigabe</th>
                <th>Größe</th>
                <th>Erstellt</th>
                <th title="Bearbeiten">✎</th>
                <th>X</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isOpen = Boolean(expanded[file.id]);
                return (
                  <Fragment key={file.id}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="btn-icon expand"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [file.id]: !prev[file.id] }))
                          }
                        >
                          {isOpen ? "▼" : "▶"}
                        </button>
                      </td>
                      <td title={file.id}>{file.id}</td>
                      <td>
                        <button
                          type="button"
                          className="file-link"
                          onClick={() => handleDownload(file.id, file.original_name)}
                        >
                          {file.original_name}
                        </button>
                      </td>
                      <td>{displayMeta(file.aktiv_id)}</td>
                      <td>{formatFreigabeLabel(file.freigabe)}</td>
                      <td>{formatBytes(file.size ?? NaN)}</td>
                      <td>{displayMeta(file.created_at)}</td>
                      <td>
                        <button type="button" className="btn-icon edit" title="Bearbeiten" onClick={() => openEdit(file)}>
                          ✎
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon delete"
                          title="Löschen"
                          onClick={() => setDeleteTarget({ id: file.id, name: file.original_name })}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="doc-detail-row">
                        <td colSpan={9}>
                          <DetailGrid file={file} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </fieldset>

      {authOpen && (
        <div className="modal-overlay" role="presentation">
          <AuthModal
            authPassword={authPassword}
            authError={authError}
            authLoading={authLoading}
            onPassword={setAuthPassword}
            onSubmit={handleLogin}
          />
        </div>
      )}

      {editFile && (
        <div className="modal-overlay" role="presentation">
          <EditModal
            file={editFile}
            editForm={editForm}
            editError={editError}
            editSaving={editSaving}
            setEditForm={setEditForm}
            onCancel={() => setEditFile(null)}
            onSave={saveEdit}
          />
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" role="presentation">
          <div className="modal" role="dialog">
            <h2 className="modal-title">Dokument löschen?</h2>
            <p className="modal-message">{deleteTarget.name}</p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                Abbrechen
              </button>
              <button type="button" className="btn-danger" onClick={confirmDelete}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AuthModal({
  authPassword,
  authError,
  authLoading,
  onPassword,
  onSubmit,
}: {
  authPassword: string;
  authError: string;
  authLoading: boolean;
  onPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="modal" role="dialog" aria-labelledby="authTitle">
      <h2 id="authTitle" className="modal-title">
        API-Passwort eingeben
      </h2>
      <p className="modal-message">
        Das Passwort wird serverseitig geprüft. Der DataHub-Token liegt in einer HttpOnly-Session
        (nicht im Browser-LocalStorage).
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="authPassword">Passwort</label>
        <input
          id="authPassword"
          type="password"
          autoComplete="current-password"
          value={authPassword}
          onChange={(e) => onPassword(e.target.value)}
        />
        {authError && <p className="auth-error">{authError}</p>}
        <div className="modal-actions">
          <button type="submit" className="btn-primary" disabled={authLoading}>
            {authLoading ? "Prüfe…" : "Verbinden"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditModal({
  file,
  editForm,
  editError,
  editSaving,
  setEditForm,
  onCancel,
  onSave,
}: {
  file: FileRecord;
  editForm: EditFormState;
  editError: string;
  editSaving: boolean;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = (patch: Partial<EditFormState>) => setEditForm((prev) => ({ ...prev, ...patch }));
  return (
    <div className="modal modal-edit" role="dialog">
      <h2 className="modal-title">Datensatz bearbeiten</h2>
      <p className="modal-message">Metadaten anpassen (Dateiinhalt und Pfad unverändert).</p>
      <div className="edit-readonly-meta">
        <div>
          <strong>Datei:</strong> {file.original_name}
        </div>
        <div>
          <strong>Pfad:</strong> {displayMeta(file.path)}
        </div>
        <div>
          <strong>ID:</strong> {file.id}
        </div>
      </div>
      <div className="edit-form-grid">
        <FieldWrapper label="aktiv_id">
          <input type="text" value={editForm.aktiv_id ?? ""} onChange={(e) => set({ aktiv_id: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="titel" className="edit-form-span-2">
          <input type="text" value={editForm.titel ?? ""} onChange={(e) => set({ titel: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="reprotyp">
          <input type="text" value={editForm.reprotyp ?? ""} onChange={(e) => set({ reprotyp: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="beschreibung" className="edit-form-full">
          <textarea
            rows={3}
            maxLength={5000}
            value={editForm.beschreibung ?? ""}
            onChange={(e) => set({ beschreibung: e.target.value })}
          />
        </FieldWrapper>
        <FieldWrapper label="autoren">
          <input type="text" value={editForm.autoren ?? ""} onChange={(e) => set({ autoren: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="sachschlagwoerter">
          <input
            type="text"
            value={editForm.sachschlagwoerter ?? ""}
            onChange={(e) => set({ sachschlagwoerter: e.target.value })}
          />
        </FieldWrapper>
        <FieldWrapper label="iab_themen">
          <input type="text" value={editForm.iab_themen ?? ""} onChange={(e) => set({ iab_themen: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="sperrfrist">
          <input
            type="date"
            value={editForm.sperrfrist ?? ""}
            onChange={(e) => set({ sperrfrist: e.target.value })}
          />
        </FieldWrapper>
        <FieldWrapper label="reihenfolge">
          <input
            type="number"
            value={editForm.reihenfolge ?? 0}
            onChange={(e) => set({ reihenfolge: Number(e.target.value) })}
          />
        </FieldWrapper>
        <FieldWrapper label="freigabe">
          <select
            value={editForm.freigabe ? "1" : "0"}
            onChange={(e) => set({ freigabe: e.target.value === "1" })}
          >
            <option value="1">Ja (abrufbar)</option>
            <option value="0">Nein (gesperrt)</option>
          </select>
        </FieldWrapper>
      </div>
      {editError && <p className="auth-error">{editError}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="button" className="btn-primary" disabled={editSaving} onClick={onSave}>
          {editSaving ? "Speichern…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
