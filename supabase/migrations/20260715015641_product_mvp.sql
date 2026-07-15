create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null,
  role text not null check (role in ('client', 'trainer')),
  phone text,
  avatar_url text,
  accepted_terms_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trainer_profiles (
  user_id uuid primary key constraint trainer_profiles_user_id_fkey references public.profiles(id) on delete cascade,
  bio text not null default '',
  disciplines text[] not null default array['tenis']::text[],
  district text not null default 'Warszawa',
  hourly_rate integer not null default 18000 check (hourly_rate between 0 and 1000000),
  verified boolean not null default false,
  published boolean not null default false,
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  level text not null default 'Każdy poziom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(disciplines) between 1 and 6)
);

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'available' check (status in ('available', 'booked', 'blocked', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null unique references public.availability_slots(id),
  client_id uuid not null constraint bookings_client_id_fkey references public.profiles(id),
  trainer_id uuid not null constraint bookings_trainer_id_fkey references public.profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  price integer not null check (price >= 0),
  platform_fee integer not null check (platform_fee >= 0 and platform_fee <= price),
  location text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null constraint conversation_members_conversation_id_fkey references public.conversations(id) on delete cascade,
  user_id uuid not null constraint conversation_members_user_id_fkey references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  trainer_id uuid not null references public.trainer_profiles(user_id),
  rating integer not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email boolean not null default true,
  sms boolean not null default false,
  push boolean not null default false,
  before_24h boolean not null default true,
  before_2h boolean not null default true,
  after_training boolean not null default false,
  updated_at timestamptz not null default now()
);

create index availability_slots_trainer_starts_idx on public.availability_slots (trainer_id, starts_at);
create index bookings_client_starts_idx on public.bookings (client_id, starts_at desc);
create index bookings_trainer_starts_idx on public.bookings (trainer_id, starts_at desc);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index reviews_trainer_created_idx on public.reviews (trainer_id, created_at desc);

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text := btrim(new.raw_user_meta_data ->> 'full_name');
  requested_role text := new.raw_user_meta_data ->> 'role';
  accepted_at timestamptz;
begin
  if requested_name is null or char_length(requested_name) not between 2 and 80 then
    raise exception 'full_name must be between 2 and 80 characters';
  end if;
  if requested_role not in ('client', 'trainer') then
    raise exception 'role must be client or trainer';
  end if;
  begin
    accepted_at := (new.raw_user_meta_data ->> 'accepted_terms_at')::timestamptz;
  exception when others then
    raise exception 'accepted_terms_at must be a valid timestamp';
  end;
  if accepted_at is null then raise exception 'accepted_terms_at is required'; end if;

  insert into public.profiles (id, full_name, email, role, accepted_terms_at)
  values (new.id, requested_name, coalesce(new.email, ''), requested_role, accepted_at);

  insert into public.notification_preferences (user_id, after_training)
  values (new.id, requested_role = 'trainer');

  if requested_role = 'trainer' then
    insert into public.trainer_profiles (user_id) values (new.id);
  end if;
  return new;
end;
$$;

create function private.prevent_slot_overlap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.availability_slots existing
    where existing.trainer_id = new.trainer_id
      and existing.id <> new.id
      and existing.status not in ('cancelled')
      and tstzrange(existing.starts_at, existing.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'availability slot overlaps an existing slot';
  end if;
  return new;
end;
$$;

create function private.prepare_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_slot public.availability_slots;
  selected_trainer public.trainer_profiles;
begin
  if (select auth.uid()) is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'client') then
    raise exception 'only clients can create bookings';
  end if;

  select * into selected_slot from public.availability_slots where id = new.slot_id for update;
  if selected_slot.id is null or selected_slot.status <> 'available' then
    raise exception 'slot is not available';
  end if;
  select * into selected_trainer from public.trainer_profiles where user_id = selected_slot.trainer_id and published = true;
  if selected_trainer.user_id is null then raise exception 'trainer profile is not published'; end if;

  new.client_id := (select auth.uid());
  new.trainer_id := selected_slot.trainer_id;
  new.starts_at := selected_slot.starts_at;
  new.ends_at := selected_slot.ends_at;
  new.status := 'pending';
  new.payment_status := 'pending';
  new.price := selected_trainer.hourly_rate;
  new.platform_fee := round(selected_trainer.hourly_rate * 0.10);
  new.location := selected_trainer.district || ', Warszawa';
  return new;
end;
$$;

create function private.finalize_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_uuid uuid;
begin
  update public.availability_slots set status = 'booked', updated_at = now() where id = new.slot_id;
  insert into public.conversations (booking_id) values (new.id) returning id into conversation_uuid;
  insert into public.conversation_members (conversation_id, user_id)
  values (conversation_uuid, new.client_id), (conversation_uuid, new.trainer_id);
  return new;
end;
$$;

create function private.validate_booking_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  allowed boolean := false;
begin
  if new.client_id <> old.client_id or new.trainer_id <> old.trainer_id or new.slot_id <> old.slot_id
     or new.price <> old.price or new.platform_fee <> old.platform_fee or new.payment_status <> old.payment_status then
    raise exception 'immutable booking fields cannot be changed';
  end if;
  if new.status = old.status then return new; end if;

  select role into actor_role from public.profiles where id = (select auth.uid());
  if actor_role = 'client' and old.client_id = (select auth.uid()) then
    allowed := old.status in ('pending', 'confirmed') and new.status = 'cancelled';
  elsif actor_role = 'trainer' and old.trainer_id = (select auth.uid()) then
    allowed := (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('completed', 'cancelled'));
  end if;
  if not allowed then raise exception 'booking status transition is not allowed'; end if;
  return new;
end;
$$;

create function private.reopen_cancelled_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.availability_slots set status = 'available', updated_at = now() where id = new.slot_id;
  end if;
  return new;
end;
$$;

create function private.validate_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_booking public.bookings;
begin
  select * into source_booking from public.bookings where id = new.booking_id;
  if source_booking.id is null or source_booking.client_id <> (select auth.uid())
    or source_booking.status <> 'completed' or source_booking.payment_status <> 'paid' then
    raise exception 'review requires a completed and paid booking owned by the client';
  end if;
  new.client_id := source_booking.client_id;
  new.trainer_id := source_booking.trainer_id;
  return new;
end;
$$;

create function private.refresh_trainer_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_trainer uuid := coalesce(new.trainer_id, old.trainer_id);
begin
  update public.trainer_profiles
  set rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where trainer_id = affected_trainer), 0),
      review_count = (select count(*) from public.reviews where trainer_id = affected_trainer),
      updated_at = now()
  where user_id = affected_trainer;
  return coalesce(new, old);
