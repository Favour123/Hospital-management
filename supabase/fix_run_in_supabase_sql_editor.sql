-- ================================================================
-- SMARTMED – One-time setup script
-- Run this ENTIRE file in Supabase Dashboard → SQL Editor → Run
-- https://supabase.com/dashboard/project/gxinhtcdkgpqcbtybiqz/sql
-- ================================================================

-- ─── 1. Extensions & Enums ──────────────────────────────────
create extension if not exists "uuid-ossp";

do $$ begin
  create type user_role as enum ('ADMIN','RECEPTIONIST','DOCTOR','NURSE','STUDENT','PHARMACY');
exception when duplicate_object then null; end $$;
do $$ begin
  create type appt_status as enum ('REQUESTED','PENDING','CONFIRMED','RESCHEDULED','CANCELLED','COMPLETED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type gender_type as enum ('MALE','FEMALE','OTHER');
exception when duplicate_object then null; end $$;

-- ─── 2. Profiles ────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);
-- Ensure all columns exist (safe if table was created by a prior partial run)
alter table public.profiles add column if not exists full_name   text;
alter table public.profiles add column if not exists email       text;
alter table public.profiles add column if not exists role        user_role not null default 'STUDENT';
alter table public.profiles add column if not exists id_number   text;
alter table public.profiles add column if not exists photo_url   text;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists created_at  timestamptz not null default now();
-- Add unique constraint on id_number if it doesn't exist yet
do $$ begin
  alter table public.profiles add constraint profiles_id_number_key unique (id_number);
exception when duplicate_table then null;
         when duplicate_object then null; end $$;
alter table public.profiles enable row level security;

do $$ begin
  create policy "profiles_own_read"   on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_admin_read" on public.profiles for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_own_update" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_admin_all"  on public.profiles for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
exception when duplicate_object then null; end $$;

-- ─── 3. Student Profiles ────────────────────────────────────
create table if not exists public.student_profiles (
  id uuid primary key references public.profiles(id) on delete cascade
);
-- Ensure all columns exist (safe if table was created by a prior partial run)
alter table public.student_profiles add column if not exists photo_url  text;
alter table public.student_profiles add column if not exists photo_done boolean not null default false;
alter table public.student_profiles add column if not exists email_done boolean not null default false;
alter table public.student_profiles enable row level security;

do $$ begin
  create policy "student_own"   on public.student_profiles for all using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "student_admin" on public.student_profiles for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
exception when duplicate_object then null; end $$;

-- ─── 4. Patients ────────────────────────────────────────────
create table if not exists public.patients (
  id            uuid primary key default gen_random_uuid(),
  patient_id    text unique not null,
  full_name     text,
  email         text,
  phone         text,
  date_of_birth date,
  gender        gender_type,
  address       text,
  matric_no     text unique,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
-- Ensure all columns exist (safe if table was created by a prior partial run)
alter table public.patients add column if not exists full_name     text;
alter table public.patients add column if not exists email         text;
alter table public.patients add column if not exists phone         text;
alter table public.patients add column if not exists date_of_birth date;
alter table public.patients add column if not exists gender        gender_type;
alter table public.patients add column if not exists address       text;
alter table public.patients add column if not exists matric_no     text;
alter table public.patients add column if not exists created_by    uuid references public.profiles(id) on delete set null;
alter table public.patients add column if not exists created_at    timestamptz not null default now();

create index if not exists idx_patients_name   on public.patients(lower(full_name));
create index if not exists idx_patients_email  on public.patients(lower(email));
create index if not exists idx_patients_phone  on public.patients(phone);
create index if not exists idx_patients_matric on public.patients(matric_no);
create index if not exists idx_patients_pid    on public.patients(patient_id);

alter table public.patients enable row level security;

do $$ begin
  create policy "patients_staff_read"   on public.patients for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST','DOCTOR','NURSE')));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "patients_staff_write"  on public.patients for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST')));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "patients_staff_update" on public.patients for update using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST')));
exception when duplicate_object then null; end $$;

-- ─── 5. Encounters ──────────────────────────────────────────
create table if not exists public.encounters (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Ensure all columns exist (safe if table was created by a prior partial run)
alter table public.encounters add column if not exists patient_id    uuid references public.patients(id) on delete cascade;
alter table public.encounters add column if not exists doctor_id     uuid references public.profiles(id);
alter table public.encounters add column if not exists complaint     text;
alter table public.encounters add column if not exists history       text;
alter table public.encounters add column if not exists diagnosis     text;
alter table public.encounters add column if not exists treatment     text;
alter table public.encounters add column if not exists prescriptions text;
alter table public.encounters add column if not exists notes         text;

create index if not exists idx_enc_patient on public.encounters(patient_id);
create index if not exists idx_enc_doctor  on public.encounters(doctor_id);
create index if not exists idx_enc_created on public.encounters(created_at desc);

alter table public.encounters enable row level security;

do $$ begin
  create policy "encounters_read"   on public.encounters for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','DOCTOR','NURSE')));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "encounters_insert" on public.encounters for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','DOCTOR')));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "encounters_update" on public.encounters for update using (
    (doctor_id=auth.uid() and created_at > now() - interval '24 hours')
    or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN')
  );
exception when duplicate_object then null; end $$;

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists encounters_updated_at on public.encounters;
create trigger encounters_updated_at before update on public.encounters for each row execute function update_updated_at_column();

