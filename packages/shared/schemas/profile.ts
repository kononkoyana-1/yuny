import { z } from "zod";

/**
 * `profiles` table (TZ.md §5). Client has SELECT + UPDATE of its own row.
 */
export const ProfileSchema = z.object({
  id: z.uuid(),
  native_language: z.string().min(2),
  ui_language: z.string().min(2),
  display_name: z.string().min(1),
  created_at: z.iso.datetime({ offset: true }),
});

export type Profile = z.infer<typeof ProfileSchema>;
