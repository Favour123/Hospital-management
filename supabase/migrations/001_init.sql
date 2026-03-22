-- ============================================================
-- SMARTMED: Adeleke University Medical Center
-- Migration 001 - Full Schema Init
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────
create type user_role as enum ('ADMIN','RECEPTIONIST','DOCTOR','NURSE','STUDENT','PHARMACY');
create type appt_status as enum ('REQUESTED','PENDING','CONFIRMED','RESCHEDULED','CANCELLED','COMPLETED');
create type gender_type as enum ('MALE','FEMALE','OTHER');

-- ─── Profiles ─────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        user_role not null default 'STUDENT',
  id_number   text unique,
  photo_url   text,
  is_verified boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_own_read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_admin_read" on public.profiles for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
create policy "profiles_own_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_all"  on public.profiles for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));

-- ─── Student Profiles ──────────────────────────────────────
create table public.student_profiles (
  id         uuid primary key references public.profiles(id) on delete cascade,
  photo_url  text,
  photo_done boolean not null default false,
  email_done boolean not null default false
);
alter table public.student_profiles enable row level security;
create policy "student_own"   on public.student_profiles for all using (auth.uid() = id);
create policy "student_admin" on public.student_profiles for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));

-- ─── Patients ─────────────────────────────────────────────
create table public.patients (
  id            uuid primary key default gen_random_uuid(),
  patient_id    text unique not null,
  full_name     text not null,
  email         text,
  phone         text,
  date_of_birth date,
  gender        gender_type,
  address       text,
  matric_no     text unique,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index idx_patients_name   on public.patients(lower(full_name));
create index idx_patients_email  on public.patients(lower(email));
create index idx_patients_phone  on public.patients(phone);
create index idx_patients_matric on public.patients(matric_no);
create index idx_patients_pid    on public.patients(patient_id);

alter table public.patients enable row level security;
create policy "patients_staff_read"  on public.patients for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST','DOCTOR','NURSE')));
create policy "patients_staff_write" on public.patients for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST')));
create policy "patients_staff_update" on public.patients for update using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST')));

-- ─── Encounters ────────────────────────────────────────────
create table public.encounters (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  doctor_id     uuid not null references public.profiles(id),
  complaint     text,
  history       text,
  diagnosis     text,
  treatment     text,
  prescriptions text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_enc_patient on public.encounters(patient_id);
create index idx_enc_doctor  on public.encounters(doctor_id);
create index idx_enc_created on public.encounters(created_at desc);

alter table public.encounters enable row level security;
create policy "encounters_read"   on public.encounters for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','DOCTOR','NURSE')));
create policy "encounters_insert" on public.encounters for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','DOCTOR')));
create policy "encounters_update" on public.encounters for update using (
  (doctor_id=auth.uid() and created_at > now() - interval '24 hours')
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN')
);

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger encounters_updated_at before update on public.encounters for each row execute function update_updated_at_column();

-- ─── Appointments ──────────────────────────────────────────
create table public.appointments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  requested_by   uuid references public.profiles(id) on delete set null,
  assigned_to    uuid references public.profiles(id) on delete set null,
  preferred_date timestamptz,
  scheduled_at   timestamptz,
  reason         text,
  status         appt_status not null default 'REQUESTED',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_appt_assigned on public.appointments(assigned_to, scheduled_at);
create index idx_appt_status   on public.appointments(status);
create index idx_appt_patient  on public.appointments(patient_id);

alter table public.appointments enable row level security;
create policy "appt_read" on public.appointments for select using (
  requested_by = auth.uid()
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST','DOCTOR','NURSE'))
);
create policy "appt_insert" on public.appointments for insert with check (
  requested_by = auth.uid()
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST'))
);
create policy "appt_update" on public.appointments for update using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('ADMIN','RECEPTIONIST'))
);

create trigger appointments_updated_at before update on public.appointments for each row execute function update_updated_at_column();

-- ─── Double-booking prevention ─────────────────────────────
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
create trigger appt_conflict_check before insert or update on public.appointments for each row execute function check_appointment_conflict();

-- ─── Audit Logs ────────────────────────────────────────────
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_actor  on public.audit_logs(actor_id);
create index idx_audit_entity on public.audit_logs(entity, entity_id);

alter table public.audit_logs enable row level security;
create policy "audit_admin_read"   on public.audit_logs for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
create policy "audit_insert_allow" on public.audit_logs for insert with check (true);

-- ─── Auth Trigger: create profile on signup ─────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role user_role := 'STUDENT';
begin
  if new.raw_user_meta_data->>'role' is not null then
    v_role := (new.raw_user_meta_data->>'role')::user_role;
  end if;
  insert into public.profiles (id, full_name, email, role, id_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email, v_role,
    new.raw_user_meta_data->>'id_number'
  );
  if v_role = 'STUDENT' then
    insert into public.student_profiles (id) values (new.id);
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ─── Auth Trigger: mark email confirmed ─────────────────────
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
create trigger on_auth_email_confirmed after update on auth.users for each row execute function public.handle_email_confirmed();