end;
$$;

create trigger profiles_touch_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger trainer_profiles_touch_updated before update on public.trainer_profiles for each row execute function private.touch_updated_at();
create trigger availability_touch_updated before update on public.availability_slots for each row execute function private.touch_updated_at();
create trigger bookings_touch_updated before update on public.bookings for each row execute function private.touch_updated_at();
create trigger preferences_touch_updated before update on public.notification_preferences for each row execute function private.touch_updated_at();
create trigger auth_user_created after insert on auth.users for each row execute function private.create_profile_for_new_user();
create trigger availability_prevent_overlap before insert or update on public.availability_slots for each row execute function private.prevent_slot_overlap();
create trigger booking_prepare before insert on public.bookings for each row execute function private.prepare_booking();
create trigger booking_finalize after insert on public.bookings for each row execute function private.finalize_booking();
create trigger booking_validate_update before update on public.bookings for each row execute function private.validate_booking_update();
create trigger booking_reopen_slot after update on public.bookings for each row execute function private.reopen_cancelled_slot();
create trigger review_validate before insert or update on public.reviews for each row execute function private.validate_review();
create trigger review_refresh_rating after insert or update or delete on public.reviews for each row execute function private.refresh_trainer_rating();

alter table public.profiles enable row level security;
alter table public.trainer_profiles enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notification_preferences enable row level security;

revoke all on public.profiles, public.trainer_profiles, public.availability_slots,
  public.bookings, public.conversations, public.conversation_members, public.messages,
  public.reviews, public.notification_preferences from anon, authenticated;
revoke all on function private.touch_updated_at() from public;
revoke all on function private.create_profile_for_new_user() from public;
revoke all on function private.prevent_slot_overlap() from public;
revoke all on function private.prepare_booking() from public;
revoke all on function private.finalize_booking() from public;
revoke all on function private.validate_booking_update() from public;
revoke all on function private.reopen_cancelled_slot() from public;
revoke all on function private.validate_review() from public;
revoke all on function private.refresh_trainer_rating() from public;

grant select (id, full_name, avatar_url) on public.profiles to anon;
grant select (id, full_name, email, role, phone, avatar_url, created_at, updated_at) on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

