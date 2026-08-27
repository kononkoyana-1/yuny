export * from "./schemas";
export type * from "./types";

/**
 * Generated from the live schema (TZ.md §2 "Типы"):
 *   pnpm --filter @yuny/shared gen:types
 * Regenerate after every migration — it is the client's compile-time record
 * of what the tables actually look like.
 */
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database.types";
