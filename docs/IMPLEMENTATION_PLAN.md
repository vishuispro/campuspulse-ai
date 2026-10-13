# CampusPulse — Student Success Intelligence Platform
## Technical Implementation Plan

**Version:** 1.0.0  
**Target Delivery:** 24-Hour Hackathon Delivery Plan  
**Architecture Lead:** Senior Software Architect & Product Designer  

---

## 1. Repository Status & Baseline Analysis

### 1.1 Existing Repository Audit
* **Workspace Path:** `/Users/vishwanath/hackxlerate /campus`
* **Current Contents:** Empty directory (0 files, no Git repository initialized).
* **System Environment:**
  - Node.js: `v24.18.0` (active)
  - npm: `11.16.0` (active)
  - Python: `3.9.6` (available)
  - Operating System: macOS (Darwin)

### 1.2 Implications & Reusability Assessment
* **Zero Legacy Debt:** Because the workspace is fresh, there are no deprecated frameworks, broken configurations, or conflicting dependencies to untangle.
* **Architecture Freedom:** We can immediately scaffold a clean, modern, type-safe architecture designed specifically for high responsiveness, zero runtime failure during live judging, and immediate local portability.
* **No Unnecessary Overhead:** We do not need heavy multi-tier database configurations (e.g., PostgreSQL + Docker) that introduce friction or latency during a 24-hour hackathon. All data models, validation engines, and scoring algorithms can run on a high-performance in-memory client engine backed by browser persistence (`localStorage` / `IndexedDB`), with seamless export/import.

---

## 2. Recommended System Architecture

```
+-----------------------------------------------------------------------------------+
|                           CampusPulse Client Architecture                         |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Presentation Layer - React 18+ / Tailwind CSS / Lucide / Recharts]              |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Executive Overview |  | Directory & Matrix   |  | Student 360 Profile       |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Placement Hub      |  | Intervention Manager |  | Data Integration Studio   |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  [State & Controller Layer - Zustand / React Context]                            |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | StudentStore       |  | FilterCohortStore    |  | InterventionStore         |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  [Domain Core - Pure TypeScript Engine]                                           |
|  +-----------------------------------------------------------------------------+  |
|  |  Data Engine & CSV Ingestion (PapaParse + Multi-File Reconciliation)        |  |
|  |  Data Validation & Anomaly Detection (Missing IDs, bounds checking)         |  |
|  |  Transparent Explainable Scoring Engine (ARA, PRA, SSS with Factor Weights)  |  |
|  |  Prescriptive Intervention Recommendation Rules                            |  |
|  |  AI Synthesis Layer (Rule-Based Fallback + Optional Gemini Flash API)       |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  [Persistence & Mock Data Layer]                                                  |
|  +-------------------------------------+  +------------------------------------+  |
|  | Synthetic Campus Generator (150 rec)|  | LocalStorage Persistence Store     |  |
|  +-------------------------------------+  +------------------------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 2.1 Technology Stack Selection
1. **Build Tool & Framework**: **Vite + React (TypeScript)**
   - *Rationale*: Sub-second build times, instant HMR, bulletproof typing, zero server configuration needed.
2. **Styling & Design System**: **Tailwind CSS + Tailwind Animate**
   - *Rationale*: Precision design tokens for warm slate-white, deep navy (`#0F172A`), muted teal (`#0D9488`), and controlled semantic risk accents.
3. **Data Visualization**: **Recharts**
   - *Rationale*: Production-standard SVG charting, responsive containers, accessible tooltips, easy composition of quadrant scatters, progress waterfalls, and trend sparklines.
4. **Data Ingestion Engine**: **PapaParse**
   - *Rationale*: Blazing-fast client-side CSV parsing with robust handling of malformed headers, quotes, and empty rows.
5. **State Management**: **Zustand**
   - *Rationale*: Minimal boilerplate, decoupled from React lifecycle, instantaneous reactive updates across filters, student selection, and intervention mutations.
6. **AI Explanation & Synthesis**: **Deterministic Heuristic Template Engine + Google Gemini SDK**
   - *Rationale*: 100% demo resilience. The platform computes mathematical factors and diagnostic insights deterministically without external API dependencies. If a Gemini API key is supplied via `VITE_GEMINI_API_KEY`, it elevates these factors into executive narrative briefs.

---

## 3. Data Schema & Integration Model

### 3.1 Source File Schemas