grant select on public.trainer_profiles to anon, authenticated;
grant update (bio, disciplines, district, hourly_rate, published, level) on public.trainer_profiles to authenticated;

grant select on public.availability_slots to anon, authenticated;
grant insert (trainer_id, starts_at, ends_at, status) on public.availability_slots to authenticated;
grant update (starts_at, ends_at, status) on public.availability_slots to authenticated;
grant delete on public.availability_slots to authenticated;

grant select on public.bookings to authenticated;
grant insert (slot_id) on public.bookings to authenticated;
grant update (status) on public.bookings to authenticated;

grant select on public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert (booking_id, client_id, rating, body) on public.reviews to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;

create policy "Published trainer names are public"
  on public.profiles for select to anon, authenticated
  using (exists (select 1 from public.trainer_profiles tp where tp.user_id = profiles.id and tp.published = true));
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Booking parties can view each other"
  on public.profiles for select to authenticated
  using (exists (select 1 from public.bookings b where ((b.client_id = (select auth.uid()) and b.trainer_id = profiles.id) or (b.trainer_id = (select auth.uid()) and b.client_id = profiles.id))));
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Published trainer profiles are public"
  on public.trainer_profiles for select to anon, authenticated using (published = true);
create policy "Trainers can view their own profile"
  on public.trainer_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Trainers can update their own profile"
  on public.trainer_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Available published slots are public"
  on public.availability_slots for select to anon, authenticated
  using (status = 'available' and exists (select 1 from public.trainer_profiles tp where tp.user_id = availability_slots.trainer_id and tp.published = true));
create policy "Trainers can view their own slots"
  on public.availability_slots for select to authenticated using ((select auth.uid()) = trainer_id);
create policy "Trainers can add their own slots"
  on public.availability_slots for insert to authenticated with check ((select auth.uid()) = trainer_id);
create policy "Trainers can update their own slots"
  on public.availability_slots for update to authenticated
  using ((select auth.uid()) = trainer_id)
  with check ((select auth.uid()) = trainer_id);
create policy "Trainers can delete their own free slots"
  on public.availability_slots for delete to authenticated
  using ((select auth.uid()) = trainer_id and status in ('available', 'blocked', 'cancelled'));

create policy "Booking parties can view bookings"
  on public.bookings for select to authenticated
  using ((select auth.uid()) in (client_id, trainer_id));
create policy "Clients can create their own bookings"
  on public.bookings for insert to authenticated
  with check ((select auth.uid()) = client_id);
create policy "Booking parties can update bookings"
  on public.bookings for update to authenticated
  using ((select auth.uid()) in (client_id, trainer_id))
  with check ((select auth.uid()) in (client_id, trainer_id));

create policy "Booking parties can view conversations"
  on public.conversations for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = conversations.booking_id and (select auth.uid()) in (b.client_id, b.trainer_id)));
create policy "Booking parties can view members"
  on public.conversation_members for select to authenticated
  using (exists (select 1 from public.conversations c join public.bookings b on b.id = c.booking_id where c.id = conversation_members.conversation_id and (select auth.uid()) in (b.client_id, b.trainer_id)));

create policy "Conversation members can view messages"
  on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c join public.bookings b on b.id = c.booking_id where c.id = messages.conversation_id and (select auth.uid()) in (b.client_id, b.trainer_id)));
create policy "Conversation members can send messages"
  on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.conversations c join public.bookings b on b.id = c.booking_id where c.id = messages.conversation_id and (select auth.uid()) in (b.client_id, b.trainer_id)));
create policy "Conversation members can mark messages read"
  on public.messages for update to authenticated
  using (exists (select 1 from public.conversations c join public.bookings b on b.id = c.booking_id where c.id = messages.conversation_id and (select auth.uid()) in (b.client_id, b.trainer_id)))
  with check (exists (select 1 from public.conversations c join public.bookings b on b.id = c.booking_id where c.id = messages.conversation_id and (select auth.uid()) in (b.client_id, b.trainer_id)));

create policy "Reviews are public"
  on public.reviews for select to anon, authenticated using (true);
create policy "Clients can review their own bookings"
  on public.reviews for insert to authenticated
  with check ((select auth.uid()) = client_id);

create policy "Users can view their preferences"
  on public.notification_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their preferences"
  on public.notification_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their preferences"
  on public.notification_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then
  null;
end;
$$;
