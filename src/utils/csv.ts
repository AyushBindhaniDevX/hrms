import { Platform, Alert } from 'react-native';

/**
 * Build-safe, cross-platform CSV helpers.
 *
 * - Web: uses Blob + anchor download for export, and a hidden <input type="file"> for import.
 * - Native: writes to the cache dir and opens the share sheet (feature-detects the installed
 *   expo-file-system API — new File/Paths or legacy writeAsStringAsync — inside try/catch so an
 *   API mismatch degrades to a friendly Alert instead of crashing).
 *
 * No new dependencies are introduced: only expo-file-system / expo-sharing, which are already
 * installed, and they are required lazily so a native-only module never touches the web bundle path.
 */

export type CsvRow = (string | number | null | undefined)[];

/** Escape a single CSV cell per RFC 4180 (quote when it contains comma, quote, or newline). */
function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Turn headers + rows into a CSV string (prefixed with a UTF-8 BOM so Excel opens it cleanly). */
export function toCsv(headers: string[], rows: CsvRow[]): string {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return '﻿' + lines.join('\r\n');
}

/** Parse a CSV string into headers + rows. Handles quoted fields, escaped quotes, and CRLF/LF. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^﻿/, ''); // strip BOM
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      // Consume \r\n as a single line break
      if (char === '\r' && clean[i + 1] === '\n') i++;
      record.push(field);
      field = '';
      // Skip fully blank trailing lines
      if (record.length > 1 || record[0] !== '') records.push(record);
      record = [];
    } else {
      field += char;
    }
  }
  // Flush the last field/record if the file didn't end with a newline
  if (field !== '' || record.length > 0) {
    record.push(field);
    if (record.length > 1 || record[0] !== '') records.push(record);
  }

  const headers = records.length > 0 ? records[0].map((h) => h.trim()) : [];
  const rows = records.slice(1);
  return { headers, rows };
}

/** Convert parsed rows into objects keyed by header (lowercased + trimmed for tolerant matching). */
export function csvToObjects(text: string): Record<string, string>[] {
  const { headers, rows } = parseCsv(text);
  const keys = headers.map((h) => h.toLowerCase().trim());
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    keys.forEach((k, i) => {
      obj[k] = (row[i] ?? '').trim();
    });
    return obj;
  });
}

/**
 * Export data as a downloadable / shareable CSV file.
 * Returns true on success, false if the platform could not complete the export
 * (a friendly Alert is shown on native failure). Never throws.
 */
export async function exportCsv(
  filenameBase: string,
  headers: string[],
  rows: CsvRow[]
): Promise<boolean> {
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenameBase}_${stamp}.csv`;
  const csv = toCsv(headers, rows);

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Native: write to cache and open the share sheet. All guarded so nothing can crash the app.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FileSystem: any = require('expo-file-system');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sharing: any = require('expo-sharing');

    let uri: string | null = null;

    // Preferred: SDK 54+ File/Paths API
    if (FileSystem?.File && FileSystem?.Paths) {
      const file = new FileSystem.File(FileSystem.Paths.cache, filename);
      try {
        if (file.exists) file.delete();
      } catch {}
      file.create();
      file.write(csv);
      uri = file.uri;
    } else if (typeof FileSystem?.writeAsStringAsync === 'function') {
      // Legacy API
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      uri = dir + filename;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem?.EncodingType?.UTF8 || 'utf8',
      });
    }

    if (uri && Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        dialogTitle: filename,
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    }

    Alert.alert('Export ready', 'The file was created but sharing is not available on this device.');
    return false;
  } catch {
    Alert.alert('Export unavailable', 'CSV export works best from the web dashboard on this device.');
    return false;
  }
}

/**
 * Prompt the user to pick a CSV file and return its parsed objects.
 * Web only (uses a hidden file input). On native, shows an informational Alert and resolves null,
 * so no uninstalled document-picker dependency is ever referenced.
 */
export function importCsvObjects(): Promise<Record<string, string>[] | null> {
  if (Platform.OS !== 'web') {
    Alert.alert('Import on web', 'Bulk CSV import is available from the web dashboard.');
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      input.style.display = 'none';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(csvToObjects(String(reader.result || '')));
          } catch {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      document.body.appendChild(input);
      input.click();
      // Clean up shortly after; the change handler fires before this on real selections.
      setTimeout(() => {
        try {
          document.body.removeChild(input);
        } catch {}
      }, 1000);
    } catch {
      resolve(null);
    }
  });
}
