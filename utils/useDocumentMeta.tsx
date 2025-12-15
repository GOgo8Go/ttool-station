import { useEffect } from 'react';

export const useDocumentMeta = (title: string, description?: string) => {
  useEffect(() => {
    // 更新标题
    document.title = title;
    
    // 更新描述 Meta
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        (meta as HTMLMetaElement).name = 'description';
        document.head.appendChild(meta);
      }
      (meta as HTMLMetaElement).content = description;
    }

    // 清理函数（可选）
    return () => {
      document.title = 'Tool Station';
    };
  }, [title, description]);
};