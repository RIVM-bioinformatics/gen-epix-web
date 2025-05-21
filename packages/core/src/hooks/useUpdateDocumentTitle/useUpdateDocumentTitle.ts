import { useEffect } from 'react';

import { ConfigManager } from '../../classes';


export const useUpdateDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = `${ConfigManager.instance.config.applicationName} - ${title}`;
  }, [title]);
};
