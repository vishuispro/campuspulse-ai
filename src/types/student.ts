/**
 * CampusPulse - Domain Types & Data Contracts
 * Defines the schemas for all raw campus data streams, reconciled records,
 * scoring models, explainability factors, and validation reports.
 */

export type Department = 
  | 'Computer Science' 
  | 'Information Science' 
  | 'Electronics & Communication' 
  | 'Mechanical Engineering';

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type PlacementTier = 'Tier-1 Ready' | 'Tier-2 Ready' | 'Needs Upskilling' | 'At Risk / Ineligible';

export type InterventionType = 
  | 'Academic Tutoring' 
  | 'Attendance Counseling' 
  | 'Placement Upskilling' 
  | 'Dean Advisory' 
  | 'Wellness Check';

export type InterventionPriority = 'low' | 'medium' | 'high' | 'critical';

export type InterventionStatus = 'pending' | 'in_progress' | 'resolved' | 'escalated';

export type TrendDirection = 'improving' | 'stable' | 'declining';

// --- RAW SOURCE DATA SCHEMAS (From individual CSV files) ---

export interface RawAcademicRecord {
  student_id: string;
  name: string;
  department: string;
  semester: number | string;
  cgpa: number | string;
  internal_midterm_pct: number | string;
  backlogs_count: number | string;
  mentor_name: string;
}

export interface RawAttendanceRecord {
  student_id: string;
  overall_attendance_pct: number | string;
  lab_attendance_pct?: number | string;
  trend_last_30_days: string;
  days_absent_consecutive?: number | string;
}

export interface RawLMSActivityRecord {
  student_id: string;
  weekly_login_frequency: number | string;
  assignment_submission_rate: number | string;
  forum_engagement_score?: number | string;
  video_lecture_completion_pct?: number | string;
}

export interface RawPlacementRecord {
  student_id: string;
  coding_assessment_score: number | string;
  aptitude_reasoning_score: number | string;
  mock_interview_rating: number | string;
  projects_count: number | string;
  resume_verified: boolean | string;
  opt_in_placement: boolean | string;
}

export interface RawInterventionRecord {
  intervention_id: string;
  student_id: string;
  student_name?: string;
  type: string;
  priority: string;
  status: string;
  assigned_to: string;
  created_at: string;
  target_follow_up_date: string;
  notes: string;
  outcome_notes?: string;
}

// --- NORMALIZED TYPED ENTITIES ---

export interface AcademicData {
  student_id: string;
  name: string;
  department: Department;
  semester: number;
  cgpa: number; // 0.0 to 10.0
  internal_midterm_pct: number; // 0.0 to 100.0
  backlogs_count: number; // integer >= 0
  mentor_name: string;
}

export interface AttendanceData {
  student_id: string;
  overall_attendance_pct: number; // 0.0 to 100.0
  lab_attendance_pct: number;
  trend_last_30_days: TrendDirection;
  days_absent_consecutive: number;
}

export interface LMSActivityData {
  student_id: string;
  weekly_login_frequency: number;
  assignment_submission_rate: number; // 0.0 to 100.0
  forum_engagement_score: number; // 0.0 to 100.0
  video_lecture_completion_pct: number;
}

export interface PlacementData {
  student_id: string;
  coding_assessment_score: number; // 0.0 to 100.0
  aptitude_reasoning_score: number; // 0.0 to 100.0
  mock_interview_rating: number; // 1.0 to 5.0
  projects_count: number;
  resume_verified: boolean;
  opt_in_placement: boolean;
}

export interface StatusHistoryEntry {
  from_status: InterventionStatus;
  to_status: InterventionStatus;
  timestamp: string;
  changed_by: string;
  notes?: string;
}

export interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  type: InterventionType;
  priority: InterventionPriority;
  status: InterventionStatus;
  assigned_to: string;
  created_at: string;
  target_follow_up_date: string;
  notes: string;
  outcome_notes?: string;
  is_user_created?: boolean;
  status_history?: StatusHistoryEntry[];
}

// --- EXPLAINABLE CONTRIBUTING FACTORS & RECOMMENDATIONS ---

export interface ContributingFactor {
  indicator: string;
  impactScore: number; // e.g. -20 for risk penalty or +15 for readiness bonus
  category: 'academic' | 'attendance' | 'lms' | 'skills' | 'data_quality';
  nature: 'negative_risk' | 'positive_protective' | 'neutral' | 'caution';
  description: string;
}

export interface RecommendedAction {
  actionType: InterventionType;
  urgency: 'high' | 'medium' | 'low';
  title: string;
  justification: string;
}

// --- COMPUTED SCORES & AUDIT DATA ---

export interface AcademicRiskEvaluation {
  score: number; // 0 to 100 (higher = greater risk)
  level: RiskLevel;
  confidence: 'high' | 'medium' | 'low_incomplete_data';
  factors: ContributingFactor[];
  missingComponents: string[];
}

export interface PlacementReadinessEvaluation {
  score: number; // 0 to 100 (higher = greater readiness)
  tier: PlacementTier;
  confidence: 'high' | 'medium' | 'low_incomplete_data';
  factors: ContributingFactor[];
  missingComponents: string[];
  isBacklogBlocked: boolean;
}

export interface StudentSuccessEvaluation {
  score: number; // 0 to 100 (higher = stronger overall profile)
  compositeFormula: string;
  confidence: 'high' | 'medium' | 'low_incomplete_data';
  primaryStrength: string;
  primaryRiskFactor: string;
}

// --- UNIFIED 360° STUDENT RECORD ---

export interface UnifiedStudent {
  id: string;
  name: string;
  department: Department;
  semester: number;
  mentorName: string;

  // Domain slices (may be null if data stream is missing for this student)
  academic: AcademicData | null;
  attendance: AttendanceData | null;
  lms: LMSActivityData | null;
  placement: PlacementData | null;
  interventions: Intervention[];

  // Evaluated intelligence
  academicRisk: AcademicRiskEvaluation;
  placementReadiness: PlacementReadinessEvaluation;
  successScore: StudentSuccessEvaluation;
  recommendedInterventions: RecommendedAction[];

  // Data Quality & Reconciliation
  dataCompletenessScore: number; // 0 to 100% of data streams present
  missingStreams: string[];
  hasDataWarnings: boolean;
  warnings: string[];
}

// --- RECONCILIATION & HYGIENE REPORT ---

export interface ValidationIssue {
  type: 'invalid_value' | 'out_of_range' | 'missing_required_field' | 'type_mismatch';
  file: string;
  student_id: string;
  field: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface DataReconciliationReport {
  totalUniqueStudents: number;
  totalRecordsProcessed: {
    academics: number;
    attendance: number;
    lms: number;
    placement: number;
    interventions: number;
  };
  matchedAcrossAllStreams: number;
  unmatchedRecords: {
    file: string;
    student_id: string;
    reason: string;
  }[];
  duplicateIds: {
    file: string;
    student_id: string;
    count: number;
  }[];
  validationIssues: ValidationIssue[];
  missingDataCount: number;
  reconciliationTimestamp: string;
}
