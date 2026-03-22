-- ================================================================
-- SMARTMED – Adeleke University Medical Center
-- Fresh schema – paste this ENTIRE file into:
-- Supabase Dashboard → SQL Editor → Run
--
-- For a BRAND-NEW project only (no existing tables).
-- ================================================================


-- ─── 1. Extensions ──────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─── 2. Enums ───────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum (
    'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'STUDENT', 'PHARMACY'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appt_status as enum (
    'REQUESTED', 'PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender_type as enum (
    'MALE', 'FEMALE', 'OTHER'
  );
exception when duplicate_object then null; end $$;


-- ─── 3. Profiles ────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  email       text        not null,
  role        user_role   not null default 'STUDENT',
  id_number   text        unique,          -- matric / staff ID
  photo_url   text,
  is_verified boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ─── Role helper ────────────────────────────────────────────
-- Security-definer function so policies on OTHER tables can read
-- the current user's role without causing recursive RLS lookups.
create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Profiles policies
-- Users can read their own row; admins can read all rows
do $$ begin
  create policy "profiles_own_read"
    on public.profiles for select
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_admin_read"
    on public.profiles for select
    using (public.get_my_role() = 'ADMIN');
exception when duplicate_object then null; end $$;

-- Users can update their own row; admins can do anything
do $$ begin
  create policy "profiles_own_update"
    on public.profiles for update
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_admin_all"
    on public.profiles for all
    using (public.get_my_role() = 'ADMIN');
exception when duplicate_object then null; end $$;


-- ─── 4. Student Profiles ────────────────────────────────────
create table if not exists public.student_profiles (
  id         uuid    primary key references public.profiles(id) on delete cascade,
  photo_url  text,
  photo_done boolean not null default false,
  email_done boolean not null default false
);

alter table public.student_profiles enable row level security;

do $$ begin
  create policy "student_own"
    on public.student_profiles for all
    using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "student_admin"
    on public.student_profiles for select
    using (public.get_my_role() = 'ADMIN');
exception when duplicate_object then null; end $$;


