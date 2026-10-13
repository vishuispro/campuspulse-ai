import { describe, it, expect } from 'vitest';
import {
  evaluateAcademicRisk,
  evaluatePlacementReadiness,
  evaluateStudentSuccessScore,
} from '../services/scoringEngine';
import { AcademicData, AttendanceData, LMSActivityData, PlacementData } from '../types/student';

describe('Scoring Engine - Academic Risk Index (ARI)', () => {
  const baseAcademic: AcademicData = {
    student_id: 'TEST01',
    name: 'Test Student',
    department: 'Computer Science',
    semester: 6,
    cgpa: 9.0,
    internal_midterm_pct: 85,
    backlogs_count: 0,
    mentor_name: 'Dr. Mentor',
  };

  const baseAttendance: AttendanceData = {
    student_id: 'TEST01',
    overall_attendance_pct: 90,
    lab_attendance_pct: 92,
    trend_last_30_days: 'stable',
    days_absent_consecutive: 0,
  };

  const baseLms: LMSActivityData = {
    student_id: 'TEST01',
    weekly_login_frequency: 5,
    assignment_submission_rate: 95,
    forum_engagement_score: 80,
    video_lecture_completion_pct: 85,
  };

  it('assigns Low Risk (0 score) to a thriving student with clean records', () => {
    const result = evaluateAcademicRisk(baseAcademic, baseAttendance, baseLms);
    expect(result.score).toBe(0);
    expect(result.level).toBe('Low');
    expect(result.confidence).toBe('high');
    expect(result.missingComponents).toHaveLength(0);
    expect(result.factors.some((f) => f.indicator === 'Exemplary Attendance')).toBe(true);
  });

  it('penalizes attendance drops below 75% and declining trajectory', () => {
    const attendanceShortfall: AttendanceData = {
      ...baseAttendance,
      overall_attendance_pct: 70, // +30 penalty
      trend_last_30_days: 'declining', // +5 penalty
    };

    const result = evaluateAcademicRisk(baseAcademic, attendanceShortfall, baseLms);
    // 35 points risk -> Moderate Risk
    expect(result.score).toBe(35);
    expect(result.level).toBe('Moderate');
    expect(result.factors.some((f) => f.indicator === 'Attendance Shortfall Alert')).toBe(true);
    expect(result.factors.some((f) => f.indicator === 'Declining Attendance Trajectory')).toBe(true);
  });

  it('escalates to High or Critical Risk when multiple failure indicators compound', () => {
    const strugglingAcademic: AcademicData = {
      ...baseAcademic,
      cgpa: 5.5,
      internal_midterm_pct: 35, // +25 penalty
      backlogs_count: 3, // +25 penalty
    };
    const criticalAttendance: AttendanceData = {
      ...baseAttendance,
      overall_attendance_pct: 60, // +35 penalty
      trend_last_30_days: 'declining', // +5 penalty
    };
    const disengagedLms: LMSActivityData = {
      ...baseLms,
      assignment_submission_rate: 40, // +10 penalty
      weekly_login_frequency: 1, // +5 penalty
    };

    const result = evaluateAcademicRisk(strugglingAcademic, criticalAttendance, disengagedLms);
    // Total raw risk: 25 + 25 + 35 + 5 + 10 + 5 = 105 -> clamped to 100
    expect(result.score).toBe(100);
    expect(result.level).toBe('Critical');
  });

  it('handles missing attendance gracefully without treating it as zero', () => {
    const result = evaluateAcademicRisk(baseAcademic, null, baseLms);
    expect(result.missingComponents).toContain('Attendance Records');
    expect(result.confidence).toBe('medium');
    // Does NOT invent 100% risk due to missing attendance
    expect(result.score).toBe(0);
  });
});

