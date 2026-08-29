-- ===== Checking in at the hotel (A2) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-checking-in', 'chapter', 'Checking in at the hotel', 1, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'Marta arrives in Lisbon on Friday afternoon. She takes a bus from the airport and walks to the guesthouse.'),
  jsonb_build_object('type', 'paragraph', 'text', 'A man is standing behind the desk. "Good afternoon. Do you have a reservation?" he asks.'),
  jsonb_build_object('type', 'paragraph', 'text', '"Yes," says Marta. "My name is Marta Silva. I booked a single room for four nights."'),
  jsonb_build_object('type', 'paragraph', 'text', 'The man looks at his computer. "I have it here. Can I see your passport, please?"'),
  jsonb_build_object('type', 'paragraph', 'text', 'Marta gives him her passport. He writes down the number and gives it back.'),
  jsonb_build_object('type', 'paragraph', 'text', '"Your room is number 12, on the second floor. Here is the key. Breakfast is from seven until ten in the small room next to the entrance."'),
  jsonb_build_object('type', 'paragraph', 'text', '"Thank you. What time do I have to leave on Tuesday?" Marta asks.'),
  jsonb_build_object('type', 'paragraph', 'text', '"Check-out is at eleven o''clock. If you need a later time, please tell us the day before."'),
  jsonb_build_object('type', 'paragraph', 'text', 'Marta takes her key and goes upstairs. The room is small but clean, and the window looks out over a narrow street.')
), now(), 160, 'parsed', 'A2'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'topic', 'travel-and-accommodation', jsonb_build_object('label', 'travel-and-accommodation'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'vocabulary', 'reservation', jsonb_build_object('word', 'reservation', 'definition', 'an arrangement made in advance to keep a room or table for you'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'vocabulary' and ki.dedup_key = 'reservation'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The receptionist asks whether she has a ___ before looking at his computer.', 'accepted_answers', jsonb_build_array('reservation')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'vocabulary', 'passport', jsonb_build_object('word', 'passport', 'definition', 'an official document that lets you travel between countries'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'vocabulary' and ki.dedup_key = 'passport'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'At the desk they ask to see her ___ to check who she is.', 'accepted_answers', jsonb_build_array('passport')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'vocabulary', 'floor', jsonb_build_object('word', 'floor', 'definition', 'one level of a building'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'vocabulary' and ki.dedup_key = 'floor'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Her room is number 12, on the second ___.', 'accepted_answers', jsonb_build_array('floor')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'vocabulary', 'check-out', jsonb_build_object('word', 'check-out', 'definition', 'the time by which you must leave your room'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'vocabulary' and ki.dedup_key = 'check-out'), 'fill_blank', jsonb_build_object('sentence_with_blank', '___ is at eleven o''clock, so she must leave before then.', 'accepted_answers', jsonb_build_array('check-out')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'vocabulary', 'entrance', jsonb_build_object('word', 'entrance', 'definition', 'the door or gate you use to enter a building'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'vocabulary' and ki.dedup_key = 'entrance'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Breakfast is served in a small room next to the ___.', 'accepted_answers', jsonb_build_array('entrance')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'grammar', 'Polite requests with Can I ... please?', jsonb_build_object('point', 'Polite requests with Can I ... please?', 'explanation', 'Use ''Can I'' plus a bare verb for a polite request: Can I see your passport, please?'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'grammar' and ki.dedup_key = 'Polite requests with Can I ... please?'), 'multiple_choice', jsonb_build_object('prompt', '___ see your passport, please?', 'options', jsonb_build_array('Can I', 'Do I can', 'I can', 'Can I to'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'grammar', 'Prepositions of time: from ... until, at', jsonb_build_object('point', 'Prepositions of time: from ... until, at', 'explanation', 'A stretch of time takes ''from'' and ''until''. A single point in time takes ''at''. Breakfast is served from seven until ten, and check-out is at eleven.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in') and ki.kind = 'grammar' and ki.dedup_key = 'Prepositions of time: from ... until, at'), 'multiple_choice', jsonb_build_object('prompt', 'Breakfast is ___ seven until ten.', 'options', jsonb_build_array('from', 'since', 'on', 'during'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'example', 'authored-checking-in-ex0', jsonb_build_object('sentence', '"Do you have a reservation?" he asks.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), 'example', 'authored-checking-in-ex1', jsonb_build_object('sentence', 'Check-out is at eleven o''clock.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-checking-in'), (select id from public.topics where slug = 'travel-and-accommodation'))
on conflict do nothing;