-- ─── 5. Patients ────────────────────────────────────────────
create table if not exists public.patients (
  id            uuid        primary key default gen_random_uuid(),
  patient_id    text        not null unique,  -- e.g. AUMC-2024-0001
  full_name     text        not null,
  email         text,
  phone         text,
  date_of_birth date,
  gender        gender_type,
  address       text,
  id_number     text        unique,          -- student matric / staff ID
  created_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_patients_name   on public.patients(lower(full_name));
create index if not exists idx_patients_email  on public.patients(lower(email));
create index if not exists idx_patients_phone  on public.patients(phone);
create index if not exists idx_patients_idnum  on public.patients(id_number);
create index if not exists idx_patients_pid    on public.patients(patient_id);

alter table public.patients enable row level security;

do $$ begin
  create policy "patients_staff_read"
    on public.patients for select
    using (public.get_my_role() in ('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "patients_staff_write"
    on public.patients for insert
    with check (public.get_my_role() in ('ADMIN', 'RECEPTIONIST'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "patients_staff_update"
    on public.patients for update
    using (public.get_my_role() in ('ADMIN', 'RECEPTIONIST'));
exception when duplicate_object then null; end $$;


-- ─── 6. Encounters ──────────────────────────────────────────
create table if not exists public.encounters (
  id            uuid        primary key default gen_random_uuid(),
  patient_id    uuid        not null references public.patients(id) on delete cascade,
  doctor_id     uuid        not null references public.profiles(id),
  complaint     text,
  history       text,
  diagnosis     text,
  treatment     text,
  prescriptions text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_enc_patient on public.encounters(patient_id);
create index if not exists idx_enc_doctor  on public.encounters(doctor_id);
create index if not exists idx_enc_created on public.encounters(created_at desc);

alter table public.encounters enable row level security;

do $$ begin
  create policy "encounters_read"
    on public.encounters for select
    using (
      public.get_my_role() in ('ADMIN', 'DOCTOR', 'NURSE')
      or (
        public.get_my_role() = 'STUDENT'
        and exists (
          select 1 from public.patients pat 
          where pat.id = public.encounters.patient_id 
          and pat.id_number = (select p2.id_number from public.profiles p2 where p2.id = auth.uid())
        )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "encounters_insert"
    on public.encounters for insert
    with check (public.get_my_role() in ('ADMIN', 'DOCTOR'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "encounters_update"
    on public.encounters for update
    using (
      (doctor_id = auth.uid() and created_at > now() - interval '24 hours')
      or public.get_my_role() = 'ADMIN'
    );
exception when duplicate_object then null; end $$;

-- Shared updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists encounters_updated_at on public.encounters;
create trigger encounters_updated_at
  before update on public.encounters
  for each row execute function public.set_updated_at();


-- ─── 7. Appointments ────────────────────────────────────────
create table if not exists public.appointments (
  id             uuid        primary key default gen_random_uuid(),
  patient_id     uuid        not null references public.patients(id) on delete cascade,
  requested_by   uuid        references public.profiles(id) on delete set null,
  assigned_to    uuid        references public.profiles(id) on delete set null,
  preferred_date timestamptz,
  scheduled_at   timestamptz,
  reason         text,
  status         appt_status not null default 'REQUESTED',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_appt_assigned on public.appointments(assigned_to, scheduled_at);
create index if not exists idx_appt_status   on public.appointments(status);
create index if not exists idx_appt_patient  on public.appointments(patient_id);

alter table public.appointments enable row level security;

do $$ begin
  create policy "appt_read"
    on public.appointments for select
    using (
      requested_by = auth.uid()
      or public.get_my_role() in ('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')
      or (
        public.get_my_role() = 'STUDENT'
        and exists (
          select 1 from public.patients pat 
          where pat.id = public.appointments.patient_id 
          and pat.id_number = (select p2.id_number from public.profiles p2 where p2.id = auth.uid())
        )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "appt_insert"
    on public.appointments for insert
    with check (
      requested_by = auth.uid()
      or public.get_my_role() in ('ADMIN', 'RECEPTIONIST')
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "appt_update"
    on public.appointments for update
    using (public.get_my_role() in ('ADMIN', 'RECEPTIONIST'));
exception when duplicate_object then null; end $$;

-- Double-booking prevention trigger
create or replace function public.check_appointment_conflict()
returns trigger language plpgsql as $$
begin
  if new.status = 'CONFIRMED'
     and new.assigned_to  is not null
     and new.scheduled_at is not null
  then
    if exists (
      select 1 from public.appointments
      where  assigned_to  = new.assigned_to
        and  status       = 'CONFIRMED'
        and  scheduled_at = new.scheduled_at
        and  id          <> coalesce(new.id, gen_random_uuid())
    ) then
      raise exception
        'Double-booking: staff member already has a CONFIRMED appointment at this time.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appt_conflict_check on public.appointments;
create trigger appt_conflict_check
  before insert or update on public.appointments
  for each row execute function public.check_appointment_conflict();

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();


-- ─── 8. Audit Logs ──────────────────────────────────────────
create table if not exists public.audit_logs (
  id         uuid        primary key default gen_random_uuid(),
  actor_id   uuid        references public.profiles(id) on delete set null,
  action     text        not null,
  entity     text        not null,
  entity_id  uuid,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_actor  on public.audit_logs(actor_id);
create index if not exists idx_audit_entity on public.audit_logs(entity, entity_id);

alter table public.audit_logs enable row level security;

do $$ begin
  create policy "audit_admin_read"
    on public.audit_logs for select
    using (public.get_my_role() = 'ADMIN');
exception when duplicate_object then null; end $$;

-- Any authenticated user (or service role) can write audit logs
do $$ begin
  create policy "audit_insert_allow"
    on public.audit_logs for insert
    with check (true);
exception when duplicate_object then null; end $$;


-- ─── 9. Auth Trigger: create profile on signup ──────────────
-- Fires immediately after a new row is inserted into auth.users.
-- Creates the matching public.profiles row (and student_profiles
-- if role = 'STUDENT').  Handles all edge-cases:
--   • role cast failure  → falls back to STUDENT
--   • id_number conflict → creates profile without id_number
--   • profile already exists (race / retry) → upserts safely
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role      user_role := 'STUDENT';
  v_full_name text;
  v_id_number text;
begin
  -- 1. Resolve role
  if new.raw_user_meta_data->>'role' is not null then
    begin
      v_role := (new.raw_user_meta_data->>'role')::user_role;
    exception when invalid_text_representation then
      v_role := 'STUDENT';
    end;
  end if;

  -- 2. Resolve display name
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 3. Resolve id_number (null when blank)
  v_id_number := nullif(
    trim(coalesce(new.raw_user_meta_data->>'id_number', '')),
    ''
  );

  -- 4. Insert profile WITH id_number; upsert on primary-key conflict
  begin
    insert into public.profiles (id, full_name, email, role, id_number)
    values (new.id, v_full_name, new.email, v_role, v_id_number)
    on conflict (id) do update
      set full_name = excluded.full_name,
          email     = excluded.email,
          role      = excluded.role;

  exception when unique_violation then
    -- id_number is already owned by another user → create profile without it
    insert into public.profiles (id, full_name, email, role)
    values (new.id, v_full_name, new.email, v_role)
    on conflict (id) do update
      set full_name = excluded.full_name,
          email     = excluded.email,
          role      = excluded.role;
  end;

  -- 5. profiles(new.id) is now guaranteed to exist → safe FK insert
  if v_role = 'STUDENT' then
    insert into public.student_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 10. Auth Trigger: mark email verified ──────────────────
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null
  then
    update public.profiles
      set is_verified = true
      where id = new.id;

    update public.student_profiles
      set email_done = true
      where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
  after update on auth.users
  for each row execute function public.handle_email_confirmed();


-- ─── 11. Storage: smartmed-assets bucket ────────────────────
-- Creates the public bucket for profile photos.
-- The bucket is public so photo URLs work without a signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'smartmed-assets',
  'smartmed-assets',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public            = true,
      file_size_limit   = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS policies
-- Uploads: each authenticated user may only upload to their own path
--   path pattern: profile-photos/<user-id>.<ext>
do $$ begin
  create policy "storage_upload_own"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'smartmed-assets'
      and name like 'profile-photos/' || auth.uid()::text || '.%'
    );
exception when duplicate_object then null; end $$;

-- Updates / upserts (upload with upsert:true triggers UPDATE as well)
do $$ begin
  create policy "storage_update_own"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'smartmed-assets'
      and name like 'profile-photos/' || auth.uid()::text || '.%'
    );
exception when duplicate_object then null; end $$;

-- Public read: anyone can view photos via the public URL
do $$ begin
  create policy "storage_public_read"
    on storage.objects for select
    using (bucket_id = 'smartmed-assets');
exception when duplicate_object then null; end $$;

-- Admins may delete any object (e.g. moderation)
do $$ begin
  create policy "storage_admin_delete"
    on storage.objects for delete
    using (
      bucket_id = 'smartmed-assets'
      and public.get_my_role() = 'ADMIN'
    );
exception when duplicate_object then null; end $$;


-- ─── Done ────────────────────────────────────────────────────
select 'SMARTMED schema created ✓' as status;

