'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface LightboxContextValue {
  open: (src: string) => void;
}

const LightboxContext = createContext<LightboxContextValue>({ open: () => {} });

export function useLightbox(): LightboxContextValue {
  return useContext(LightboxContext);
}

export default function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [activeSrc, setActiveSrc] = useState<string | null>(null);

  const open = useCallback((src: string) => setActiveSrc(src), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <LightboxContext.Provider value={value}>
      {children}
      <Lightbox
        open={activeSrc !== null}
        close={() => setActiveSrc(null)}
        slides={activeSrc ? [{ src: activeSrc }] : []}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          iconClose: () => (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ),
        }}
        carousel={{ finite: true }}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: 'rgba(64, 64, 64, 0.92)' },
          button: { filter: 'none' },
        }}
      />
    </LightboxContext.Provider>
  );
}
