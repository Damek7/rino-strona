alter table public.trainer_profiles add column if not exists display_name text not null default 'Trener RinoMove';
alter table public.trainer_profiles add column if not exists avatar_url text;
alter table public.trainer_profiles add column if not exists city text not null default 'Warszawa';
alter table public.trainer_profiles add column if not exists experience text not null default '';
alter table public.trainer_profiles add column if not exists specialties text[] not null default '{}'::text[];
alter table public.reviews add column if not exists author_name text not null default 'Klient R.';

update public.trainer_profiles trainer
set display_name = profile.full_name,
    avatar_url = profile.avatar_url
from public.profiles profile
where profile.id = trainer.user_id;

update public.reviews review
set author_name = split_part(profile.full_name, ' ', 1) || ' ' || left(coalesce(nullif(split_part(profile.full_name, ' ', 2), ''), profile.full_name), 1) || '.'
from public.profiles profile
where profile.id = review.client_id;

create table public.trainer_media (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(user_id) on delete cascade,
  url text not null check (char_length(btrim(url)) between 1 and 2000),
  alt_text text not null default '' check (char_length(alt_text) <= 240),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index trainer_media_one_cover_idx on public.trainer_media (trainer_id) where is_cover;
create index trainer_profiles_public_search_idx on public.trainer_profiles (city, district) where published = true;
create index trainer_media_trainer_order_idx on public.trainer_media (trainer_id, sort_order);

create function private.prepare_trainer_public_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  identity public.profiles;
begin
  select * into identity from public.profiles where id = new.user_id;
  if identity.id is not null then
    new.display_name := identity.full_name;
    new.avatar_url := identity.avatar_url;
  end if;
  return new;
end;
$$;

create function private.sync_trainer_public_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.trainer_profiles
  set display_name = new.full_name,
      avatar_url = new.avatar_url
  where user_id = new.id;
  return new;
end;
$$;

create function private.prepare_public_review_author()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  full_name text;
begin
  select profile.full_name into full_name from public.profiles profile where profile.id = new.client_id;
  new.author_name := split_part(coalesce(full_name, 'Klient'), ' ', 1)
    || ' '
    || left(coalesce(nullif(split_part(coalesce(full_name, 'R'), ' ', 2), ''), 'R'), 1)
    || '.';
  return new;
end;
$$;

create trigger trainer_profiles_prepare_public_identity
before insert on public.trainer_profiles
for each row execute function private.prepare_trainer_public_identity();

create trigger profiles_sync_trainer_public_identity
after update of full_name, avatar_url on public.profiles
for each row execute function private.sync_trainer_public_identity();

create trigger reviews_prepare_public_author
before insert or update of client_id on public.reviews
for each row execute function private.prepare_public_review_author();

alter table public.trainer_media enable row level security;

revoke all on public.trainer_media from anon, authenticated;
grant select on public.trainer_media to anon, authenticated;
grant insert, update, delete on public.trainer_media to authenticated;
grant update (display_name, avatar_url, city, experience, specialties) on public.trainer_profiles to authenticated;

revoke select on public.reviews from anon;
grant select (id, trainer_id, rating, body, author_name, created_at) on public.reviews to anon;

revoke select on public.availability_slots from anon;
drop policy if exists "Available published slots are public" on public.availability_slots;
create policy "Authenticated users can view published availability"
  on public.availability_slots for select to authenticated
  using (
    status = 'available'
    and exists (
      select 1 from public.trainer_profiles trainer
      where trainer.user_id = availability_slots.trainer_id and trainer.published = true
    )
  );

create policy "Published trainer media are public"
  on public.trainer_media for select to anon, authenticated
  using (
    exists (
      select 1 from public.trainer_profiles trainer
      where trainer.user_id = trainer_media.trainer_id and trainer.published = true
    )
  );
create policy "Trainers insert own media"
  on public.trainer_media for insert to authenticated
  with check ((select auth.uid()) = trainer_id);
create policy "Trainers update own media"
  on public.trainer_media for update to authenticated
  using ((select auth.uid()) = trainer_id)
  with check ((select auth.uid()) = trainer_id);
create policy "Trainers delete own media"
  on public.trainer_media for delete to authenticated
  using ((select auth.uid()) = trainer_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trainer-gallery', 'trainer-gallery', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Published trainer gallery objects are public"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'trainer-gallery'
    and exists (
      select 1 from public.trainer_profiles trainer
      where trainer.user_id::text = (storage.foldername(name))[1] and trainer.published = true
    )
  );
create policy "Trainers can view own gallery objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'trainer-gallery' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Trainers can insert own gallery objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'trainer-gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.trainer_profiles trainer where trainer.user_id = (select auth.uid()))
  );
create policy "Trainers can update own gallery objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'trainer-gallery' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (
    bucket_id = 'trainer-gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.trainer_profiles trainer where trainer.user_id = (select auth.uid()))
  );
create policy "Trainers can delete own gallery objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'trainer-gallery' and (storage.foldername(name))[1] = auth.uid()::text);

revoke all on function private.prepare_trainer_public_identity() from public;
revoke all on function private.sync_trainer_public_identity() from public;
revoke all on function private.prepare_public_review_author() from public;
