# CampusPulse — Project State

## Current Position
- **Current Milestone**: Milestone 1 (Hackathon MVP v1.0.0)
- **Current Phase**: Phase 1 — Architecture, Product Scope & Data Contracts (Completed)
- **Next Phase**: Phase 2 — Scaffolding, Core Ingestion & Deterministic Scoring Engine
- **Status**: Awaiting User Review & Approval to Begin Scaffolding

---

## Architectural & Product Decisions Log
- **ADR-01 (Tech Stack)**: Selected Vite + React + TypeScript + Tailwind CSS + Lucide + Recharts + PapaParse for high responsiveness, zero backend failure risk during demos, and rapid iteration.
- **ADR-02 (Transparent Scoring)**: Implemented deterministic, explainable scoring rules (ARI, PRI, SSS) with explicit point weights rather than unverified machine learning models, ensuring complete institutional credibility.
- **ADR-03 (Data Ingestion Architecture)**: Client-side CSV reconciliation of 5 files via PapaParse, linked by canonical `student_id`, with anomaly detection for unmatched IDs, out-of-range marks, and missing values.
- **ADR-04 (Design System)**: Adopted an institutional editorial visual identity using Warm Slate (`#F8FAFC`), Deep Oxford Navy (`#0F172A`), Muted Teal (`#0D9488`), and restrained semantic risk accents.
- **ADR-05 (Dual-Layer AI)**: Deterministic heuristic rule templates for factor attribution and recommended interventions (100% offline reliable), with optional Gemini API enhancement when `VITE_GEMINI_API_KEY` is supplied.

---

## Deliverables Generated in Phase 1
- `docs/PRODUCT_REQUIREMENTS.md` (Full Product Requirements Document)
- `docs/IMPLEMENTATION_PLAN.md` (Comprehensive Technical Architecture & Implementation Plan)
- `.planning/PROJECT.md` (Project Context)
- `.planning/config.json` (GSD Workflow Configuration)
- `.planning/REQUIREMENTS.md` (Scoped Functional & Technical Requirements)
- `.planning/ROADMAP.md` (Phased Implementation Roadmap)
- `.planning/STATE.md` (Active State & Decision Log)
