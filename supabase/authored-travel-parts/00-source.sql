-- Authored content, part 0: the source row.
-- JSON is built with jsonb_build_object, never as a quoted JSON literal:
-- that keeps backslashes and double quotes out of the file entirely.

insert into public.content_sources (title, author, source_url, license, license_url, parser, parser_config, status)
values ('Yuny authored content (English)', 'Yuny', 'yuny://authored/en/v1', 'Proprietary - Yuny original content, not an open educational resource', null, 'authored', '{}'::jsonb, 'ready')
on conflict (source_url) do update set status = 'ready', license = excluded.license;
