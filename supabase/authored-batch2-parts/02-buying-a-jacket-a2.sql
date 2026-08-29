-- ===== Buying a jacket (A2) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-buying-a-jacket', 'chapter', 'Buying a jacket', 11, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'Lena needed a new jacket for the winter, so on Saturday she went to a shop in the town centre.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She found a dark green jacket that she liked. She looked at the label: size medium, forty euros.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She took it to the changing room and tried it on. The sleeves were too long and the shoulders were too tight.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She asked the assistant for a large. The large one was more comfortable, but it was a lighter green and she preferred the dark colour.'),
  jsonb_build_object('type', 'paragraph', 'text', '"Do you have this one in dark green?" she asked.'),
  jsonb_build_object('type', 'paragraph', 'text', 'The assistant checked and found one at the back of the shop.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Lena tried it on again. This time the fit was good and the sleeves were the right length.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She paid at the till and the assistant gave her a receipt. "Keep this," he said. "If it does not fit at home, you can bring it back within thirty days."')
), now(), 156, 'parsed', 'A2'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'topic', 'clothing', jsonb_build_object('label', 'clothing'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'vocabulary', 'sleeve', jsonb_build_object('word', 'sleeve', 'definition', 'the part of a piece of clothing that covers your arm'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'vocabulary' and ki.dedup_key = 'sleeve'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The jacket was too big and each ___ hung over her hands.', 'accepted_answers', jsonb_build_array('sleeve')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'vocabulary', 'receipt', jsonb_build_object('word', 'receipt', 'definition', 'a piece of paper showing what you paid for something'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'vocabulary' and ki.dedup_key = 'receipt'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Keep the ___ so you can return the jacket if it does not fit.', 'accepted_answers', jsonb_build_array('receipt')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'vocabulary', 'label', jsonb_build_object('word', 'label', 'definition', 'a small piece of material on clothing showing the size or price'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'vocabulary' and ki.dedup_key = 'label'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'She read the ___ and saw that the size was medium.', 'accepted_answers', jsonb_build_array('label')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'vocabulary', 'tight', jsonb_build_object('word', 'tight', 'definition', 'fitting too closely, with not enough room'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'vocabulary' and ki.dedup_key = 'tight'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The shoulders were so ___ that she could not move her arms.', 'accepted_answers', jsonb_build_array('tight')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'vocabulary', 'assistant', jsonb_build_object('word', 'assistant', 'definition', 'a person who works in a shop and helps customers'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'vocabulary' and ki.dedup_key = 'assistant'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'She asked the shop ___ whether they had a larger size.', 'accepted_answers', jsonb_build_array('assistant')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'grammar', 'Too and enough', jsonb_build_object('point', 'Too and enough', 'explanation', '''Too'' means more than you want: the sleeves were too long. ''Enough'' means the right amount: the jacket was not big enough.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'grammar' and ki.dedup_key = 'Too and enough'), 'multiple_choice', jsonb_build_object('prompt', 'The sleeves were ___ long, so she asked for another size.', 'options', jsonb_build_array('too', 'too much', 'very much', 'enough'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'grammar', 'Try on as a separable phrasal verb', jsonb_build_object('point', 'Try on as a separable phrasal verb', 'explanation', 'You can say ''try on the jacket'' or ''try the jacket on''. With a pronoun the object goes in the middle: try it on.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket') and ki.kind = 'grammar' and ki.dedup_key = 'Try on as a separable phrasal verb'), 'multiple_choice', jsonb_build_object('prompt', 'She liked the jacket, so she went to the changing room to ___.', 'options', jsonb_build_array('try it on', 'try on it', 'on try it', 'it try on'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'example', 'authored-buying-a-jacket-ex0', jsonb_build_object('sentence', 'The sleeves were too long and the shoulders were too tight.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), 'example', 'authored-buying-a-jacket-ex1', jsonb_build_object('sentence', 'She paid at the till and the assistant gave her a receipt.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), (select id from public.topics where slug = 'clothing'))
on conflict do nothing;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-jacket'), (select id from public.topics where slug = 'shopping-and-money'))
on conflict do nothing;
