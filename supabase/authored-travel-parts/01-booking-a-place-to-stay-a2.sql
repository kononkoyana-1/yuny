-- ===== Booking a place to stay (A2) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-booking-a-room', 'chapter', 'Booking a place to stay', 0, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'Marta wants to visit Lisbon in April. She has five days and a small budget, so she looks for a cheap place to stay.'),
  jsonb_build_object('type', 'paragraph', 'text', 'First she opens a booking website. She types the city and the dates. The website shows hotels, hostels and apartments.'),
  jsonb_build_object('type', 'paragraph', 'text', 'A hotel near the centre costs 120 euros a night. That is too expensive for Marta.'),
  jsonb_build_object('type', 'paragraph', 'text', 'A hostel costs 25 euros a night, but she must share a room with five other people. Marta does not sleep well when a room is noisy.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Then she finds a small guesthouse. It costs 45 euros a night. The room is private and breakfast is included. The guesthouse is twenty minutes from the centre by bus.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Marta reads the reviews. Other guests write that the beds are comfortable and the owner is friendly. One guest writes that the walls are thin.'),
  jsonb_build_object('type', 'paragraph', 'text', 'She decides to book the guesthouse for four nights. She pays with her card and receives an email. The email is her confirmation.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Marta prints the confirmation. She wants to show it when she arrives.')
), now(), 177, 'parsed', 'A2'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'topic', 'travel-and-accommodation', jsonb_build_object('label', 'travel-and-accommodation'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'vocabulary', 'budget', jsonb_build_object('word', 'budget', 'definition', 'the amount of money you can spend on something'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'budget'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Marta cannot pay 120 euros a night because she has a small ___.', 'accepted_answers', jsonb_build_array('budget')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'vocabulary', 'guesthouse', jsonb_build_object('word', 'guesthouse', 'definition', 'a small house where travellers pay to sleep, smaller than a hotel'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'guesthouse'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'It is not a hotel and not a hostel, but a small ___.', 'accepted_answers', jsonb_build_array('guesthouse')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'vocabulary', 'review', jsonb_build_object('word', 'review', 'definition', 'what a customer writes about a place or product after using it'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'review'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Before booking, she reads every ___ written by other guests.', 'accepted_answers', jsonb_build_array('review')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'vocabulary', 'confirmation', jsonb_build_object('word', 'confirmation', 'definition', 'a message that proves your booking is complete'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'confirmation'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'After she pays, the website sends an email with her ___.', 'accepted_answers', jsonb_build_array('confirmation')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'vocabulary', 'included', jsonb_build_object('word', 'included', 'definition', 'already part of the price, with nothing more to pay'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'vocabulary' and ki.dedup_key = 'included'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Breakfast is ___ in the price, so she pays nothing extra for it.', 'accepted_answers', jsonb_build_array('included')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'grammar', 'Comparatives for prices: cheaper than, more expensive than', jsonb_build_object('point', 'Comparatives for prices: cheaper than, more expensive than', 'explanation', 'Use -er than for short adjectives and more ... than for longer ones: A hostel is cheaper than a hotel. A hotel is more expensive than a guesthouse.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'grammar' and ki.dedup_key = 'Comparatives for prices: cheaper than, more expensive than'), 'multiple_choice', jsonb_build_object('prompt', 'The hostel is ___ than the hotel.', 'options', jsonb_build_array('more cheap', 'cheap', 'cheaper', 'cheapest'), 'correct_index', 2::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'grammar', 'Must for necessity', jsonb_build_object('point', 'Must for necessity', 'explanation', 'Use ''must'' plus a bare verb for something necessary: She must share a room with five other people.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room') and ki.kind = 'grammar' and ki.dedup_key = 'Must for necessity'), 'multiple_choice', jsonb_build_object('prompt', 'In a hostel you ___ share a room.', 'options', jsonb_build_array('musts', 'are must', 'must to', 'must'), 'correct_index', 3::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'example', 'authored-booking-a-room-ex0', jsonb_build_object('sentence', 'A hotel near the centre costs 120 euros a night.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), 'example', 'authored-booking-a-room-ex1', jsonb_build_object('sentence', 'She decides to book the guesthouse for four nights.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-booking-a-room'), (select id from public.topics where slug = 'travel-and-accommodation'))
on conflict do nothing;
