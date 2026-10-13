import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  History,
} from 'lucide-react';
import {
  Intervention,
  InterventionStatus,
  UnifiedStudent,
} from '../../types/student';
import { canTransitionStatus } from '../../services/interventionStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InterventionDetailDrawerProps {
  intervention: Intervention | null;
  student: UnifiedStudent | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: InterventionStatus, resolutionNote?: string) => void;
  onUpdateFollowUp: (id: string, newFollowUpDate: string, newNoteText?: string) => void;
}

export function InterventionDetailDrawer({
  intervention,
  student,
  isOpen,
  onClose,
  onStatusChange,
  onUpdateFollowUp,
}: InterventionDetailDrawerProps) {
  // Follow-up date edit state
  const [isEditingFollowUp, setIsEditingFollowUp] = useState(false);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');

  // Resolution prompt state
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionError, setResolutionError] = useState('');

  // Sync state when intervention changes
  useEffect(() => {
    if (intervention) {
      setFollowUpDateInput(intervention.target_follow_up_date);
      setFollowUpNoteInput('');
      setIsEditingFollowUp(false);
      setIsResolving(false);
      setResolutionNote('');
      setResolutionError('');
    }
  }, [intervention]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !intervention) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = intervention.status !== 'resolved' && intervention.target_follow_up_date < todayStr;
  const isDueSoon =
    intervention.status !== 'resolved' &&
    !isOverdue &&
    Date.parse(intervention.target_follow_up_date) <= Date.now() + 7 * 24 * 60 * 60 * 1000;

  const handleResolveSubmit = () => {
    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      setResolutionError('A concise resolution note explaining the outcome/actions taken is required (min 5 characters).');
      return;
    }

    onStatusChange(intervention.id, 'resolved', resolutionNote.trim());
    setIsResolving(false);
    setResolutionNote('');
    setResolutionError('');
  };

  const handleSaveFollowUp = () => {
    if (!followUpDateInput) return;
    onUpdateFollowUp(intervention.id, followUpDateInput, followUpNoteInput);
    setIsEditingFollowUp(false);
    setFollowUpNoteInput('');
  };

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
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200/90 text-slate-800 font-bold">
                  {intervention.id}
                </span>
                <span className="font-bold text-base text-slate-900 truncate">
                  {intervention.type}
                </span>
                {intervention.is_user_created && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    Faculty Created
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Student: <span className="font-semibold text-slate-900">{intervention.student_name}</span>{' '}
                <span className="font-mono text-slate-500">({intervention.student_id})</span>
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

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-700">
            {/* Status and Follow-up Summary Bar */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Status
                </span>
                <div className="mt-1">
                  <Badge
                    variant={
                      intervention.status === 'resolved'
                        ? 'positive'
                        : intervention.status === 'in_progress'
                        ? 'accent'
                        : intervention.status === 'escalated'
                        ? 'critical'
                        : 'neutral'
                    }
                    size="md"
                    className="capitalize font-bold"
                  >
                    {intervention.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Priority
                </span>
                <div className="mt-1">
                  <Badge
                    variant={
                      intervention.priority === 'critical'
                        ? 'critical'
                        : intervention.priority === 'high'
                        ? 'high'
                        : intervention.priority === 'medium'
                        ? 'moderate'
                        : 'low'
                    }
                    size="md"
                    className="capitalize font-semibold"
                  >
                    {intervention.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Assigned Mentor
                </span>
                <div className="font-semibold text-slate-800 mt-1 truncate" title={intervention.assigned_to}>
                  {intervention.assigned_to}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Follow-up Due
                </span>
                <div className="font-mono font-semibold text-slate-900 mt-1 flex items-center gap-1">
                  <span>{intervention.target_follow_up_date}</span>
                  {isOverdue && (
                    <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                      Overdue
                    </span>
                  )}
                  {isDueSoon && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Due Soon
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Student Context & Supporting Evidence */}
            {student && (
              <div className="p-3.5 rounded-lg bg-teal-50/50 border border-teal-200/80 space-y-2">
                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                  Student Institutional Evidence & Metrics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Department:</span>
                    <span className="font-semibold text-slate-900">{student.department} (Sem {student.semester})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Academic Risk:</span>
                    <span className={`font-semibold ${student.academicRisk.score >= 55 ? 'text-red-700' : 'text-slate-800'}`}>
                      {student.academicRisk.level} ({student.academicRisk.score}/100)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attendance:</span>
                    <span className={`font-semibold ${student.attendance && student.attendance.overall_attendance_pct < 75 ? 'text-red-700' : 'text-slate-800'}`}>
                      {student.attendance ? `${student.attendance.overall_attendance_pct.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Active Backlogs:</span>
                    <span className={`font-semibold ${student.academic && student.academic.backlogs_count > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {student.academic ? student.academic.backlogs_count : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Plan & Notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Action Plan & Counseling Log
              </h4>
              <div className="p-3 rounded-lg bg-white border border-slate-200 whitespace-pre-wrap leading-relaxed text-slate-800 font-sans">
                {intervention.notes}
              </div>
            </div>

            {/* Resolution Outcome Notes (if resolved) */}
            {intervention.outcome_notes && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Documented Case Resolution Outcome:</span>
                </div>
                <p className="text-emerald-950/90 text-xs leading-relaxed pl-5.5">
                  {intervention.outcome_notes}
                </p>
              </div>
            )}

            {/* Status Transition Control Panel */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Manage Case Lifecycle Status</span>
                <span className="text-[10px] text-slate-400 font-normal">Controlled Transition Workflow</span>
              </h4>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Pending -> In Progress */}
                {canTransitionStatus(intervention.status, 'in_progress') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onStatusChange(intervention.id, 'in_progress')}
                  >
                    Start Working (In Progress)
                  </Button>
                )}

                {/* -> Escalated */}
                {canTransitionStatus(intervention.status, 'escalated') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(intervention.id, 'escalated')}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Escalate Case
                  </Button>
                )}

                {/* -> Resolved (Opens note prompt) */}
                {canTransitionStatus(intervention.status, 'resolved') && !isResolving && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsResolving(true)}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    Resolve Case...
                  </Button>
                )}

                {/* Resolved -> Re-open (In Progress) */}
                {intervention.status === 'resolved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(intervention.id, 'in_progress', 'Case re-opened for ongoing follow-up.')}
                  >
                    Re-open Case
                  </Button>
                )}
              </div>

              {/* Resolution Note Prompt */}
              {isResolving && (
                <div className="mt-3 p-3 rounded bg-emerald-50/70 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">
                      Document Resolution Notes <span className="text-red-500">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsResolving(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Describe the actions executed and student response. Note: Do not claim academic grade improvement unless supported by subsequent examination records.
                  </p>
                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="e.g. Student attended remedial tutoring session. Weekly attendance agreement signed with guardian."
                    className="w-full text-xs bg-white border border-emerald-200 rounded p-2 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                  {resolutionError && (
                    <p className="text-[11px] text-red-600 font-medium">{resolutionError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsResolving(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleResolveSubmit}>
                      Confirm Resolution
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up Date Update & Progress Note Log */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Update Follow-up & Add Log Entry
                </h4>
                {!isEditingFollowUp ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingFollowUp(true)}>
                    Edit Date / Log Note
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingFollowUp(false)}>
                    Cancel
                  </Button>
                )}
              </div>

              {isEditingFollowUp && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-followup-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
                        New Follow-up Date:
                      </label>
                      <input
                        id="new-followup-date"
                        type="date"
                        value={followUpDateInput}
                        onChange={(e) => setFollowUpDateInput(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="log-note" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Add Progress Note:
                    </label>
                    <textarea
                      id="log-note"
                      rows={2}
                      value={followUpNoteInput}
                      onChange={(e) => setFollowUpNoteInput(e.target.value)}
                      placeholder="e.g. Completed weekly check-in. Attendance improved from 62% to 68% over past 10 days."
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" onClick={handleSaveFollowUp}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Status History & Audit Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Case History & Activity Timeline
              </h4>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 divide-y divide-slate-200/60">
                <div className="py-2 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Case Opened</span>
                    <span className="font-mono">{intervention.created_at}</span>
                  </div>
                  <p className="text-slate-800 mt-0.5">Assigned to: {intervention.assigned_to}</p>
                </div>

                {intervention.status_history &&
                  intervention.status_history.map((entry, idx) => (
                    <div key={idx} className="py-2 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span className="capitalize font-semibold text-slate-800">
                          {entry.from_status} → {entry.to_status}
                        </span>
                        <span className="font-mono">{entry.timestamp.slice(0, 10)}</span>
                      </div>
                      <p className="text-slate-700 mt-0.5">{entry.notes || `Transitioned by ${entry.changed_by}`}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Changes persist immediately to local storage.
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
