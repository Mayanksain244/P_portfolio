-- Phase 3: Site Diary schema. Safe to re-run.

create extension if not exists pgcrypto;

do $$ begin
  create type album_category as enum
    ('roads','bridges','buildings','disaster_relief','inspections','events','awards','other');
exception when duplicate_object then null; end $$;

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_hi text,
  description_en text,
  description_hi text,
  category album_category not null default 'other',
  event_date date,
  location_en text,
  location_hi text,
  cover_image_id uuid null,
  sort_order int default 0,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists albums_set_updated_at on albums;
create trigger albums_set_updated_at before update on albums
  for each row execute function set_updated_at();

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade,
  storage_path text not null,
  width int,
  height int,
  blur_data_url text,
  caption_en text,
  caption_hi text,
  tags text[] default '{}',
  taken_on date,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists images_album_sort_idx on images (album_id, sort_order);

do $$ begin
  alter table albums add constraint albums_cover_image_fk
    foreign key (cover_image_id) references images(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  ip_hash text,
  created_at timestamptz default now(),
  read boolean default false
);

create index if not exists messages_created_at_idx on messages (created_at desc);

-- Row level security. The secret key bypasses RLS for server-side admin work.
alter table albums enable row level security;
alter table images enable row level security;
alter table messages enable row level security;

drop policy if exists "public read published albums" on albums;
create policy "public read published albums" on albums
  for select to anon, authenticated using (published = true);

drop policy if exists "public read images of published albums" on images;
create policy "public read images of published albums" on images
  for select to anon, authenticated
  using (exists (select 1 from albums a where a.id = images.album_id and a.published = true));

-- messages: no policies, so no public access at all.

-- Storage bucket (public read, no public write).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 10485760,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

drop policy if exists "public read gallery objects" on storage.objects;
create policy "public read gallery objects" on storage.objects
  for select to anon, authenticated using (bucket_id = 'gallery');
