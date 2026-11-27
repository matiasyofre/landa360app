import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para detectar inactividad del usuario (15 minutos) y bloquear la pantalla
 */
export function useInactivityLock(timeoutMinutos = 15, isEnabled = true) {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (!isEnabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, timeoutMinutos * 60 * 1000);
  }, [timeoutMinutos, isEnabled]);

  const unlock = () => {
    setIsLocked(false);
    resetTimer();
  };

  useEffect(() => {
    if (!isEnabled) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      if (!isLocked) resetTimer();
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [resetTimer, isLocked, isEnabled]);

  return {
    isLocked,
    unlock
  };
}
