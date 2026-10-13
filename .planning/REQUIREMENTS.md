# CampusPulse — Requirements Specification

## Requirement Categories

### 1. Data Ingestion, Reconciliation & Hygiene (INGEST)
- **INGEST-01 (Multi-CSV Import)**: System must parse 5 separate CSV streams (`academics.csv`, `attendance.csv`, `lms_activity.csv`, `placement_skills.csv`, `interventions.csv`) with automatic header mapping and schema validation.
- **INGEST-02 (Data Reconciliation)**: Automatically link records across files via `student_id`. Flag unmatched IDs as orphaned records without crashing.
- **INGEST-03 (Hygiene & Imputation)**: Detect out-of-range values (e.g. attendance > 100%, CGPA > 10) and handle missing fields with safe default imputation and diagnostic warnings.
- **INGEST-04 (1-Click Demo Dataset)**: Provide an instant "Load Benchmark Dataset" button injecting 150 diverse student profiles across 4 engineering departments.

### 2. Scoring & Explainability Engine (SCORE)
- **SCORE-01 (Academic Risk Index - ARI)**: Compute transparent 0–100 risk score based on weighted attendance shortfalls, backlogs/arrears, internal marks trajectory, and LMS engagement.
- **SCORE-02 (Placement Readiness Index - PRI)**: Compute 0–100 career readiness score based on coding benchmark, aptitude test, mock interview rating, and 0-backlog eligibility gate.
- **SCORE-03 (Unified Student Success Score - SSS)**: Compute overall institutional health score: $(100 - \text{ARI}) \times 0.55 + \text{PRI} \times 0.45$.
- **SCORE-04 (Factor Attribution)**: Decompose each student's score into explicit positive and negative contributing factors with human-readable rationale.

### 3. Unified 360° Profile & Exploration (PROFILE)
- **PROFILE-01 (Summary Card)**: Display student name, USN/ID, department, semester, mentor, SSS gauge, and risk/readiness badges.
- **PROFILE-02 (Sub-System Metrics)**: Tabbed or structured view of academic marks, attendance trend (improving/stable/declining), LMS logins & submissions, and placement ratings.
- **PROFILE-03 (Explainability Waterfall)**: Visual display of positive and negative score drivers.
- **PROFILE-04 (Case Timeline)**: History of assigned interventions with status, mentor notes, and target resolution dates.

### 4. Cohort Segmentation & Search (SEARCH)
- **SEARCH-01 (Instant Search)**: Sub-100ms fuzzy search by student name, ID, or mentor.
- **SEARCH-02 (Multi-Facet Filter)**: Filter by department, semester, risk level (Low, Moderate, High, Critical), placement tier, and attendance thresholds.
- **SEARCH-03 (Quick Presets)**: 1-click segmented views: "Attendance Defaulters (<75%)", "Critical Watchlist", "High CGPA / Low Coding", "Placement Ready".

### 5. Closed-Loop Intervention Workflow (INTERVENE)
- **INTERVENE-01 (Case Creation)**: Modal/drawer to create a new intervention with type (Tutoring, Counseling, Coding Bootcamp, Dean Advisory), priority, assignee, and follow-up deadline.
- **INTERVENE-02 (Lifecycle Tracking)**: Update status across `Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Escalated`.
- **INTERVENE-03 (Intervention Hub)**: Dedicated management table/board for faculty and placement officers to review pending follow-ups and log resolution outcomes.

### 6. Institutional Analytics & Decision Support (ANALYTICS)
- **ANALYTICS-01 (Executive KPIs)**: High-level metric cards for total students, average success score, at-risk percentage, and placement-ready pool.
- **ANALYTICS-02 (Departmental Benchmarks)**: Comparative matrix comparing departments on average risk vs. readiness.
- **ANALYTICS-03 (Correlation Scatter)**: Quadrant scatter plot of CGPA vs. Attendance with risk color encoding.
- **ANALYTICS-04 (Placement Funnel)**: Visual pipeline of candidates from eligible to assessed to interview-ready.

### 7. User Interface & Accessibility (UI)
- **UI-01 (Visual Direction)**: Institutional palette with warm slate background, deep Oxford navy headers, muted teal accents, and restrained semantic risk tokens.
- **UI-02 (Role Switcher)**: Quick role preview toggle (Dean/Admin, Faculty Advisor, Placement Officer) tailoring views and action emphasis.
- **UI-03 (Responsive & Accessible)**: High-density data tables with tabular numerals, WCAG AA contrast, and graceful empty/loading states.
