-- Situational topics: the taxonomy a roadmap module is actually named after.
--
-- Decision of 2026-09-08. `seed-topics.sql` describes subject areas — "Food
-- and cooking", "Travel and accommodation", "Shopping and money" — and those
-- are the right shape for tagging a library, but the wrong shape for a module.
-- A learner does not set out to study Food; they set out to order in a
-- restaurant, check into a hotel, rent a flat, buy groceries. A module titled
-- "Shopping and money" cannot say what the learner will be able to do at the
-- end of it, and a route made of such modules reads as a syllabus rather than
-- a path to the goal.
--
-- The chapters were already written this way — "Booking a place to stay",
-- "Wu buys food", "Ann visits the market" are situations. Only the taxonomy
-- above them was not. This file closes that gap.
--
-- What this does NOT do: invent coverage. `readCoverage` admits a topic only
-- where validated `knowledge_items` exist at the learner's band, so a topic
-- added here with no content behind it will never become a module. That is
-- deliberate — the gaps below are the list of what to author next, not a bug.
--
-- Idempotent: re-running updates labels and re-tags rather than duplicating.

insert into public.topics (slug, label, category) values
  -- Named in the product decision; `at-a-restaurant` has no content yet.
  ('at-a-restaurant',            'At a restaurant',            'everyday'),
  ('buying-groceries',           'Buying groceries',           'everyday'),
  ('at-the-market',              'At the market',              'everyday'),
  ('renting-a-home',             'Renting a home',             'everyday'),
  ('at-a-hotel',                 'At a hotel',                 'place-and-travel'),
  -- The situations the authored travel and clothing sets already teach.
  ('shopping-for-clothes',       'Shopping for clothes',       'everyday'),
  ('asking-for-directions',      'Asking for directions',      'place-and-travel'),
  ('travel-tickets-and-delays',  'Tickets and delays',         'place-and-travel')
on conflict (slug) do update set label = excluded.label, category = excluded.category;

-- ------------------------------------------------- authored set (yuny://)

with pairs(ext, topic) as (values
  ('authored-booking-a-room',    'at-a-hotel'),
  ('authored-checking-in',       'at-a-hotel'),
  ('authored-problem-with-room', 'at-a-hotel'),
  ('authored-asking-directions', 'asking-for-directions'),
  ('authored-buying-a-ticket',   'travel-tickets-and-delays'),
  ('authored-flight-cancelled',  'travel-tickets-and-delays'),
  ('authored-buying-a-jacket',   'shopping-for-clothes'),
  ('authored-what-to-wear',      'shopping-for-clothes')
)
insert into public.content_unit_topics (content_unit_id, topic_id)
select cu.id, t.id
from pairs p
join public.content_sources cs on cs.source_url = 'yuny://authored/en/v1'
join public.content_units   cu on cu.source_id = cs.id and cu.external_id = p.ext
join public.topics          t  on t.slug = p.topic
on conflict (content_unit_id, topic_id) do nothing;

-- ------------------------------------------------- Open Oregon chapters
--
-- Three chapters whose `part_title` already names the situation: "Wu buys
-- food", "Ann visits the market", "Sunee and Chet live in an apartment".

with pairs(book, ext, topic) as (values
  ('homeandschool','chapter-22', 'buying-groceries'),
  ('homeandschool','chapter-30', 'at-the-market'),
  ('homeandschool','chapter-26', 'renting-a-home')
)
insert into public.content_unit_topics (content_unit_id, topic_id)
select cu.id, t.id
from pairs p
join public.content_sources cs on cs.source_url = 'https://openoregon.pressbooks.pub/' || p.book || '/'
join public.content_units   cu on cu.source_id = cs.id and cu.external_id = p.ext
join public.topics          t  on t.slug = p.topic
on conflict (content_unit_id, topic_id) do nothing;

-- ------------------------------------------------- retiring the broad tag
--
-- A chapter left tagged with both "Food and cooking" and "Buying groceries"
-- feeds two topics that would compete for the same slot on the same route —
-- and since `rankTopics` sees both as covered, a learner could be handed two
-- modules built from one chapter. So where a situation now covers a chapter,
-- the subject-area tag that it replaces is removed from THAT chapter only.
--
-- The broad topics themselves stay in the taxonomy and keep every other
-- chapter: they still describe the library, and material with no situational
-- home (work, history, opinions) still needs them.

with retire(book, ext, topic) as (values
  ('homeandschool','chapter-22', 'food-and-cooking'),
  ('homeandschool','chapter-22', 'shopping-and-money'),
  ('homeandschool','chapter-30', 'food-and-cooking'),
  ('homeandschool','chapter-30', 'shopping-and-money'),
  ('homeandschool','chapter-26', 'home-and-housing')
)
delete from public.content_unit_topics cut
using retire r,
     public.content_sources cs,
     public.content_units   cu,
     public.topics          t
where cs.source_url = 'https://openoregon.pressbooks.pub/' || r.book || '/'
  and cu.source_id  = cs.id
  and cu.external_id = r.ext
  and t.slug = r.topic
  and cut.content_unit_id = cu.id
  and cut.topic_id = t.id;

with retire(ext, topic) as (values
  ('authored-booking-a-room',    'travel-and-accommodation'),
  ('authored-checking-in',       'travel-and-accommodation'),
  ('authored-problem-with-room', 'travel-and-accommodation'),
  ('authored-buying-a-ticket',   'travel-and-accommodation'),
  ('authored-flight-cancelled',  'travel-and-accommodation'),
  ('authored-flight-cancelled',  'transport-and-directions'),
  ('authored-buying-a-jacket',   'clothing'),
  ('authored-buying-a-jacket',   'shopping-and-money'),
  -- `what-to-wear` keeps `weather-and-seasons`: choosing clothes for the
  -- forecast is half of what that chapter teaches.
  ('authored-what-to-wear',      'clothing'),
  -- `asking-directions` keeps `city-and-places`: the chapter genuinely
  -- teaches both, and only the directions half now has a situation.
  ('authored-asking-directions', 'transport-and-directions')
)
delete from public.content_unit_topics cut
using retire r,
     public.content_sources cs,
     public.content_units   cu,
     public.topics          t
where cs.source_url = 'yuny://authored/en/v1'
  and cu.source_id  = cs.id
  and cu.external_id = r.ext
  and t.slug = r.topic
  and cut.content_unit_id = cu.id
  and cut.topic_id = t.id;
