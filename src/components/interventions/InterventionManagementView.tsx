import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  X,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Intervention,
  InterventionStatus,
  UnifiedStudent,
} from '../../types/student';
import {
  InterventionFilterCriteria,
  InterventionSortConfig,
  INITIAL_INTERVENTION_FILTERS,
  INITIAL_INTERVENTION_SORT,
  computeInterventionMetrics,
  filterInterventions,
  sortInterventions,
  paginateInterventions,
} from '../../utils/interventionFilterSort';
import {
  VALID_INTERVENTION_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
  CreateInterventionInput,
} from '../../services/interventionStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CreateInterventionModal } from './CreateInterventionModal';
import { InterventionDetailDrawer } from './InterventionDetailDrawer';

interface InterventionManagementViewProps {
  interventions: Intervention[];
  students: UnifiedStudent[];
  onCreateIntervention: (input: CreateInterventionInput) => void;
  onUpdateStatus: (id: string, newStatus: InterventionStatus, resolutionNote?: string) => void;
  onUpdateFollowUp: (id: string, newFollowUpDate: string, newNoteText?: string) => void;
  initialStudent?: UnifiedStudent | null;
  autoOpenCreateModal?: boolean;
  onClearInitialStudent?: () => void;
}

export function InterventionManagementView({
  interventions,
  students,
  onCreateIntervention,
  onUpdateStatus,
  onUpdateFollowUp,
  initialStudent = null,
  autoOpenCreateModal = false,
  onClearInitialStudent,
}: InterventionManagementViewProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filters, Sort & Pagination state
  const [filters, setFilters] = useState<InterventionFilterCriteria>(INITIAL_INTERVENTION_FILTERS);
  const [sort, setSort] = useState<InterventionSortConfig>(INITIAL_INTERVENTION_SORT);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(autoOpenCreateModal);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpenCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [autoOpenCreateModal]);

  // Metrics
  const metrics = useMemo(() => {
    return computeInterventionMetrics(interventions, todayStr);
  }, [interventions, todayStr]);

  // Unique list of assignees for filtering
  const assigneesList = useMemo(() => {
    const set = new Set<string>();
    interventions.forEach((item) => {
      if (item.assigned_to) set.add(item.assigned_to);
    });
    return Array.from(set).sort();
  }, [interventions]);

  // Filtered interventions
  const filteredInterventions = useMemo(() => {
    return filterInterventions(interventions, filters, todayStr);
  }, [interventions, filters, todayStr]);

  // Sorted interventions
  const sortedInterventions = useMemo(() => {
    return sortInterventions(filteredInterventions, sort);
  }, [filteredInterventions, sort]);

  // Pagination
  const pagination = useMemo(() => {
    return paginateInterventions(sortedInterventions, page, pageSize);
  }, [sortedInterventions, page, pageSize]);

  // Handle Sort Change
  const handleSortChange = (field: InterventionSortConfig['field']) => {
    setSort((prevSort) => {
      if (prevSort.field === field) {
        return {
          field,
          direction: prevSort.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        field,
        direction: 'asc',
      };
    });
  };

  const handleFilterChange = (updated: InterventionFilterCriteria) => {
    setFilters(updated);
    setPage(1);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleCreateSubmit = (input: CreateInterventionInput) => {
    onCreateIntervention(input);
    showFeedback(`Intervention case successfully created for ${input.student_name}.`);
  };

  const handleStatusChangeWithFeedback = (id: string, newStatus: InterventionStatus, note?: string) => {
    onUpdateStatus(id, newStatus, note);
    if (selectedIntervention && selectedIntervention.id === id) {
      setSelectedIntervention({
        ...selectedIntervention,
        status: newStatus,
        outcome_notes: note || selectedIntervention.outcome_notes,
      });
    }
    showFeedback(`Case ${id} status updated to ${newStatus.replace('_', ' ')}.`);
  };

  const handleFollowUpChangeWithFeedback = (id: string, date: string, note?: string) => {
    onUpdateFollowUp(id, date, note);
    if (selectedIntervention && selectedIntervention.id === id) {
      setSelectedIntervention({
        ...selectedIntervention,
        target_follow_up_date: date,
      });
    }
    showFeedback(`Follow-up date for case ${id} updated to ${date}.`);
  };

  // Find student associated with selected intervention
  const selectedStudent = useMemo(() => {
    if (!selectedIntervention) return null;
    return students.find((s) => s.id === selectedIntervention.student_id) || null;
  }, [selectedIntervention, students]);

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.status !== 'all' ||
    filters.type !== 'all' ||
    filters.priority !== 'all' ||
    filters.assignedTo !== 'all' ||
    filters.dueFilter !== 'all';

  // Render Sort Header
  const renderSortHeader = (label: string, field: InterventionSortConfig['field'], align: 'left' | 'right' = 'left') => {
    const isSorted = sort.field === field;
    return (
      <th
        onClick={() => handleSortChange(field)}
        className={`py-3 px-3.5 font-semibold text-[10px] uppercase tracking-wider text-slate-600 select-none cursor-pointer hover:bg-slate-100/70 transition-colors ${
          align === 'right' ? 'text-right' : 'text-left'
        }`}
      >
        <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {isSorted ? (
            sort.direction === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0 opacity-60 hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-teal-700 hover:text-teal-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interventions</h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
              {metrics.totalCases} total cases
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Coordinate student support, track follow-ups, and review progress. Closed-loop case management connecting early warning risk signals to faculty mentoring actions.
          </p>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="shrink-0 self-start md:self-auto"
        >
          New Intervention
        </Button>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Open Cases */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Open Cases
            </span>
            <div className="p-1.5 rounded bg-teal-100 text-teal-800">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-800 tabular-nums">
              {metrics.openCases}
            </span>
            <span className="text-xs text-slate-500 font-medium">active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
            <span>In Progress or Pending</span>
            <span className="font-semibold text-slate-700">{metrics.totalCases} logged</span>
          </div>
        </Card>

        {/* Metric 2: Awaiting Assignment */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Awaiting Action / Assignment
            </span>
            <div className="p-1.5 rounded bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums">
              {metrics.awaitingAssignment}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
            <span>Requires faculty intake</span>
            <span className="text-amber-800 font-medium">{metrics.awaitingAssignment} unstarted</span>
          </div>
        </Card>

        {/* Metric 3: Follow-ups Due Soon or Overdue */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-ups Due Soon / Overdue
            </span>
            <div className="p-1.5 rounded bg-red-100 text-red-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-700 tabular-nums">
              {metrics.dueSoonOrOverdue}
            </span>
            <span className="text-xs text-slate-500 font-medium">milestones</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
            <span className="text-red-700 font-medium">{metrics.overdueCount} Overdue</span>
            <span className="text-amber-700 font-medium">{metrics.dueSoonOrOverdue - metrics.overdueCount} Due &le; 7 days</span>
          </div>
        </Card>

        {/* Metric 4: Resolved Cases */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved Cases
            </span>
            <div className="p-1.5 rounded bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
              {metrics.resolvedCases}
            </span>
            <span className="text-xs text-slate-500 font-medium">completed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
            <span>Documented resolution</span>
            <span className="text-emerald-700 font-medium">
              {metrics.totalCases > 0 ? `${Math.round((metrics.resolvedCases / metrics.totalCases) * 100)}% resolution` : '0%'}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by student, USN, case ID, or notes..."
              className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                handleFilterChange({
                  ...filters,
                  dueFilter: filters.dueFilter === 'overdue' ? 'all' : 'overdue',
                })
              }
              className={`px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
                filters.dueFilter === 'overdue'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Overdue ({metrics.overdueCount})
            </button>

            <button
              type="button"
              onClick={() =>
                handleFilterChange({
                  ...filters,
                  dueFilter: filters.dueFilter === 'due_soon' ? 'all' : 'due_soon',
                })
              }
              className={`px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
                filters.dueFilter === 'due_soon'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Due &le; 7 Days
            </button>

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
                onClick={() => handleFilterChange(INITIAL_INTERVENTION_FILTERS)}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Status */}
          <div>
            <label htmlFor="filter-status" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Case Status
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 capitalize cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="filter-cat" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              id="filter-cat"
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {VALID_INTERVENTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="filter-priority" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              id="filter-priority"
              value={filters.priority}
              onChange={(e) => handleFilterChange({ ...filters, priority: e.target.value })}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 capitalize cursor-pointer"
            >
              <option value="all">All Priorities</option>
              {VALID_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="filter-assignee" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assigned Mentor
            </label>
            <select
              id="filter-assignee"
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange({ ...filters, assignedTo: e.target.value })}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
            >
              <option value="all">All Assignees</option>
              {assigneesList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Count Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 tabular-nums">{filteredInterventions.length}</strong> of{' '}
            <span className="tabular-nums">{interventions.length}</span> intervention cases
          </span>
          {isFiltered && (
            <span className="text-amber-800 font-medium text-[11px]">Filters active</span>
          )}
        </div>
      </div>

      {/* Case Management Table */}
      {filteredInterventions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="No Matching Intervention Cases"
            description="No interventions match your active filters. Try broadening your query or reset filters."
            action={
              <Button variant="secondary" size="sm" onClick={() => handleFilterChange(INITIAL_INTERVENTION_FILTERS)}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {renderSortHeader('Case ID', 'created_at')}
                  {renderSortHeader('Student & USN', 'student_name')}
                  {renderSortHeader('Category', 'type')}
                  {renderSortHeader('Priority', 'priority')}
                  <th className="py-3 px-3.5 font-semibold text-[10px] uppercase tracking-wider text-slate-600">
                    Assigned Mentor
                  </th>
                  {renderSortHeader('Status', 'status')}
                  {renderSortHeader('Follow-up Due', 'target_follow_up_date')}
                  <th className="py-3 px-3.5 font-semibold text-[10px] uppercase tracking-wider text-slate-600 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagination.paginated.map((item) => {
                  const isItemOverdue = item.status !== 'resolved' && item.target_follow_up_date < todayStr;
                  const isItemDueSoon =
                    item.status !== 'resolved' &&
                    !isItemOverdue &&
                    Date.parse(item.target_follow_up_date) <= Date.now() + 7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedIntervention(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Case ID & Created Date */}
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        <span className="font-bold text-slate-800">{item.id}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.created_at}</div>
                      </td>

                      {/* Student Name & USN */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-teal-900">
                          {item.student_name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {item.student_id}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3.5 text-slate-800 font-medium">
                        {item.type}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3.5">
                        <Badge
                          variant={
                            item.priority === 'critical'
                              ? 'critical'
                              : item.priority === 'high'
                              ? 'high'
                              : item.priority === 'medium'
                              ? 'moderate'
                              : 'low'
                          }
                          size="sm"
                          className="capitalize font-semibold"
                        >
                          {item.priority}
                        </Badge>
                      </td>

                      {/* Assigned Mentor */}
                      <td className="py-3 px-3.5 text-slate-700 max-w-xs truncate" title={item.assigned_to}>
                        {item.assigned_to}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <Badge
                          variant={
                            item.status === 'resolved'
                              ? 'positive'
                              : item.status === 'in_progress'
                              ? 'accent'
                              : item.status === 'escalated'
                              ? 'critical'
                              : 'neutral'
                          }
                          size="sm"
                          className="capitalize font-bold"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      {/* Next Follow-up Date */}
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={isItemOverdue ? 'text-red-700 font-bold' : 'text-slate-800'}>
                            {item.target_follow_up_date}
                          </span>
                          {isItemOverdue && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                              Overdue
                            </span>
                          )}
                          {isItemDueSoon && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Due Soon
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIntervention(item);
                          }}
                          className="group-hover:border-teal-300"
                        >
                          View Case
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="text-slate-400 ml-2">
                Showing {pagination.startIndex + 1}–{pagination.endIndex} of {pagination.totalRecords} records
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPage(pagination.currentPage - 1)}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPage(pagination.currentPage + 1)}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateInterventionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          onClearInitialStudent?.();
        }}
        onSubmit={handleCreateSubmit}
        students={students}
        initialStudent={initialStudent}
      />

      {/* Details Drawer */}
      <InterventionDetailDrawer
        intervention={selectedIntervention}
        student={selectedStudent}
        isOpen={selectedIntervention !== null}
        onClose={() => setSelectedIntervention(null)}
        onStatusChange={handleStatusChangeWithFeedback}
        onUpdateFollowUp={handleFollowUpChangeWithFeedback}
      />
    </div>
  );
}
