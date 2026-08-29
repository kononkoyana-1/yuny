-- Canonical topic taxonomy + chapter tagging (plan-tasks.md stage 2).
--
-- Topics are deliberately source-independent. Several are listed with no
-- content behind them yet (travel-and-accommodation, clothing): that is the
-- point. The taxonomy describes what a learner might need, and the gaps it
-- exposes are what tells us which book to import next. A roadmap builder
-- must therefore filter topics by "has content at this level", never assume
-- every topic is usable.
--
-- Idempotent: re-running updates rather than duplicates.

insert into public.topics (slug, label, category) values
  ('greetings-and-introductions', 'Greetings and introductions', 'everyday'),
  ('family-and-relationships',    'Family and relationships',    'everyday'),
  ('home-and-housing',            'Home and housing',            'everyday'),
  ('daily-routine',               'Daily routine',               'everyday'),
  ('food-and-cooking',            'Food and cooking',            'everyday'),
  ('shopping-and-money',          'Shopping and money',          'everyday'),
  ('health-and-body',             'Health and the body',         'everyday'),
  ('clothing',                    'Clothing',                    'everyday'),
  ('transport-and-directions',    'Transport and directions',    'place-and-travel'),
  ('city-and-places',             'Cities and places',           'place-and-travel'),
  ('travel-and-accommodation',    'Travel and accommodation',    'place-and-travel'),
  ('weather-and-seasons',         'Weather and seasons',         'place-and-travel'),
  ('nature-and-environment',      'Nature and environment',      'place-and-travel'),
  ('school-and-study',            'School and study',            'work-and-study'),
  ('work-and-jobs',               'Work and jobs',               'work-and-study'),
  ('technology-and-computers',    'Technology and computers',    'work-and-study'),
  ('hobbies-and-free-time',       'Hobbies and free time',       'social-and-culture'),
  ('holidays-and-celebrations',   'Holidays and celebrations',   'social-and-culture'),
  ('feelings-and-opinions',       'Feelings and opinions',       'social-and-culture'),
  ('arts-and-culture',            'Arts and culture',            'social-and-culture'),
  ('history-and-society',         'History and society',         'social-and-culture')
on conflict (slug) do update set label = excluded.label, category = excluded.category;

-- ---------------------------------------------------------------- levels
--
-- Book-level for now, and deliberately labelled as a first pass: judging each
-- chapter separately needs a measure we do not have yet. "A City of Bridges"
-- is plainly harder than "A Small City", and both sit in the same book at A2.
-- Green Tea is B1 because that is what its publisher states, even though its
-- chapters are too thin to teach from.

update public.content_units cu set cefr_level = 'A1'
from public.content_sources cs where cs.id = cu.source_id
  and cs.source_url in (
    'https://openoregon.pressbooks.pub/esol23/',
    'https://openoregon.pressbooks.pub/homeandschool/'
  );

update public.content_units cu set cefr_level = 'A2'
from public.content_sources cs where cs.id = cu.source_id
  and cs.source_url = 'https://openoregon.pressbooks.pub/portlandpeopleandplaces/';

update public.content_units cu set cefr_level = 'B1'
from public.content_sources cs where cs.id = cu.source_id
  and cs.source_url = 'https://openoregon.pressbooks.pub/greentea/';

-- ------------------------------------------------------------- chapter tags
--
-- Many chapters carry two or three topics: the market chapter teaches food
-- and shopping, the bridges chapter teaches transport and the city. That is
-- why this is a join table and not a column.

with pairs(book, ext, topic) as (values
  -- Home and School
  ('homeandschool','chapter-5',  'greetings-and-introductions'),
  ('homeandschool','chapter-5',  'school-and-study'),
  ('homeandschool','chapter-20', 'technology-and-computers'),
  ('homeandschool','chapter-20', 'school-and-study'),
  ('homeandschool','chapter-22', 'food-and-cooking'),
  ('homeandschool','chapter-22', 'shopping-and-money'),
  ('homeandschool','chapter-24', 'health-and-body'),
  ('homeandschool','chapter-24', 'family-and-relationships'),
  ('homeandschool','chapter-26', 'home-and-housing'),
  ('homeandschool','chapter-26', 'family-and-relationships'),
  ('homeandschool','chapter-28', 'school-and-study'),
  ('homeandschool','chapter-30', 'shopping-and-money'),
  ('homeandschool','chapter-30', 'food-and-cooking'),
  ('homeandschool','chapter-246','transport-and-directions'),
  ('homeandschool','chapter-246','work-and-jobs'),
  ('homeandschool','chapter-246','daily-routine'),
  ('homeandschool','chapter-34', 'weather-and-seasons'),
  ('homeandschool','chapter-32', 'holidays-and-celebrations'),
  -- Portland People and Places
  ('portlandpeopleandplaces','chapter-94', 'city-and-places'),
  ('portlandpeopleandplaces','chapter-94', 'nature-and-environment'),
  ('portlandpeopleandplaces','chapter-94', 'weather-and-seasons'),
  ('portlandpeopleandplaces','chapter-84', 'hobbies-and-free-time'),
  ('portlandpeopleandplaces','chapter-75', 'history-and-society'),
  ('portlandpeopleandplaces','chapter-75', 'city-and-places'),
  ('portlandpeopleandplaces','chapter-402','feelings-and-opinions'),
  ('portlandpeopleandplaces','chapter-402','holidays-and-celebrations'),
  ('portlandpeopleandplaces','chapter-69', 'work-and-jobs'),
  ('portlandpeopleandplaces','chapter-69', 'history-and-society'),
  ('portlandpeopleandplaces','chapter-127','city-and-places'),
  ('portlandpeopleandplaces','chapter-127','hobbies-and-free-time'),
  ('portlandpeopleandplaces','chapter-243','arts-and-culture'),
  ('portlandpeopleandplaces','chapter-243','weather-and-seasons'),
  ('portlandpeopleandplaces','chapter-248','nature-and-environment'),
  ('portlandpeopleandplaces','chapter-248','history-and-society'),
  ('portlandpeopleandplaces','chapter-253','transport-and-directions'),
  ('portlandpeopleandplaces','chapter-253','city-and-places')
)
insert into public.content_unit_topics (content_unit_id, topic_id)
select cu.id, t.id
from pairs p
join public.content_sources cs on cs.source_url = 'https://openoregon.pressbooks.pub/' || p.book || '/'
join public.content_units   cu on cu.source_id = cs.id and cu.external_id = p.ext
join public.topics          t  on t.slug = p.topic
on conflict (content_unit_id, topic_id) do nothing;
