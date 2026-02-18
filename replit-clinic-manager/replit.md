# Nina - Gestao de Clinicas

## Overview
Full-stack clinic management system with patient registration, scheduling, electronic health records, inventory, financial management, and RBAC.

## Tech Stack
- Frontend: React + TypeScript + Tailwind + Shadcn/ui
- Backend: Express + TypeScript
- Database: PostgreSQL with Drizzle ORM
- Auth: Session-based with bcryptjs

## Project Structure
- `client/src/pages/` - All page components (login, dashboard, pacientes, agenda, etc.)
- `client/src/components/` - Reusable components (app-sidebar, ui/)
- `client/src/lib/` - Utilities (auth context, queryClient)
- `server/` - Express server, routes, storage layer, seed data
- `shared/schema.ts` - Drizzle schema definitions and Zod validation

## Key Features (MVP)
- Authentication with role-based access (ADMIN, RECEPCAO, PROFISSIONAL_SAUDE, FINANCEIRO)
- Patient management (CRUD)
- Collaborator management (CRUD)
- Service/procedure management
- Weekly agenda/calendar view
- Appointment management with status flow
- Electronic health records (prontuario)
- Inventory management with stock alerts
- Financial management (receivables, payables)
- Dashboard with KPIs
- WhatsApp notifications via Z-API (appointment reminders)

## Z-API Integration (WhatsApp)
- Module: `server/zapi.ts` - Handles sending WhatsApp text messages via Z-API REST API
- Triggered on: Appointment creation (POST /api/consultas) - sends reminder to patient
- Secrets required: ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN, ZAPI_CLIENT_TOKEN
- API endpoint: `https://api.z-api.io/instances/{ID}/token/{TOKEN}/send-text`
- Phone format: Auto-prepends country code 55 (Brazil) if not present
- Non-blocking: WhatsApp send failures don't prevent appointment creation
- Response includes `whatsappSent: boolean` to indicate if message was delivered

## Default Credentials
- Admin: admin@nina.com / admin123
- Recepcao: maria@nina.com / user123
- Profissional: carlos@nina.com / user123
- Financeiro: ana@nina.com / user123

## Database
- PostgreSQL via Drizzle ORM
- Schema push: `npm run db:push`
- Auto-seeds on first run

## Security
- Zod validation on all create/update API routes
- RBAC enforcement via middleware on all endpoints
- Session stores user role for authorization checks
- Passwords hashed with bcryptjs

## Running
- `npm run dev` starts the full application
- Frontend binds to port 5000
