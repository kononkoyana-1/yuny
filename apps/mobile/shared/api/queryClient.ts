import { QueryClient } from "@tanstack/react-query";

/**
 * Single `QueryClient` instance, provided once in `app/_layout.tsx`. Every
 * repository call goes through a hook built on this client (TZ.md §17 —
 * "Никаких useEffect + fetch").
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});
