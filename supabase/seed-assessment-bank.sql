-- Assessment bank, batch 1 - written by hand to stand in for the AI step
-- the pipeline cannot run without a key. Generated 2026-08-28.
--
-- difficulty maps onto CEFR one-to-one: 1=A1 2=A2 3=B1 4=B2 5=C1, so this
-- lands before the stage-3 migration adds an explicit cefr_level column.
-- Options are shuffled with a fixed seed: re-running yields identical SQL,
-- and the correct answer is not positionally predictable.
--
-- Topically neutral by design - the pre-existing seeded bank is entirely
-- job-interview themed, which measures domain familiarity, not language.

delete from public.assessment_questions where language = 'en' and position >= 1000;

-- A1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'She is my mother''s daughter. She is my ___.', array['cousin', 'aunt', 'niece', 'sister'], 3, 1, 1000);
-- A1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'We keep milk and eggs in the ___.', array['fridge', 'shelf', 'oven', 'sink'], 0, 1, 1001);
-- A1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'It is raining. Take an ___.', array['envelope', 'orange', 'engine', 'umbrella'], 3, 1, 1002);
-- A1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'I go to work by ___ every morning.', array['shoe', 'bus', 'hour', 'street'], 1, 1, 1003);
-- A1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'What is the opposite of "hot"?', array['cold', 'loud', 'tall', 'heavy'], 0, 1, 1004);
-- A1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'On Monday, Tuesday and Wednesday I work. These are ___.', array['days', 'months', 'hours', 'years'], 0, 1, 1005);
-- A1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'Choose the correct sentence.', array['She are a teacher.', 'She be a teacher.', 'She am a teacher.', 'She is a teacher.'], 3, 1, 1006);
-- A1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', '___ you from Brazil?', array['Be', 'Is', 'Am', 'Are'], 3, 1, 1007);
-- A1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'I ___ a car, but my brother does.', array['does not have', 'am not have', 'not have', 'do not have'], 3, 1, 1008);
-- A1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'There ___ two books on the table.', array['are', 'was', 'be', 'is'], 0, 1, 1009);
-- A1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'This is ___ apple.', array['an', 'any', 'the some', 'a'], 0, 1, 1010);
-- A1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'He ___ tea every morning.', array['do drink', 'drink', 'are drinking', 'drinks'], 3, 1, 1011);
-- A2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The train was late, so I ___ my connection.', array['failed', 'dropped', 'lost', 'missed'], 3, 2, 1012);
-- A2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Could you ___ the light? It is dark in here.', array['turn up', 'turn on', 'turn over', 'turn into'], 1, 2, 1013);
-- A2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The museum is ___ on Mondays, so we cannot visit today.', array['empty', 'finished', 'quiet', 'closed'], 3, 2, 1014);
-- A2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'I need to ___ an appointment with the doctor.', array['do', 'take', 'make', 'give'], 2, 2, 1015);
-- A2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'She is very ___ — she always helps other people.', array['kind', 'busy', 'early', 'tall'], 0, 2, 1016);
-- A2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Which word means almost the same as "cheap"?', array['modern', 'valuable', 'rare', 'inexpensive'], 3, 2, 1017);
-- A2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'Yesterday I ___ to the cinema with my friends.', array['go', 'was going', 'went', 'have gone'], 2, 2, 1018);
-- A2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'This bag is ___ than that one.', array['heaviest', 'more heavy', 'heavier', 'as heavy'], 2, 2, 1019);
-- A2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'We ___ dinner when the phone rang.', array['are having', 'had have', 'were having', 'have'], 2, 2, 1020);
-- A2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'I am going to visit my aunt ___ Saturday.', array['to', 'at', 'on', 'in'], 2, 2, 1021);
-- A2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'There isn''t ___ milk left.', array['many', 'any', 'a', 'some'], 1, 2, 1022);
-- A2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'You ___ wear a helmet when you ride a bike.', array['should to', 'are should', 'should', 'shoulds'], 2, 2, 1023);
-- B1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The company decided to ___ the launch until next spring.', array['prevent', 'promote', 'postpone', 'prolong'], 2, 3, 1024);
-- B1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'I could not ___ the difference between the two recordings.', array['tell', 'say', 'speak', 'talk'], 0, 3, 1025);
-- B1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'She ___ up smoking three years ago.', array['gave', 'took', 'put', 'made'], 0, 3, 1026);
-- B1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The instructions were ___, so nobody knew what to do.', array['confused', 'confuse', 'confusing', 'confusion'], 2, 3, 1027);
-- B1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Traffic in the city centre has become a serious ___.', array['topic', 'issue', 'matter of fact', 'affair'], 1, 3, 1028);
-- B1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Which word best completes: "Despite the rain, the event was a huge ___."', array['achievement', 'victory', 'success', 'profit'], 2, 3, 1029);
-- B1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'I ___ here since 2019.', array['am working', 'worked', 'work', 'have worked'], 3, 3, 1030);
-- B1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'If it rains tomorrow, we ___ the picnic.', array['will cancel', 'cancelled', 'will be cancelled', 'would cancel'], 0, 3, 1031);
-- B1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'She asked me where I ___ from.', array['came', 'have come', 'am coming', 'come'], 0, 3, 1032);
-- B1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'The report ___ by the whole team last week.', array['has wrote', 'was written', 'is writing', 'wrote'], 1, 3, 1033);
-- B1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'That is the man ___ car was stolen.', array['who', 'which', 'whose', 'whom'], 2, 3, 1034);
-- B1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'I am used to ___ early on weekdays.', array['have got up', 'get up', 'getting up', 'got up'], 2, 3, 1035);
-- B2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The evidence was ___ enough to change the committee''s decision.', array['compelling', 'urging', 'insisting', 'obliging'], 0, 4, 1036);
-- B2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Her argument ___ on the assumption that prices will keep falling.', array['stands', 'rests', 'lies', 'sits'], 1, 4, 1037);
-- B2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The two studies reached ___ conclusions, which puzzled the researchers.', array['reverse', 'opposite-minded', 'conflicting', 'contrasted'], 2, 4, 1038);
-- B2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'He gave a ___ account of events, leaving out anything inconvenient.', array['choosy', 'selective', 'picky', 'elective'], 1, 4, 1039);
-- B2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Funding cuts have severely ___ the project''s scope.', array['abbreviated', 'curtailed', 'compressed', 'shortened'], 1, 4, 1040);
-- B2 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The policy was introduced ___ concerns about air quality.', array['in response to', 'as answer for', 'on account to', 'in reply of'], 0, 4, 1041);
-- B2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'If I ___ about the delay, I would have taken a different route.', array['have known', 'had known', 'knew', 'would know'], 1, 4, 1042);
-- B2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'Rarely ___ such a well-argued proposal.', array['we saw', 'we have seen', 'did we saw', 'have we seen'], 3, 4, 1043);
-- B2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'The building, ___ construction began in 1890, is now a museum.', array['whose', 'which', 'of which the', 'that'], 0, 4, 1044);
-- B2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'She insisted that he ___ present at the meeting.', array['was being', 'is', 'will be', 'be'], 3, 4, 1045);
-- B2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'By the time we arrived, the discussion ___.', array['was already ending', 'already ended', 'has already ended', 'had already ended'], 3, 4, 1046);
-- B2 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'I would rather you ___ mention this to anyone.', array['haven''t', 'don''t', 'didn''t', 'wouldn''t'], 2, 4, 1047);
-- C1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The minister''s remarks were widely seen as a ___ attempt to shift blame.', array['faintly masked', 'lightly hidden', 'thinly veiled', 'narrowly covered'], 2, 5, 1048);
-- C1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The results should be treated with caution, as the sample was hardly ___.', array['illustrative', 'representative', 'demonstrative', 'indicative'], 1, 5, 1049);
-- C1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'Critics accused the author of ___ complex history into a simple morality tale.', array['curtailing', 'condensing', 'abbreviating', 'distilling'], 3, 5, 1050);
-- C1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'The reforms were, by any ___, a remarkable achievement.', array['yardstick', 'measure', 'gauge', 'scale'], 1, 5, 1051);
-- C1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'His enthusiasm for the plan appeared to ___ once the costs became clear.', array['wane', 'lessen off', 'recede back', 'dwindle down'], 0, 5, 1052);
-- C1 vocabulary
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'vocabulary', 'She has a ___ for understating her own contribution.', array['fondness of', 'penchant', 'liking to', 'inclination of'], 1, 5, 1053);
-- C1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'Not until the final page ___ the narrator''s identity revealed.', array['is it', 'it is', 'does', 'is'], 3, 5, 1054);
-- C1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'Were the funding ___, the project would proceed immediately.', array['approved to be', 'approve', 'being approved', 'to be approved'], 3, 5, 1055);
-- C1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', '___ the weather, the ceremony will take place outdoors.', array['However', 'Whatever', 'Whichever of', 'Whenever'], 1, 5, 1056);
-- C1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'He is said ___ in Vienna for several years before the war.', array['having lived', 'to live', 'to have lived', 'that he lived'], 2, 5, 1057);
-- C1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'Little ___ that the decision would prove so controversial.', array['did they realise', 'they realised', 'they did realise', 'realised they'], 0, 5, 1058);
-- C1 grammar
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'grammar', 'The proposal is worth ___ seriously.', array['consider', 'to consider', 'considering', 'be considered'], 2, 5, 1059);
-- A1 reading
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'reading', 'Read: "The shop opens at 9:00 and closes at 5:00. It is closed on Sunday."

