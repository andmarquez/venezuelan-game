import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildPhotoFilename,
  buildVideoFilename,
  capturePhotoFromVideo,
  createVideoRecorder,
  saveBlobToDevice,
} from '../lib/mediaCapture.js';

export default function CameraCapturePanel({
  open,
  videoRef,
  streamRef,
  onClose,
}) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef('');

  useEffect(() => {
    if (!open) {
      setMessage('');
      setIsBusy(false);
    }
  }, [open]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopRecording();
      setIsRecording(false);
    }

    return () => {
      stopRecording();
    };
  }, [open, stopRecording]);

  const handlePhoto = async () => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) {
      setMessage('Start the experience first to use the camera.');
      return;
    }

    setIsBusy(true);
    setMessage('Capturing photo…');

    try {
      const blob = await capturePhotoFromVideo(video);
      const result = await saveBlobToDevice(blob, buildPhotoFilename());

      if (result.method === 'cancelled') {
        setMessage('Photo capture cancelled.');
      } else if (result.method === 'share') {
        setMessage('Choose Save Image in the share sheet to store on your phone.');
      } else {
        setMessage('Photo saved. Check Downloads or your Photos app.');
      }
    } catch (captureError) {
      setMessage(captureError?.message || 'Could not save photo.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleRecord = async () => {
    const stream = streamRef.current;

    if (!stream) {
      setMessage('Start the experience first to use the camera.');
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setMessage('Video recording is not supported in this browser.');
      return;
    }

    setIsBusy(true);
    setMessage('Starting recording…');

    try {
      chunksRef.current = [];
      const { recorder, mimeType } = createVideoRecorder(stream, (chunk) => {
        chunksRef.current.push(chunk);
      });

      mimeTypeRef.current = mimeType;
      recorderRef.current = recorder;

      recorder.addEventListener(
        'stop',
        async () => {
          setIsRecording(false);
          setIsBusy(true);
          setMessage('Saving video…');

          try {
            const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
            chunksRef.current = [];

            if (!blob.size) {
              throw new Error('Recording was empty. Try again.');
            }

            const result = await saveBlobToDevice(
              blob,
              buildVideoFilename(mimeTypeRef.current),
            );

            if (result.method === 'cancelled') {
              setMessage('Video save cancelled.');
            } else if (result.method === 'share') {
              setMessage('Choose Save Video in the share sheet to store on your phone.');
            } else {
              setMessage('Video saved. Check Downloads or your Photos app.');
            }
          } catch (saveError) {
            setMessage(saveError?.message || 'Could not save video.');
          } finally {
            setIsBusy(false);
            recorderRef.current = null;
          }
        },
        { once: true },
      );

      recorder.start(1000);
      setIsRecording(true);
      setMessage('Recording… Tap Stop when finished.');
    } catch (recordError) {
      setMessage(recordError?.message || 'Could not start recording.');
      setIsRecording(false);
      recorderRef.current = null;
    } finally {
      setIsBusy(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="capture-backdrop" role="presentation" onClick={onClose}>
      <div
        className="capture-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Camera capture"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="capture-header">
          <h2>Camera</h2>
          <button type="button" className="capture-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className="capture-hint">
          Uses your live camera feed. On iPhone, use the share sheet and tap Save Photo or Save
          Video to add to your library.
        </p>

        <div className="capture-actions">
          <button
            type="button"
            className="capture-action"
            disabled={isBusy || isRecording}
            onClick={handlePhoto}
          >
            Take photo
          </button>
          <button
            type="button"
            className={`capture-action ${isRecording ? 'is-recording' : ''}`}
            disabled={isBusy && !isRecording}
            onClick={handleToggleRecord}
          >
            {isRecording ? 'Stop recording' : 'Record video'}
          </button>
        </div>

        {isRecording ? <p className="capture-recording-badge" aria-live="polite">● REC</p> : null}
        {message ? (
          <p className="capture-status" aria-live="polite">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
