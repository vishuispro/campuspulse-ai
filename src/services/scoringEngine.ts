/**
 * CampusPulse - Deterministic & Explainable Scoring Engine
 * 
 * Computes:
 * 1. Academic Risk Index (ARI, 0-100, higher = greater risk)
 * 2. Placement Readiness Index (PRI, 0-100, higher = greater readiness)
 * 3. Student Success Score (SSS, 0-100, higher = stronger overall flourishing)
 * 
 * Core Design Tenet:
 * - 100% Deterministic and mathematically transparent.
 * - Every point scored has an explicit attribution and factor description.
 * - Missing data is NEVER treated as zero or assumed certain. It is explicitly
 *   surfaced in `missingComponents` and degrades confidence.
 */

import {
  AcademicData,
  AttendanceData,
  LMSActivityData,
  PlacementData,
  AcademicRiskEvaluation,
  PlacementReadinessEvaluation,
  StudentSuccessEvaluation,
  ContributingFactor,
  RiskLevel,
  PlacementTier,
} from '../types/student';
import {
  AcademicRiskConfig,
  PlacementReadinessConfig,
  StudentSuccessScoreConfig,
  DEFAULT_SCORING_CONFIG,
} from '../config/scoringConfig';

/**
 * Evaluates Academic Risk Index (0 - 100). Higher = More Risk.
 */
