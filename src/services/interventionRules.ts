/**
 * CampusPulse - Evidence-Based Intervention Rule Matrix
 * 
 * Maps specific deficit indicators to targeted, actionable institutional
 * intervention packages with explicit justification.
 */

import {
  AcademicData,
  AttendanceData,
  LMSActivityData,
  PlacementData,
  AcademicRiskEvaluation,
  PlacementReadinessEvaluation,
  RecommendedAction,
} from '../types/student';

export function deriveRecommendedInterventions(
  academic: AcademicData | null,
  attendance: AttendanceData | null,
  lms: LMSActivityData | null,
  placement: PlacementData | null,
  academicRisk: AcademicRiskEvaluation,
  placementReadiness: PlacementReadinessEvaluation
): RecommendedAction[] {
  const recommendations: RecommendedAction[] = [];

  // Critical Compounded Risk Rule
  if (academicRisk.level === 'Critical') {
    recommendations.push({
      actionType: 'Dean Advisory',
      urgency: 'high',
      title: 'Urgent Academic Dean & Guardian Case Conference',
      justification: `Composite academic risk score (${academicRisk.score}/100) has reached Critical tier. Convene comprehensive case review across attendance and course coordinators.`,
    });
  }

  // Rule 1: Critical or Severe Attendance Alert
  if (attendance && attendance.overall_attendance_pct < 75) {
    recommendations.push({
      actionType: 'Attendance Counseling',
      urgency: attendance.overall_attendance_pct < 65 ? 'high' : 'medium',
      title: 'Dean Advisory & Mandatory Attendance Counseling',
      justification: `Current attendance (${attendance.overall_attendance_pct.toFixed(1)}%) breaches the mandatory university 75% threshold. Schedule an advisor review and issue formal shortfall warning before exam registration lock-in.`,
    });
  }

  // Rule 2: Active Backlogs or Course Struggling
  if (academic && academic.backlogs_count > 0) {
    recommendations.push({
      actionType: 'Academic Tutoring',
      urgency: academic.backlogs_count >= 2 ? 'high' : 'medium',
      title: 'Remedial Course Tutoring & Backlog Clearance Plan',
      justification: `Student has ${academic.backlogs_count} active backlogs. Assign senior departmental peer tutor and establish a weekly study plan for upcoming supplementary examinations.`,
    });
  } else if (academic && academic.internal_midterm_pct < 55) {
    recommendations.push({
      actionType: 'Academic Tutoring',
      urgency: 'medium',
      title: 'Midterm Concept Remediation Workshop',
      justification: `Internal assessment score (${academic.internal_midterm_pct.toFixed(1)}%) shows significant concept deficit. Course coordinator peer tutoring recommended.`,
    });
  }

  // Rule 3: Low LMS Submission & Disengagement
  if (lms && lms.assignment_submission_rate < 60) {
    recommendations.push({
      actionType: 'Wellness Check',
      urgency: 'low',
      title: 'LMS Disengagement & Academic Workload Check-in',
      justification: `Assignment submission rate is down to ${lms.assignment_submission_rate.toFixed(1)}% with only ${lms.weekly_login_frequency} logins/week. Mentor should assess workload or personal barriers.`,
    });
  }

  // Rule 4: Placement Coding Assessment Gap
  if (placement && placement.opt_in_placement) {
    if (placement.coding_assessment_score < 55) {
      recommendations.push({
        actionType: 'Placement Upskilling',
        urgency: 'high',
        title: 'DSA & Coding Assessment Fast-Track Sprint',
        justification: `Coding score (${placement.coding_assessment_score.toFixed(1)}/100) falls below corporate recruitment cutoffs (typically 65+). Enroll student in 4-week algorithmic problem solving cohort.`,
      });
    }

    // Rule 5: Mock Interview Gap
    if (placement.mock_interview_rating < 3.0) {
      recommendations.push({
        actionType: 'Placement Upskilling',
        urgency: 'medium',
        title: 'Career Cell Communication & Mock Interview Clinic',
        justification: `Mock interview rating is ${placement.mock_interview_rating.toFixed(1)}/5.0. Student requires structured practice in technical articulation and HR behavioral questions.`,
      });
    }

    // Rule 6: Resume Verification Pending
    if (!placement.resume_verified) {
      recommendations.push({
        actionType: 'Placement Upskilling',
        urgency: 'low',
        title: 'Placement Cell Resume Review & Verification',
        justification: `Resume is unverified by placement cell. Schedule peer resume review to ensure ATS compliance and project verification.`,
      });
    }
  }

  // Rule 7: Institutional Backlog Barrier on Placement
  if (placementReadiness.isBacklogBlocked) {
    recommendations.push({
      actionType: 'Academic Tutoring',
      urgency: 'high',
      title: 'Fast-Track Remedial Arrear Clearance',
      justification: 'Active arrears currently block eligibility for Tier-1 corporate placement drives. Priority focus on upcoming supplementary examination registration.',
    });
  }

  // If no critical flags, provide positive advisory
  if (recommendations.length === 0) {
    recommendations.push({
      actionType: 'Placement Upskilling',
      urgency: 'low',
      title: placementReadiness.tier === 'Tier-1 Ready' ? 'Honors Industry Mentorship & Research Track' : 'Skill Enrichment Track',
      justification: 'Student is performing reliably across academic and placement metrics. Recommend for honors project or hackathon mentorship.',
    });
  }

  return recommendations;
}
