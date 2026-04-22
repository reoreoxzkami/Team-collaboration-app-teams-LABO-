import { useEffect } from "react";

const BASE_TITLE = "teams LABO";
const TAGLINE = "チーム連携を高めるカラフルPWA";

/** Sets the document title based on the current view. */
export const usePageTitle = (section?: string) => {
  useEffect(() => {
    const title = section
      ? `${section} | ${BASE_TITLE} — ${TAGLINE}`
      : `${BASE_TITLE} — ${TAGLINE}`;
    document.title = title;
  }, [section]);
};
