const MIME_EXTENSION: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/aac': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/m4a': 'm4a',
};

/** File extension for a recording MIME type. Web takes are usually WebM blobs. */
export function extensionForMime(mime: string): string {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  return MIME_EXTENSION[base] ?? 'webm';
}

/** A download name that keeps the note and a real audio extension. */
export function takeDownloadName(note: string, mime: string): string {
  const base = (note || 'take')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'take'}.${extensionForMime(mime)}`;
}
