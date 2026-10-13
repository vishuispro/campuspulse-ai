import { useState, useEffect } from 'react';
import {
  X,
  ClipboardList,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  UnifiedStudent,
  InterventionType,
  InterventionPriority,
  InterventionStatus,
} from '../../types/student';
import {
  CreateInterventionInput,
  validateInterventionInput,
  VALID_INTERVENTION_TYPES,
  VALID_PRIORITIES,
} from '../../services/interventionStore';
import { Button } from '../ui/Button';

interface CreateInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateInterventionInput) => void;
  students: UnifiedStudent[];
  initialStudent?: UnifiedStudent | null;
}

export function CreateInterventionModal({
  isOpen,
  onClose,
  onSubmit,
  students,
  initialStudent = null,
}: CreateInterventionModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultFollowUp = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || '');
  const [category, setCategory] = useState<InterventionType>('Academic Tutoring');
  const [priority, setPriority] = useState<InterventionPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>(initialStudent?.mentorName || '');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>(todayStr);
  const [targetFollowUpDate, setTargetFollowUpDate] = useState<string>(defaultFollowUp);
  const [initialStatus, setInitialStatus] = useState<InterventionStatus>('pending');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when initialStudent changes
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
      setAssignedTo(initialStudent.mentorName);
      if (initialStudent.recommendedInterventions.length > 0) {
        const topRec = initialStudent.recommendedInterventions[0];
        setCategory(topRec.actionType);
        setPriority(topRec.urgency === 'high' ? 'high' : topRec.urgency === 'medium' ? 'medium' : 'low');
        setActionPlan(`${topRec.title}: ${topRec.justification}`);
      }
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
      setAssignedTo(students[0].mentorName);
    }
  }, [initialStudent, students]);

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

  if (!isOpen) return null;

  const currentSelectedStudent = students.find((s) => s.id === selectedStudentId) || initialStudent;

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      setAssignedTo(stu.mentorName);
      if (stu.recommendedInterventions.length > 0) {
        const topRec = stu.recommendedInterventions[0];
        setCategory(topRec.actionType);
        setActionPlan(`${topRec.title}: ${topRec.justification}`);
      }
    }
  };

  const handleApplyRecommendation = (rec: { title: string; justification: string; actionType: InterventionType; urgency: 'high' | 'medium' | 'low' }) => {
    setCategory(rec.actionType);
    setPriority(rec.urgency === 'high' ? 'high' : rec.urgency === 'medium' ? 'medium' : 'low');
    setActionPlan(`${rec.title}: ${rec.justification}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    const input: CreateInterventionInput = {
      student_id: selectedStudentId,
      student_name: currentSelectedStudent?.name || '',
      type: category,
      priority,
      assigned_to: assignedTo,
      action_plan: actionPlan,
      created_at: createdAt,
      target_follow_up_date: targetFollowUpDate,
      initial_status: initialStatus,
    };

    const validation = validateInterventionInput(input);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      onSubmit(input);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create intervention';
      setValidationErrors({ general: msg });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-xl rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden text-xs text-slate-800">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-teal-100 text-teal-800">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Create Student Intervention</h3>
                <p className="text-[11px] text-slate-500">
                  Assign counseling, tutoring, or placement support with a trackable follow-up milestone.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {validationErrors.general && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationErrors.general}</span>
              </div>
            )}

            {/* Student Selection */}
            <div>
              <label htmlFor="student-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Student <span className="text-red-500">*</span>
              </label>
              {initialStudent ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{initialStudent.name}</span>
                    <span className="font-mono text-slate-500 ml-2">({initialStudent.id})</span>
                    <span className="text-slate-500 ml-2">• {initialStudent.department}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    Selected Profile
                  </span>
                </div>
              ) : (
                <select
                  id="student-select"
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
                >
                  <option value="">Select a student...</option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name} ({stu.id}) — {stu.department} (ARI: {stu.academicRisk.score})
                    </option>
                  ))}
                </select>
              )}
              {validationErrors.student_id && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.student_id}</p>
              )}
            </div>

            {/* Prescriptive Recommendation Quick-Fill (if student has recommendations) */}
            {currentSelectedStudent && currentSelectedStudent.recommendedInterventions.length > 0 && (
              <div className="p-2.5 rounded bg-teal-50/60 border border-teal-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-900">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>Rule Engine Suggestions for this Student (Click to Apply):</span>
                </div>
                <div className="space-y-1">
                  {currentSelectedStudent.recommendedInterventions.map((rec, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleApplyRecommendation(rec)}
                      className="w-full text-left p-1.5 rounded bg-white border border-teal-100 hover:border-teal-300 hover:bg-teal-50/30 text-[11px] text-slate-700 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate pr-2">
                        <strong className="text-teal-950 font-semibold">{rec.title}</strong>: {rec.justification.slice(0, 75)}...
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-teal-700 underline">Apply</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category and Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label htmlFor="category-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Intervention Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InterventionType)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
                >
                  {VALID_INTERVENTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {validationErrors.type && (
                  <p className="text-[11px] text-red-600 mt-1">{validationErrors.type}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency / Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as InterventionPriority)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white capitalize"
                >
                  {VALID_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)} Priority
                    </option>
                  ))}
                </select>
                {validationErrors.priority && (
                  <p className="text-[11px] text-red-600 mt-1">{validationErrors.priority}</p>
                )}
              </div>
            </div>

            {/* Assigned Faculty */}
            <div>
              <label htmlFor="assigned-faculty" className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Faculty Advisor / Mentor <span className="text-red-500">*</span>
              </label>
              <input
                id="assigned-faculty"
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Dr. Ramesh Shastri or Placement Training Cell"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              {validationErrors.assigned_to && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.assigned_to}</p>
              )}
            </div>

            {/* Action Plan Notes */}
            <div>
              <label htmlFor="action-plan" className="block text-xs font-semibold text-slate-700 mb-1">
                Action Plan & Intervention Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="action-plan"
                rows={3}
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                placeholder="Detail the root cause, remedial tutoring schedule, attendance warning, or skill goals..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              {validationErrors.action_plan && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.action_plan}</p>
              )}
            </div>

            {/* Dates & Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Created Date */}
              <div>
                <label htmlFor="created-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Creation Date
                </label>
                <input
                  id="created-date"
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
                />
                {validationErrors.created_at && (
                  <p className="text-[11px] text-red-600 mt-1">{validationErrors.created_at}</p>
                )}
              </div>

              {/* Target Follow-up Date */}
              <div>
                <label htmlFor="followup-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Follow-up Due <span className="text-red-500">*</span>
                </label>
                <input
                  id="followup-date"
                  type="date"
                  value={targetFollowUpDate}
                  onChange={(e) => setTargetFollowUpDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
                />
                {validationErrors.target_follow_up_date && (
                  <p className="text-[11px] text-red-600 mt-1">{validationErrors.target_follow_up_date}</p>
                )}
              </div>

              {/* Initial Status */}
              <div>
                <label htmlFor="initial-status" className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Status
                </label>
                <select
                  id="initial-status"
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as InterventionStatus)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white capitalize"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving Case...' : 'Create Intervention Case'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