```typescript
// 1. Academics
export interface RawAcademicRecord {
  student_id: string;
  name: string;
  department: 'Computer Science' | 'Information Science' | 'Electronics' | 'Mechanical';
  semester: number; // 1 to 8
  cgpa: number; // 0.0 to 10.0
  internal_midterm_pct: number; // 0 to 100
  backlogs_count: number; // integer >= 0
  mentor_name: string;
}

// 2. Attendance
export interface RawAttendanceRecord {
  student_id: string;
  overall_attendance_pct: number; // 0 to 100
  lab_attendance_pct: number; // 0 to 100
  trend_last_30_days: 'improving' | 'stable' | 'declining';
  days_absent_consecutive: number;
}

// 3. LMS Activity
export interface RawLMSActivityRecord {
  student_id: string;
  weekly_login_frequency: number; // logins / week
  assignment_submission_rate: number; // 0 to 100%
  forum_engagement_score: number; // 0 to 100
  video_lecture_completion_pct: number; // 0 to 100
}

// 4. Placement & Skills
export interface RawPlacementRecord {
  student_id: string;
  coding_assessment_score: number; // 0 to 100
  aptitude_reasoning_score: number; // 0 to 100
  mock_interview_rating: number; // 1.0 to 5.0
  projects_count: number;
  resume_verified: boolean;
  opt_in_placement: boolean;
}

// 5. Interventions Log
export interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  type: 'Academic Tutoring' | 'Attendance Counseling' | 'Placement Upskilling' | 'Dean Advisory' | 'Wellness Check';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  assigned_to: string;
  created_at: string; // ISO date
  target_follow_up_date: string; // ISO date
  notes: string;
  outcome_notes?: string;
}
```

### 3.2 Unified Student Profile Entity
```typescript
export interface UnifiedStudent {
  id: string;
  name: string;
  department: string;
  semester: number;
  mentorName: string;
  
  // Raw Aggregates
  academic: RawAcademicRecord;
  attendance: RawAttendanceRecord;
  lms: RawLMSActivityRecord;
  placement: RawPlacementRecord;
  
  // Computed Intelligence Scores (0-100)
  academicRiskScore: number; // 0 (healthy) - 100 (critical risk)
  academicRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  
  placementReadinessScore: number; // 0 (unprepared) - 100 (tier-1 ready)
  placementReadinessTier: 'Tier-1 Ready' | 'Tier-2 Ready' | 'Needs Upskilling' | 'At Risk';
  
  studentSuccessScore: number; // 0 (failing) - 100 (thriving)
  
  // Explainability Signals
  riskFactors: ContributingFactor[];
  readinessFactors: ContributingFactor[];
  recommendedInterventions: RecommendedAction[];
  
  // Associated Case Management
  interventions: Intervention[];
  
  // Hygiene & Audit metadata
  dataIntegrityStatus: 'complete' | 'missing_fields' | 'imputed';
}

export interface ContributingFactor {
  indicator: string;
  impactScore: number; // e.g. -20 or +15
  category: 'academic' | 'attendance' | 'lms' | 'skills';
  nature: 'negative_risk' | 'positive_protective';
  description: string;
}

export interface RecommendedAction {
  actionType: Intervention['type'];
  urgency: 'high' | 'medium' | 'low';
  title: string;
  justification: string;
}
```

---

## 4. Mathematical Scoring Model & Explainability Engine

To honor the product requirement of **transparent, defensible scoring rules without fabricated ML claims**, the model calculates deterministic, weighted index scores with clear attribution.

### 4.1 Academic Risk Index (ARI, 0–100)
Measures the likelihood of academic probation, exam debarment, or course failure. **Higher = More Risk.**

$$\text{ARI} = \min\left(100, \max\left(0, \sum w_i \cdot f_i\right)\right)$$

* **Attendance Penalty ($w_{\text{att}} = 35\%$ weight)**:
  - If Attendance $\ge 85\%$: 0 risk points
  - If $75\% \le \text{Attendance} < 85\%$: $+15$ risk points
  - If $65\% \le \text{Attendance} < 75\%$: $+30$ risk points (Mandatory University Shortfall warning)
  - If Attendance $< 65\%$: $+35$ risk points (Immediate Debarment threshold)
  - If 30-day trend is `declining`: $+5$ additional penalty points
* **Arrears / Backlogs Penalty ($w_{\text{backlog}} = 25\%$ weight)**:
  - 0 backlogs: 0 risk points
  - 1 backlog: $+12$ risk points
  - 2 backlogs: $+20$ risk points
  - $\ge 3$ backlogs: $+25$ risk points
