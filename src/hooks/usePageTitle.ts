import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Halevai.ai`;
    return () => { document.title = "Halevai.ai"; };
  }, [title]);
}
