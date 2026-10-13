# CampusPulse — Student Success Intelligence Platform

## Project Overview
**CampusPulse** is an institutional decision-support intelligence platform built for higher education colleges and universities. It addresses the "Smart Campus Analytics: Predict, Optimize & Improve Student Success" challenge by unifying fragmented student data streams (academics, attendance, LMS activity, skills assessments, placement preparation, and student feedback) into an actionable, explainable 360° student intelligence hub.

### Problem Statement
Colleges store student performance and engagement data in isolated silos (ERP, attendance registers, LMS, and Placement & Training databases). Academic advisors and placement directors only detect at-risk students when it is too late—after semester debarment or failed campus hiring drives. Most existing tools are either passive charts without action triggers, or opaque "black-box" models that provide zero justification to faculty.

### Core Value Proposition
- **Unified 360° Profile**: Ingests and reconciles 5 core campus CSV sources (`academics.csv`, `attendance.csv`, `lms_activity.csv`, `placement_skills.csv`, `interventions.csv`).
- **Explainable Scoring Engine**: Computes a transparent **Student Success Score (0–100)** with dual assessments:
  - **Academic Risk Index (ARI, 0–100)**: Detects course failure, attendance shortfall, and arrears risk.
  - **Placement Readiness Index (PRI, 0–100)**: Evaluates technical coding, aptitude, and interview readiness.
- **Factor Attribution**: Decomposes every score into exact positive and negative causal drivers (e.g., `-20 pts: 62% attendance`, `-12 pts: 2 active backlogs`, `+15 pts: strong coding score`).
- **Closed-Loop Case Management**: Bridges insight directly to action—faculty and placement officers assign, track, and follow up on interventions (peer tutoring, dean counseling, DSA sprints).

---

## User Personas
1. **College Administrators (Deans & HODs)**: Monitor institutional health, cross-departmental risk patterns, and intervention efficacy.
2. **Faculty Advisors & Mentors**: Spot struggling students in their assigned cohorts early and manage targeted counseling.
3. **Placement & Training Officers (T&P Cell)**: Identify students needing technical/aptitude upskilling before placement season and remove eligibility barriers.

---

## Design Principles
- **Institutional Dignity & Restraint**: Editorial, production-grade enterprise UX (warm slate `#F8FAFC`, deep Oxford navy `#0F172A`, muted teal `#0D9488`, and controlled semantic risk accents).
- **No AI Cliché**: Zero neon glows, zero superfluous cards, zero ungrounded chatbots, and zero decorative charts without drill-downs.
- **Ethical Human-in-the-Loop**: Risk assessments are framed strictly as signals for supportive human review, never automated gatekeeping.

---

## Architecture & Technology
- **Frontend / Client Engine**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Data Engine**: PapaParse for multi-source CSV parsing, deterministic rule-based explainability engine, in-memory filtering/search, browser LocalStorage persistence.
- **AI Synthesis**: Deterministic heuristic templates + optional Google Gemini API fallback.
- **Benchmarking**: Bundled 150-student synthetic dataset across 4 departments for 1-click zero-friction judging demos.
