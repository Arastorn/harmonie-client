import { useState } from 'react';
import { loadBlobUrl } from './useFileBlobUrl';

export const useFileDownload = () => {
  const [downloading, setDownloading] = useState(false);

  const download = async (fileId: string, fileName: string) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const url = await loadBlobUrl(fileId);
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  return { download, downloading };
};
