import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Eye, AlertCircle } from 'lucide-react';
import { UnifiedStudent } from '../../types/student';
import { StudentSortConfig, StudentSortField } from '../../utils/studentFilterSort';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

interface StudentTableProps {
  students: UnifiedStudent[];
  sort: StudentSortConfig;
  onSortChange: (field: StudentSortField) => void;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onSelectStudent: (student: UnifiedStudent) => void;
  onResetFilters?: () => void;
}

export function StudentTable({
  students,
  sort,
  onSortChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectStudent,
  onResetFilters,
}: StudentTableProps) {
  // Sort Header Helper
  const renderSortableHeader = (label: string, field: StudentSortField, align: 'left' | 'right' = 'left') => {
    const isSorted = sort.field === field;
    return (
      <th
        onClick={() => onSortChange(field)}
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

  // Pagination bounds
  const totalRecords = students.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentSlice = students.slice(startIndex, endIndex);

  if (totalRecords === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-2xs">
        <EmptyState
          title="No Matching Students Found"
          description="None of the 150 student records match the active criteria. Adjust your search query or reset filters."
          action={
            onResetFilters && (
              <Button variant="secondary" size="sm" onClick={onResetFilters}>
                Clear All Filters
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      {/* Table Container with Horizontal Scroll */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {renderSortableHeader('Student & USN', 'name')}
              {renderSortableHeader('Department & Sem', 'department')}
              {renderSortableHeader('CGPA', 'cgpa')}
              {renderSortableHeader('Attendance', 'attendance')}
              {renderSortableHeader('Academic Risk (ARI)', 'academicRisk')}
              {renderSortableHeader('Placement Readiness (PRI)', 'placementReadiness')}
              {renderSortableHeader('Success Score (SSS)', 'successScore')}
              <th className="py-3 px-3.5 font-semibold text-[10px] uppercase tracking-wider text-slate-600 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentSlice.map((student) => {
              const isCriticalRisk = student.academicRisk.level === 'Critical';
              const isHighRisk = student.academicRisk.level === 'High';
              const isModerateRisk = student.academicRisk.level === 'Moderate';

              const isTier1 = student.placementReadiness.tier === 'Tier-1 Ready';
              const isTier2 = student.placementReadiness.tier === 'Tier-2 Ready';

              const hasLowConfidence = student.successScore.confidence === 'low_incomplete_data';

              return (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  {/* Name and USN */}
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900 group-hover:text-teal-900">
                      {student.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {student.id}
                    </div>
                  </td>

                  {/* Department and Semester */}
                  <td className="py-3 px-3.5 text-slate-700">
                    <div>{student.department}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Semester {student.semester}
                    </div>
                  </td>

                  {/* CGPA */}
                  <td className="py-3 px-3.5">
                    {student.academic ? (
                      <div>
                        <span className="font-bold text-slate-900 font-mono tabular-nums">
                          {student.academic.cgpa.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {student.academic.backlogs_count > 0 ? (
                            <span className="text-red-700 font-medium">
                              {student.academic.backlogs_count} backlog(s)
                            </span>
                          ) : (
                            <span>0 backlogs</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </td>

                  {/* Attendance */}
                  <td className="py-3 px-3.5">
                    {student.attendance ? (
                      <div>
                        <span
                          className={`font-bold font-mono tabular-nums ${
                            student.attendance.overall_attendance_pct < 75
                              ? 'text-red-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {student.attendance.overall_attendance_pct.toFixed(1)}%
                        </span>
                        <div
                          className={`text-[10px] font-medium capitalize ${
                            student.attendance.trend_last_30_days === 'declining'
                              ? 'text-red-700'
                              : student.attendance.trend_last_30_days === 'improving'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {student.attendance.trend_last_30_days} trend
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </td>

                  {/* Academic Risk */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1.5">
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
                      <span className="font-mono text-slate-700 tabular-nums font-semibold">
                        {student.academicRisk.score}
                      </span>
                    </div>
                  </td>

                  {/* Placement Readiness */}
                  <td className="py-3 px-3.5">
                    {student.placement ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              isTier1
                                ? 'positive'
                                : isTier2
                                ? 'neutral'
                                : 'moderate'
                            }
                            size="sm"
                          >
                            {student.placementReadiness.tier}
                          </Badge>
                          <span className="font-mono text-slate-700 tabular-nums font-semibold">
                            {student.placementReadiness.score}
                          </span>
                        </div>
                        {student.placementReadiness.isBacklogBlocked && (
                          <div className="text-[10px] text-red-700 font-semibold mt-0.5">
                            Backlog Cap (≤50)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </td>

                  {/* Student Success Score */}
                  <td className="py-3 px-3.5">
                    {!hasLowConfidence ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 font-mono tabular-nums text-sm">
                          {student.successScore.score}
                        </span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Pending Data
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3.5 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(student);
                      }}
                      className="group-hover:border-teal-300"
                    >
                      Inspect
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
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-teal-600 cursor-pointer"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span className="text-slate-400 ml-2">
            Showing {startIndex + 1}–{endIndex} of {totalRecords} records
          </span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
