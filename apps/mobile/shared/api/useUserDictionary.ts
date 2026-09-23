import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userDictionaryRepository, type SaveWordInput } from "@/shared/repositories";
import { queryKeys } from "./queryKeys";

/**
 * Свой словарь (TZ.md §11 экран 04): папки и слова. Экран и
 * `features/dictionary/**` ходят только через эти хуки, не в репозиторий.
 *
 * Каждая мутация перезапрашивает и папки, и слова: удаление папки уносит её
 * слова, а новое слово меняет счётчик папки — проще и надёжнее обновить оба
 * списка, чем править кэш руками.
 */

export function useFolders() {
  return useQuery({
    queryKey: queryKeys.userDictionaryFolders,
    queryFn: () => userDictionaryRepository.listFolders(),
  });
}

export function useSavedItems() {
  return useQuery({
    queryKey: queryKeys.userDictionaryItems,
    queryFn: () => userDictionaryRepository.listItems(),
  });
}

function useInvalidateUserDictionary() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.userDictionaryFolders }),
      client.invalidateQueries({ queryKey: queryKeys.userDictionaryItems }),
    ]);
}

export function useCreateFolder() {
  const invalidate = useInvalidateUserDictionary();
  return useMutation({
    mutationFn: (name: string) => userDictionaryRepository.createFolder(name),
    onSuccess: invalidate,
  });
}

export function useRenameFolder() {
  const invalidate = useInvalidateUserDictionary();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      userDictionaryRepository.renameFolder(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteFolder() {
  const invalidate = useInvalidateUserDictionary();
  return useMutation({
    mutationFn: (id: string) => userDictionaryRepository.deleteFolder(id),
    onSuccess: invalidate,
  });
}

export function useAddToFolder() {
  const invalidate = useInvalidateUserDictionary();
  return useMutation({
    mutationFn: ({ folderId, word }: { folderId: string; word: SaveWordInput }) =>
      userDictionaryRepository.addItem(folderId, word),
    onSettled: invalidate,
  });
}

export function useRemoveFromFolder() {
  const invalidate = useInvalidateUserDictionary();
  return useMutation({
    mutationFn: (itemId: string) => userDictionaryRepository.removeItem(itemId),
    onSettled: invalidate,
  });
}
