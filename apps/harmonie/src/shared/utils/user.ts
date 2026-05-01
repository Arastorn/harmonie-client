export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isValidPassword = (value: string) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);

const hashUserId = (userId: string): number => {
  return userId.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 0);
};

export const getUserGradient = (userId: string, isDarkTheme: boolean): string => {
  const hue = hashUserId(userId);
  const secondaryHue = (hue + 80) % 360;
  const start = isDarkTheme ? `hsl(${hue} 28% 30%)` : `hsl(${hue} 50% 96%)`;
  const end = isDarkTheme ? `hsl(${secondaryHue} 24% 25%)` : `hsl(${secondaryHue} 44% 92%)`;
  return `linear-gradient(145deg, ${start} 0%, ${end} 100%)`;
};
