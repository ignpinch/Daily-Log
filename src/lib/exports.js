import { formatLongDate, formatTime, localDateKey, readPhoto, writePhoto } from './storage.js';

function sorted(entries) {
  return [...entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function makeTextArchive(entries) {
  const lines = [
    'STILL — PERSONAL JOURNAL',
    `Exported: ${new Date().toLocaleString('en-US')}`,
    `Total entries: ${entries.length}`,
    '='.repeat(62), ''
  ];
  for (const entry of sorted(entries)) {
    lines.push(`${formatLongDate(entry.createdAt)}  |  ${formatTime(entry.createdAt)}`);
    lines.push(`Title: ${entry.title || 'Untitled entry'}`);
    lines.push(`Saved: ${entry.createdAt}`);
    if (entry.updatedAt && entry.updatedAt !== entry.createdAt) lines.push(`Last edited: ${entry.updatedAt}`);
    if (entry.photos?.length) lines.push(`Photos: ${entry.photos.map(p => `photos/${p.filename}`).join(', ')}`);
    lines.push('', entry.body, '', '-'.repeat(62), '');
  }
  return lines.join('\n');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(entries) {
  downloadBlob(new Blob([makeTextArchive(entries)], { type: 'text/plain;charset=utf-8' }), `still-journal-${localDateKey(new Date())}.txt`);
}

export async function buildExcel(entries) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Still Personal Journal';
  wb.created = new Date();
  const ws = wb.addWorksheet('Journal Entries', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Time', key: 'time', width: 18 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Entry / Transcript', key: 'body', width: 85 },
    { header: 'Photo files', key: 'photos', width: 54 },
    { header: 'Saved at (ISO)', key: 'saved', width: 30 },
    { header: 'Last edited (ISO)', key: 'updated', width: 30 }
  ];
  for (const e of sorted(entries)) {
    // Text is intentionally written as text, preventing user-entered content from executing as Excel formulas.
    const row = ws.addRow({
      date: localDateKey(e.createdAt),
      time: formatTime(e.createdAt),
      title: String(e.title || 'Untitled entry'),
      body: String(e.body),
      photos: (e.photos || []).map(p => `photos/${p.filename}`).join('; '),
      saved: e.createdAt,
      updated: e.updatedAt || e.createdAt
    });
    row.alignment = { vertical: 'top', wrapText: true };
    row.height = Math.min(85, Math.max(24, 16 * (Math.floor(e.body.length / 90) + 1)));
  }
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18332A' } };
  ws.getRow(1).height = 28;
  ws.autoFilter = { from: 'A1', to: 'G1' };
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function downloadExcel(entries) {
  downloadBlob(await buildExcel(entries), `still-journal-${localDateKey(new Date())}.xlsx`);
}

export async function downloadCompleteBackup(entries) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('journal.txt', makeTextArchive(entries));
  zip.file('journal.xlsx', await buildExcel(entries));
  zip.file('journal-data.json', JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: sorted(entries) }, null, 2));
  const folder = zip.folder('photos');
  const missing = [];
  for (const photo of new Map(entries.flatMap(e => (e.photos || []).map(p => [p.filename, p]))).values()) {
    try { folder.file(photo.filename, await readPhoto(photo.filename)); }
    catch { missing.push(photo.filename); }
  }
  zip.file('README.txt', `STILL JOURNAL BACKUP\n\njournal.txt: Readable notes\njournal.xlsx: Open in Microsoft Excel\njournal-data.json: Data used for restoring your journal\nphotos/: All attached images\n\n${missing.length ? `WARNING: Photo files not found: ${missing.join(', ')}\n` : ''}Keep your backup somewhere private. Do not clear browser storage without exporting first.\n`);
  downloadBlob(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }), `still-complete-backup-${localDateKey(new Date())}.zip`);
  return missing;
}

export async function importCompleteBackup(file, existingEntries) {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  const dataFile = zip.file('journal-data.json');
  if (!dataFile) throw new Error('Not a Still backup: journal-data.json is missing.');
  const data = JSON.parse(await dataFile.async('string'));
  if (data.version !== 1 || !Array.isArray(data.entries)) throw new Error('The backup file is invalid or not supported.');
  const incoming = data.entries;
  if (incoming.some(e => typeof e.id !== 'string' || typeof e.body !== 'string' || !Number.isFinite(new Date(e.createdAt).getTime()) || !Array.isArray(e.photos || []))) {
    throw new Error('Some entries in the backup are invalid.');
  }
  for (const photo of new Map(incoming.flatMap(e => (e.photos || []).map(p => [p.filename, p]))).values()) {
    if (!/^[a-zA-Z0-9._-]+$/.test(photo.filename) || photo.filename.includes('..')) throw new Error('Backup contains an unsafe photo path.');
    const archivedPhoto = zip.file(`photos/${photo.filename}`);
    if (archivedPhoto) await writePhoto(photo.filename, await archivedPhoto.async('blob'));
  }
  const existingIDs = new Set(existingEntries.map(e => e.id));
  const newEntries = incoming.filter(e => !existingIDs.has(e.id));
  return { entries: [...existingEntries, ...newEntries], imported: newEntries.length };
}
