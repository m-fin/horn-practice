import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { INSTRUMENTS, type InstrumentId } from '@/lib/pitch';

const STORAGE_KEY = 'horn-practice.instrument';

type InstrumentContextValue = {
  instrument: InstrumentId;
  setInstrument: (instrument: InstrumentId) => void;
};

const InstrumentContext = createContext<InstrumentContextValue | null>(null);

export function InstrumentProvider({ children }: { children: ReactNode }) {
  const [instrument, setInstrumentState] = useState<InstrumentId>('eb-alto');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'eb-alto' || stored === 'bb-trumpet') setInstrumentState(stored);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<InstrumentContextValue>(
    () => ({
      instrument,
      setInstrument(next) {
        setInstrumentState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      },
    }),
    [instrument],
  );

  return <InstrumentContext.Provider value={value}>{children}</InstrumentContext.Provider>;
}

export function useInstrument() {
  const value = useContext(InstrumentContext);
  if (!value) throw new Error('useInstrument must be used inside InstrumentProvider');
  return value;
}

export function instrumentLabel(id: InstrumentId): string {
  return INSTRUMENTS[id].label;
}
