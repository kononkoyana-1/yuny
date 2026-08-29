-- ===== Buying a train ticket (B1) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-buying-a-ticket', 'chapter', 'Buying a train ticket', 4, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'Marta had planned to spend her last full day in Sintra, a town about forty minutes from Lisbon by train. She reached the station early, expecting a queue, and found one.'),
  jsonb_build_object('type', 'paragraph', 'text', 'The machines took cards but only sold single tickets, and the screen was in Portuguese. Rather than guess, she joined the shorter queue at the ticket office.'),
  jsonb_build_object('type', 'paragraph', 'text', '"A return to Sintra, please. Is there a cheaper option if I come back this evening?"'),
  jsonb_build_object('type', 'paragraph', 'text', '"A day return is cheaper than two singles," the clerk said. "It is valid until midnight, but only on regional trains. If you take an express, you will have to pay a supplement."'),
  jsonb_build_object('type', 'paragraph', 'text', 'Marta bought the day return. The clerk pointed at the departure board and told her that trains left every twenty minutes from platform four.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She had almost boarded the wrong train when a guard stopped her: that one went to Cascais. The two lines leave from the same platform, and the difference is easy to miss unless you check the board carefully.'),
  jsonb_build_object('type', 'paragraph', 'text', 'By the time she found the right train, she had learned something useful. Asking a person had cost her five minutes in a queue and saved her a wasted afternoon.')
), now(), 199, 'parsed', 'B1'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'topic', 'transport-and-directions', jsonb_build_object('label', 'transport-and-directions'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'vocabulary', 'queue', jsonb_build_object('word', 'queue', 'definition', 'a line of people waiting for their turn'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'vocabulary' and ki.dedup_key = 'queue'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'She expected to wait and found a long ___ at the machines.', 'accepted_answers', jsonb_build_array('queue')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'vocabulary', 'return', jsonb_build_object('word', 'return', 'definition', 'a ticket that takes you somewhere and back again'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'vocabulary' and ki.dedup_key = 'return'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Instead of two singles she buys a day ___, which is cheaper.', 'accepted_answers', jsonb_build_array('return')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'vocabulary', 'valid', jsonb_build_object('word', 'valid', 'definition', 'able to be legally or officially used'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'vocabulary' and ki.dedup_key = 'valid'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The ticket is ___ until midnight, so she can travel back late.', 'accepted_answers', jsonb_build_array('valid')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'vocabulary', 'supplement', jsonb_build_object('word', 'supplement', 'definition', 'an extra amount of money added to the basic price'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'vocabulary' and ki.dedup_key = 'supplement'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'On a faster express train she would have to pay a ___.', 'accepted_answers', jsonb_build_array('supplement')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'vocabulary', 'platform', jsonb_build_object('word', 'platform', 'definition', 'the raised area beside a railway track where you get on a train'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'vocabulary' and ki.dedup_key = 'platform'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Trains to Sintra leave every twenty minutes from ___ four.', 'accepted_answers', jsonb_build_array('platform')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'grammar', 'Past perfect for the earlier of two past events', jsonb_build_object('point', 'Past perfect for the earlier of two past events', 'explanation', 'Use had plus a past participle for what happened first: She had almost boarded the wrong train when a guard stopped her.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'grammar' and ki.dedup_key = 'Past perfect for the earlier of two past events'), 'multiple_choice', jsonb_build_object('prompt', 'She ___ the wrong train when a guard stopped her.', 'options', jsonb_build_array('was almost board', 'almost boards', 'had almost boarded', 'has almost boarded'), 'correct_index', 2::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'grammar', 'Unless for negative condition', jsonb_build_object('point', 'Unless for negative condition', 'explanation', '''Unless'' means ''if not'': The difference is easy to miss unless you check the board.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'grammar' and ki.dedup_key = 'Unless for negative condition'), 'multiple_choice', jsonb_build_object('prompt', 'You will miss it ___ you check the board.', 'options', jsonb_build_array('in case of', 'if', 'without you', 'unless'), 'correct_index', 3::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'grammar', 'Rather than + bare infinitive', jsonb_build_object('point', 'Rather than + bare infinitive', 'explanation', 'Use ''rather than'' to reject one option in favour of another: Rather than guess, she joined the queue.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket') and ki.kind = 'grammar' and ki.dedup_key = 'Rather than + bare infinitive'), 'multiple_choice', jsonb_build_object('prompt', '___ guess, she asked at the ticket office.', 'options', jsonb_build_array('Better than to', 'Instead', 'Rather than', 'Rather to'), 'correct_index', 2::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'example', 'authored-buying-a-ticket-ex0', jsonb_build_object('sentence', 'A day return is cheaper than two singles.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), 'example', 'authored-buying-a-ticket-ex1', jsonb_build_object('sentence', 'Trains left every twenty minutes from platform four.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), (select id from public.topics where slug = 'transport-and-directions'))
on conflict do nothing;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-buying-a-ticket'), (select id from public.topics where slug = 'travel-and-accommodation'))
on conflict do nothing;
