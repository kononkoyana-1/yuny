import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userRepository, type ProfileUpdateInput } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/** Wraps `UserRepository.updateProfile()` and invalidates the cached profile. */
export function useUpdateProfile() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (patch: ProfileUpdateInput) => userRepository.updateProfile(patch),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