When can you visit the shop?', array['Monday at 7:00', 'Monday at 10:00', 'Sunday at 4:00', 'Sunday at 10:00'], 1, 1, 1060);
-- A2 reading
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'reading', 'Read: "Ana wanted to take the 8:15 bus, but she woke up late. She took the 8:45 bus instead and arrived at work ten minutes late."

Why was Ana late?', array['She woke up late and took a later bus.', 'She walked to work.', 'Her work started earlier than usual.', 'The 8:15 bus was cancelled.'], 0, 2, 1061);
-- B1 reading
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'reading', 'Read: "The city introduced a bike-sharing scheme hoping to cut traffic. Use was high in the first month but fell sharply once the free trial ended, suggesting price mattered more than convenience."

What does the passage suggest?', array['The scheme failed because bikes were hard to find.', 'Traffic increased after the scheme started.', 'Cost influenced usage more than convenience did.', 'People preferred cycling to driving regardless of price.'], 2, 3, 1062);
-- B2 reading
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'reading', 'Read: "While the study documents a clear correlation between screen time and reported sleep quality, the authors are careful not to claim causation: participants who slept poorly may simply have had more waking hours to fill."

What is the authors'' position?', array['Screen time is proven to cause poor sleep.', 'The link may run in the opposite direction to the obvious one.', 'The correlation found was too weak to report.', 'Sleep quality cannot be measured reliably.'], 1, 4, 1063);
-- C1 reading
insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position)
values ('en', 'reading', 'Read: "That the reforms were popular is not in dispute; what remains contested is whether their popularity owed more to their substance or to the adroitness with which they were presented."

What is being questioned?', array['The competence of those who opposed the reforms.', 'The reason for the reforms'' popularity, not the popularity itself.', 'Whether the reforms were popular at all.', 'Whether the reforms were properly implemented.'], 1, 5, 1064);