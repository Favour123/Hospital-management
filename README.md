# SMARTMED — Adeleke University Medical Center
**Computerized Medical Record Management System**

> Built with Next.js 15 · Supabase · shadcn · Tailwind v4 · Adeleke University Brand Colors (Green & Gold)

---

## 🚀 Quick Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials from the [Supabase Dashboard](https://app.supabase.com):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database
1. Open **SQL Editor** in your Supabase Dashboard
2. Paste and run `supabase/migrations/001_init.sql`
3. After creating the admin user, run `supabase/seed.sql`

### 4. Set up Supabase Storage
Create a storage bucket named `smartmed-assets` with **public** access for profile photos.

### 5. Configure Supabase Auth
In Supabase Dashboard → Auth → URL Configuration:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

### 6. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 👥 Roles & Access

| Role | Appointments | Patients | Encounters | Reports |
|------|-------------|----------|------------|---------|
| **ADMIN** | ✅ Full | ✅ Full | ✅ Full | ✅ |
| **RECEPTIONIST** | ✅ Manage | ✅ Create/Search | ❌ | ❌ |
| **DOCTOR** | ✅ View own | ✅ Read | ✅ Create (24h edit) | ❌ |
| **NURSE** | ✅ View own | ✅ Read | ✅ Read | ❌ |
| **STUDENT** | ✅ Request/View own | ❌ | ❌ | ❌ |
| **PHARMACY** | ❌ | ❌ | ❌ | ❌ |

---

## 🔐 Student Onboarding Flow
```
Register → Email Verification Link → /onboarding/photo-upload → Dashboard
```

---

## 🏗️ Pages
| Route | Description |
|-------|-------------|
| `/auth/login` | Sign in |
| `/auth/signup` | Student registration |
| `/auth/verify` | Email verification pending |
| `/onboarding/photo-upload` | Upload student photo |
| `/dashboard/student` | Student portal |
| `/dashboard/doctor` | Doctor schedule & encounters |
| `/dashboard/nurse` | Nurse schedule |
| `/dashboard/receptionist` | Appointment management |
| `/dashboard/admin` | Admin panel with charts |
| `/patients` | Patient search & list |
| `/patients/new` | Register patient |
| `/patients/[id]` | Patient profile + history |
| `/encounters/new` | Create encounter (Doctor) |
| `/appointments` | Appointment list |
| `/appointments/new` | Request/create appointment |

---

## 📋 API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/patients` | List/create patients |
| GET/PATCH | `/api/patients/[id]` | Get/update patient |
| GET/POST | `/api/encounters` | List/create encounters |
| PATCH | `/api/encounters/[id]` | Update encounter (24h window) |
| GET/POST | `/api/appointments` | List/create appointments |
| PATCH/DELETE | `/api/appointments/[id]` | Update appointment status |
| GET | `/api/reports` | Admin dashboard reports |

---

## 🎨 Design System
- **Primary Green**: `#006B3E` (Adeleke University Green)
- **Gold Accent**: `#C9A227` (Adeleke University Gold)
- **Font**: Inter
