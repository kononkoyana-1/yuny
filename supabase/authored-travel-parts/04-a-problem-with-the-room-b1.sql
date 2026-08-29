-- ===== A problem with the room (B1) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-problem-with-room', 'chapter', 'A problem with the room', 3, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'On the second night Marta hardly slept. The guests in the next room came back after midnight and talked loudly until three in the morning. The guest who had warned about thin walls in the review had not been exaggerating.'),
  jsonb_build_object('type', 'paragraph', 'text', 'At breakfast she thought about what to do. She could say nothing and hope the next night would be quieter, or she could complain. She had never enjoyed complaining, but four nights of no sleep would ruin the trip.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She went to the desk and explained the problem calmly. "I understand it is not your fault," she said, "but I have not slept properly since I arrived. Is there another room available?"'),
  jsonb_build_object('type', 'paragraph', 'text', 'The receptionist checked the computer and apologised. The guesthouse was full that night, but a room at the back would be free from the following afternoon. It was slightly smaller and had no view, though it was much quieter.'),
  jsonb_build_object('type', 'paragraph', 'text', '"I would rather have a quiet room than a view," Marta said.'),
  jsonb_build_object('type', 'paragraph', 'text', 'He moved her booking and offered her a free breakfast for the trouble. If she had said nothing, she would have spent three more bad nights.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Later she added her own review. She wrote that the walls were thin, but that the staff had solved the problem quickly and politely. Both parts of that, she thought, were worth knowing.')
), now(), 222, 'parsed', 'B1'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'topic', 'travel-and-accommodation', jsonb_build_object('label', 'travel-and-accommodation'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'vocabulary', 'complain', jsonb_build_object('word', 'complain', 'definition', 'to tell someone officially that you are not satisfied'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'complain'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'She dislikes making a fuss, but decides to ___ about the noise.', 'accepted_answers', jsonb_build_array('complain')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'vocabulary', 'available', jsonb_build_object('word', 'available', 'definition', 'free to be used or taken'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'available'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'She asks the receptionist whether another room is ___ tonight.', 'accepted_answers', jsonb_build_array('available')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'vocabulary', 'apologise', jsonb_build_object('word', 'apologise', 'definition', 'to say you are sorry for something'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'apologise'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The receptionist checks the computer and begins to ___ for the noise.', 'accepted_answers', jsonb_build_array('apologise')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'vocabulary', 'exaggerate', jsonb_build_object('word', 'exaggerate', 'definition', 'to describe something as larger or worse than it really is'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'exaggerate'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The earlier guest had not been wrong and did not ___ about the thin walls.', 'accepted_answers', jsonb_build_array('exaggerate')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'vocabulary', 'staff', jsonb_build_object('word', 'staff', 'definition', 'the people who work at a place'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'staff'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'In her review she praises the ___ for solving the problem quickly.', 'accepted_answers', jsonb_build_array('staff')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'grammar', 'Present perfect with since and for', jsonb_build_object('point', 'Present perfect with since and for', 'explanation', 'Use the present perfect for something that started in the past and continues now: I have not slept properly since I arrived.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'grammar' and ki.dedup_key = 'Present perfect with since and for'), 'multiple_choice', jsonb_build_object('prompt', 'I ___ properly since I arrived.', 'options', jsonb_build_array('haven''t slept', 'didn''t sleep', 'don''t sleep', 'am not sleeping'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'grammar', 'Third conditional for unreal past', jsonb_build_object('point', 'Third conditional for unreal past', 'explanation', 'Use ''if'' plus past perfect with ''would have'' for something that did not happen: If she had said nothing, she would have spent three more bad nights.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'grammar' and ki.dedup_key = 'Third conditional for unreal past'), 'multiple_choice', jsonb_build_object('prompt', 'If she ___ nothing, she would have slept badly again.', 'options', jsonb_build_array('would say', 'has said', 'said', 'had said'), 'correct_index', 3::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'grammar', 'Would rather + bare infinitive', jsonb_build_object('point', 'Would rather + bare infinitive', 'explanation', 'Use ''would rather'' plus a bare verb to state a preference: I would rather have a quiet room than a view.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room') and ki.kind = 'grammar' and ki.dedup_key = 'Would rather + bare infinitive'), 'multiple_choice', jsonb_build_object('prompt', 'I would rather ___ a quiet room than a view.', 'options', jsonb_build_array('have', 'having', 'to have', 'had to have'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'example', 'authored-problem-with-room-ex0', jsonb_build_object('sentence', 'I have not slept properly since I arrived.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), 'example', 'authored-problem-with-room-ex1', jsonb_build_object('sentence', 'I would rather have a quiet room than a view.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), (select id from public.topics where slug = 'travel-and-accommodation'))
on conflict do nothing;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-problem-with-room'), (select id from public.topics where slug = 'feelings-and-opinions'))
on conflict do nothing;
