import * as React from "react";

// De vaste zijbalk past vanaf iPad mini-breedte; alles daaronder gebruikt de
// compacte telefoonweergave en het uitschuifmenu.
const MOBILE_BREAKPOINT = 744;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.matchMedia(query).matches;
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Gedempt: Safari meldt bij draaien of terugkomen uit de achtergrond soms
    // kort een andere breedte. Pas omschakelen als de breedte stabiel is.
    const onChange = () => {
      if (document.hidden) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.matchMedia(query).matches), 200);
    };
    mql.addEventListener("change", onChange);
    document.addEventListener("visibilitychange", onChange);
    return () => {
      if (timer) clearTimeout(timer);
      mql.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onChange);
    };
  }, [query]);

  return isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const onChange = () => {
      const width = window.innerWidth;
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };
    window.addEventListener("resize", onChange);
    onChange();
    return () => window.removeEventListener("resize", onChange);
  }, []);

  return isTablet;
}
