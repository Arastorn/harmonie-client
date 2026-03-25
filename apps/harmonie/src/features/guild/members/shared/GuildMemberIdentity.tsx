interface GuildMemberIdentityProps {
  label: string;
  subtitle?: string;
}

export const GuildMemberIdentity = ({ label, subtitle }: GuildMemberIdentityProps) => (
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-text-1 truncate">{label}</p>
    {subtitle && <p className="text-xs text-text-3 truncate">{subtitle}</p>}
  </div>
);
