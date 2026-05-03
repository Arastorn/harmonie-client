export interface AvatarAppearance {
  color?: string;
  icon?: string;
  bg?: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName?: string | null;
  bio?: string;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance;
  theme: string;
  language: string | null;
}

export interface PatchMyProfileInput {
  displayName?: string | null;
  bio?: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance | null;
  theme?: string | null;
  language?: string | null;
}
