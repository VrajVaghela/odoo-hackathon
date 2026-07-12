# TransitOps – Smart Transport Operations Platform

## Overview

TransitOps is a transport operations platform built for the hackathon challenge to digitize fleet management workflows for logistics organizations. It brings together vehicle registration, driver management, trip dispatching, maintenance tracking, fuel and expense logging, and analytics into one centralized system.

The platform is designed for roles such as Fleet Manager, Driver, Safety Officer, and Financial Analyst, with secure authentication and role-based access control to ensure the right users see the right data.

## Key Features

- Secure authentication and role-based access control
- Vehicle registry and lifecycle management
- Driver profiles with license and safety tracking
- Trip creation and dispatching with validation rules
- Maintenance workflow with automatic vehicle status updates
- Fuel and expense tracking
- Dashboard KPIs and operational analytics
- Reports with export support

## Functional Scope

The solution focuses on core transport operations use cases, including:

- Managing vehicles with statuses such as Available, On Trip, In Shop, and Retired
- Managing drivers with license validity and compliance checks
- Creating and tracking trips with business-rule validation
- Recording maintenance activities and updating fleet availability
- Monitoring fuel, costs, and fleet performance

## Tech Stack

- **Frontend:** React + Vite + TypeScript (Vanilla CSS styling with `ui_tokens.md` values)
- **Backend:** Node.js + Express + TypeScript
- **Database:** Local MySQL 8 with `mysql2/promise` connection pool
- **Authentication:** Local opaque session stored in MySQL; Node crypto password hashing
- **Charts & Analytics:** Native SVG/CSS charts and server-generated CSV
- **Test Runner:** Built-in Node.js test runner (`node --test`)

## Goal

TransitOps aims to replace manual spreadsheets and disconnected workflows with a scalable, modern platform that improves visibility, compliance, and operational efficiency.

---

## Local Setup

Follow these steps to run the TransitOps platform locally.

### 1. Prerequisites
- **Node.js**: v20 or higher
- **MySQL**: v8.0 or higher running locally

### 2. Environment Configuration
Create a `.env` file in `apps/api` with your MySQL credentials. You can copy the template:
```bash
cp .env.example apps/api/.env
```
Ensure that the DB parameters (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`) in `apps/api/.env` match your local MySQL configuration.

### 3. Install Dependencies
From the repository root directory, run:
```bash
npm install
```

### 4. Database Initialization & Seeding
To automatically create the `transitops` database, apply schema migrations, and load the deterministic demo dataset, run:
```bash
npm run db:reset
```

### 5. Running the Application
To start both the backend API server (listening on port 3001) and the frontend Vite server (listening on port 5173) concurrently, run:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser to access the application shell.

---

## Running Tests

To execute the server-side API integration tests and validation rules:
```bash
npm run test
```

---

## Seed Demo Accounts & Roles

TransitOps enforces role-based access control (RBAC). Use the seeded accounts below (all passwords are `password123`) or select them from the **Quick Demo Accounts** grid on the login screen:

1. **Fleet Manager**
   - **Email:** `manager@transitops.com`
   - **Responsibilities:** Registry CRUD, opening/closing maintenance, and general dashboard metrics.
2. **Dispatcher**
   - **Email:** `dispatcher@transitops.com`
   - **Responsibilities:** Managing dispatch operations, drafting/cancelling trips, and assigning drivers/vehicles.
3. **Safety Officer**
   - **Email:** `safety@transitops.com`
   - **Responsibilities:** Driver compliance tracking, monitoring licence expiry dates and safety ratings.
4. **Financial Analyst**
   - **Email:** `finance@transitops.com`
   - **Responsibilities:** Fuel logging, expense entries, CSV exports, and ROI reporting.

---

## Demo Walkthrough Story

To demonstrate the local-first operations workflow, try this scenario:
1. **Login as Dispatcher:** Open the `Trips & Dispatch` page to see the pending trip drafts.
2. **Assign Available Resources:** Open the dispatch configuration panel on `TRP-103`. Select vehicle `KA-01-AA-1111` and driver `John Doe`. Click **Dispatch Trip**.
3. **Confirm Availability Status Update:** Observe that the vehicle and driver status atomically updates to `ON_TRIP`.
4. **Try Over-Capacity Rejection:** Try assigning vehicle `KA-01-AA-1111` to trip `TRP-105`. The system blocks dispatch because the cargo weight (801 kg) exceeds the van's 800 kg capacity.
5. **Complete a Trip:** Mark the dispatched trip as completed, logging actual distance travelled. Watch driver and vehicle return to `AVAILABLE` status.
6. **Open Maintenance as Fleet Manager:** Log in as `manager@transitops.com`. Put a vehicle into the shop. Note how its status changes to `IN_SHOP` and is instantly removed from dispatch availability.
7. **View Financial Summary:** Log in as `finance@transitops.com` and review operational cost charts, fuel efficiency, ROI, and download the full reports sheet as a local CSV.

For the timed owner-based story, reset fallback, and evidence checklist, use `context/team/teammate-4-phase5-demo-runbook.md`.