* **Midterm / Internal Assessment Penalty ($w_{\text{midterm}} = 25\%$ weight)**:
  - Internal mark $\ge 70\%$: 0 risk points
  - $55\% \le \text{Internal} < 70\%$: $+10$ risk points
  - $40\% \le \text{Internal} < 55\%$: $+18$ risk points
  - Internal $< 40\%$: $+25$ risk points
* **LMS Disengagement Penalty ($w_{\text{lms}} = 15\%$ weight)**:
  - Assignment rate $< 60\%$: $+10$ risk points
  - Weekly logins $< 2$: $+5$ risk points

**Risk Bands:**
- `0–29`: **Low Risk** (Normal academic standing)
- `30–54`: **Moderate Risk** (Advisory watchlist)
- `55–74`: **High Risk** (Mentor intervention required)
- `75–100`: **Critical Risk** (Immediate Dean & Guardian review)

### 4.2 Placement Readiness Index (PRI, 0–100)
Evaluates industry hiring eligibility. **Higher = Better Prepared.**

$$\text{PRI} = \text{CodingScore} \times 0.35 + \text{AptitudeScore} \times 0.25 + (\text{MockRating} \times 20) \times 0.20 + \text{Bonus/Deductions}$$

* **Gatekeeping Disqualifiers**:
  - If Active Backlogs $> 0$: Cap PRI at a maximum of $50$ (Most campus recruiters enforce a zero-backlog eligibility rule).
  - If Resume not verified: $-10$ penalty points.
* **Readiness Tiers:**
  - `80–100`: **Tier-1 Ready** (Eligible for top product/core companies)
  - `65–79`: **Tier-2 Ready** (Eligible for mass/IT recruitment)
  - `45–64`: **Needs Upskilling** (Specific gaps in coding or interview ratings)
  - `< 45`: **At Risk / Ineligible** (Foundational skills or backlog barrier)

### 4.3 Student Success Score (SSS, 0–100)
A single composite indicator representing overall student flourishing:

$$\text{SSS} = \text{round}\left((100 - \text{ARI}) \times 0.55 + \text{PRI} \times 0.45\right)$$

* Provides a single, intuitive institutional barometer where **100 is peak success**.

---

## 5. UI Architecture & Cohesive Visual Direction

### 5.1 Visual Direction & Design Tokens
* **Institutional Restraint**: Moving away from dark-neon gamer UI or bloated SaaS cards. We adopt an editorial, high-trust academic design language.
* **Palette Configuration**:
  ```css
  /* Primary Slate Chrome */
  --bg-canvas: #F8FAFC;       /* Warm Slate 50 */
  --bg-surface: #FFFFFF;      /* Clean White Card */
  --border-subtle: #E2E8F0;   /* Slate 200 */
  --text-main: #0F172A;       /* Slate 900 */
  --text-muted: #64748B;      /* Slate 500 */
  
  /* Brand & Navigation */
  --brand-navy: #0F2744;      /* Deep Oxford Navy */
  --brand-teal: #0D9488;      /* Academic Intelligence Teal */
  --brand-teal-light: #CCFBF1;/* Subtle highlight */
  
  /* Semantic Risk Tokens */
  --risk-critical: #DC2626;   /* Crimson 600 */
  --risk-critical-bg: #FEF2F2;
  --risk-high: #EA580C;       /* Orange 600 */
  --risk-high-bg: #FFF7ED;
  --risk-moderate: #D97706;   /* Amber 600 */
  --risk-moderate-bg: #FFFBEB;
  --risk-low: #059669;        /* Forest Sage 600 */
  --risk-low-bg: #ECFDF5;
  ```
* **Typography**: Clean system stack featuring **Inter / Plus Jakarta Sans**, using standard tabular numerals (`font-variant-numeric: tabular-nums`) for aligned grade and attendance figures.

### 5.2 Application Page Hierarchy
1. **Top Navigation Bar**:
   - Institutional branding (`CampusPulse`), active academic term badge (`Fall 2026`), role switcher pill (`Dean/Admin`, `Faculty Advisor`, `Placement Cell`), quick search shortcut (`Cmd+K`), and dataset status badge.
