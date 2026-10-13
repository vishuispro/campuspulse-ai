/**
 * CampusPulse - Multi-Source Data Reconciliation & Validation Engine
 * 
 * Reconciles 5 independent campus data streams:
 * - academics.csv
 * - attendance.csv
 * - lms_activity.csv
 * - placement_skills.csv
 * - interventions.csv
 * 
 * Responsibilities:
 * - Schema validation and bounds checking
 * - Cross-file student ID reconciliation
 * - Duplicate ID detection
 * - Unmatched / orphaned record tracking
 * - Missing stream tracking (without fabricating false certainty)
 * - Producing UnifiedStudent 360° models and a DataReconciliationReport
 */

import {
  RawAcademicRecord,
  RawAttendanceRecord,
  RawLMSActivityRecord,
  RawPlacementRecord,
  RawInterventionRecord,
  AcademicData,
  AttendanceData,
  LMSActivityData,
  PlacementData,
  Intervention,
  UnifiedStudent,
  DataReconciliationReport,
  ValidationIssue,
  Department,
  TrendDirection,
  InterventionType,
  InterventionPriority,
  InterventionStatus,
} from '../types/student';
import {
  evaluateAcademicRisk,
  evaluatePlacementReadiness,
  evaluateStudentSuccessScore,
} from './scoringEngine';
import { deriveRecommendedInterventions } from './interventionRules';
import { SystemScoringConfig, DEFAULT_SCORING_CONFIG } from '../config/scoringConfig';

export interface RawDataPackage {
  academics: RawAcademicRecord[];
  attendance: RawAttendanceRecord[];
  lms: RawLMSActivityRecord[];
  placement: RawPlacementRecord[];
  interventions?: RawInterventionRecord[];
}

export interface ReconciliationResult {
  students: UnifiedStudent[];
  report: DataReconciliationReport;
}

const VALID_DEPARTMENTS: Department[] = [
  'Computer Science',
  'Information Science',
  'Electronics & Communication',
  'Mechanical Engineering',
];

function normalizeStudentId(id: unknown): string {
  if (id === null || id === undefined) return '';
  return String(id).trim().toUpperCase();
}

function normalizeNumber(val: unknown, fallback: number): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

function normalizeTrend(val: unknown): TrendDirection {
  const str = String(val).toLowerCase().trim();
  if (str === 'improving' || str === 'positive' || str === 'up') return 'improving';
  if (str === 'declining' || str === 'negative' || str === 'down') return 'declining';
  return 'stable';
}

function normalizeDepartment(val: unknown): Department {
  const str = String(val).trim();
  const match = VALID_DEPARTMENTS.find(
    (d) => d.toLowerCase() === str.toLowerCase() || str.toLowerCase().includes(d.toLowerCase())
  );
  if (match) return match;
  if (/comp|cse|cs/i.test(str)) return 'Computer Science';
  if (/info|ise|it/i.test(str)) return 'Information Science';
  if (/elec|ece|ec/i.test(str)) return 'Electronics & Communication';
  if (/mech|me/i.test(str)) return 'Mechanical Engineering';
  return 'Computer Science';
}

/**
 * Reconciles raw data streams into unified student profiles with full audit report.
 */