-- ─── 6. Appointments ────────────────────────────────────────
create table if not exists public.appointments (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Ensure all columns exist (safe if table was created by a prior partial run)
alter table public.appointments add column if not exists patient_id     uuid references public.patients(id) on delete cascade;
alter table public.appointments add column if not exists requested_by   uuid references public.profiles(id) on delete set null;
alter table public.appointments add column if not exists assigned_to    uuid references public.profiles(id) on delete set null;
alter table public.appointments add column if not exists preferred_date timestamptz;
alter table public.appointments add column if not exists scheduled_at   timestamptz;
alter table public.appointments add column if not exists reason         text;
alter table public.appointments add column if not exists status         appt_status not null default 'REQUESTED';
alter table public.appointments add column if not exists notes          text;

create index if not exists idx_appt_assigned on public.appointments(assigned_to, scheduled_at);
create index if not exists idx_appt_status   on public.appointments(status);
create index if not exists idx_appt_patient  on public.appointments(patient_id);

alter table public.appointments enable row level security;

do $$ begin
  create policy "appt_read" on public.appointments for select using (
    requested_by = auth.uid()
    or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST','DOCTOR','NURSE'))
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "appt_insert" on public.appointments for insert with check (
    requested_by = auth.uid()
    or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST'))
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "appt_update" on public.appointments for update using (
    exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST'))
  );
exception when duplicate_object then null; end $$;

create or replace function check_appointment_conflict()
returns trigger language plpgsql as $$
begin
  if new.status = 'CONFIRMED' and new.assigned_to is not null and new.scheduled_at is not null then
    if exists (
      select 1 from public.appointments
      where assigned_to = new.assigned_to
        and status = 'CONFIRMED'
        and scheduled_at = new.scheduled_at
        and id <> coalesce(new.id, gen_random_uuid())
    ) then
      raise exception 'Double-booking detected: staff already has a CONFIRMED appointment at this time.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appt_conflict_check on public.appointments;
create trigger appt_conflict_check before insert or update on public.appointments for each row execute function check_appointment_conflict();

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at before update on public.appointments for each row execute function update_updated_at_column();

-- ─── 7. Audit Logs ──────────────────────────────────────────
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
-- Ensure all columns exist (safe if table was created by a prior partial run)
alter table public.audit_logs add column if not exists actor_id  uuid references public.profiles(id) on delete set null;
alter table public.audit_logs add column if not exists action    text;
alter table public.audit_logs add column if not exists entity    text;
alter table public.audit_logs add column if not exists entity_id uuid;
alter table public.audit_logs add column if not exists metadata  jsonb;

create index if not exists idx_audit_actor  on public.audit_logs(actor_id);
create index if not exists idx_audit_entity on public.audit_logs(entity, entity_id);

alter table public.audit_logs enable row level security;

do $$ begin
  create policy "audit_admin_read"   on public.audit_logs for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "audit_insert_allow" on public.audit_logs for insert with check (true);
exception when duplicate_object then null; end $$;

-- ─── 8. Auth Triggers ───────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role      user_role := 'STUDENT';
  v_full_name text;
  v_id_number text;
begin
  -- Resolve role
  if new.raw_user_meta_data->>'role' is not null then
    begin
      v_role := (new.raw_user_meta_data->>'role')::user_role;
    exception when invalid_text_representation then
      v_role := 'STUDENT';
    end;
  end if;

  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_id_number := nullif(trim(coalesce(new.raw_user_meta_data->>'id_number', '')), '');

  -- PRIMARY attempt: insert with id_number.
  -- ON CONFLICT (id) handles the case where the profile already exists.
  begin
    insert into public.profiles (id, full_name, email, role, id_number)
    values (new.id, v_full_name, new.email, v_role, v_id_number)
    on conflict (id) do update
      set full_name = excluded.full_name,
          email     = excluded.email,
          role      = excluded.role;
  exception when unique_violation then
    -- id_number is already owned by a different user — create profile without it.
    -- ON CONFLICT (id) still handles any profile-already-exists race condition.
    insert into public.profiles (id, full_name, email, role)
    values (new.id, v_full_name, new.email, v_role)
    on conflict (id) do update
      set full_name = excluded.full_name,
          email     = excluded.email,
          role      = excluded.role;
  end;

  -- profiles(new.id) is now guaranteed to exist — safe to insert student row.
  if v_role = 'STUDENT' then
    insert into public.student_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_email_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles set is_verified = true where id = new.id;
    update public.student_profiles set email_done = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed after update on auth.users for each row execute function public.handle_email_confirmed();

-- ─── 9. Backfill profiles for users who signed up BEFORE this migration ──
-- This creates profiles for any existing auth users that don't have one yet.
insert into public.profiles (id, full_name, email, role, id_number, is_verified)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  coalesce((u.raw_user_meta_data->>'role')::user_role, 'STUDENT'),
  u.raw_user_meta_data->>'id_number',
  u.email_confirmed_at is not null
from auth.users u
left join public.profiles p on u.id = p.id
where p.id is null
on conflict (id) do nothing;

-- Backfill student_profiles for STUDENT users
insert into public.student_profiles (id, email_done)
select
  p.id,
  p.is_verified
from public.profiles p
left join public.student_profiles sp on p.id = sp.id
where p.role = 'STUDENT' and sp.id is null
on conflict (id) do nothing;

-- ─── Done ────────────────────────────────────────────────────
select 'Schema created ✓' as status, count(*) as profiles_count from public.profiles;
