export interface FileRecord {
  id: string;
  aktiv_id?: string | null;
  original_name: string;
  path?: string | null;
  mime_type?: string;
  size?: number;
  reprotyp?: string | null;
  titel?: string | null;
  beschreibung?: string | null;
  autoren?: string | null;
  sachschlagwoerter?: string | null;
  iab_themen?: string | null;
  sperrfrist?: string | null;
  reihenfolge?: number | null;
  freigabe?: boolean | number | null;
  created_at?: string;
}

export interface FileListResponse {
  files?: FileRecord[];
  data?: FileRecord[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

export interface FileMetadataUpdate {
  aktiv_id?: string | null;
  reprotyp?: string | null;
  titel?: string | null;
  beschreibung?: string | null;
  autoren?: string | null;
  sachschlagwoerter?: string | null;
  iab_themen?: string | null;
  sperrfrist?: string | null;
  reihenfolge?: number;
  freigabe?: boolean;
}

export interface ListFilters {
  path?: string;
  year?: string;
  aktiv_id?: string;
  reprotyp?: string;
  freigabe?: string;
  since?: string;
  page?: string;
}
