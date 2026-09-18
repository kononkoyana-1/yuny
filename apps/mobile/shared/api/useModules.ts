import { useQuery } from "@tanstack/react-query";
import { moduleRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Modules for Главная (home.design.md §1). Wraps
 * `ModuleRepository.listModules()` — the screen and `features/home/**` never
 * import `moduleRepository` directly.
 */
export function useModules() {
  return useQuery({
    queryKey: queryKeys.modules,
    queryFn: () => moduleRepository.listModules(),
  });
}
