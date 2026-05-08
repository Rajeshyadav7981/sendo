import { useEffect, useRef } from 'react';

interface UseModalBackButtonArgs {
  isOpen: boolean;
  currentMode: string;
  modeHandlers: Record<string, () => void>;
  onClose: () => void;
}

export function useModalBackButton({
  isOpen,
  currentMode,
  modeHandlers,
  onClose,
}: UseModalBackButtonArgs): void {
  const latest = useRef({ currentMode, modeHandlers, onClose });
  latest.current = { currentMode, modeHandlers, onClose };

  useEffect(() => {
    if (!isOpen) return;
    let consumed = false;
    window.history.pushState({ sendoModal: 1 }, '');

    const onPop = (): void => {
      const cur = latest.current;
      const handler = cur.modeHandlers[cur.currentMode];
      if (handler) {
        handler();
        window.history.pushState({ sendoModal: 1 }, '');
      } else {
        consumed = true;
        cur.onClose();
      }
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!consumed) window.history.back();
    };
  }, [isOpen]);
}
