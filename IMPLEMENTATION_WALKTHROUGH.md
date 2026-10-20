# TechIssue Hub — Implementation Walkthrough & Feature Guide

**TechIssue Hub** is a full-featured, enterprise-grade internal issue tracker CRM and technical knowledge base for engineering organizations.

---

## 1. Quick Start & Access

The production application is running locally on:
**[http://localhost:3000](http://localhost:3000)**

### Pre-Configured Test Credentials
For immediate testing across different departmental perspectives, the sign-in page ([`/login`](http://localhost:3000/login)) features **1-click quick-fill role selector buttons**:

| Role | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@techissuehub.local` | `ChangeMeOnFirstLogin2026!` | Global administrative access across all 7 departments |
| **Lead PM** | `pm@techissuehub.local` | `ChangeMeOnFirstLogin2026!` | Project planning, issue triage, and lifecycle management |
| **Senior Dev** | `dev@techissuehub.local` | `ChangeMeOnFirstLogin2026!` | Code fixes, diagnostic entries, and resolution submissions |
| **QA Lead** | `qa@techissuehub.local` | `ChangeMeOnFirstLogin2026!` | Verification checklists, regression testing, QA sign-off |
| **DevOps Eng** | `devops@techissuehub.local` | `ChangeMeOnFirstLogin2026!` | Infrastructure, Docker, CI/CD, and DB connection pooling |

---

## 2. Complete Capabilities Across All 12 Phases

### Phase 1 & 2: Foundations, RBAC & Layout
- **7 Engineering Departments**: Frontend, Backend, SEO & Search Crawling, Performance & Optimization, DevOps & Infrastructure, Quality Assurance, and Desktop/Electron.
- **40+ Pre-Configured Categories**: UI Component Bug, Hydration Mismatch, REST API Failure, Robots.txt Indexing, Memory Leaks, Docker Healthcheck, Playwright Flaky Test, etc.
- **Collapsible Sidebar & Command Palette**: Global quick search shortcut (`⌘K` / `Ctrl+K`) for fast navigation between issues, projects, and knowledge base articles.

### Phase 3: Project & Issue Management Core
- **Atomic Concurrency-Safe Sequencing**: Generates sequential identifiers in the format `ISS-YYYY-####` (e.g. `ISS-2026-0001`).
- **Comprehensive Technical Diagnostics**: Captures expected vs actual behavior, reproduction steps, raw stack traces/error messages, affected URL, Git branch, PR URL, and commit SHA.
- **Optimistic Locking**: Every issue update verifies version counter to prevent concurrent overwrite collisions.

### Phase 4: Technical Investigation & Resolution Engine
- **Diagnostic Investigation Journal** ([`src/components/issues/investigation-journal.tsx`](src/components/issues/investigation-journal.tsx)):
  - Structured fields: Observed symptom, Working hypothesis, Diagnostic steps, Tools used (DevTools, APM, Wireshark, etc.), Findings, and Conclusions.
  - **Dead End Prevention**: Dedicated tracking of *Failed Attempts* to prevent engineers from repeating invalid hypotheses.
- **Permanent Resolution Documentation** ([`src/components/issues/resolution-section.tsx`](src/components/issues/resolution-section.tsx)):
  - Root cause analysis, permanent code fix, immediate workaround, files changed, database schema changes, deployment instructions, regression prevention, and QA checklist.
- **QA Verification Sign-Off**:
  - Formal review mechanism for QA and PM roles: approve or reject with audit notes.
  - 1-click option to promote verified resolutions into the corporate Technical Knowledge Base.

### Phase 5: Issue Lifecycle State Machine & Activity Auditing
- **Strict State Transitions**: Enforces valid progression from `OPEN` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED` → `CLOSED` (with `BLOCKED`, `REOPENED`, and `DUPLICATE` branches).
- **Append-Only Activity Audit Stream** ([`src/components/issues/comments-timeline.tsx`](src/components/issues/comments-timeline.tsx)):
  - Unified chronological stream combining human comments (with private "Internal Team Note" toggle) and automated system audits (status transitions, assignments, resolutions).

### Phase 6: Knowledge Base & Real-Time Duplicate Search
- **Searchable Knowledge Base** ([`/knowledge-base`](http://localhost:3000/knowledge-base)):
  - Full-text search across confirmed root causes, permanent solutions, workarounds, and stack traces.
  - Department filter dropdown and quick-topic pills (Hydration, Prisma, Docker, Memory Leak, etc.).
  - Expandable solution accordions revealing code and database changes.
- **Pre-Creation Duplicate Detector** ([`/issues/create`](http://localhost:3000/issues/create)):
  - Real-time debounced search while typing issue titles.
  - Alerts the reporter if similar active issues or existing verified solutions already exist before filing a duplicate ticket.

### Phase 7: Analytics Dashboard & Notifications
- **Live KPI Counters** ([`/dashboard`](http://localhost:3000/dashboard)): Active Open, In Progress, Awaiting QA, and Verified/Closed counts.
- **Recharts Analytics**: Dynamic department volume bar chart and priority distribution donut chart.
- **In-App Notification Bell** ([`src/components/layout/notification-bell.tsx`](src/components/layout/notification-bell.tsx)):
  - Real-time unread badge, dropdown list of ticket assignments and resolution sign-offs, and 1-click "Mark all read" action.

### Phase 8: Team Directory & Incident Reports
- **Engineering Directory** ([`/team`](http://localhost:3000/team)): Overview of all 7 departments, categories, active issue loads, and engineer profiles.
- **RCA & Incident Retrospective** ([`/reports`](http://localhost:3000/reports)): Mean Time to Resolution (MTTR) by department, QA verification pass rate, and root cause analysis archive.

### Phase 9: Secure File & Diagnostic Attachments Engine (NEW)
- **Private Attachment Storage** ([`src/actions/attachments.ts`](src/actions/attachments.ts)):
  - Safe file upload handling supporting screenshots, memory profiles, error logs, HAR network captures, SQL dumps, PDFs, and ZIP archives up to 25MB.
- **Authenticated Streaming API Route** ([`/api/attachments/[id]`](src/app/api/attachments/[id]/route.ts)):
  - Zero public URL exposure; strictly validates session tokens, enforces `X-Content-Type-Options: nosniff`, and streams files with dynamic inline/attachment content disposition.
- **Interactive UI** ([`src/components/issues/attachments-section.tsx`](src/components/issues/attachments-section.tsx)):
  - Drag-and-drop dropzone, file type icons, size formatting (KB/MB), in-browser downloads, and permission-gated deletion.

### Phase 10: Issue Relations, Dependencies & Duplicate Linking Graph (NEW)
- **Bidirectional Relationship Manager** ([`src/actions/relations.ts`](src/actions/relations.ts)):
  - Links issues via `BLOCKS`, `IS_BLOCKED_BY`, `DUPLICATES`, `IS_DUPLICATED_BY`, and `RELATES_TO`.
  - Automatically maintains symmetrical inverse relations across linked tickets.
- **Visual Blocker Warnings** ([`src/components/issues/relations-section.tsx`](src/components/issues/relations-section.tsx)):
  - Visual hierarchy grouping blockers, dependent tasks, and duplicate tickets.
  - Unresolved blockers display red warning indicators alerting assignees to upstream delays.

### Phase 11: Project Detail Workspace & Health Metrics (NEW)
- **Dedicated Project Workspaces** ([`/projects/[id]`](src/app/projects/[id]/page.tsx)):
  - Comprehensive project cockpit showing live project health, resolution velocity ratio, active defect load, and governance details.
  - Project members list and project-filtered issues queue with 1-click navigation.

### Phase 12: Automated Domain & Security Test Suite (NEW)
- **Automated Test Suite** ([`tests/core-domain.test.ts`](tests/core-domain.test.ts)):
  - Executable via `npm test` with 9 passing tests covering RBAC permission matrix checks, state machine transition validity, and relationship symmetry.
