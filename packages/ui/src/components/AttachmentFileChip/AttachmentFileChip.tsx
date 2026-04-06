import { type ReactNode } from 'react';
import { FileIcon } from 'lucide-react';

export interface AttachmentFileChipProps {
  fileName: string;
  fileSize: string;
  actions?: ReactNode;
}

export const AttachmentFileChip = ({ fileName, fileSize, actions }: AttachmentFileChipProps) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border-2 bg-surface-2 max-w-xs">
    <FileIcon size={18} className="shrink-0 text-text-3" />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-text-1 truncate">{fileName}</p>
      <p className="text-xs text-text-3">{fileSize}</p>
    </div>
    {actions && <div className="flex items-center gap-0.5 shrink-0">{actions}</div>}
  </div>
);
