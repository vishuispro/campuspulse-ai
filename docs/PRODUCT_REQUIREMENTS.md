# CampusPulse — Student Success Intelligence Platform
## Product Requirements Document (PRD)

**Version:** 1.0.0  
**Status:** Approved for Architecture Review  
**Date:** October 2026  
**Problem Statement:** Smart Campus Analytics: Predict, Optimize & Improve Student Success  
**Domain:** Higher Education Management, Predictive Analytics, Decision Support Systems  

---

## 1. Executive Summary & Vision

### 1.1 The Institutional Problem
Colleges and universities operate in extreme data silos. Academic performance (grades, midterm assessments, arrears), classroom attendance (daily logs, lab hours), Learning Management Systems (LMS login frequency, assignment submissions, forum activity), extracurricular achievements, and placement cell readiness scores (coding tests, mock interviews, aptitude evaluations) reside in disparate, unlinked systems or ad-hoc spreadsheets.

By the time an academic counselor or placement director discovers a student is in jeopardy—often during semester-end exam eligibility audits or failed campus recruitment drives—it is too late for preventive intervention.

### 1.2 The CampusPulse Solution
**CampusPulse** is an institutional **decision-support intelligence platform** that reconciles disparate campus data streams into a unified 360° student profile. It evaluates each student along two distinct, explainable axes:
1. **Academic Risk Index (ARI)**: Early warning indicators for course failure, attendance shortfall, and dropout risk.
2. **Placement Readiness Index (PRI)**: Vocational readiness indicators for technical, aptitude, and interview benchmarks.

Together, these feed an overall, transparent **Student Success Score (SSS, 0–100)**. 

Crucially, **CampusPulse is not an opaque AI chatbot, nor a decorative passive dashboard.** It is a closed-loop intervention workflow engine: every risk score is accompanied by granular, human-auditable causal factors and actionable intervention triggers (e.g., peer tutoring, remedial bootcamps, attendance counseling), with milestone assignment and longitudinal outcome tracking.

---

## 2. Target Personas & Core User Journeys

### 2.1 Persona 1: College Administrator / Dean of Academic Affairs
* **Goal**: High-level visibility into institutional health, department-level risk patterns, and cohort trends to allocate faculty and tutoring resources effectively.
* **Pain Points**: Relies on static, end-of-semester reports; cannot see cross-departmental correlation between attendance and pass rates in real time.
* **Key User Journey**:
  1. Opens **Institutional Executive Overview**.
  2. Inspects campus-wide health distribution (Success Score distribution, critical risk percentage).
  3. Filters by Department (e.g., Computer Science vs. Mechanical Engineering) to identify departments with declining attendance or emerging academic risk.
  4. Reviews the **Intervention Impact Funnel** (total interventions open, resolved, and recovery rate).
  5. Exports cohort executive summaries for Senate or Board meetings.

### 2.2 Persona 2: Faculty Advisor / Mentor / Course Coordinator
* **Goal**: Identify students within their assigned mentor cohort who need timely academic assistance before exam lock-ins.
* **Pain Points**: Spends hours manually cross-referencing attendance registers with internal assessment marks; lack of a single place to record counseling notes.
* **Key User Journey**:
  1. Navigates to **Student Directory & Risk Matrix**, filtered to assigned department/semester.
  2. Selects quick cohort preset: *"Attendance Alert (< 75%)"* or *"Academic Risk: Critical/High"*.
  3. Clicks into a student's **Unified 360° Profile**.
  4. Inspects the **Explainable Risk Decomposition** (e.g., "-18 pts: 62% attendance in Data Structures", "-12 pts: internal score drop of 24%").
  5. Clicks **"Create Intervention"**; assigns *"Remedial Peer Tutoring"* and schedules a follow-up date for next Friday.
  6. Tracks status change from `Assigned` to `In Progress` and logs session notes.

### 2.3 Persona 3: Placement & Training Officer (T&P Cell)
* **Goal**: Maximize campus hiring conversion by identifying eligible students and proactively bridging technical/aptitude gaps.
* **Pain Points**: Many students are disqualified at company recruitment drives due to hidden backlogs, poor aptitude benchmarks, or unverified resumes discovered late in semester 7.
* **Key User Journey**:
  1. Accesses **Placement Readiness Command Center**.
  2. Filters cohort by Semester 6 & 7 and applies filter: *"Backlog Count = 0"* and *"Readiness: Needs Technical Upskilling"*.
  3. Identifies a segment of 35 students with high CGPA (>8.0) but low coding assessment percentiles (<45%).
  4. Triggers batch action: *"Enroll in LeetCode/DSA Sprint Bootcamp"*.
  5. Monitors progression of readiness status from *"Needs Preparation"* to *"Placement Ready"*.

