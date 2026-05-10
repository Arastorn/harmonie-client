import { useEffect, useState } from 'react';

const MOBILE_INTERACTION_QUERY = '(hover: none), (pointer: coarse), (max-width: 767px)';

export const isCoarsePointerDevice = () =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_INTERACTION_QUERY).matches;

export const useCoarsePointer = () => {
  const [isCoarsePointer, setIsCoarsePointer] = useState(isCoarsePointerDevice);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_INTERACTION_QUERY);
    const handleChange = () => setIsCoarsePointer(media.matches);

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return isCoarsePointer;
};
