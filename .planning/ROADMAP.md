# CampusPulse — Project Roadmap

## Milestone 1: Hackathon MVP Release (v1.0.0)

### Phase 1: Architecture, Product Scope & Data Contracts (Completed)
- **Goal**: Analyze domain requirements, formulate PRD and technical implementation plan, define data schemas, scoring formulas, and UI visual direction.
- **Deliverables**:
  - `docs/PRODUCT_REQUIREMENTS.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `.planning/PROJECT.md`
  - `.planning/config.json`
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
- **Status**: Completed / Ready for Phase 2 Approval.

---

### Phase 2: Scaffolding, Core Ingestion & Deterministic Scoring Engine
- **Goal**: Set up Vite + React + TypeScript + Tailwind development environment, implement CSV reconciliation, data validation, and deterministic scoring algorithms.
- **Key Tasks**:
  1. Initialize Git repository and scaffold Vite + React + Tailwind CSS project.
  2. Implement TypeScript interfaces for all campus data streams.
  3. Implement `dataEngine.ts`: PapaParse wrapper, schema validator, and multi-source reconciler.
  4. Implement `scoringEngine.ts`: Deterministic calculation of ARI, PRI, SSS, and factor contribution lists.
  5. Generate curated 150-student synthetic dataset (`academics.csv`, `attendance.csv`, `lms_activity.csv`, `placement_skills.csv`, `interventions.csv`).
  6. Unit test scoring rules and edge-case handling.
- **Requirements Covered**: `INGEST-01`, `INGEST-02`, `INGEST-03`, `INGEST-04`, `SCORE-01`, `SCORE-02`, `SCORE-03`, `SCORE-04`.

---

### Phase 3: Design System Shell, Navigation & Student Directory
- **Goal**: Build the institutional UI shell, persistent role switcher, universal search, cohort filtering, and high-density student directory table.
- **Key Tasks**:
  1. Configure Tailwind theme with Oxford navy, muted teal, warm slate, and semantic risk tokens.
  2. Implement top navigation bar with term badge, role selector (`Dean`, `Faculty`, `Placement`), and global search (`Cmd+K`).
  3. Build Student Directory table with column sorting, risk badges, and cohort quick-preset tabs.
  4. Build multi-facet filter drawer (department, semester, attendance slider, risk level).
- **Requirements Covered**: `SEARCH-01`, `SEARCH-02`, `SEARCH-03`, `UI-01`, `UI-02`, `UI-03`.

---

### Phase 4: Student 360° Profile, Explainability & Closed-Loop Interventions
- **Goal**: Build the diagnostic deep-dive profile modal/drawer with factor waterfall, and complete the intervention management lifecycle.
- **Key Tasks**:
  1. Build Student 360° Profile drawer displaying academic marks, attendance sparklines, LMS metrics, and placement scores.
  2. Build Explainability Waterfall visualizing positive protective factors vs. negative risk drivers.
  3. Build "Create Intervention" modal with type, priority, assignee, and follow-up deadline.
  4. Build Intervention Tracking Hub (table/kanban board) allowing faculty to update statuses (`Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Escalated`) and log notes.
- **Requirements Covered**: `PROFILE-01`, `PROFILE-02`, `PROFILE-03`, `PROFILE-04`, `INTERVENE-01`, `INTERVENE-02`, `INTERVENE-03`.

---

### Phase 5: Institutional Analytics, Placement Command Center & Demo Polish
- **Goal**: Implement campus-wide executive charts, placement cell upskilling dashboard, data upload studio, and final presentation polish.
- **Key Tasks**:
  1. Build Executive Overview with Recharts (KPI metric cards, department risk vs. readiness matrix, CGPA vs. attendance scatter).
  2. Build Placement Command Center with skills radar, funnel chart, and 0-backlog barrier filter.
  3. Build Data Integration Studio for uploading custom CSV files with validation report and 1-click synthetic benchmark loader.
  4. Implement AI diagnostic synthesis (rule-based templates + optional Gemini Flash fallback).
  5. Complete end-to-end user verification and presentation readiness checklist.
- **Requirements Covered**: `ANALYTICS-01`, `ANALYTICS-02`, `ANALYTICS-03`, `ANALYTICS-04`.
