function timestampSlug() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}

export function capturePhotoFromVideo(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) {
    throw new Error('Camera is not ready yet. Wait a moment and try again.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not capture photo.');
  }

  context.drawImage(video, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create photo file.'));
        }
      },
      'image/jpeg',
      0.92,
    );
  });
}

export function pickVideoMimeType() {
  const candidates = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

export function createVideoRecorder(stream, onData) {
  const mimeType = pickVideoMimeType();

  if (!mimeType) {
    throw new Error('Video recording is not supported in this browser.');
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  });

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) {
      onData(event.data);
    }
  });

  return { recorder, mimeType };
}

export function extensionForMime(mimeType) {
  if (mimeType.includes('mp4')) {
    return 'mp4';
  }
  return 'webm';
}

export async function saveBlobToDevice(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return { method: 'share' };
    } catch (shareError) {
      if (shareError?.name === 'AbortError') {
        return { method: 'cancelled' };
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { method: 'download' };
}

export function buildPhotoFilename() {
  return `andsiosa-photo-${timestampSlug()}.jpg`;
}

export function buildVideoFilename(mimeType) {
  return `andsiosa-video-${timestampSlug()}.${extensionForMime(mimeType)}`;
}
