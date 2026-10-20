# TechIssue Hub — Complete File & Architecture Guide

This document provides a comprehensive explanation of every file and folder in the **TechIssue Hub** repository, detailing **why each file was created**, **what responsibility it holds**, and **how it fits into the overall system architecture**.

---

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Project Root & Configuration](#1-project-root--configuration)
3. [Database & Prisma ORM Layer (`prisma/`)](#2-database--prisma-orm-layer-prisma)
4. [Application Core Libraries (`src/lib/`)](#3-application-core-libraries-srclib)
5. [Type Definitions (`src/types/`)](#4-type-definitions-srctypes)
6. [Security & Routing Middleware (`src/middleware.ts`)](#5-security--routing-middleware-srcmiddlewarets)
7. [Server Actions / Backend Business Logic (`src/actions/`)](#6-server-actions--backend-business-logic-srcactions)
8. [App Router & Pages (`src/app/`)](#7-app-router--pages-srcapp)
9. [UI Component Architecture (`src/components/`)](#8-ui-component-architecture-srccomponents)
10. [Automated Testing Suite (`tests/`)](#9-automated-testing-suite-tests)
11. [Summary Matrix of System Responsibilities](#10-summary-matrix-of-system-responsibilities)

---

## System Architecture Overview

TechIssue Hub is an **Internal Issue Tracker CRM & Technical Knowledge Base** built with Next.js 14 (App Router), React, TypeScript, Tailwind CSS, and Prisma ORM.

```
                          ┌────────────────────────┐
                          │   Browser / Client     │
                          └───────────┬────────────┘
                                      │
                                      ▼
                        [ src/middleware.ts (Edge) ]
                        (JWT Verification & Route Guard)
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
     [ Page Routes (RSC) ]                         [ Server Actions ]
   (src/app/(dashboard)/...)                       (src/actions/...)
   - Dashboard & Metrics                           - Issue CRUD & Optimistic Locks
   - Issue Workspace Cockpit                       - State Machine Engine
   - Knowledge Base Search                         - Investigation Journal
   - Projects & Reports                            - Resolutions & QA Promotion
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      │
                                      ▼
                             [ Prisma ORM Client ]
                              (src/lib/prisma.ts)
                                      │
                                      ▼
                         [ SQLite / PostgreSQL DB ]
```

---

## 1. Project Root & Configuration

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `package.json` | Project manifest | Declares dependencies (`next`, `react`, `@prisma/client`, `jose`, `bcryptjs`, `recharts`, `lucide-react`, `zod`), development scripts (`dev`, `build`, `start`, `test`, `seed`), and pins Prisma to `5.22.0` for Node 18 compatibility. |
| `package-lock.json` | Dependency lockfile | Locks exact dependency versions for reproducible builds across developer machines and CI/CD pipelines. |
| `tsconfig.json` | TypeScript configuration | Enables TypeScript strict mode (`"strict": true`), ESNext module resolution, and path alias mapping (`"@/*": ["./src/*"]`) for clean, refactor-safe imports. |
| `next.config.mjs` | Next.js runtime configuration | Configures Next.js runtime options, including `serverActions.bodySizeLimit: '30mb'` to allow diagnostic file uploads (HAR files, logs, heap dumps). |
| `tailwind.config.ts` | Tailwind CSS configuration | Defines the content scanning paths (`./src/**/*.{js,ts,jsx,tsx,mdx}`) and design tokens for custom colors, badges, and layout utilities. |
| `postcss.config.mjs` | CSS post-processing pipeline | Configures Tailwind CSS and Autoprefixer to compile modern CSS with cross-browser vendor prefixes. |
| `docker-compose.yml` | Containerized database setup | Provisions a local production-grade PostgreSQL 16 database container with persistent volume mounts for enterprise deployment. |
| `.env` | Environment configuration | Stores environment secrets including `DATABASE_URL` (SQLite file or PostgreSQL connection URI) and `JWT_SECRET` for stateless cookie encryption. |
| `PROJECT_REQUIREMENTS.md` | Functional specifications | Complete project requirements documentation detailing all 12 implementation phases, workflows, and diagnostic criteria. |
| `IMPLEMENTATION_WALKTHROUGH.md` | Technical audit & runbook | Step-by-step verification guide detailing all completed phases, test credentials, verification steps, and test results. |
| `README.md` | Quickstart documentation | Developer onboarding instructions, installation steps, seed credentials, and project overview. |

---

## 2. Database & Prisma ORM Layer (`prisma/`)

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `prisma/schema.prisma` | PostgreSQL production schema | Primary data model definition defining 17 normalized entities: `User`, `Department`, `Category`, `Project`, `ProjectMember`, `Issue`, `InvestigationJournal`, `IssueResolution`, `IssueVerification`, `KnowledgeBaseArticle`, `Comment`, `Attachment`, `IssueRelation`, `ActivityLog`, `Notification`, and `SystemSequence`. |
| `prisma/schema.sqlite.prisma` | Local zero-config SQLite schema | Identical schema structure adapted for SQLite (`file:./dev.db`), allowing full local development and testing without requiring Docker or a running PostgreSQL daemon. |
| `prisma/dev.db` | Local SQLite database file | Active development database storing seeded departments, users, projects, issues, journals, and knowledge base articles. |
| `prisma/seed.ts` | Database seeder script | Seeds the database with: <br>• 7 Engineering Departments (Frontend, Backend, SEO, Performance, DevOps, QA, Desktop)<br>• 40+ Categorized defect types<br>• 5 Test Users with role-based credentials (Admin, PM, Dev, QA, DevOps)<br>• 3 Initial Projects<br>• Fully populated demo issues (`ISS-2026-0001`, `ISS-2026-0002`, `ISS-2026-0003`) containing real diagnostic logs, hypotheses, failed attempts, and permanent resolutions. |

---

## 3. Application Core Libraries (`src/lib/`)

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `src/lib/prisma.ts` | Prisma Client Singleton | Implements the global singleton pattern for `PrismaClient` to prevent connection exhaustion and memory leaks during Next.js hot-reloading in development. |
| `src/lib/auth.ts` | Stateless JWT & Session Utility | Handles password hashing and comparison via `bcryptjs`, issues signed JSON Web Tokens via `jose`, and manages secure, httpOnly, sameSite cookies (`techissue_session`). |
| `src/lib/rbac.ts` | Role-Based Access Control Matrix | Centralized security policy defining permissions (`canCreateIssue`, `canTransitionStatus`, `canVerifyIssue`, `canManageProjects`, `canViewInternalNotes`, `canPromoteToKB`) mapped to roles (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `QA_TESTER`, `DEVOPS`, `SEO_TEAM`). |
| `src/lib/issue-number.ts` | Concurrency-Safe Sequence Generator | Generates predictable, human-readable issue identifiers formatted as `ISS-YYYY-####` (e.g., `ISS-2026-0001`) backed by an atomic database counter in `SystemSequence`. |

---

## 4. Type Definitions (`src/types/`)

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `src/types/index.ts` | Domain TypeScript Interfaces | Central TypeScript declarations including `SessionUser`, `NavigationItem`, `IssueFilterParams`, `IssueDetailWithRelations`, and state transition payloads used across client components and server actions. |

---

## 5. Security & Routing Middleware (`src/middleware.ts`)

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `src/middleware.ts` | Edge Route Guard | Next.js Edge Middleware that runs before every request: <br>• Verifies the `techissue_session` cookie.<br>• Redirects unauthenticated users trying to access dashboard routes to `/login?callbackUrl=...`.<br>• Redirects already-authenticated users trying to access `/login` back to `/dashboard`.<br>• Passes user session headers to downstream server components. |

---

## 6. Server Actions / Backend Business Logic (`src/actions/`)

All backend mutations and database operations are implemented using **Next.js Server Actions** with full server-side validation and security checks:

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `src/actions/auth.ts` | Authentication actions | Handles user login credentials, provides 1-click test role sign-in helpers, and handles secure cookie invalidation upon logout. |
| `src/actions/issues.ts` | Issue CRUD & Concurrency | Creates, updates, and deletes issues; performs multi-criteria filtering and pagination; enforces optimistic locking via the `version` counter to prevent mid-air collision overwrites. |
| `src/actions/lifecycle.ts` | State Machine Enforcement | Server-side lifecycle state machine governing valid status progressions (`OPEN` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `VERIFIED` &rarr; `CLOSED` or `BLOCKED`/`REOPENED`); automatically creates tamper-evident entries in `ActivityLog`. |
| `src/actions/investigations.ts` | Diagnostic Journal Engine | Records step-by-step diagnostic sessions for an issue: symptoms observed, tools used (Chrome DevTools, Wireshark, pprof, EXPLAIN ANALYZE), hypotheses tested, findings, and explicitly documents **failed attempts / dead ends** to prevent team members from repeating futile fixes. |
| `src/actions/resolutions.ts` | Resolution & Verification | Captures Root Cause Analysis (RCA), permanent code fixes, interim workarounds, files changed, database migrations, and regression prevention tests. Governs QA sign-off (pass/fail verification) and 1-click promotion to the Knowledge Base. |
| `src/actions/comments.ts` | Timeline & Discussion | Adds comments to issue timelines; supports an **Internal Team Note** toggle that restricts visibility to internal engineers while keeping general comments open. |
| `src/actions/attachments.ts` | Secure File Ingestion | Validates uploaded diagnostic files (max 25MB; logs, SQL dumps, HAR files, screenshots, traces), stores files safely on disk, and records metadata in the database. |
| `src/actions/relations.ts` | Dependency & Duplicate Graph | Manages bidirectional issue linkages: `BLOCKS`, `IS_BLOCKED_BY`, `DUPLICATES`, `IS_DUPLICATED_BY`, and `RELATES_TO`, preventing circular dependencies and warning when active blockers exist. |
| `src/actions/duplicate.ts` | Real-time Duplicate Scanner | Scans open and resolved issues in real-time as users type defect titles/descriptions, displaying matching issues and verified permanent fixes to prevent duplicate reporting. |
| `src/actions/kb.ts` | Knowledge Base Engine | Full-text search and filtering across verified solutions, RCAs, and post-mortems categorized by department, category, and keywords. |
| `src/actions/dashboard.ts` | Executive KPIs & Aggregations | Calculates live metrics: total open defects, in-progress count, pending QA verification queue, resolved/closed counts, department distribution, and severity breakdown. |
| `src/actions/notifications.ts` | Notification Dispatcher | Fetches unread notifications for the active user, marks individual notifications as read, or marks all notifications as read in 1 click. |
| `src/actions/projects.ts` | Project Administration | Creates and edits engineering projects, manages project member assignments, and calculates project defect load. |
| `src/actions/departments.ts` | Department Taxonomy | Fetches the 7 engineering departments and their corresponding diagnostic categories. |
| `src/actions/team.ts` | Team Directory | Queries users by department, displays role badges, email contacts, and team rosters. |
| `src/actions/reports.ts` | Analytics & RCA Archive | Calculates Mean Time to Resolution (MTTR) by department, QA verification pass rates, and compiles the post-mortem RCA report archive. |

---

## 7. App Router & Pages (`src/app/`)

Next.js App Router handles server-side rendering (SSR), layout nesting, and streaming:

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `src/app/layout.tsx` | Root Application Layout | HTML wrapper defining document metadata, loading Geist font variables, and injecting `globals.css`. |
| `src/app/globals.css` | Global Styling & Custom Scrollbars | Tailwind CSS imports, base font definitions, and custom modern scrollbar styles (`.custom-scrollbar-dark`, `.custom-scrollbar-light`, `.no-scrollbar`) replacing OS scrollbars. |
| `src/app/page.tsx` | Entry Redirector | Root route handler that automatically checks session cookies and redirects authenticated users to `/dashboard` or guests to `/login`. |
| `src/app/login/page.tsx` | Authentication Page | Login screen featuring email/password inputs and 1-click test credential buttons for immediate role testing (Admin, PM, Dev, QA, DevOps). |
| `src/app/(dashboard)/layout.tsx` | Authenticated Shell Layout | Enforces authentication check, wraps child pages inside the persistent sidebar, top navigation bar, and command palette (`⌘K`). |
| `src/app/(dashboard)/dashboard/page.tsx` | KPI Overview & Metrics | Visual cockpit displaying metric cards, Recharts workload bar chart, severity distribution donut chart, and high-priority issue table. |
| `src/app/(dashboard)/issues/page.tsx` | Master Issue Tracker | Full issue catalog featuring live search, department/priority/status filters, pagination, and sorting. |
| `src/app/(dashboard)/issues/create/page.tsx` | Issue Creation Wizard | Form for reporting defects with expected/actual behavior, reproduction steps, environment details, and real-time duplicate warning scanner. |
| `src/app/(dashboard)/issues/[id]/page.tsx` | Comprehensive Issue Cockpit | Central tabbed workspace for an issue: Overview, Investigation Journal, Resolution & RCA, Comments & Audit Trail, Attachments, and Dependency Graph. |
| `src/app/(dashboard)/issues/[id]/edit/page.tsx` | Issue Edit Form | Allows editing defect details with server-enforced optimistic locking to avoid overwriting concurrent edits. |
| `src/app/(dashboard)/assigned-to-me/page.tsx` | Personal Task Queue | Scoped issue table displaying defects assigned directly to the authenticated user. |
| `src/app/(dashboard)/my-issues/page.tsx` | Reporter Queue | Scoped issue table displaying defects originally submitted by the authenticated user. |
| `src/app/(dashboard)/knowledge-base/page.tsx` | Technical Knowledge Base | Searchable repository of verified solutions, RCAs, and post-mortems for cross-team technical solution reuse. |
| `src/app/(dashboard)/projects/page.tsx` | Projects Directory | Grid of engineering projects displaying active defect counts, resolved counts, and project health indicators. |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Project Detail Workspace | Project cockpit with member list, resolution velocity ratio, active defect load, and project-scoped issue queue. |
| `src/app/(dashboard)/team/page.tsx` | Team & Department Directory | Department taxonomy breakdown, category badges, and engineer roster. |
| `src/app/(dashboard)/reports/page.tsx` | Engineering Intelligence | Mean Time to Resolution (MTTR) by department, QA pass rate progress, and searchable RCA archive. |
| `src/app/(dashboard)/settings/page.tsx` | System Governance | System health overview, database engine status, and comprehensive RBAC permission matrix display. |
| `src/app/api/attachments/[id]/route.ts` | Authenticated File Streaming API | Protected route streaming uploaded diagnostic files with `X-Content-Type-Options: nosniff` and access control. |

---

## 8. UI Component Architecture (`src/components/`)

### Layout Components (`src/components/layout/`)
- `dashboard-shell.tsx`: Master layout wrapper managing mobile drawer state, sidebar collapse, and header responsiveness.
- `sidebar.tsx`: Sticky dark navigation sidebar with department badges, workspace links, active route highlights, `.custom-scrollbar-dark`, and current user session drawer.
- `header.tsx`: Top bar featuring breadcrumb navigation, quick search shortcut trigger (`⌘K`), notification bell, and "+ Report Issue" button.
- `command-palette.tsx`: Global search modal (`⌘K` or `Ctrl+K`) for keyboard-driven navigation across all system views and quick actions.
- `breadcrumbs.tsx`: Dynamic hierarchy trail automatically parsed from the current URL path.
- `notification-bell.tsx`: Real-time notification badge and interactive dropdown list with 1-click "Mark all as read".

### Issue Management Components (`src/components/issues/`)
- `issue-table.tsx`: Interactive issue list with multi-column sorting, pagination, role-based action buttons, and empty states.
- `create-issue-form.tsx`: Comprehensive defect reporting form with live duplicate detector debouncing user input.
- `edit-issue-form.tsx`: Issue modification form equipped with optimistic locking validation.
- `status-badge.tsx`: Visual status pills with distinct color-coding (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `VERIFIED`, `CLOSED`, `BLOCKED`, `REOPENED`).
- `priority-badge.tsx`: Visual severity badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with indicator icons.
- `status-transition-bar.tsx`: Quick transition action bar enforcing valid lifecycle progressions with required audit note inputs.
- `investigation-journal.tsx`: Diagnostic timeline allowing engineers to record symptoms, hypotheses, tools, findings, and *failed attempts / dead ends*.
- `resolution-section.tsx`: RCA documentation, permanent solution code snippets, workaround instructions, and QA verification sign-off controls.
- `comments-timeline.tsx`: Threaded discussion component supporting normal comments and private internal team notes.
- `attachments-section.tsx`: Drag-and-drop diagnostic file uploader with file type validation, size limits, and download controls.
- `relations-section.tsx`: Visual dependency tree and active blocker alerts for linked issues.

### Dashboard & Analytics Components (`src/components/dashboard/`)
- `dashboard-charts.tsx`: Responsive Recharts visualizer rendering:
  1. Department Defect Load (Bar Chart with HSL palette)
  2. Severity Distribution Breakdown (Donut Chart)

### Knowledge Base Components (`src/components/kb/`)
- `kb-browser.tsx`: High-performance instant search interface for verified technical solutions with department filters and tabbed RCA code views.

### Project Components (`src/components/projects/`)
- `create-project-dialog.tsx`: Modal dialog for creating new engineering projects with department associations and git repository URLs.

---

## 9. Automated Testing Suite (`tests/`)

| File | Why It Was Created | Key Responsibility & Uses |
| :--- | :--- | :--- |
| `tests/core-domain.test.ts` | Automated Domain Test Suite | Standalone automated test runner executed via `npm test` verifying 9 mission-critical business logic rules: <br>• **RBAC Permissions**: Verifies Admin, Dev, and QA permission gates.<br>• **Lifecycle State Machine**: Validates legal state transitions and asserts that illegal transitions (e.g. `CLOSED` &rarr; `RESOLVED`) are rejected.<br>• **Relation Symmetry**: Verifies that linking an issue as `BLOCKS` creates a symmetric `IS_BLOCKED_BY` reverse relationship. |

---

## 10. Summary Matrix of System Responsibilities

```
┌─────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Layer                   │ Primary Source Files                                                   │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Data Architecture       │ prisma/schema.prisma, prisma/schema.sqlite.prisma, prisma/seed.ts      │
│ Security & RBAC         │ src/middleware.ts, src/lib/auth.ts, src/lib/rbac.ts                    │
│ Business Logic          │ src/actions/issues.ts, src/actions/lifecycle.ts, src/actions/kb.ts     │
│ Diagnostic Engine       │ src/actions/investigations.ts, src/components/investigation-journal.tsx│
│ Resolution & QA         │ src/actions/resolutions.ts, src/components/resolution-section.tsx      │
│ Relations & Blockers    │ src/actions/relations.ts, src/components/relations-section.tsx         │
│ Knowledge Base          │ src/actions/kb.ts, src/app/knowledge-base/page.tsx, kb-browser.tsx     │
│ UI & Design System      │ src/app/globals.css, src/components/layout/sidebar.tsx, header.tsx    │
│ Verification & Tests    │ tests/core-domain.test.ts (npm test: 9/9 passing)                      │
└─────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```
