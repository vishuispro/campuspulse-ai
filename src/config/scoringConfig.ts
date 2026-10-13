/**
 * CampusPulse - Scoring & Institutional Rules Configuration
 * Fully configurable weights, thresholds, and eligibility gates.
 * Allows institutional administrators or faculty to calibrate scoring
 * without altering core engine logic.
 */

export interface AcademicRiskConfig {
  weights: {
    attendance: number;       // default 0.35 (35%)
    backlogs: number;         // default 0.25 (25%)
    internalMarks: number;    // default 0.25 (25%)
    lmsEngagement: number;    // default 0.15 (15%)
  };
  thresholds: {
    attendanceGood: number;       // >= 85%: 0 penalty
    attendanceWarning: number;    // 75% - 85%: mild penalty
    attendanceDebarment: number; // < 75%: university debarment alert
    attendanceCritical: number;   // < 65%: severe penalty
    internalMarksGood: number;    // >= 70%
    internalMarksWarning: number; // 55% - 70%
    internalMarksCritical: number;// < 40%
  };
  penalties: {
    decliningTrend: number;       // +5 points if attendance is declining
    backlogPerItem: number;       // +10 points per backlog up to max
    maxBacklogPenalty: number;    // max 25 points
    lowLmsSubmission: number;     // +10 points if assignment rate < 60%
    lowLmsLogins: number;         // +5 points if logins < 2 per week
  };
  bands: {
    lowMax: number;        // 29
    moderateMax: number;   // 54
    highMax: number;       // 74
    // 75-100 is Critical
  };
}

export interface PlacementReadinessConfig {
  weights: {
    codingAssessment: number;     // default 0.35 (35%)
    aptitudeReasoning: number;    // default 0.25 (25%)
    mockInterview: number;        // default 0.25 (25%)
    projectsAndPortfolio: number; // default 0.15 (15%)
  };
  institutionalEligibilityGates: {
    maxAllowedBacklogsForTier1: number; // 0 backlogs allowed for top recruiters
    capScoreIfBacklogsPresent: number;  // Capped at 50 points if backlogs > 0
    requireResumeVerified: boolean;     // Penalize if false
    resumeUnverifiedPenalty: number;    // -10 points
  };
  tiers: {
    tier1Min: number;      // 80 - 100
    tier2Min: number;      // 65 - 79
    needsUpskillingMin: number; // 45 - 64
    // < 45 is At Risk / Ineligible
  };
}

export interface StudentSuccessScoreConfig {
  academicWeight: number;    // 0.55
  placementWeight: number;   // 0.45
}

export interface SystemScoringConfig {
  academicRisk: AcademicRiskConfig;
  placementReadiness: PlacementReadinessConfig;
  successScore: StudentSuccessScoreConfig;
}

export const DEFAULT_SCORING_CONFIG: SystemScoringConfig = {
  academicRisk: {
    weights: {
      attendance: 0.35,
      backlogs: 0.25,
      internalMarks: 0.25,
      lmsEngagement: 0.15,
    },
    thresholds: {
      attendanceGood: 85,
      attendanceWarning: 75,
      attendanceDebarment: 75,
      attendanceCritical: 65,
      internalMarksGood: 70,
      internalMarksWarning: 55,
      internalMarksCritical: 40,
    },
    penalties: {
      decliningTrend: 5,
      backlogPerItem: 10,
      maxBacklogPenalty: 25,
      lowLmsSubmission: 10,
      lowLmsLogins: 5,
    },
    bands: {
      lowMax: 29,
      moderateMax: 54,
      highMax: 74,
    },
  },
  placementReadiness: {
    weights: {
      codingAssessment: 0.35,
      aptitudeReasoning: 0.25,
      mockInterview: 0.25,
      projectsAndPortfolio: 0.15,
    },
    institutionalEligibilityGates: {
      maxAllowedBacklogsForTier1: 0,
      capScoreIfBacklogsPresent: 50,
      requireResumeVerified: true,
      resumeUnverifiedPenalty: 10,
    },
    tiers: {
      tier1Min: 80,
      tier2Min: 65,
      needsUpskillingMin: 45,
    },
  },
  successScore: {
    academicWeight: 0.55,
    placementWeight: 0.45,
  },
};
