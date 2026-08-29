-- ===== A neighbourhood changes (B2) =====
insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level)
values ((select id from public.content_sources where source_url = 'yuny://authored/en/v1'), 'authored-neighbourhood-changes', 'chapter', 'A neighbourhood changes', 13, jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'text', 'Twenty years ago the street had a hardware shop, two bakeries and a launderette. Today it has a wine bar, a shop selling handmade ceramics and an estate agent with photographs of flats priced beyond what most of the older residents earn.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Nobody planned this exactly. Rents rose slowly, then quickly. Businesses that had served the area for decades could not renew their leases, and the shops that replaced them were aimed at people who had only recently arrived.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Residents who have lived there all their lives describe the change with a mixture of pride and unease. The street is safer than it was and better lit. It is also, several of them say, no longer theirs.'),
  jsonb_build_object('type', 'paragraph', 'text', 'Councils have been experimenting with ways to slow the process, from capping commercial rents to reserving units for local traders. The results have been modest. Where the pressure of demand is strong enough, rules tend to bend around it.'),
  jsonb_build_object('type', 'paragraph', 'text', 'What makes the argument difficult is that both sides are describing something real. Investment has genuinely improved the street. It has also genuinely displaced the people who made it worth investing in.')
), now(), 188, 'parsed', 'B2'::public.cefr_level)
on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title;

insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'topic', 'city-and-places', jsonb_build_object('label', 'city-and-places'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'vocabulary', 'resident', jsonb_build_object('word', 'resident', 'definition', 'a person who lives in a particular place'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'vocabulary' and ki.dedup_key = 'resident'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'A long-term ___ of the street can remember when it had two bakeries.', 'accepted_answers', jsonb_build_array('resident')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'vocabulary', 'lease', jsonb_build_object('word', 'lease', 'definition', 'a legal agreement allowing you to use a building for a period of time'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'vocabulary' and ki.dedup_key = 'lease'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The old shop closed because the owner could not renew the ___.', 'accepted_answers', jsonb_build_array('lease')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'vocabulary', 'displace', jsonb_build_object('word', 'displace', 'definition', 'to force people out of the place they belong to'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'vocabulary' and ki.dedup_key = 'displace'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'Rising rents can ___ the very people who gave the area its character.', 'accepted_answers', jsonb_build_array('displace')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'vocabulary', 'modest', jsonb_build_object('word', 'modest', 'definition', 'small in size or amount, not impressive'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'vocabulary' and ki.dedup_key = 'modest'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'The council tried several measures, but the results were ___ at best.', 'accepted_answers', jsonb_build_array('modest')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'vocabulary', 'unease', jsonb_build_object('word', 'unease', 'definition', 'a feeling of worry that is hard to explain precisely'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'vocabulary' and ki.dedup_key = 'unease'), 'fill_blank', jsonb_build_object('sentence_with_blank', 'They describe the change with pride mixed with a quiet ___.', 'accepted_answers', jsonb_build_array('unease')), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'grammar', 'Present perfect continuous for an ongoing process', jsonb_build_object('point', 'Present perfect continuous for an ongoing process', 'explanation', 'Use have/has been + -ing for something that started earlier and is still going on: Councils have been experimenting with ways to slow the process.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'grammar' and ki.dedup_key = 'Present perfect continuous for an ongoing process'), 'multiple_choice', jsonb_build_object('prompt', 'Councils ___ with rent caps for several years now.', 'options', jsonb_build_array('experimented', 'have experimented since', 'are experimenting since', 'have been experimenting'), 'correct_index', 3::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'grammar', 'Non-defining relative clauses with commas', jsonb_build_object('point', 'Non-defining relative clauses with commas', 'explanation', 'A non-defining clause adds extra information and is separated by commas: The street, which was once full of small shops, now attracts tourists.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.generated_exercises (knowledge_item_id, type, payload, status)
values ((select ki.id from public.knowledge_items ki where ki.content_unit_id = (select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes') and ki.kind = 'grammar' and ki.dedup_key = 'Non-defining relative clauses with commas'), 'multiple_choice', jsonb_build_object('prompt', 'The street, ___ was once full of small shops, now attracts tourists.', 'options', jsonb_build_array('which', 'what', 'that', 'who'), 'correct_index', 0::int), 'draft')
on conflict (knowledge_item_id, type) do update set payload = excluded.payload;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'example', 'authored-neighbourhood-changes-ex0', jsonb_build_object('sentence', 'Rents rose slowly, then quickly.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), 'example', 'authored-neighbourhood-changes-ex1', jsonb_build_object('sentence', 'The street is safer than it was and better lit.'), 'ai_generated', 'draft')
on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), (select id from public.topics where slug = 'city-and-places'))
on conflict do nothing;
insert into public.content_unit_topics (content_unit_id, topic_id)
values ((select cu.id from public.content_units cu where cu.source_id = (select id from public.content_sources where source_url = 'yuny://authored/en/v1') and cu.external_id = 'authored-neighbourhood-changes'), (select id from public.topics where slug = 'history-and-society'))
on conflict do nothing;
