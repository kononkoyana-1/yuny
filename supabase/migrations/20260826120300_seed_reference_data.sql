-- Reference data: the English assessment bank and the public resource
-- catalogue (TZ.md §5). Both are curated, not user-owned.
--
-- The bank is text-only multiple choice (vocabulary / grammar / reading):
-- Speaking and Listening Activity renderers land in Phase 5, and the initial
-- assessment must not depend on them. For a target language with no bank
-- rows, `assessment-next` generates and persists questions on demand.

insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values
  ('en', 'vocabulary',
   'Choose the word that best completes the sentence: "I''m excited about this ___ because it matches my experience."',
   array['opportunity', 'weather', 'bicycle', 'spoon'], 0, 1, 0),
  ('en', 'vocabulary',
   'Which word means the same as "accomplished" in "I accomplished several projects last year"?',
   array['completed', 'forgot', 'avoided', 'postponed'], 0, 2, 1),
  ('en', 'grammar',
   'Which sentence is correct?',
   array[
     'I have worked here for three years.',
     'I have worked here since three years.',
     'I working here for three years.',
     'I work here since three years.'
   ], 0, 2, 2),
  ('en', 'reading',
   '"Tell me about a time you handled a difficult situation at work." What is the interviewer most likely asking for?',
   array[
     'A specific example with a concrete outcome',
     'Your opinion on office difficulty in general',
     'A list of every job you have had',
     'Whether you enjoy difficult work'
   ], 0, 2, 3),
  ('en', 'vocabulary',
   'A colleague says a deadline is "tight". What do they mean?',
   array['There is very little time', 'The deadline was cancelled', 'The work is easy', 'The deadline is flexible'],
   0, 2, 4),
  ('en', 'grammar',
   'Complete the sentence: "If I ___ more time, I would rewrite the report."',
   array['had', 'have', 'will have', 'am having'], 0, 3, 5),
  ('en', 'grammar',
   'Which question is correctly formed for an interview?',
   array[
     'Could you tell me more about the team I would join?',
     'Could you tell me more about the team I would to join?',
     'Could you telling me more about the team I would join?',
     'Could you tell me more about the team what I would join?'
   ], 0, 3, 6),
  ('en', 'reading',
   'An email ends with "Let me know if that works for you." What response does the sender expect?',
   array[
     'Confirmation or an alternative suggestion',
     'No response at all',
     'A payment',
     'A formal complaint'
   ], 0, 1, 7),
  ('en', 'vocabulary',
   'In a job description, "proficient in Excel" means you can:',
   array['use Excel skilfully', 'teach Excel professionally', 'install Excel', 'have never used Excel'],
   0, 2, 8),
  ('en', 'reading',
   'A recruiter writes: "We''ve moved you to the next stage." What happens next?',
   array[
     'You continue in the hiring process',
     'Your application was rejected',
     'You already have the job',
     'You must reapply from the start'
   ], 0, 1, 9),
  ('en', 'grammar',
   'Which sentence uses the past tense correctly when describing a project?',
   array[
     'Last year I led a team of four engineers.',
     'Last year I lead a team of four engineers.',
     'Last year I am leading a team of four engineers.',
     'Last year I have led a team of four engineers yesterday.'
   ], 0, 3, 10),
  ('en', 'vocabulary',
   'Which phrase best replaces "I did a lot of things" in a professional answer?',
   array[
     'I was responsible for several key tasks',
     'I did stuff',
     'Many things happened',
     'It was a lot'
   ], 0, 3, 11);

insert into public.public_resources (title, source_url, description, skills, language)
values
  ('BBC Learning English - Job interviews',
   'https://www.bbc.co.uk/learningenglish/english/features/english-at-work',
   'Short scripted workplace dialogues with transcripts, useful for interview phrasing and listening.',
   array['listening', 'vocabulary']::public.skill[], 'en'),
  ('Cambridge Dictionary - Business vocabulary',
   'https://dictionary.cambridge.org/topics/work-and-jobs/',
   'Definitions and example sentences for work and hiring vocabulary, grouped by topic.',
   array['vocabulary', 'reading']::public.skill[], 'en'),
  ('British Council - Speaking practice',
   'https://learnenglish.britishcouncil.org/skills/speaking',
   'Graded speaking tasks with model answers, from introductions to describing experience.',
   array['speaking']::public.skill[], 'en'),
  ('British Council - Grammar reference',
   'https://learnenglish.britishcouncil.org/grammar',
   'Explanations and practice for tenses, conditionals, and question forms.',
   array['grammar', 'writing']::public.skill[], 'en'),
  ('VOA Learning English - News in slower English',
   'https://learningenglish.voanews.com/',
   'News stories read slowly with full transcripts, for listening and reading together.',
   array['listening', 'reading']::public.skill[], 'en');