export function reconcileCampusData(
  rawData: RawDataPackage,
  config: SystemScoringConfig = DEFAULT_SCORING_CONFIG
): ReconciliationResult {
  const issues: ValidationIssue[] = [];
  const duplicateIdsReport: DataReconciliationReport['duplicateIds'] = [];
  const unmatchedRecordsReport: DataReconciliationReport['unmatchedRecords'] = [];

  // 1. Process Academics
  const academicMap = new Map<string, AcademicData>();
  const academicSeen = new Map<string, number>();

  for (const raw of rawData.academics || []) {
    const id = normalizeStudentId(raw.student_id);
    if (!id) {
      issues.push({
        type: 'missing_required_field',
        file: 'academics.csv',
        student_id: 'UNKNOWN',
        field: 'student_id',
        value: raw.student_id,
        message: 'Record missing student_id',
        severity: 'error',
      });
      continue;
    }

    const count = (academicSeen.get(id) || 0) + 1;
    academicSeen.set(id, count);
    if (count === 2) {
      duplicateIdsReport.push({ file: 'academics.csv', student_id: id, count });
    }

    const cgpa = normalizeNumber(raw.cgpa, -1);
    if (cgpa < 0 || cgpa > 10) {
      issues.push({
        type: 'out_of_range',
        file: 'academics.csv',
        student_id: id,
        field: 'cgpa',
        value: raw.cgpa,
        message: `CGPA (${raw.cgpa}) must be between 0.0 and 10.0`,
        severity: 'warning',
      });
    }

    const internalMarks = normalizeNumber(raw.internal_midterm_pct, -1);
    if (internalMarks < 0 || internalMarks > 100) {
      issues.push({
        type: 'out_of_range',
        file: 'academics.csv',
        student_id: id,
        field: 'internal_midterm_pct',
        value: raw.internal_midterm_pct,
        message: `Internal midterm marks (${raw.internal_midterm_pct}) must be between 0 and 100`,
        severity: 'warning',
      });
    }

    const backlogs = Math.max(0, Math.floor(normalizeNumber(raw.backlogs_count, 0)));

    academicMap.set(id, {
      student_id: id,
      name: String(raw.name || `Student ${id}`).trim(),
      department: normalizeDepartment(raw.department),
      semester: Math.min(8, Math.max(1, Math.floor(normalizeNumber(raw.semester, 6)))),
      cgpa: Math.min(10, Math.max(0, cgpa < 0 ? 7.0 : cgpa)),
      internal_midterm_pct: Math.min(100, Math.max(0, internalMarks < 0 ? 65.0 : internalMarks)),
      backlogs_count: backlogs,
      mentor_name: String(raw.mentor_name || 'Assigned Faculty Advisor').trim(),
    });
  }

  // 2. Process Attendance
  const attendanceMap = new Map<string, AttendanceData>();
  const attendanceSeen = new Map<string, number>();

  for (const raw of rawData.attendance || []) {
    const id = normalizeStudentId(raw.student_id);
    if (!id) continue;

    const count = (attendanceSeen.get(id) || 0) + 1;
    attendanceSeen.set(id, count);
    if (count === 2) {
      duplicateIdsReport.push({ file: 'attendance.csv', student_id: id, count });
    }

    const att = normalizeNumber(raw.overall_attendance_pct, -1);
    if (att < 0 || att > 100) {
      issues.push({
        type: 'out_of_range',
        file: 'attendance.csv',
        student_id: id,
        field: 'overall_attendance_pct',
        value: raw.overall_attendance_pct,
        message: `Attendance percentage (${raw.overall_attendance_pct}) must be between 0 and 100`,
        severity: 'warning',
      });
    }

    attendanceMap.set(id, {
      student_id: id,
      overall_attendance_pct: Math.min(100, Math.max(0, att < 0 ? 75.0 : att)),
      lab_attendance_pct: Math.min(100, Math.max(0, normalizeNumber(raw.lab_attendance_pct, 80))),
      trend_last_30_days: normalizeTrend(raw.trend_last_30_days),
      days_absent_consecutive: Math.max(0, normalizeNumber(raw.days_absent_consecutive, 0)),
    });
  }

  // 3. Process LMS Activity
  const lmsMap = new Map<string, LMSActivityData>();
  const lmsSeen = new Map<string, number>();

  for (const raw of rawData.lms || []) {
    const id = normalizeStudentId(raw.student_id);
    if (!id) continue;

    const count = (lmsSeen.get(id) || 0) + 1;
    lmsSeen.set(id, count);
    if (count === 2) {
      duplicateIdsReport.push({ file: 'lms_activity.csv', student_id: id, count });
    }

    const subRate = normalizeNumber(raw.assignment_submission_rate, -1);
    if (subRate < 0 || subRate > 100) {
      issues.push({
        type: 'out_of_range',
        file: 'lms_activity.csv',
        student_id: id,
        field: 'assignment_submission_rate',
        value: raw.assignment_submission_rate,
        message: `LMS Assignment submission rate (${raw.assignment_submission_rate}) must be between 0 and 100`,
        severity: 'warning',
      });
    }

    lmsMap.set(id, {
      student_id: id,
      weekly_login_frequency: Math.max(0, normalizeNumber(raw.weekly_login_frequency, 3)),
      assignment_submission_rate: Math.min(100, Math.max(0, subRate < 0 ? 70 : subRate)),
      forum_engagement_score: Math.min(100, Math.max(0, normalizeNumber(raw.forum_engagement_score, 50))),
      video_lecture_completion_pct: Math.min(100, Math.max(0, normalizeNumber(raw.video_lecture_completion_pct, 75))),
    });
  }

  // 4. Process Placement & Skills
  const placementMap = new Map<string, PlacementData>();
  const placementSeen = new Map<string, number>();

  for (const raw of rawData.placement || []) {
    const id = normalizeStudentId(raw.student_id);
    if (!id) continue;

    const count = (placementSeen.get(id) || 0) + 1;
    placementSeen.set(id, count);
    if (count === 2) {
      duplicateIdsReport.push({ file: 'placement_skills.csv', student_id: id, count });
    }

    const coding = normalizeNumber(raw.coding_assessment_score, -1);
    if (coding < 0 || coding > 100) {
      issues.push({
        type: 'out_of_range',
        file: 'placement_skills.csv',
        student_id: id,
        field: 'coding_assessment_score',
        value: raw.coding_assessment_score,
        message: `Coding score (${raw.coding_assessment_score}) must be between 0 and 100`,
        severity: 'warning',
      });
    }

    const mock = normalizeNumber(raw.mock_interview_rating, -1);
    if (mock < 1 || mock > 5) {
      issues.push({
        type: 'out_of_range',
        file: 'placement_skills.csv',
        student_id: id,
        field: 'mock_interview_rating',
        value: raw.mock_interview_rating,
        message: `Mock interview rating (${raw.mock_interview_rating}) must be between 1.0 and 5.0`,
        severity: 'warning',
      });
    }

    const resumeVerified =
      raw.resume_verified === true ||
      String(raw.resume_verified).toLowerCase() === 'true' ||
      String(raw.resume_verified).toLowerCase() === 'yes' ||
      String(raw.resume_verified) === '1';

    const optIn =
      raw.opt_in_placement === true ||
      String(raw.opt_in_placement).toLowerCase() === 'true' ||
      String(raw.opt_in_placement).toLowerCase() === 'yes' ||
      String(raw.opt_in_placement) === '1' ||
      raw.opt_in_placement === undefined;

    placementMap.set(id, {
      student_id: id,
      coding_assessment_score: Math.min(100, Math.max(0, coding < 0 ? 50 : coding)),
      aptitude_reasoning_score: Math.min(100, Math.max(0, normalizeNumber(raw.aptitude_reasoning_score, 60))),
      mock_interview_rating: Math.min(5, Math.max(1, mock < 1 ? 3.0 : mock)),
      projects_count: Math.max(0, Math.floor(normalizeNumber(raw.projects_count, 1))),
      resume_verified: resumeVerified,
      opt_in_placement: optIn,
    });
  }

  // 5. Process Interventions Log
  const interventionsMap = new Map<string, Intervention[]>();
  for (const raw of rawData.interventions || []) {
    const id = normalizeStudentId(raw.student_id);
    if (!id) continue;

    const list = interventionsMap.get(id) || [];
    list.push({
      id: raw.intervention_id || `int-${Math.random().toString(36).substring(2, 9)}`,
      student_id: id,
      student_name: raw.student_name || `Student ${id}`,
      type: (raw.type as InterventionType) || 'Academic Tutoring',
      priority: (raw.priority as InterventionPriority) || 'medium',
      status: (raw.status as InterventionStatus) || 'pending',
      assigned_to: raw.assigned_to || 'Assigned Mentor',
      created_at: raw.created_at || new Date().toISOString().split('T')[0],
      target_follow_up_date: raw.target_follow_up_date || new Date().toISOString().split('T')[0],
      notes: raw.notes || '',
      outcome_notes: raw.outcome_notes,
    });
    interventionsMap.set(id, list);
  }

  // 6. Cross-Stream Reconciliation: Gather all distinct student IDs
  const allStudentIds = new Set<string>([
    ...academicMap.keys(),
    ...attendanceMap.keys(),
    ...lmsMap.keys(),
    ...placementMap.keys(),
  ]);

  // Check for orphaned records (IDs present in other files but missing in academics)
  for (const id of allStudentIds) {
    if (!academicMap.has(id)) {
      if (attendanceMap.has(id)) {
        unmatchedRecordsReport.push({
          file: 'attendance.csv',
          student_id: id,
          reason: 'Student ID present in attendance but missing in master academics registry',
        });
      }
      if (lmsMap.has(id)) {
        unmatchedRecordsReport.push({
          file: 'lms_activity.csv',
          student_id: id,
          reason: 'Student ID present in LMS but missing in master academics registry',
        });
      }
      if (placementMap.has(id)) {
        unmatchedRecordsReport.push({
          file: 'placement_skills.csv',
          student_id: id,
          reason: 'Student ID present in placement assessments but missing in master academics registry',
        });
      }
    }
  }

  // 7. Assemble Unified Student 360 Records
  const students: UnifiedStudent[] = [];
  let matchedAcrossAllStreams = 0;
  let missingDataCount = 0;

  for (const id of allStudentIds) {
    const academic = academicMap.get(id) || null;
    const attendance = attendanceMap.get(id) || null;
    const lms = lmsMap.get(id) || null;
    const placement = placementMap.get(id) || null;
    const studentInterventions = interventionsMap.get(id) || [];

    const missingStreams: string[] = [];
    if (!academic) missingStreams.push('Academics');
    if (!attendance) missingStreams.push('Attendance');
    if (!lms) missingStreams.push('LMS Activity');
    if (!placement) missingStreams.push('Placement Assessments');

    if (missingStreams.length === 0) {
      matchedAcrossAllStreams++;
    } else {
      missingDataCount++;
    }

    // Evaluate intelligence scores
    const academicRisk = evaluateAcademicRisk(academic, attendance, lms, config.academicRisk);
    const placementReadiness = evaluatePlacementReadiness(placement, academic, config.placementReadiness);
    const successScore = evaluateStudentSuccessScore(academicRisk, placementReadiness, config.successScore);
    const recommendedInterventions = deriveRecommendedInterventions(
      academic,
      attendance,
      lms,
      placement,
      academicRisk,
      placementReadiness
    );

    // Calculate completeness percentage (4 total primary streams)
    const presentCount = 4 - missingStreams.length;
    const completenessScore = Math.round((presentCount / 4) * 100);

    const warnings: string[] = [];
    if (missingStreams.length > 0) {
      warnings.push(`Incomplete profile: Missing ${missingStreams.join(', ')}.`);
    }
    if (academic && academic.backlogs_count > 0 && placement && placementReadiness.isBacklogBlocked) {
      warnings.push('Placement eligibility restricted due to active backlogs.');
    }
    if (attendance && attendance.overall_attendance_pct < 75) {
      warnings.push('Attendance shortfall: Violates 75% institutional requirement.');
    }

    students.push({
      id,
      name: academic?.name || `Student ${id}`,
      department: academic?.department || 'Computer Science',
      semester: academic?.semester || 6,
      mentorName: academic?.mentor_name || 'Faculty Mentor',
      academic,
      attendance,
      lms,
      placement,
      interventions: studentInterventions,
      academicRisk,
      placementReadiness,
      successScore,
      recommendedInterventions,
      dataCompletenessScore: completenessScore,
      missingStreams,
      hasDataWarnings: warnings.length > 0,
      warnings,
    });
  }

  // Sort students alphabetically or by ID
  students.sort((a, b) => a.id.localeCompare(b.id));

  const report: DataReconciliationReport = {
    totalUniqueStudents: allStudentIds.size,
    totalRecordsProcessed: {
      academics: rawData.academics?.length || 0,
      attendance: rawData.attendance?.length || 0,
      lms: rawData.lms?.length || 0,
      placement: rawData.placement?.length || 0,
      interventions: rawData.interventions?.length || 0,
    },
    matchedAcrossAllStreams,
    unmatchedRecords: unmatchedRecordsReport,
    duplicateIds: duplicateIdsReport,
    validationIssues: issues,
    missingDataCount,
    reconciliationTimestamp: new Date().toISOString(),
  };

  return { students, report };
}
