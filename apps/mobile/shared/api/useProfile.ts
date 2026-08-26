import { useQuery } from "@tanstack/react-query";
import { userRepository } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `UserRepository.getProfile()` — components never call the repository directly. */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => userRepository.getProfile(),
  });
}
