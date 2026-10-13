# CampusPulse — Project State

## Current Position
- **Current Milestone**: Milestone 1 (Hackathon MVP v1.0.0)
- **Current Phase**: Phase 2 — Project Scaffolding & Core Domain Engine (Completed)
- **Next Phase**: Phase 3 — Design System Shell, Navigation & Student Directory
- **Status**: Completed Phase 2, tests passing (13/13), production build clean, awaiting user review before Phase 3.

---

## Architectural & Product Decisions Log
- **ADR-01 (Tech Stack Scaffolding)**: Successfully installed and verified Vite 6 + React 18 + TypeScript 5.6 + Tailwind CSS 3.4 + Recharts 2.13 + PapaParse 5.4.
- **ADR-02 (Deterministic Scoring Engine)**: Implemented mathematical calculations for:
  - Academic Risk Index (ARI, 0-100, higher = more risk)
  - Placement Readiness Index (PRI, 0-100, higher = more ready)
  - Student Success Score (SSS, 0-100, higher = stronger profile)
  - Full factor decomposition (`ContributingFactor[]`) with explicit positive/negative weights.
- **ADR-03 (Data Hygiene & Multi-Source Reconciliation)**:
  - Cross-file student ID reconciliation across 5 CSV streams.
  - Automatic detection of duplicate IDs, unmatched records, and out-of-range values.
  - Incomplete data handling: Missing streams are never treated as zero and do not invent false certainty; confidence flags (`high`, `medium`, `low_incomplete_data`) are surfaced.
- **ADR-04 (Configurable Rules)**: Scoring weights and institutional eligibility gates (e.g. 0-backlog rule for Tier-1 placement) are externalized in `src/config/scoringConfig.ts` with customizable overrides.
- **ADR-05 (Synthetic Benchmark Dataset)**: Generated 150 realistic students across Computer Science, Information Science, Electronics, and Mechanical departments stored in separate CSVs labeled with synthetic demo disclaimers.

---

## Test & Build Verification
- **Automated Tests**: 13/13 passing in 311ms (`src/tests/scoringEngine.test.ts`, `src/tests/dataReconciler.test.ts`).
- **TypeScript Typecheck**: Passed (`tsc -b`), zero errors.
- **Vite Production Build**: Passed (`dist/`), zero errors.