describe('Scoring Engine - Placement Readiness Index (PRI)', () => {
  const baseAcademic: AcademicData = {
    student_id: 'TEST01',
    name: 'Test Student',
    department: 'Computer Science',
    semester: 6,
    cgpa: 8.8,
    internal_midterm_pct: 85,
    backlogs_count: 0,
    mentor_name: 'Dr. Mentor',
  };

  const basePlacement: PlacementData = {
    student_id: 'TEST01',
    coding_assessment_score: 90, // 90 * 0.35 = 31.5
    aptitude_reasoning_score: 85, // 85 * 0.25 = 21.25
    mock_interview_rating: 4.5, // (4.5 / 5 * 100) * 0.25 = 22.5
    projects_count: 3, // 75 * 0.15 = 11.25
    resume_verified: true,
    opt_in_placement: true,
  };

  it('classifies top candidate as Tier-1 Ready', () => {
    const result = evaluatePlacementReadiness(basePlacement, baseAcademic);
    // 31.5 + 21.25 + 22.5 + 11.25 = 86.5 -> round 87
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.tier).toBe('Tier-1 Ready');
    expect(result.isBacklogBlocked).toBe(false);
  });

  it('caps placement readiness at 50 if student has active backlogs (Institutional Gate)', () => {
    const academicWithBacklog: AcademicData = {
      ...baseAcademic,
      backlogs_count: 1,
    };

    const result = evaluatePlacementReadiness(basePlacement, academicWithBacklog);
    expect(result.isBacklogBlocked).toBe(true);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.tier).toBe('Needs Upskilling');
    expect(result.factors.some((f) => f.indicator === 'Active Backlog Eligibility Cap')).toBe(true);
  });

  it('penalizes unverified resume', () => {
    const unverifiedPlacement: PlacementData = {
      ...basePlacement,
      resume_verified: false,
    };

    const verifiedResult = evaluatePlacementReadiness(basePlacement, baseAcademic);
    const unverifiedResult = evaluatePlacementReadiness(unverifiedPlacement, baseAcademic);

    expect(verifiedResult.score - unverifiedResult.score).toBe(10);
    expect(unverifiedResult.factors.some((f) => f.indicator === 'Resume Pending Verification')).toBe(true);
  });

  it('returns low confidence when placement data is missing rather than inventing failure', () => {
    const result = evaluatePlacementReadiness(null, baseAcademic);
    expect(result.confidence).toBe('low_incomplete_data');
    expect(result.missingComponents).toContain('Placement Assessments');
  });
});

describe('Scoring Engine - Student Success Score (SSS)', () => {
  it('correctly calculates composite score according to formula: (100 - ARI)*0.55 + PRI*0.45', () => {
    const academicRisk = {
      score: 20, // (100 - 20) * 0.55 = 44
      level: 'Low' as const,
      confidence: 'high' as const,
      factors: [],
      missingComponents: [],
    };

    const placementReadiness = {
      score: 80, // 80 * 0.45 = 36
      tier: 'Tier-1 Ready' as const,
      confidence: 'high' as const,
      factors: [],
      missingComponents: [],
      isBacklogBlocked: false,
    };

    const result = evaluateStudentSuccessScore(academicRisk, placementReadiness);
    // 44 + 36 = 80
    expect(result.score).toBe(80);
    expect(result.confidence).toBe('high');
  });

  it('supports custom configurable weights', () => {
    const academicRisk = {
      score: 10,
      level: 'Low' as const,
      confidence: 'high' as const,
      factors: [],
      missingComponents: [],
    };
    const placementReadiness = {
      score: 60,
      tier: 'Tier-2 Ready' as const,
      confidence: 'high' as const,
      factors: [],
      missingComponents: [],
      isBacklogBlocked: false,
    };

    // Custom 70% academic, 30% placement
    const result = evaluateStudentSuccessScore(academicRisk, placementReadiness, {
      academicWeight: 0.70,
      placementWeight: 0.30,
    });
    // (90 * 0.7) + (60 * 0.3) = 63 + 18 = 81
    expect(result.score).toBe(81);
  });
});