2. **Main Views**:
   - **Tab 1: Campus Executive Overview**
     - Global KPI Bar (Total Students, Mean SSS, Critical Risk Count, Placement Ready Count).
     - Departmental Risk vs. Readiness comparative matrix.
     - Scatter Quadrant: CGPA vs. Attendance with Risk Density.
     - Live Interventions KPI pipeline.
   - **Tab 2: Student Directory & Risk Matrix**
     - Segment tabs: `All Students`, `Critical Watchlist`, `Attendance Defaulters (<75%)`, `Placement Blocked`, `Healthy Cohort`.
     - Multi-column data table with sorting, department filter dropdown, search input, and risk badges.
     - Row action: "Inspect 360° Profile" and "Quick Intervene".
   - **Tab 3: Student 360° Profile & Diagnostics (Drawer / Dedicated View)**
     - Student identity card with contact, mentor, and overall SSS dial.
     - Causal Explainability Waterfall: Clear audit of why the student has this risk score.
     - Sub-system breakdowns: Academic, Attendance, LMS, Placement.
     - Historical CGPA trajectory sparkline.
     - Active Interventions list + "Assign New Intervention" workflow.
   - **Tab 4: Placement Readiness Command Center**
     - Placement Funnel (Total Eligible $\rightarrow$ Assessed $\rightarrow$ Interview Ready $\rightarrow$ Tier-1).
     - Skills distribution (Coding vs. Aptitude radar/bars).
     - Backlog barrier analysis (Students held back purely by 1 backlog).
     - Batch intervention trigger (e.g., "Assign Coding Sprint to 18 candidates").
   - **Tab 5: Intervention Tracking Hub**
     - Case management board (Kanban / Tabular view): `Pending`, `In Progress`, `Resolved`, `Escalated`.
     - Follow-up date calendar reminders.
     - Add counseling notes & log outcomes.
   - **Tab 6: Data Integration & Hygiene Studio**
     - File dropzones for the 5 CSV streams.
     - Data validation report: Unmatched Student IDs, out-of-range values, imputed missing fields.
     - One-Click Action: "Load Pre-Validated Benchmark Dataset (150 Students)" for live demo.

---

## 6. Phased Implementation Roadmap

### Phase 1: Specifications & Architectural Alignment (Current Phase)
* [x] Deep analysis of problem statement and design requirements.
* [x] Verification of empty workspace and system runtimes.
* [x] Creation of `docs/PRODUCT_REQUIREMENTS.md`.
* [x] Creation of `docs/IMPLEMENTATION_PLAN.md`.
* [x] Architectural sign-off and approval request.

### Phase 2: Project Scaffolding & Core Domain Engine
* Initialize Git repository.
* Scaffold Vite + React + TypeScript + Tailwind CSS application.
* Install verified core dependencies (`lucide-react`, `recharts`, `papaparse`, `clsx`, `tailwind-merge`).
* Implement TypeScript domain types and schemas.
* Build the In-Memory Data Engine:
  - Synthetic Data Generator (150 realistic students across 4 departments with edge cases).
  - CSV Ingestion and Reconciliation Engine (PapaParse wrapper).
  - Validation & Anomaly Detector.
* Implement deterministic scoring engine (ARI, PRI, SSS, and factor contribution calculator) with automated test assertions.

### Phase 3: Design System & Core Navigation Shell
* Configure custom Tailwind design tokens (Oxford navy, muted teal, warm slate, semantic risk).
* Build layout components: App Header, Role Switcher, Tab Navigation, Metric Cards, Status Badges.
* Build responsive Universal Search and Cohort Filter drawers.

### Phase 4: Core Operational Views
* Implement **Campus Executive Overview** with Recharts analytics.
* Implement **Student Directory & Risk Matrix** with high-density tabular view, sorting, and filtering.
* Implement **Student 360° Profile** with Explainability Waterfall and historical trends.
* Implement **Placement Readiness Command Center** with skills distribution and eligibility analysis.
* Implement **Intervention Tracking Hub** with full CRUD case management and follow-up tracking.

### Phase 5: Data Studio, AI Synthesis & Polish
* Implement **Data Integration Studio** with drag-and-drop CSV upload and validation anomaly report.
* Implement AI diagnostic synthesis (Rule-based templates + Gemini API fallback).
* Add realistic demo data loader button with toast feedback.
* Comprehensive UI audit for WCAG contrast, edge cases, responsive scaling, and zero console errors.

---

## 7. Blockers & Decisions Requiring User Approval

1. **Stack Approval**: Confirming the choice of **Vite + React + TypeScript + Tailwind CSS + Recharts + PapaParse** as an optimal, zero-backend-dependency client-side architecture for the hackathon.
2. **Demo Dataset Scope**: Using a realistic 150-student synthetic dataset across 4 departments (Computer Science, Information Science, Electronics, Mechanical) simulating genuine academic, attendance, and placement distribution curves.
3. **Approval to Proceed**: Once approved, Phase 2 scaffolding and core engine implementation will commence immediately.
