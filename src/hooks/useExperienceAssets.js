import { useEffect, useState } from 'react';
import { DEFAULT_EXPERIENCE } from '../config/defaults.js';
import { loadExperienceAsset } from '../lib/experienceAssets.js';

/**
 * Loads exactly one built-in experience artwork for the active tab slug.
 */
export function useExperienceAssets(enabled, activeSlug = DEFAULT_EXPERIENCE.activeSlug) {
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setItem(null);
      return;
    }

    let cancelled = false;

    loadExperienceAsset(activeSlug).then((loaded) => {
      if (!cancelled) {
        setItem(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, activeSlug]);

  return item;
}
