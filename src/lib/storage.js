export const ENTRIES_KEY = 'still.journal.entries.v1';
const FALLBACK_PHOTOS_KEY = 'still.journal.photos.fallback.v1';
const PHOTO_DIR = 'photos';

export function loadEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(item => item && typeof item.id === 'string' && typeof item.body === 'string') : [];
  } catch { return []; }
}

export function persistEntries(entries) {
  // Synchronous storage: only update React state after the data is actually persisted.
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatLongDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(new Date(value));
}

export function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(new Date(value));
}

export function formatTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  }).format(new Date(value));
}

export function formatTimeZone(value) {
  try { return new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' }).formatToParts(new Date(value)).find(x => x.type === 'timeZoneName')?.value ?? ''; }
  catch { return ''; }
}

function safeFileName(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.').slice(0, 140);
}

function uniquePhotoName(file) {
  const suffix = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const extension = /^[a-z0-9]{2,5}$/.test(suffix) ? suffix : 'jpg';
  return `${Date.now()}_${crypto.randomUUID()}.${extension}`;
}

async function photoDirectory() {
  if (!navigator.storage?.getDirectory) throw new Error('Origin-private photo storage is unavailable in this browser.');
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(PHOTO_DIR, { create: true });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function optimizePhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Each photo must be smaller than 15 MB.');
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 70);
    return new File([blob], `${base || 'photo'}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file; // e.g. a browser that cannot decode a particular photo format.
  }
}

export async function savePhoto(file) {
  const filename = uniquePhotoName(file);
  await writePhoto(filename, file);
  return { filename, originalName: safeFileName(file.name), type: file.type || 'image/jpeg', size: file.size };
}

export async function writePhoto(filename, blob) {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes('..')) throw new Error('Invalid photo filename.');
  try {
    const dir = await photoDirectory();
    const handle = await dir.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    // Compatibility path for browsers without the origin-private file system.
    if (navigator.storage?.getDirectory) throw error;
    const photos = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
    photos[filename] = await fileToDataURL(blob);
    localStorage.setItem(FALLBACK_PHOTOS_KEY, JSON.stringify(photos));
  }
}

export async function readPhoto(filename) {
  try {
    const dir = await photoDirectory();
    const handle = await dir.getFileHandle(filename);
    return await handle.getFile();
  } catch {
    const photos = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
    if (!photos[filename]) throw new Error(`Photo not found: ${filename}`);
    return await (await fetch(photos[filename])).blob();
  }
}

export async function deletePhoto(filename) {
  try {
    const dir = await photoDirectory();
    await dir.removeEntry(filename);
  } catch {
    const photos = JSON.parse(localStorage.getItem(FALLBACK_PHOTOS_KEY) || '{}');
    delete photos[filename];
    localStorage.setItem(FALLBACK_PHOTOS_KEY, JSON.stringify(photos));
  }
}
