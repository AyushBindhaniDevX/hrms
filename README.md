# Oasis HRMS

A complete Human Resource Management System built with **Expo** (React Native), running on **Android**, **iOS**, and **Web** from a single codebase. Backend powered by **Supabase** (PostgreSQL + Auth + RLS).

## Features

### Employee
- **Dashboard** — Greeting, attendance status, clock in/out with geofence, leave balance, latest payslip
- **Attendance** — Geofence-validated clock in/out, attendance history with status tracking
- **Leave** — Apply for leave, view balances, track request status, cancel pending requests
- **Payslips** — View salary breakdown (earnings, deductions, LOP, net), share payslip
- **Directory** — Search and filter employee directory by name/department
- **Profile** — View personal and employment details

### HR
- **Dashboard** — Stat cards (total employees, present, late, on leave), pending leave actions
- **Employee Management** — Create, edit, deactivate employees, assign departments/workplaces/salary
- **Attendance Management** — Organization-wide attendance with date filter and verification status
- **Leave Management** — Approve/reject leave requests with balance auto-update
- **Payroll** — Create payroll periods, add salary entries, process payroll, generate payslips
- **Workplace Management** — Create/edit workplaces with GPS coordinates and geofence radius

### Admin
- **Dashboard** — Organization overview with all stats
- **User Management** — Change roles, activate/deactivate users with audit logging
- **Organization Settings** — Name, working hours, geofence defaults
- **Audit Logs** — Track all important admin actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 57, React Native |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Styling | React Native StyleSheet + theme system |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Location | expo-location (native) + navigator.geolocation (web) |
| Validation | Zod |
| Forms | React Hook Form |

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (free tier works)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd hcm-v2
npm install
```

### 2. Configure Supabase

1. Create a [Supabase project](https://supabase.com)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL` → Supabase Dashboard > Settings > API > Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Supabase Dashboard > Settings > API > anon/public key

### 3. Run database migrations

In your Supabase SQL Editor, run these files **in order**:

1. `supabase/migrations/001_schema.sql` — Tables, enums, triggers, helper functions
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security policies
3. `supabase/migrations/003_functions.sql` — Server-side geofence validation, leave processing
4. `supabase/seed.sql` — Organization, departments, workplace, leave types

### 4. Create seed users

In Supabase Dashboard > Authentication > Users, create these users with the **user metadata** shown:

| Email | Password | User Metadata |
|-------|----------|---------------|
| `admin@oasis.local` | `Admin@12345` | `{"full_name": "Admin User", "role": "admin", "organization_id": "00000000-0000-0000-0000-000000000001"}` |
| `hr@oasis.local` | `HR@12345` | `{"full_name": "HR Manager", "role": "hr", "organization_id": "00000000-0000-0000-0000-000000000001"}` |
| `employee@oasis.local` | `Employee@12345` | `{"full_name": "John Employee", "role": "employee", "organization_id": "00000000-0000-0000-0000-000000000001"}` |

Then run the employee record creation SQL from `supabase/seed.sql` (the commented section at the bottom).

> ⚠️ **These are development-only credentials. Replace before production.**

### 5. Run the app

```bash
# Start Expo dev server
npx expo start

# Specific platforms
npx expo start --web       # Web
npx expo start --android   # Android
npx expo start --ios       # iOS
```

## Project Structure

```
src/
├── app/                    # Expo Router pages
│   ├── (auth)/             # Login, Forgot Password
│   ├── (employee)/         # Employee screens
│   ├── (hr)/               # HR screens
│   ├── (admin)/            # Admin screens
│   ├── _layout.tsx         # Root layout with AuthProvider
│   └── index.tsx           # Entry redirect
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Sidebar, Header
│   ├── attendance/         # Attendance domain components
│   ├── leave/              # Leave domain components
│   └── payroll/            # Payroll domain components
├── hooks/                  # Custom hooks (useAuth, useTheme, etc.)
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── auth.ts             # Auth service
│   └── services/           # Business logic services
├── types/                  # TypeScript types
├── constants/              # Theme, config
└── utils/                  # Formatting utilities
```

## Security

- **Row Level Security** — All tables have RLS enabled
- **Server-side geofence validation** — `clock_in_with_geofence()` and `clock_out_with_geofence()` PostgreSQL functions validate coordinates server-side
- **Role-based access** — Route guards prevent unauthorized access
- **Organization isolation** — Users can only see data from their organization
- **Audit logging** — Admin actions are logged to `audit_logs` table

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@oasis.local | Admin@12345 |
| HR | hr@oasis.local | HR@12345 |
| Employee | employee@oasis.local | Employee@12345 |

## Known Limitations

1. **PDF payslips** — Payslips are rendered as structured views; PDF generation is a post-MVP enhancement
2. **Push notifications** — Not implemented in MVP
3. **Background location tracking** — Not implemented; uses on-demand location for clock in/out
4. **Offline support** — Requires internet connection
5. **File upload for avatars** — Not implemented in MVP; uses initials fallback

## Next Improvements

- PDF payslip generation and download
- Push notifications for leave approvals
- Employee photo upload
- Attendance calendar view
- Monthly/weekly attendance reports
- Bulk payroll import from CSV
- Dark mode toggle in settings
- Multi-language support
