import { useEffect, useState } from 'react';
import { fetchExperienceManifest } from '../lib/experienceManifest.js';

export function useExperienceScreens(enabled = true) {
  const [state, setState] = useState({ screens: [], manifestVersion: '' });

  useEffect(() => {
    if (!enabled) {
      setState({ screens: [], manifestVersion: '' });
      return;
    }

    let cancelled = false;

    fetchExperienceManifest(true).then((manifest) => {
      if (!cancelled) {
        setState({
          screens: manifest.screens ?? [],
          manifestVersion: manifest.generatedAt ?? '',
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
