import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isMediaRef, resolveMediaUrl } from '../../lib/mediaStorage';

interface MediaAudioPlayerProps {
  src: string;
  className?: string;
  /** Shows a friendly error message when the audio cannot be loaded. */
  showError?: boolean;
}

/**
 * Audio player that understands both normal URLs and large audio files
 * saved in chunks in Firestore (`firestore-media:<id>`).
 */
export const MediaAudioPlayer: React.FC<MediaAudioPlayerProps> = ({
  src,
  className = 'w-full',
  showError = true,
}) => {
  const [resolved, setResolved] = useState<string | null>(isMediaRef(src) ? null : src);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);

    if (!isMediaRef(src)) {
      setResolved(src);
      return;
    }

    setResolved(null);
    resolveMediaUrl(src)
      .then((url) => {
        if (active) setResolved(url);
      })
      .catch((err) => {
        if (active) setError(String(err?.message || err));
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (error) {
    return showError ? (
      <p className="text-[11px] font-semibold text-rose-600">
        Could not load the audio ({error}).
      </p>
    ) : null;
  }

  if (!resolved) {
    return (
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading audio...
      </p>
    );
  }

  return (
    <audio
      controls
      controlsList="nodownload noplaybackrate"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      className={className}
      src={resolved}
    >
      Your browser does not support audio.
    </audio>
  );
};
