// Saving + sharing helpers for both the web build and the Android (Capacitor) app.
// - Android: saves into the phone's Gallery (Pictures/Photobooth album) and shares via the native share sheet.
// - Web: downloads through a link and shares through the Web Share API when the browser supports files.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Media } from '@capacitor-community/media';

const ALBUM_NAME = 'Photobooth';

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const toDataUrl = async (data) => (data instanceof Blob ? blobToDataUrl(data) : data);

const toBlob = async (data) => (data instanceof Blob ? data : (await fetch(data)).blob());

const stripExtension = (filename) => filename.replace(/\.[^.]+$/, '');

// Android needs an album identifier (a folder path); iOS can save without one.
let albumIdPromise = null;
async function getAlbumIdentifier() {
  if (Capacitor.getPlatform() !== 'android') return undefined;
  if (!albumIdPromise) {
    albumIdPromise = (async () => {
      const { path } = await Media.getAlbumsPath();
      const identifier = `${path}/${ALBUM_NAME}`;
      try {
        await Media.createAlbum({ name: ALBUM_NAME });
      } catch (e) {
        // "Album already exists" is expected after the first save
        if (!/exist/i.test(e?.message || '')) throw e;
      }
      return identifier;
    })().catch((e) => {
      albumIdPromise = null; // allow retry (e.g. after the user grants permission)
      throw e;
    });
  }
  return albumIdPromise;
}

/**
 * Save an image (data URL or Blob) for the user.
 * Resolves to { ok, message, canShare }.
 */
export async function saveImage(data, filename) {
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUrl = await toDataUrl(data);
      const albumIdentifier = await getAlbumIdentifier();
      await Media.savePhoto({ path: dataUrl, albumIdentifier, fileName: stripExtension(filename) });
      return { ok: true, message: 'Saved to your Gallery 💗', canShare: true };
    } catch (e) {
      console.error('Unable to save to gallery', e);
      return {
        ok: false,
        message: /denied|permission/i.test(e?.message || '')
          ? 'Photo permission is needed to save. You can still share it!'
          : `Couldn't save: ${e?.message || 'unknown error'}`,
        canShare: true,
      };
    }
  }

  const link = document.createElement('a');
  link.href = data instanceof Blob ? URL.createObjectURL(data) : data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (data instanceof Blob) setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  return { ok: true, message: 'Downloaded 💗', canShare: await canWebShareFiles(data, filename) };
}

async function canWebShareFiles(data, filename) {
  try {
    if (!navigator.canShare) return false;
    const blob = await toBlob(data);
    return navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] });
  } catch {
    return false;
  }
}

/** Open the share sheet for an image (data URL or Blob). */
export async function shareImage(data, filename) {
  const title = 'My Photobooth strip';
  try {
    if (Capacitor.isNativePlatform()) {
      const dataUrl = await toDataUrl(data);
      const { uri } = await Filesystem.writeFile({
        path: filename,
        data: dataUrl.split(',')[1],
        directory: Directory.Cache,
      });
      await Share.share({ title, files: [uri], dialogTitle: 'Share your strip' });
      return;
    }
    const blob = await toBlob(data);
    const file = new File([blob], filename, { type: blob.type });
    await navigator.share({ title, files: [file] });
  } catch (e) {
    // Closing the share sheet throws a "canceled" error — that's fine
    if (!/cancel|abort/i.test(e?.message || e?.name || '')) console.error('Share failed', e);
  }
}
