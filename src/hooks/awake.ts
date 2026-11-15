import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

/** Holds the screen on while a practice surface is in use. */
export function useConditionalKeepAwake(active: boolean, tag: string) {
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    activateKeepAwakeAsync(tag).catch(() => {
      if (!cancelled) {
        // The browser may ignore wake locks without a gesture. Practice still works.
      }
    });
    return () => {
      cancelled = true;
      deactivateKeepAwake(tag).catch(() => undefined);
    };
  }, [active, tag]);
}
