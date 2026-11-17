import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PAGE, findItem } from "./config/navigation";

/** Page id from a location hash ("#/health" → "health"); unknown or empty hashes give the default page. */
export const pageFromHash = (hash: string): string => {
  const id = hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  return id && findItem(id) ? id : DEFAULT_PAGE;
};

/**
 * The current page, kept in the URL hash so back/forward, reloads and bookmarks work without a
 * router library or server-side routes (the app also runs from a static folder, offline).
 */
export const useHashRoute = (): [string, (id: string) => void] => {
  const [page, setPage] = useState(() => pageFromHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setPage(pageFromHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((id: string) => {
    window.location.hash = `/${id}`;
  }, []);

  return [page, navigate];
};
