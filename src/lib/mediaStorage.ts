/**
 * Armazenamento de mídias grandes (áudios de quiz) em partes no Firestore.
 *
 * O Firestore limita cada documento a 1 MB, por isso um áudio grande é dividido
 * em vários documentos de ~600 KB. A coleção `test` é usada porque já está
 * liberada nas regras de segurança atuais (leitura/escrita por ID).
 *
 * Referência salva no quiz: `firestore-media:<mediaId>`.
 */
import { doc, getDoc } from 'firebase/firestore';
import { db, saveDocument, deleteDocument } from './firebase';

const MEDIA_COLLECTION = 'test';
const MEDIA_PREFIX = 'tgmedia_';
const CHUNK_CHARS = 600_000; // ~600 KB de base64 por documento (limite do Firestore é 1 MB)
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB

const metaDocId = (mediaId: string) => `${MEDIA_PREFIX}${mediaId}_meta`;
const chunkDocId = (mediaId: string, index: number) => `${MEDIA_PREFIX}${mediaId}_${index}`;

const objectUrlCache = new Map<string, string>();

export const isMediaRef = (value?: string): boolean =>
  Boolean(value && value.startsWith('firestore-media:'));

export const mediaIdFromRef = (value: string): string => value.replace('firestore-media:', '');

export interface UploadedMedia {
  ref: string;
  mediaId: string;
  name: string;
  mime: string;
  size: number;
  chunks: number;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });

export const uploadMediaFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedMedia> => {
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). O limite é ${MAX_MEDIA_BYTES / (1024 * 1024)} MB.`
    );
  }

  const dataUrl = await readFileAsDataUrl(file);
  const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
  const mime = file.type || dataUrl.slice(5, dataUrl.indexOf(';')) || 'audio/mpeg';
  const mediaId = `m${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const totalChunks = Math.max(1, Math.ceil(base64.length / CHUNK_CHARS));

  for (let index = 0; index < totalChunks; index++) {
    const data = base64.slice(index * CHUNK_CHARS, (index + 1) * CHUNK_CHARS);
    await saveDocument(MEDIA_COLLECTION, chunkDocId(mediaId, index), {
      id: chunkDocId(mediaId, index),
      mediaId,
      kind: 'chunk',
      index,
      data,
    });
    onProgress?.(Math.round(((index + 1) / (totalChunks + 1)) * 100));
  }

  await saveDocument(MEDIA_COLLECTION, metaDocId(mediaId), {
    id: metaDocId(mediaId),
    mediaId,
    kind: 'meta',
    name: file.name,
    mime,
    size: file.size,
    chunks: totalChunks,
    createdAt: new Date().toISOString(),
  });
  onProgress?.(100);

  return {
    ref: `firestore-media:${mediaId}`,
    mediaId,
    name: file.name,
    mime,
    size: file.size,
    chunks: totalChunks,
  };
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const resolveMediaUrl = async (ref: string): Promise<string> => {
  if (!isMediaRef(ref)) return ref;
  const mediaId = mediaIdFromRef(ref);
  const cached = objectUrlCache.get(mediaId);
  if (cached) return cached;

  const metaSnap = await getDoc(doc(db, MEDIA_COLLECTION, metaDocId(mediaId)));
  if (!metaSnap.exists()) throw new Error('Áudio não encontrado no armazenamento.');
  const meta = metaSnap.data() as { mime?: string; chunks?: number };
  const totalChunks = Number(meta.chunks || 0);
  if (!totalChunks) throw new Error('Áudio não encontrado no armazenamento.');

  // A coleção permite leitura por documento, mas não listagem: buscamos cada parte pelo ID.
  const chunkSnaps = await Promise.all(
    Array.from({ length: totalChunks }, (_, index) =>
      getDoc(doc(db, MEDIA_COLLECTION, chunkDocId(mediaId, index)))
    )
  );

  const chunks = chunkSnaps
    .map((docSnap, index) => {
      const chunk = docSnap.data() as { data?: string } | undefined;
      return { index, data: chunk?.data };
    })
    .filter((chunk) => typeof chunk.data === 'string');

  if (chunks.length === 0) throw new Error('Áudio não encontrado no armazenamento.');

  const parts = chunks.map((chunk) => base64ToBytes(chunk.data as string));
  const blob = new Blob(parts, { type: meta.mime || 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(mediaId, url);
  return url;
};

export const deleteMedia = async (ref: string): Promise<void> => {
  if (!isMediaRef(ref)) return;
  const mediaId = mediaIdFromRef(ref);
  const cached = objectUrlCache.get(mediaId);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(mediaId);
  }
  const metaSnap = await getDoc(doc(db, MEDIA_COLLECTION, metaDocId(mediaId)));
  const totalChunks = Number((metaSnap.data() as { chunks?: number } | undefined)?.chunks || 0);
  await Promise.all([
    ...Array.from({ length: totalChunks }, (_, index) =>
      deleteDocument(MEDIA_COLLECTION, chunkDocId(mediaId, index))
    ),
    deleteDocument(MEDIA_COLLECTION, metaDocId(mediaId)),
  ]);
};
