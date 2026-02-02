import { useState, useEffect, useCallback } from "react";

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRoute() {
  const [route, setRoute] = useState(() => getRoute());

  useEffect(() => {
    function onHashChange() {
      setRoute(getRoute());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

function getRoute() {
  const hash = window.location.hash.slice(1) || "/dashboard";
  const parts = hash.split("/").filter(Boolean);

  return {
    path: hash,
    parts,
    matches(pattern: string): Record<string, string> | null {
      const patternParts = pattern.split("/").filter(Boolean);
      if (patternParts.length !== parts.length) return null;

      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
          params[patternParts[i].slice(1)] = parts[i];
        } else if (patternParts[i] !== parts[i]) {
          return null;
        }
      }
      return params;
    },
  };
}

export function Link({
  href,
  children,
  className,
  activeClassName,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const route = useRoute();
  const isActive = route.path === href || route.path.startsWith(href + "/");

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(href);
    },
    [href]
  );

  const classes = [className || "", isActive ? activeClassName || "" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <a href={"#" + href} onClick={handleClick} className={classes}>
      {children}
    </a>
  );
}
