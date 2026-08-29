-- ===== Asking for directions (A2) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-asking-directions', 'chapter', 'Asking for directions', 2, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'On Saturday morning Marta wants to visit the castle. She has a paper map, but the streets are narrow and she quickly gets lost.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She stops an older woman near a bakery. "Excuse me, how do I get to the castle?"'),
  jsonb_build_object('type', 'paragraph', 'text', '"It is not far," the woman says. "Go straight along this street to the end. Then turn left at the church."'),
  jsonb_build_object('type', 'paragraph', 'text', '"Left at the church," Marta repeats.'),
  jsonb_build_object('type', 'paragraph', 'text', '"Yes. After the church you will see some steps. Go up the steps and turn right. The castle is at the top of the hill."'),
  jsonb_build_object('type', 'paragraph', 'text', '"Is it far on foot?"'),
  jsonb_build_object('type', 'paragraph', 'text', '"About fifteen minutes, but the hill is steep. If you are tired, you can take tram 28. The stop is behind you, opposite the pharmacy."'),
  jsonb_build_object('type', 'paragraph', 'text', 'Marta thanks her and decides to walk. She goes straight, turns left at the church and finds the steps.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Twenty minutes later she is standing at the castle wall, looking down at the red roofs of the city.')
), now(), 161, 'parsed', 'A2'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'topic', 'transport-and-directions', jsonb_build_object('label', 'transport-and-directions'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'vocabulary', 'lost', jsonb_build_object('word', 'lost', 'definition', 'not knowing where you are or which way to go'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'vocabulary' and ki.dedup_key = 'lost'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The streets are narrow and confusing, so Marta quickly gets ___.', 'accepted_answers', jsonb_build_array('lost')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'vocabulary', 'straight', jsonb_build_object('word', 'straight', 'definition', 'continuing in one direction without turning'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'vocabulary' and ki.dedup_key = 'straight'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The woman tells her to go ___ along the street to the end.', 'accepted_answers', jsonb_build_array('straight')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'vocabulary', 'steps', jsonb_build_object('word', 'steps', 'definition', 'a set of flat surfaces you walk up or down'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'vocabulary' and ki.dedup_key = 'steps'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'After the church she must go up the stone ___ to reach the hill.', 'accepted_answers', jsonb_build_array('steps')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'vocabulary', 'steep', jsonb_build_object('word', 'steep', 'definition', 'rising or falling sharply, hard to walk up'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'vocabulary' and ki.dedup_key = 'steep'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The hill is very ___, so walking up takes effort.', 'accepted_answers', jsonb_build_array('steep')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'vocabulary', 'opposite', jsonb_build_object('word', 'opposite', 'definition', 'on the other side, directly facing something'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'vocabulary' and ki.dedup_key = 'opposite'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The tram stop is ___ the pharmacy, on the other side of the road.', 'accepted_answers', jsonb_build_array('opposite')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'grammar', 'Imperatives for directions', jsonb_build_object('point', 'Imperatives for directions', 'explanation', 'Directions use the bare verb with no subject: Go straight. Turn left at the church. Take tram 28.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'grammar' and ki.dedup_key = 'Imperatives for directions'), 'multiple_choice', jsonb_build_object('prompt', '___ left at the church.', 'options', jsonb_build_array('Turns', 'You turning', 'To turn', 'Turn'), 'correct_index', 3::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'grammar', 'First conditional: if + present, will/can', jsonb_build_object('point', 'First conditional: if + present, will/can', 'explanation', 'Use ''if'' plus the present simple for a real possibility: If you are tired, you can take the tram.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions') and ki.kind = 'grammar' and ki.dedup_key = 'First conditional: if + present, will/can'), 'multiple_choice', jsonb_build_object('prompt', 'If you ___ tired, you can take the tram.', 'options', jsonb_build_array('would be', 'are', 'will be', 'are being'), 'correct_index', 1::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'example', 'authored-asking-directions-ex0', jsonb_build_object('sentence', '"Excuse me, how do I get to the castle?"'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), 'example', 'authored-asking-directions-ex1', jsonb_build_object('sentence', 'Go straight along this street to the end.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), (select id from public.topics where slug = 'transport-and-directions'))
on conflict do nothing;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-asking-directions'), (select id from public.topics where slug = 'city-and-places'))
on conflict do nothing;
