import { useEffect } from 'react';
import {
  X,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { UnifiedStudent } from '../../types/student';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface StudentDetailDrawerProps {
  student: UnifiedStudent | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerIntervention?: (student: UnifiedStudent) => void;
}

export function StudentDetailDrawer({
  student,
  isOpen,
  onClose,
  onTriggerIntervention,
}: StudentDetailDrawerProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const isCriticalRisk = student.academicRisk.level === 'Critical';
  const isHighRisk = student.academicRisk.level === 'High';
  const isModerateRisk = student.academicRisk.level === 'Moderate';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                  {student.name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                  {student.id}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                  Synthetic Record
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {student.department} • Semester {student.semester} • Mentor: <span className="font-medium text-slate-800">{student.mentorName}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-700">
            {/* Top Score Bar */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              {/* Academic Risk */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Academic Risk (ARI)
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {student.academicRisk.score}
                  </span>
                  <Badge
                    variant={
                      isCriticalRisk
                        ? 'critical'
                        : isHighRisk
                        ? 'high'
                        : isModerateRisk
                        ? 'moderate'
                        : 'low'
                    }
                    size="sm"
                  >
                    {student.academicRisk.level}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Scale 0-100 (Higher = Risk)</span>
              </div>

              {/* Placement Readiness */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Placement Readiness (PRI)
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {student.placementReadiness.score}
                  </span>
                  <Badge
                    variant={
                      student.placementReadiness.tier === 'Tier-1 Ready'
                        ? 'positive'
                        : student.placementReadiness.tier === 'Tier-2 Ready'
                        ? 'neutral'
                        : 'moderate'
                    }
                    size="sm"
                  >
                    {student.placementReadiness.tier}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Scale 0-100 (Higher = Ready)</span>
              </div>

              {/* Composite Success Score */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Success Score (SSS)
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xl font-extrabold font-mono text-teal-800 tabular-nums">
                    {student.successScore.score}
                  </span>
                  <span className="text-xs text-slate-400">/100</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 truncate" title={student.successScore.compositeFormula}>
                  Confidence: {student.successScore.confidence.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Incomplete Data Warning Banner (if any) */}
            {student.missingStreams.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Incomplete Data Stream Notice</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Records for <strong>{student.missingStreams.join(', ')}</strong> were not provided in the source files. The scoring engine has evaluated this student using available components only without assuming missing data as zero.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 1: OBSERVED INSTITUTIONAL DATA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                  Observed Institutional Records
                </h4>
                <span className="text-[10px] text-slate-400">Master CSV Imports</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Academic Performance */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Academics & Arrears
                  </span>
                  {student.academic ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">CGPA:</span>
                        <span className="font-bold text-slate-900 font-mono tabular-nums">{student.academic.cgpa.toFixed(2)} / 10.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Internal Midterm:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.academic.internal_midterm_pct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Backlogs:</span>
                        <span className={`font-mono font-bold ${student.academic.backlogs_count > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {student.academic.backlogs_count}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No academic marks provided.</p>
                  )}
                </div>

                {/* Attendance Records */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Attendance Monitoring
                  </span>
                  {student.attendance ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Overall Attendance:</span>
                        <span className={`font-bold font-mono tabular-nums ${student.attendance.overall_attendance_pct < 75 ? 'text-red-700' : 'text-slate-900'}`}>
                          {student.attendance.overall_attendance_pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lab Attendance:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.attendance.lab_attendance_pct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">30-Day Trend:</span>
                        <span className="font-medium capitalize text-slate-800">{student.attendance.trend_last_30_days}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No attendance records provided.</p>
                  )}
                </div>

                {/* LMS Activity */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    LMS Learning Activity
                  </span>
                  {student.lms ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weekly Logins:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.lms.weekly_login_frequency} times/wk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assignment Rate:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.lms.assignment_submission_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Forum Engagement:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.lms.forum_engagement_score.toFixed(0)}/100</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">LMS activity records have not been provided.</p>
                  )}
                </div>

                {/* Placement & Skills */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Placement & Skills Assessments
                  </span>
                  {student.placement ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coding Assessment:</span>
                        <span className="font-mono text-slate-900 font-bold">{student.placement.coding_assessment_score.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aptitude & Reasoning:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.placement.aptitude_reasoning_score.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mock Interview:</span>
                        <span className="font-mono text-slate-900 font-medium">{student.placement.mock_interview_rating.toFixed(1)}/5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Resume Verified:</span>
                        <span className={`font-medium ${student.placement.resume_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {student.placement.resume_verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Placement assessment records have not been provided.</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: DERIVED RISK & READINESS EXPLANATIONS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  Explainable Contributing Factors
                </h4>
                <span className="text-[10px] text-slate-400">Scoring Engine Attribution</span>
              </div>

              <div className="space-y-2">
                {[
                  ...student.academicRisk.factors,
                  ...student.placementReadiness.factors,
                ].map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded border border-slate-200 bg-white flex items-start justify-between text-xs gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{factor.indicator}</div>
                      <p className="text-slate-600 mt-0.5 text-[11px]">{factor.description}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded font-mono font-medium text-[11px] whitespace-nowrap ${
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

            {/* SECTION 3: RECOMMENDED NEXT STEPS & INTERVENTIONS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-teal-700" />
                  Prescriptive Recommendations & Actions
                </h4>
                <span className="text-[10px] text-slate-400">Institutional Decision Support</span>
              </div>

              <div className="space-y-2">
                {student.recommendedInterventions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-teal-200 bg-teal-50/50 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-950">{action.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                        {action.urgency} priority
                      </span>
                    </div>
                    <p className="text-teal-900/80 leading-relaxed text-[11px]">{action.justification}</p>
                  </div>
                ))}
              </div>

              {/* Logged Interventions History */}
              {student.interventions.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Case Log ({student.interventions.length})
                  </span>
                  {student.interventions.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900">{item.type}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 uppercase">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{item.notes}</p>
                      <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-200/60">
                        <span>Assigned to: {item.assigned_to}</span>
                        <span>Follow-up: {item.target_follow_up_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Evaluated strictly using transparent weighted scoring rules.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              {onTriggerIntervention && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => {
                    onTriggerIntervention(student);
                  }}
                >
                  Create Intervention
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
