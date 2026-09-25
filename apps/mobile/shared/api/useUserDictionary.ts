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
      // Слова в папках сменились — стадии и «пора освежить» по папкам тоже (#70).
      client.invalidateQueries({ queryKey: queryKeys.overview }),
      client.invalidateQueries({ queryKey: queryKeys.today }),
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

/** Список слов в одну папку — сохранение слов из файла. Отдаёт, сколько добавилось. */
export function useSaveWords() {
  const invalidate = useInvalidateUserDictionary();
  return useMutation({
    mutationFn: ({ folderId, words }: { folderId: string; words: SaveWordInput[] }) =>
      userDictionaryRepository.addItems(folderId, words),
    onSettled: invalidate,
  });
}
