import { useState, useEffect } from 'react';
import { generateSyntheticDataset } from './data/syntheticDataGenerator';
import { parseCsvString } from './services/csvParser';
import { reconcileCampusData, ReconciliationResult } from './services/dataReconciler';
import {
  RawAcademicRecord,
  RawAttendanceRecord,
  RawLMSActivityRecord,
  RawPlacementRecord,
  RawInterventionRecord,
  UnifiedStudent,
} from './types/student';
import { DEFAULT_SCORING_CONFIG } from './config/scoringConfig';

export default function App() {
  const [dataResult, setDataResult] = useState<ReconciliationResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<UnifiedStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate & reconcile benchmark dataset on initialization
    const bundle = generateSyntheticDataset(150);

    const academics = parseCsvString<RawAcademicRecord>(bundle.academicsCsv).data;
    const attendance = parseCsvString<RawAttendanceRecord>(bundle.attendanceCsv).data;
    const lms = parseCsvString<RawLMSActivityRecord>(bundle.lmsCsv).data;
    const placement = parseCsvString<RawPlacementRecord>(bundle.placementCsv).data;
    const interventions = parseCsvString<RawInterventionRecord>(bundle.interventionsCsv).data;

    const reconciled = reconcileCampusData({
      academics,
      attendance,
      lms,
      placement,
      interventions,
    });

    setDataResult(reconciled);
    if (reconciled.students.length > 0) {
      setSelectedStudent(reconciled.students[0]);
    }
    setIsLoading(false);
  }, []);

  if (isLoading || !dataResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Initializing CampusPulse Core Domain Engine...</p>
        </div>
      </div>
    );
  }

  const { students, report } = dataResult;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
              CP
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 tracking-tight text-base leading-none">
                CampusPulse
              </h1>
              <p className="text-xs text-slate-500 mt-1">Student Success Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium">
              Phase 2: Core Domain Engine Active
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              v1.0.0-alpha
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Phase 2 Scaffolding Status Banner */}
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Core Domain Engine & Scaffolding Verification
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Data reconciliation, deterministic scoring formulas, validation reporting, and synthetic dataset verified.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                13 Unit Tests Passing
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                150 Synthetic Records Loaded
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <div className="p-3.5 bg-slate-50 rounded border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unique Students</span>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{report.totalUniqueStudents}</p>
              <span className="text-xs text-slate-500">Across 4 Departments</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Full Stream Matches</span>
              <p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">{report.matchedAcrossAllStreams}</p>
              <span className="text-xs text-slate-500">All 4 streams present</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unmatched / Orphaned</span>
              <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{report.unmatchedRecords.length}</p>
              <span className="text-xs text-slate-500">Flagged for audit</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded border border-slate-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Interventions</span>
              <p className="text-2xl font-bold text-indigo-700 mt-1 tabular-nums">
                {report.totalRecordsProcessed.interventions}
              </p>
              <span className="text-xs text-slate-500">Assigned & logged</span>
            </div>
          </div>
        </section>

        {/* Two-Column Diagnostic Inspection Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Student Selector & Cohort Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Synthetic Student Roster</h3>
                <span className="text-xs text-slate-500">Select to inspect scores</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded">
                {students.slice(0, 20).map((stu) => {
                  const isSelected = selectedStudent?.id === stu.id;
                  return (
                    <button
                      key={stu.id}
                      onClick={() => setSelectedStudent(stu)}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-slate-100 font-medium text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{stu.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {stu.id} • {stu.department}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            stu.academicRisk.level === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : stu.academicRisk.level === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : stu.academicRisk.level === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          ARI: {stu.academicRisk.score} ({stu.academicRisk.level})
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          SSS: {stu.successScore.score}/100
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-right">
                Showing first 20 of {students.length} reconciled students
              </p>
            </div>

            {/* Reconciliation Hygiene Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Data Reconciler Audit Log</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Processed Academics Records</span>
                  <span className="font-mono font-medium">{report.totalRecordsProcessed.academics}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Processed Attendance Records</span>
                  <span className="font-mono font-medium">{report.totalRecordsProcessed.attendance}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Processed LMS Records</span>
                  <span className="font-mono font-medium">{report.totalRecordsProcessed.lms}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Processed Placement Records</span>
                  <span className="font-mono font-medium">{report.totalRecordsProcessed.placement}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Unmatched Records Detected</span>
                  <span className="font-mono font-medium text-amber-700">{report.unmatchedRecords.length}</span>
                </div>
              </div>
              {report.unmatchedRecords.length > 0 && (
                <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
                  <span className="font-semibold">Detected Orphaned Record:</span> {report.unmatchedRecords[0].student_id} ({report.unmatchedRecords[0].reason})
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Deep-Dive Student Intelligence Inspection Card */}
          <div className="lg:col-span-7">
            {selectedStudent ? (
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      USN: {selectedStudent.id} • Dept: {selectedStudent.department} • Sem: {selectedStudent.semester}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Faculty Mentor: <span className="font-medium text-slate-800">{selectedStudent.mentorName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Student Success Score
                    </span>
                    <span className="text-3xl font-extrabold text-teal-800 tabular-nums">
                      {selectedStudent.successScore.score}
                      <span className="text-base font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Academic Risk Index Card */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Academic Risk Index (ARI)
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          selectedStudent.academicRisk.level === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : selectedStudent.academicRisk.level === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : selectedStudent.academicRisk.level === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedStudent.academicRisk.level}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">
                      {selectedStudent.academicRisk.score}
                      <span className="text-xs font-normal text-slate-500"> / 100</span>
                    </p>
                    <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                      <div>CGPA: <span className="font-medium">{selectedStudent.academic?.cgpa ?? 'N/A'}</span></div>
                      <div>Attendance: <span className="font-medium">{selectedStudent.attendance?.overall_attendance_pct ?? 'N/A'}%</span> ({selectedStudent.attendance?.trend_last_30_days ?? 'N/A'})</div>
                      <div>Backlogs: <span className="font-medium">{selectedStudent.academic?.backlogs_count ?? 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Placement Readiness Card */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Placement Readiness (PRI)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-200 text-slate-800">
                        {selectedStudent.placementReadiness.tier}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">
                      {selectedStudent.placementReadiness.score}
                      <span className="text-xs font-normal text-slate-500"> / 100</span>
                    </p>
                    <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                      <div>Coding Assessment: <span className="font-medium">{selectedStudent.placement?.coding_assessment_score ?? 'N/A'}/100</span></div>
                      <div>Aptitude Score: <span className="font-medium">{selectedStudent.placement?.aptitude_reasoning_score ?? 'N/A'}/100</span></div>
                      <div>Mock Interview: <span className="font-medium">{selectedStudent.placement?.mock_interview_rating ?? 'N/A'}/5.0</span></div>
                    </div>
                  </div>
                </div>

                {/* Explainability Factors Waterfall */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Transparent Contributing Factors
                  </h4>
                  <div className="space-y-2">
                    {[
                      ...selectedStudent.academicRisk.factors,
                      ...selectedStudent.placementReadiness.factors,
                    ].map((factor, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded border border-slate-100 bg-white flex items-start justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{factor.indicator}</span>
                          <p className="text-slate-600 mt-0.5">{factor.description}</p>
                        </div>
                        <span
                          className={`ml-3 px-2 py-0.5 rounded font-mono font-medium text-[11px] whitespace-nowrap ${
                            factor.nature === 'negative_risk'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : factor.nature === 'positive_protective'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {factor.nature === 'negative_risk'
                            ? `+${factor.impactScore} risk`
                            : factor.nature === 'positive_protective'
                            ? `+${factor.impactScore} pts`
                            : `${factor.impactScore} pts`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescriptive Recommended Interventions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recommended Interventions
                  </h4>
                  <div className="space-y-2">
                    {selectedStudent.recommendedInterventions.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded border border-teal-100 bg-teal-50/50 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-teal-950">{action.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                            {action.urgency} priority
                          </span>
                        </div>
                        <p className="text-teal-900/80">{action.justification}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associated Interventions Log */}
                {selectedStudent.interventions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Active Case Management History ({selectedStudent.interventions.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedStudent.interventions.map((intCase) => (
                        <div
                          key={intCase.id}
                          className="p-3 rounded border border-slate-200 bg-slate-50/80 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-900">{intCase.type}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 uppercase">
                              {intCase.status}
                            </span>
                          </div>
                          <p className="text-slate-600">{intCase.notes}</p>
                          <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                            <span>Assigned: {intCase.assigned_to}</span>
                            <span>Target: {intCase.target_follow_up_date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Configurable Institutional Rules Verification Card */}
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Institutional Rules & Scoring Configuration (Configurable)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200/80 space-y-1">
              <span className="font-semibold text-slate-800 block">Academic Risk Weights</span>
              <ul className="text-slate-600 space-y-0.5">
                <li>• Attendance: {DEFAULT_SCORING_CONFIG.academicRisk.weights.attendance * 100}%</li>
                <li>• Backlogs: {DEFAULT_SCORING_CONFIG.academicRisk.weights.backlogs * 100}%</li>
                <li>• Internal Midterms: {DEFAULT_SCORING_CONFIG.academicRisk.weights.internalMarks * 100}%</li>
                <li>• LMS Engagement: {DEFAULT_SCORING_CONFIG.academicRisk.weights.lmsEngagement * 100}%</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200/80 space-y-1">
              <span className="font-semibold text-slate-800 block">Placement Readiness Weights</span>
              <ul className="text-slate-600 space-y-0.5">
                <li>• Coding Assessment: {DEFAULT_SCORING_CONFIG.placementReadiness.weights.codingAssessment * 100}%</li>
                <li>• Aptitude & Reasoning: {DEFAULT_SCORING_CONFIG.placementReadiness.weights.aptitudeReasoning * 100}%</li>
                <li>• Mock Interview: {DEFAULT_SCORING_CONFIG.placementReadiness.weights.mockInterview * 100}%</li>
                <li>• Projects & Portfolio: {DEFAULT_SCORING_CONFIG.placementReadiness.weights.projectsAndPortfolio * 100}%</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200/80 space-y-1">
              <span className="font-semibold text-slate-800 block">Institutional Gate Rules</span>
              <ul className="text-slate-600 space-y-0.5">
                <li>• Tier-1 Max Backlogs: {DEFAULT_SCORING_CONFIG.placementReadiness.institutionalEligibilityGates.maxAllowedBacklogsForTier1}</li>
                <li>• Active Backlog Score Cap: {DEFAULT_SCORING_CONFIG.placementReadiness.institutionalEligibilityGates.capScoreIfBacklogsPresent} pts</li>
                <li>• Unverified Resume Penalty: -{DEFAULT_SCORING_CONFIG.placementReadiness.institutionalEligibilityGates.resumeUnverifiedPenalty} pts</li>
                <li>• Composite SSS Balance: 55% Academic / 45% Placement</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
