import { useEffect, useState } from 'react';
import { transport } from '../../services/transportService';
import { useGcodeStore } from '../../stores/gcodeStore';

export interface WizardLocalFile {
  name: string;
  size: number;
  modified: number;
}

export function useWizardLocalFiles(isWizardOpen: boolean, gcodeStoragePath: string) {
  const [localFiles, setLocalFiles] = useState<WizardLocalFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isWizardOpen || !gcodeStoragePath) return;

    setIsLoadingFiles(true);
    setFileError(null);
    transport
      .invoke<WizardLocalFile[]>('list_local_files', { path: gcodeStoragePath })
      .then((list) => setLocalFiles(list.sort((a, b) => b.modified - a.modified)))
      .catch(() => setFileError('Failed to load files from storage.'))
      .finally(() => setIsLoadingFiles(false));
  }, [isWizardOpen, gcodeStoragePath]);

  const handleSelectFile = async (filename: string) => {
    try {
      const fullPath = `${gcodeStoragePath}/${filename}`.replace(/\\/g, '/');
      const content = await transport.invoke<string>('read_local_file', {
        path: gcodeStoragePath,
        filename,
      });
      useGcodeStore.getState().setGcode(content, filename, fullPath);
    } catch (e) {
      console.error('Failed to read file', e);
    }
  };

  return {
    localFiles,
    isLoadingFiles,
    fileError,
    setFileError,
    handleSelectFile,
  };
}