export function evaluateAcademicRisk(
  academic: AcademicData | null,
  attendance: AttendanceData | null,
  lms: LMSActivityData | null,
  customConfig?: Partial<AcademicRiskConfig>
): AcademicRiskEvaluation {
  const config = { ...DEFAULT_SCORING_CONFIG.academicRisk, ...customConfig };
  const factors: ContributingFactor[] = [];
  const missingComponents: string[] = [];

  let attendanceRisk = 0;
  let backlogRisk = 0;
  let marksRisk = 0;
  let lmsRisk = 0;

  let availableWeight = 0;

  // 1. Attendance Analysis (Weight: 35%)
  if (attendance) {
    availableWeight += config.weights.attendance;
    const att = attendance.overall_attendance_pct;

    if (att >= config.thresholds.attendanceGood) {
      factors.push({
        indicator: 'Exemplary Attendance',
        impactScore: 0,
        category: 'attendance',
        nature: 'positive_protective',
        description: `Overall attendance is high (${att.toFixed(1)}%). Zero risk penalty.`,
      });
    } else if (att >= config.thresholds.attendanceWarning) {
      attendanceRisk += 15;
      factors.push({
        indicator: 'Attendance Watchlist',
        impactScore: 15,
        category: 'attendance',
        nature: 'caution',
        description: `Attendance at ${att.toFixed(1)}% is below 85% benchmark (+15 pts risk).`,
      });
    } else if (att >= config.thresholds.attendanceCritical) {
      attendanceRisk += 30;
      factors.push({
        indicator: 'Attendance Shortfall Alert',
        impactScore: 30,
        category: 'attendance',
        nature: 'negative_risk',
        description: `Attendance at ${att.toFixed(1)}% violates university 75% minimum (+30 pts risk).`,
      });
    } else {
      attendanceRisk += 35;
      factors.push({
        indicator: 'Severe Attendance Deficit',
        impactScore: 35,
        category: 'attendance',
        nature: 'negative_risk',
        description: `Attendance critically low (${att.toFixed(1)}%). High danger of exam debarment (+35 pts risk).`,
      });
    }

    if (attendance.trend_last_30_days === 'declining') {
      attendanceRisk += config.penalties.decliningTrend;
      factors.push({
        indicator: 'Declining Attendance Trajectory',
        impactScore: config.penalties.decliningTrend,
        category: 'attendance',
        nature: 'negative_risk',
        description: `Attendance trend has dropped over the last 30 days (+${config.penalties.decliningTrend} pts risk).`,
      });
    }
  } else {
    missingComponents.push('Attendance Records');
    factors.push({
      indicator: 'Missing Attendance Data',
      impactScore: 0,
      category: 'data_quality',
      nature: 'caution',
      description: 'Attendance stream not found. Risk not computed from attendance.',
    });
  }

  // 2. Backlogs / Arrears Analysis (Weight: 25%)
  if (academic) {
    availableWeight += config.weights.backlogs;
    const backlogs = academic.backlogs_count;

    if (backlogs === 0) {
      factors.push({
        indicator: 'Clean Academic Record',
        impactScore: 0,
        category: 'academic',
        nature: 'positive_protective',
        description: 'Zero active backlogs or course arrears.',
      });
    } else {
      backlogRisk = Math.min(
        config.penalties.maxBacklogPenalty,
        backlogs * config.penalties.backlogPerItem
      );
      factors.push({
        indicator: 'Active Course Backlogs',
        impactScore: backlogRisk,
        category: 'academic',
        nature: 'negative_risk',
        description: `${backlogs} active backlog(s) recorded (+${backlogRisk} pts risk).`,
      });
    }

    // 3. Internal Marks Analysis (Weight: 25%)
    availableWeight += config.weights.internalMarks;
    const marks = academic.internal_midterm_pct;

    if (marks >= config.thresholds.internalMarksGood) {
      factors.push({
        indicator: 'Strong Midterm Performance',
        impactScore: 0,
        category: 'academic',
        nature: 'positive_protective',
        description: `Internal midterm score is ${marks.toFixed(1)}%. Solid concept grasp.`,
      });
    } else if (marks >= config.thresholds.internalMarksWarning) {
      marksRisk = 10;
      factors.push({
        indicator: 'Average Midterm Score',
        impactScore: 10,
        category: 'academic',
        nature: 'caution',
        description: `Internal score (${marks.toFixed(1)}%) indicates moderate subject struggle (+10 pts risk).`,
      });
    } else if (marks >= config.thresholds.internalMarksCritical) {
      marksRisk = 18;
      factors.push({
        indicator: 'Low Midterm Score',
        impactScore: 18,
        category: 'academic',
        nature: 'negative_risk',
        description: `Internal score (${marks.toFixed(1)}%) places student at risk of failing (+18 pts risk).`,
      });
    } else {
      marksRisk = 25;
      factors.push({
        indicator: 'Critical Midterm Failure',
        impactScore: 25,
        category: 'academic',
        nature: 'negative_risk',
        description: `Internal score (${marks.toFixed(1)}%) is below passing baseline (+25 pts risk).`,
      });
    }
  } else {
    missingComponents.push('Academic History');
    factors.push({
      indicator: 'Missing Academic Record',
      impactScore: 0,
      category: 'data_quality',
      nature: 'caution',
      description: 'Academic grades and backlogs not found. Component omitted from risk.',
    });
  }

  // 4. LMS Activity & Engagement (Weight: 15%)
  if (lms) {
    availableWeight += config.weights.lmsEngagement;
    if (lms.assignment_submission_rate < 60) {
      lmsRisk += config.penalties.lowLmsSubmission;
      factors.push({
        indicator: 'Low Assignment Submissions',
        impactScore: config.penalties.lowLmsSubmission,
        category: 'lms',
        nature: 'negative_risk',
        description: `Assignment submission rate is only ${lms.assignment_submission_rate.toFixed(1)}% (+${config.penalties.lowLmsSubmission} pts risk).`,
      });
    }
    if (lms.weekly_login_frequency < 2) {
      lmsRisk += config.penalties.lowLmsLogins;
      factors.push({
        indicator: 'Infrequent LMS Logins',
        impactScore: config.penalties.lowLmsLogins,
        category: 'lms',
        nature: 'negative_risk',
        description: `Student logs into LMS ${lms.weekly_login_frequency} time(s)/week (+${config.penalties.lowLmsLogins} pts risk).`,
      });
    }
    if (lmsRisk === 0) {
      factors.push({
        indicator: 'Consistent LMS Engagement',
        impactScore: 0,
        category: 'lms',
        nature: 'positive_protective',
        description: `Active LMS logins (${lms.weekly_login_frequency}/week) and ${lms.assignment_submission_rate.toFixed(1)}% submission rate.`,
      });
    }
  } else {
    missingComponents.push('LMS Engagement');
  }

  // Calculate normalized risk score based strictly on available components
  let rawRisk = attendanceRisk + backlogRisk + marksRisk + lmsRisk;

  // If some components are missing, scale the available score proportionally
  let finalScore = 0;
  if (availableWeight > 0) {
    const scaleFactor = 1.0 / availableWeight;
    finalScore = Math.min(100, Math.max(0, Math.round(rawRisk * scaleFactor)));
  }

  // Confidence determination
  let confidence: 'high' | 'medium' | 'low_incomplete_data' = 'high';
  if (missingComponents.length >= 2) {
    confidence = 'low_incomplete_data';
  } else if (missingComponents.length === 1) {
    confidence = 'medium';
  }

  // Risk band classification
  let level: RiskLevel = 'Low';
  if (finalScore > config.bands.highMax) {
    level = 'Critical';
  } else if (finalScore > config.bands.moderateMax) {
    level = 'High';
  } else if (finalScore > config.bands.lowMax) {
    level = 'Moderate';
  }

  return {
    score: finalScore,
    level,
    confidence,
    factors,
    missingComponents,
  };
}

