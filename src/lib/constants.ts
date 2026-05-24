export const PATH_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "barrierefreiheit", label: "Barrierefreiheit" },
  { value: "befragungen", label: "Befragungen" },
  { value: "fdz", label: "FDZ" },
  { value: "RePEc", label: "RePEc" },
  { value: "PASS", label: "PASS" },
  { value: "arbeitsmarktdaten", label: "Arbeitsmarktdaten" },
  { value: "kurzberichte", label: "Kurzberichte" },
  { value: "kurzberichtsgrafiken", label: "Kurzberichtsgrafiken" },
] as const;

export const DEFAULT_PATH = "kurzberichte";

export function getEffectivePath(pathValue: string, yearValue: string): string {
  const path = pathValue.trim();
  const year = yearValue.trim();
  if (!year) return path;
  return path ? `${path}/${year}` : year;
}

export function buildYearOptions(currentYear = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let y = currentYear; y >= 2000; y -= 1) {
    years.push(y);
  }
  return years;
}

export function toIso8601WithOffsetFromDateAndTime(
  dateValue: string,
  timeValue: string
): string {
  if (!dateValue) return "";
  const timePart = timeValue || "00:00";
  const d = new Date(`${dateValue}T${timePart}`);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(offMin) / 60));
  const om = pad(Math.abs(offMin) % 60);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${oh}:${om}`
  );
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatFreigabeLabel(value: unknown): string {
  if (value === true || value === 1 || value === "1") return "ja";
  if (value === false || value === 0 || value === "0") return "nein";
  return "-";
}

export function isPathValid(path: string): boolean {
  if (!path) return true;
  const allowed = /^[a-zA-Z0-9._/-]+$/;
  if (!allowed.test(path)) return false;
  if (path.startsWith("/") || path.endsWith("/")) return false;
  return !path.split("/").some((seg) => seg === "..");
}
