import {
  FolderNameSchema,
  UserDictionaryFolderSchema,
  UserDictionaryItemSchema,
} from "@yuny/shared";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { BackendError } from "@/shared/lib/backendError";
import { requireUserId } from "@/shared/lib/auth";
import { getSupabase } from "@/shared/lib/supabase";
import type { UserDictionaryRepository } from "../userDictionary.repository";

const FOLDER_COLUMNS = "id,name,created_at";
const ITEM_COLUMNS =
  "id,folder_id,headword,reading,created_at,entry:dictionary_entries(id,headword,reading,senses,compact)";

/** Postgres `unique_violation`. */
const UNIQUE_VIOLATION = "23505";

/**
 * У PostgREST ошибка сети приходит без кода Postgres, а ответ базы — с ним.
 * Этого хватает, чтобы экран сказал «проверьте интернет» только когда дело в
 * интернете.
 */
function failure(error: PostgrestError): BackendError {
  return new BackendError(error.code ? "internal_error" : "network_error");
}

export const supabaseUserDictionaryRepository: UserDictionaryRepository = {
  async listFolders() {
    const { data, error } = await getSupabase()
      .from("user_dictionary_folders")
      .select(FOLDER_COLUMNS)
      .order("name", { ascending: true });
    if (error) throw failure(error);
    return z.array(UserDictionaryFolderSchema).parse(data);
  },

  async createFolder(name) {
    await requireUserId();
    const { data, error } = await getSupabase()
      .from("user_dictionary_folders")
      .insert({ name: FolderNameSchema.parse(name) })
      .select(FOLDER_COLUMNS)
      .single();
    if (error?.code === UNIQUE_VIOLATION) throw new BackendError("folder_name_taken");
    if (error) throw failure(error);
    return UserDictionaryFolderSchema.parse(data);
  },

  async renameFolder(id, name) {
    const { data, error } = await getSupabase()
      .from("user_dictionary_folders")
      .update({ name: FolderNameSchema.parse(name) })
      .eq("id", id)
      .select(FOLDER_COLUMNS)
      .single();
    if (error?.code === UNIQUE_VIOLATION) throw new BackendError("folder_name_taken");
    if (error) throw failure(error);
    return UserDictionaryFolderSchema.parse(data);
  },

  async deleteFolder(id) {
    const { error } = await getSupabase().from("user_dictionary_folders").delete().eq("id", id);
    if (error) throw failure(error);
  },

  async listItems() {
    const { data, error } = await getSupabase()
      .from("user_dictionary_items")
      .select(ITEM_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw failure(error);
    return z.array(UserDictionaryItemSchema).parse(data);
  },

  async addItem(folderId, word) {
    await requireUserId();
    const { error } = await getSupabase().from("user_dictionary_items").insert({
      folder_id: folderId,
      headword: word.headword,
      reading: word.reading,
      dictionary_entry_id: word.entryId,
    });
    // Слово уже в этой папке — результат тот, которого и хотели.
    if (error && error.code !== UNIQUE_VIOLATION) throw failure(error);
  },

  async removeItem(itemId) {
    const { error } = await getSupabase().from("user_dictionary_items").delete().eq("id", itemId);
    if (error) throw failure(error);
  },
};