---

## 3. Product Principles & Design Standards

### 3.1 Design Principles
1. **Decision Support Over Passive Visualization**: Never display a chart without an associated insight, drilldown, or action trigger.
2. **Transparent, Auditable Scoring**: No "black box" claims. Risk scores must clearly expose positive and negative contributing weights.
3. **Calm, High-Density Institutional UX**: Inspired by world-class enterprise software (Linear, Palantir Foundry, Stripe Dashboard).
4. **Restrained Color Architecture**:
   - Canvas: Warm slate-white (`#F8FAFC` / `#FFFFFF`)
   - Structural Chrome: Deep Navy (`#0F172A`, `#1E293B`)
   - Accent & Success: Muted Teal (`#0D9488`) / Forest Sage (`#059669`)
   - Caution & Moderate Risk: Warm Amber (`#D97706`)
   - Critical Risk: Muted Crimson (`#DC2626` / `#BE123C`)
5. **Ethical AI & Signal Philosophy**: Risk classifications are treated strictly as **signals for supportive human review**, never as automated negative judgments or gatekeeping barriers.

---

## 4. Functional Requirements

### 4.1 Ingestion & Integration Engine (Multi-Source CSV)
* **FR-1.1**: The platform must support importing five standard campus CSV schemas:
  1. `academics.csv` (StudentID, Name, Dept, Semester, CGPA, InternalExam1, InternalExam2, BacklogCount)
  2. `attendance.csv` (StudentID, OverallAttendanceRate, LabAttendanceRate, Last30DaysTrend)
  3. `lms_activity.csv` (StudentID, WeeklyLogins, AssignmentSubmissionRate, ForumEngagementScore)
  4. `placement_skills.csv` (StudentID, CodingAssessmentScore, AptitudeScore, MockInterviewRating, ResumeVerified, OptInStatus)
  5. `interventions.csv` (InterventionID, StudentID, Type, AssignedBy, Status, TargetDate, Notes)
* **FR-1.2 Validation & Reconciler**:
  - Automatically match records across files using canonical `StudentID`.
  - Detect and flag unmatched Student IDs (orphaned records).
  - Detect out-of-bounds values (e.g., Attendance > 100%, CGPA > 10.0, negative backlogs).
  - Handle missing fields with explicit imputation rules or "Data Incomplete" tags.
* **FR-1.3 Instant Demonstration Mode**: Provide a one-click *"Load Verified Synthetic Campus Dataset (150+ students across 4 departments)"* to enable immediate, zero-friction hackathon evaluation.

### 4.2 Unified 360° Student Profile
* **FR-2.1 Profile Summary Header**: Displays Student Name, ID, Department, Current Semester, Assigned Mentor, Unified Success Score (0–100), Academic Risk Badge, and Placement Readiness Badge.
* **FR-2.2 Four-Dimensional Metric Grid**:
  - Academic Health: CGPA, Internal Marks trend, Active Backlogs.
  - Attendance & Engagement: Overall Attendance %, 30-day trajectory indicator (Improving / Stable / Declining), LMS Assignment Submission %.
  - Career & Skills: Coding Assessment (0–100), Aptitude Score (0–100), Mock Interview (1–5), Resume Verification status.
  - Historical Record: Semester-by-semester CGPA progression sparkline.
* **FR-2.3 Explainability Waterfall**: Visual list of top positive and negative factors directly contributing to the score (e.g., `+15 pts: Strong CGPA (8.8)`, `-20 pts: Attendance critical (61%)`).
* **FR-2.4 Closed-Loop Intervention Timeline**: Interactive log of past and ongoing interventions with status badges, counselor notes, and follow-up deadlines.

### 4.3 Dual-Engine Scoring & Evaluation
* **FR-3.1 Academic Risk Assessment (ARA)**:
  - Computed on a 0–100 scale, classified into:
    - `Low Risk` (0–29): On track, healthy attendance, no arrears.
    - `Moderate Risk` (30–54): Emerging attendance drops (<75%) or minor grade dips.
    - `High Risk` (55–74): Attendance <65% OR multiple backlogs OR steep midterm decline.
    - `Critical Risk` (75–100): Compounded failure indicators requiring urgent intervention.
