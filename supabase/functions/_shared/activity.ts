/**
 * Activity type registry (TZ.md §9). Shared vocabulary between mission
 * generation (which produces activities) and submission grading (which
 * consumes them), so neither module depends on the other.
 */
export type ActivityType =
  | "vocabulary_choice"
  | "vocabulary_recall"
  | "grammar_practice"
  | "reading_comprehension"
  | "listening_comprehension"
  | "speaking_response"
  | "speaking_roleplay"
  | "writing_response";

export const ACTIVITY_TYPES: ActivityType[] = [
  "vocabulary_choice",
  "vocabulary_recall",
  "grammar_practice",
  "reading_comprehension",
  "listening_comprehension",
  "speaking_response",
  "speaking_roleplay",
  "writing_response",
];