/**
 * Evaluates Placement Readiness Index (0 - 100). Higher = More Prepared.
 */
export function evaluatePlacementReadiness(
  placement: PlacementData | null,
  academic: AcademicData | null,
  customConfig?: Partial<PlacementReadinessConfig>
): PlacementReadinessEvaluation {
  const config = { ...DEFAULT_SCORING_CONFIG.placementReadiness, ...customConfig };
  const factors: ContributingFactor[] = [];
  const missingComponents: string[] = [];

  if (!placement) {
    missingComponents.push('Placement Assessments');
    return {
      score: 0,
      tier: 'At Risk / Ineligible',
      confidence: 'low_incomplete_data',
      factors: [
        {
          indicator: 'Missing Placement Data',
          impactScore: 0,
          category: 'data_quality',
          nature: 'caution',
          description: 'No placement assessment records found. Student not yet evaluated.',
        },
      ],
      missingComponents,
      isBacklogBlocked: false,
    };
  }

  // Compute component sub-scores (0-100 scale)
  const coding = Math.min(100, Math.max(0, placement.coding_assessment_score));
  const aptitude = Math.min(100, Math.max(0, placement.aptitude_reasoning_score));
  const mockScore = Math.min(100, Math.max(0, (placement.mock_interview_rating / 5.0) * 100));
  const projectScore = Math.min(100, Math.max(0, placement.projects_count * 25)); // 4 projects = 100%

  let rawScore =
    coding * config.weights.codingAssessment +
    aptitude * config.weights.aptitudeReasoning +
    mockScore * config.weights.mockInterview +
    projectScore * config.weights.projectsAndPortfolio;

  // Add factor rationales
  factors.push({
    indicator: 'Coding Proficiency',
    impactScore: Math.round(coding * config.weights.codingAssessment),
    category: 'skills',
    nature: coding >= 75 ? 'positive_protective' : coding < 50 ? 'negative_risk' : 'neutral',
    description: `Coding assessment score: ${coding.toFixed(1)}/100 (Contributes ${Math.round(coding * config.weights.codingAssessment)} pts).`,
  });

  factors.push({
    indicator: 'Aptitude & Reasoning',
    impactScore: Math.round(aptitude * config.weights.aptitudeReasoning),
    category: 'skills',
    nature: aptitude >= 70 ? 'positive_protective' : 'neutral',
    description: `Aptitude assessment: ${aptitude.toFixed(1)}/100 (Contributes ${Math.round(aptitude * config.weights.aptitudeReasoning)} pts).`,
  });

  factors.push({
    indicator: 'Mock Interview Evaluation',
    impactScore: Math.round(mockScore * config.weights.mockInterview),
    category: 'skills',
    nature: placement.mock_interview_rating >= 3.5 ? 'positive_protective' : 'negative_risk',
    description: `Mock interview rating: ${placement.mock_interview_rating.toFixed(1)}/5.0.`,
  });

  if (placement.projects_count >= 2) {
    factors.push({
      indicator: 'Project Portfolio',
      impactScore: Math.round(projectScore * config.weights.projectsAndPortfolio),
      category: 'skills',
      nature: 'positive_protective',
      description: `${placement.projects_count} verified technical projects documented.`,
    });
  }

  // Institutional Eligibility Gate: Check Active Backlogs
  let isBacklogBlocked = false;
  if (academic && academic.backlogs_count > config.institutionalEligibilityGates.maxAllowedBacklogsForTier1) {
    isBacklogBlocked = true;
    if (rawScore > config.institutionalEligibilityGates.capScoreIfBacklogsPresent) {
      const reduction = Math.round(rawScore - config.institutionalEligibilityGates.capScoreIfBacklogsPresent);
      rawScore = config.institutionalEligibilityGates.capScoreIfBacklogsPresent;
      factors.push({
        indicator: 'Active Backlog Eligibility Cap',
        impactScore: -reduction,
        category: 'academic',
        nature: 'negative_risk',
        description: `Campus recruiters require 0 active backlogs. Student has ${academic.backlogs_count} backlog(s). Score capped at 50 pts until cleared.`,
      });
    }
  }

  // Resume verification penalty
  if (config.institutionalEligibilityGates.requireResumeVerified && !placement.resume_verified) {
    rawScore = Math.max(0, rawScore - config.institutionalEligibilityGates.resumeUnverifiedPenalty);
    factors.push({
      indicator: 'Resume Pending Verification',
      impactScore: -config.institutionalEligibilityGates.resumeUnverifiedPenalty,
      category: 'skills',
      nature: 'caution',
      description: `Resume is unverified by placement cell (-${config.institutionalEligibilityGates.resumeUnverifiedPenalty} pts).`,
    });
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Tier classification
  let tier: PlacementTier = 'At Risk / Ineligible';
  if (finalScore >= config.tiers.tier1Min && !isBacklogBlocked) {
    tier = 'Tier-1 Ready';
  } else if (finalScore >= config.tiers.tier2Min) {
    tier = 'Tier-2 Ready';
  } else if (finalScore >= config.tiers.needsUpskillingMin) {
    tier = 'Needs Upskilling';
  }

  return {
    score: finalScore,
    tier,
    confidence: 'high',
    factors,
    missingComponents,
    isBacklogBlocked,
  };
}

/**
 * Evaluates Unified Student Success Score (0 - 100). Higher = Thriving.
 */
export function evaluateStudentSuccessScore(
  academicRisk: AcademicRiskEvaluation,
  placementReadiness: PlacementReadinessEvaluation,
  customConfig?: Partial<StudentSuccessScoreConfig>
): StudentSuccessEvaluation {
  const config = { ...DEFAULT_SCORING_CONFIG.successScore, ...customConfig };

  // SSS = (100 - ARI) * 0.55 + (PRI) * 0.45
  const academicHealthyComponent = Math.max(0, 100 - academicRisk.score);
  const readinessComponent = placementReadiness.score;

  let finalScore = 0;
  let formula = '';
  let confidence: 'high' | 'medium' | 'low_incomplete_data' = 'high';

  if (academicRisk.confidence === 'low_incomplete_data' && placementReadiness.confidence === 'low_incomplete_data') {
    confidence = 'low_incomplete_data';
    finalScore = 50; // Neutral baseline when no information exists
    formula = 'Insufficient campus data streams available to compute reliable score';
  } else if (academicRisk.confidence === 'low_incomplete_data') {
    confidence = 'medium';
    finalScore = Math.round(readinessComponent);
    formula = '100% Placement Readiness (Academic records pending)';
  } else if (placementReadiness.confidence === 'low_incomplete_data') {
    confidence = 'medium';
    finalScore = Math.round(academicHealthyComponent);
    formula = '100% Academic Standing (Placement records pending)';
  } else {
    finalScore = Math.round(
      academicHealthyComponent * config.academicWeight +
      readinessComponent * config.placementWeight
    );
    formula = `(${academicHealthyComponent} Academic × ${Math.round(config.academicWeight * 100)}%) + (${readinessComponent} Placement × ${Math.round(config.placementWeight * 100)}%)`;
  }

  // Derive primary strength and primary risk factor
  const negativeFactors = academicRisk.factors
    .filter((f) => f.nature === 'negative_risk')
    .sort((a, b) => b.impactScore - a.impactScore);

  const positiveFactors = [
    ...academicRisk.factors.filter((f) => f.nature === 'positive_protective'),
    ...placementReadiness.factors.filter((f) => f.nature === 'positive_protective'),
  ].sort((a, b) => b.impactScore - a.impactScore);

  const primaryRiskFactor =
    negativeFactors.length > 0
      ? negativeFactors[0].description
      : 'No high-risk academic or attendance anomalies detected';

  const primaryStrength =
    positiveFactors.length > 0
      ? positiveFactors[0].description
      : 'Consistent baseline performance';

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    compositeFormula: formula,
    confidence,
    primaryStrength,
    primaryRiskFactor,
  };
}
