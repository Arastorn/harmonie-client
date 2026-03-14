import { apiFetch } from './client';
import type { AvatarAppearance, PatchMyProfileInput, UserProfile } from '@/types/user';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getMe = (): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });

export const patchMe = (data: PatchMyProfileInput): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });

export const uploadAvatarImage = (file: File): Promise<{ avatarFileId: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`${API_BASE}/users/me/avatar`, {
    method: 'PUT',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });
};

export const removeAvatarImage = (): Promise<void> =>
  patchMe({ avatarFileId: null }).then(() => undefined);

export type { AvatarAppearance, PatchMyProfileInput, UserProfile };
