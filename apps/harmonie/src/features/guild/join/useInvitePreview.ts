import { useEffect, useState } from 'react';
import { getInvitePreview } from '@/api/guilds';
import type { InvitePreview } from '@/api/guilds';

const MIN_CODE_LENGTH = 8;
const DEBOUNCE_MS = 400;

interface UseInvitePreviewResult {
  preview: InvitePreview | null;
  isLoading: boolean;
  notFound: boolean;
}

export const useInvitePreview = (inviteCode: string): UseInvitePreviewResult => {
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const code = inviteCode.trim();
    if (code.length < MIN_CODE_LENGTH) {
      setPreview(null);
      setNotFound(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      getInvitePreview(code)
        .then((data) => {
          setPreview(data);
          setNotFound(false);
        })
        .catch((err: { status?: number }) => {
          setPreview(null);
          setNotFound(err?.status === 404);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inviteCode]);

  return { preview, isLoading, notFound };
};
