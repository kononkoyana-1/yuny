-- ===== What to wear today (A1) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-what-to-wear', 'chapter', 'What to wear today', 10, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'Sam looks out of the window. The sky is grey and it is raining.'),
  jsonb_build_object('type', 'paragraph', 'text', 'It is cold today. Sam does not wear shorts. He wears warm clothes.'),
  jsonb_build_object('type', 'paragraph', 'text', 'First he puts on socks and a shirt. Then he puts on trousers.'),
  jsonb_build_object('type', 'paragraph', 'text', 'He takes a thick jumper from the cupboard. The jumper is blue.'),
  jsonb_build_object('type', 'paragraph', 'text', 'He wears boots because the street is wet. His shoes are not good in the rain.'),
  jsonb_build_object('type', 'paragraph', 'text', 'At the door he takes his coat and a hat.'),
  jsonb_build_object('type', 'paragraph', 'text', '"Where are my gloves?" he asks. They are in the pocket of his coat.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Now Sam is warm and dry. He opens the door and goes to work.')
), now(), 106, 'parsed', 'A1'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'topic', 'clothing', jsonb_build_object('label', 'clothing'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'vocabulary', 'jumper', jsonb_build_object('word', 'jumper', 'definition', 'a warm piece of clothing for the top of your body, often made of wool'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'vocabulary' and ki.dedup_key = 'jumper'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The day is cold, so he takes a thick blue ___ out of the cupboard.', 'accepted_answers', jsonb_build_array('jumper')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'vocabulary', 'boots', jsonb_build_object('word', 'boots', 'definition', 'strong shoes that cover your foot and part of your leg'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'vocabulary' and ki.dedup_key = 'boots'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The street is wet, so he wears ___ and not ordinary shoes.', 'accepted_answers', jsonb_build_array('boots')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'vocabulary', 'coat', jsonb_build_object('word', 'coat', 'definition', 'a long piece of clothing you wear over your other clothes when you go outside'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'vocabulary' and ki.dedup_key = 'coat'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'At the door he takes his warm ___ and a hat.', 'accepted_answers', jsonb_build_array('coat')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'vocabulary', 'socks', jsonb_build_object('word', 'socks', 'definition', 'soft clothing for your feet, worn inside shoes'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'vocabulary' and ki.dedup_key = 'socks'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'He puts ___ on his feet before he puts on his shoes.', 'accepted_answers', jsonb_build_array('socks')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'vocabulary', 'pocket', jsonb_build_object('word', 'pocket', 'definition', 'a small bag sewn inside clothing, for keeping small things'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'vocabulary' and ki.dedup_key = 'pocket'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'His gloves are not lost. They are in the ___ of his coat.', 'accepted_answers', jsonb_build_array('pocket')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'grammar', 'Put on and wear', jsonb_build_object('point', 'Put on and wear', 'explanation', '''Put on'' is the action of dressing. ''Wear'' is having clothes on your body. He puts on a shirt. He wears a shirt all day.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'grammar' and ki.dedup_key = 'Put on and wear'), 'multiple_choice', jsonb_build_object('prompt', 'It is cold. Sam ___ a warm coat all day.', 'options', jsonb_build_array('puts', 'is wear', 'wears', 'wear'), 'correct_index', 2::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'grammar', 'Because for a reason', jsonb_build_object('point', 'Because for a reason', 'explanation', '''Because'' gives the reason for something: He wears boots because the street is wet.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear') and ki.kind = 'grammar' and ki.dedup_key = 'Because for a reason'), 'multiple_choice', jsonb_build_object('prompt', 'He wears boots ___ the street is wet.', 'options', jsonb_build_array('for', 'why', 'so that', 'because'), 'correct_index', 3::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'example', 'authored-what-to-wear-ex0', jsonb_build_object('sentence', 'It is cold today. Sam does not wear shorts.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), 'example', 'authored-what-to-wear-ex1', jsonb_build_object('sentence', 'He wears boots because the street is wet.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), (select id from public.topics where slug = 'clothing'))
on conflict do nothing;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-what-to-wear'), (select id from public.topics where slug = 'weather-and-seasons'))
on conflict do nothing;
