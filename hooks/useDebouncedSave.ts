import { useEffect, useRef } from 'react';

export function useDebouncedSave(
  value: string,
  saveFn: (v: string) => void,
  delay = 800,
) {
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveFnRef.current(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);
}
