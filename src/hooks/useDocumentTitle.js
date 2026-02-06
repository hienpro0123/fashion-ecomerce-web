import { useLayoutEffect } from 'react';

const useDocumentTitle = (title) => {
  useLayoutEffect(() => {
    if (title) {
      document.title = title;
    } else {
      document.title = 'LORDMEN - Men’s Daily Style';
    }
  }, [title]);
};

export default useDocumentTitle;