* **FR-3.2 Placement Readiness Assessment (PRA)**:
  - Computed on a 0–100 scale, classified into:
    - `Tier-1 Ready` (80–100): High coding proficiency, aptitude cleared, 0 backlogs, resume verified.
    - `Tier-2 Ready` (65–79): Moderate coding/aptitude, 0 backlogs.
    - `Needs Upskilling` (45–64): Gaps in coding assessments or mock interview ratings.
    - `At Risk / Ineligible` (<45): Active backlogs or missing foundational benchmarks.
* **FR-3.3 Unified Student Success Score (SSS)**:
  - Balanced composite score: $\text{SSS} = (100 - \text{Academic Risk}) \times 0.55 + (\text{Placement Readiness}) \times 0.45$.

### 4.4 Evidence-Based Recommendations & Interventions
* **FR-4.1 Prescriptive Intervention Rules**: Contextual rule matrix matching specific deficiencies to pre-configured intervention packages:
  - *Attendance < 75%*: "Dean's Attendance Advisory & Guardian Notification"
  - *Internal Exam Drop > 20%*: "Departmental Peer Tutoring Assignment"
  - *Coding Score < 50*: "DSA Problem-Solving Sprint"
  - *Mock Interview Rating < 3*: "Career Cell Communication & HR Mock Interview"
  - *Compound High Risk*: "Comprehensive Academic & Wellness Counseling"
* **FR-4.2 AI Narrative Synthesis**: Generates concise, professional, evidence-backed diagnostic summaries (deterministic template engine + optional Gemini LLM synthesis).
* **FR-4.3 Intervention Management Life Cycle**:
  - Create intervention modal with assignee, priority, category, target resolution date.
  - Status progression: `Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Escalated`.
  - Follow-up date reminders and outcome documentation.

### 4.5 Cohort Segmentation, Search & Filtering
* **FR-5.1 Universal Instant Search**: Search by student name, ID/USN, or mentor.
* **FR-5.2 Multi-Facet Filtering**: Filter by Department, Semester, Academic Risk tier, Placement Readiness tier, Attendance Range slider, and Backlog presence.
* **FR-5.3 Quick Cohort Presets**:
  - "Immediate Attention Needed" (Critical Academic Risk)
  - "Attendance Defaulters" (< 75%)
  - "Unplaced Final-Years with High CGPA"
  - "Placement Ready Candidates"

### 4.6 Campus-Wide Analytics & Visual Reporting
* **FR-6.1 Institutional KPIs**: Total Students, Campus Average Success Score, At-Risk Student Count (and % change), Placement-Ready Pool Count.
* **FR-6.2 Departmental Risk Matrix**: Grouped comparative view of departments showing average risk vs. average readiness.
* **FR-6.3 Correlation Analytics**: Scatter / quadrant chart plotting CGPA vs. Attendance with risk color-coding.
* **FR-6.4 Intervention Efficacy Metrics**: Total interventions launched, completion rate, and students whose risk status improved post-intervention.

---

## 5. Non-Functional Requirements

* **Performance**: Sub-100ms response time for client-side search, filtering, and scoring across datasets of up to 5,000 records.
* **Reliability & Portability**: Zero external database dependencies required for hackathon deployment; fully functional with in-memory store and browser local persistence.
* **Accessibility**: WCAG 2.1 AA compliant contrast ratios across all typography and status badges.
* **Responsive Layout**: Optimized for desktop display (1280px–1920px) where faculty and administrators review institutional tables, with responsive scaling down to tablet views.
* **Data Privacy Compliance**: Synthetic data schema mirrors real institutional databases without storing identifiable student PII.

---

## 6. Hackathon MVP Scope vs. Future Roadmap

| Feature | Hackathon MVP (Phase 1–4) | Post-Hackathon / Production |
| :--- | :--- | :--- |
| **Data Ingestion** | Multi-CSV file upload + 1-click synthetic demo dataset | Automated LMS/ERP webhook sync (Canvas, Moodle, Ellucian) |
| **Scoring Engine** | Transparent, weighted rule-based model with exact factor audit | Supervised ML classifier (Gradient Boosting / Random Forest) trained on historical graduation datasets |
| **Interventions** | Full CRUD case management with status tracking & follow-ups | Automated calendar sync (Google/Outlook) and student SMS alerts |
| **AI Insights** | Evidence-based rule templates + Gemini API enrichment | Autonomous multi-agent follow-up workflows |
| **Deployment** | Standalone high-performance Single Page App with mock backend | Multi-tenant SaaS with Role-Based Access Control (RBAC) & SSO |

---
