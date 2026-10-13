import { X, RotateCcw, AlertTriangle, Search } from 'lucide-react';
import { Department, RiskLevel, PlacementTier } from '../../types/student';
import { StudentFilterCriteria, INITIAL_FILTERS } from '../../utils/studentFilterSort';
import { Button } from '../ui/Button';

interface StudentFiltersProps {
  filters: StudentFilterCriteria;
  onChange: (updatedFilters: StudentFilterCriteria) => void;
  totalStudents: number;
  filteredCount: number;
}

const DEPARTMENTS: Department[] = [
  'Computer Science',
  'Information Science',
  'Electronics & Communication',
  'Mechanical Engineering',
];

const RISK_TIERS: RiskLevel[] = ['Critical', 'High', 'Moderate', 'Low'];

const PLACEMENT_TIERS: PlacementTier[] = [
  'Tier-1 Ready',
  'Tier-2 Ready',
  'Needs Upskilling',
  'At Risk / Ineligible',
];

export function StudentFilters({
  filters,
  onChange,
  totalStudents,
  filteredCount,
}: StudentFiltersProps) {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.department !== 'all' ||
    filters.semester !== 'all' ||
    filters.riskLevel !== 'all' ||
    filters.placementTier !== 'all' ||
    filters.needsReviewOnly;

  const handleReset = () => {
    onChange(INITIAL_FILTERS);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3.5">
      {/* Top Filter Bar: Search + Quick Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by student name, USN, or mentor..."
            className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Toggles: Needs Review & Reset */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* "Needs Review" Quick Filter Toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...filters, needsReviewOnly: !filters.needsReviewOnly })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
              filters.needsReviewOnly
                ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filters.needsReviewOnly ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Students Needing Review</span>
          </button>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
              onClick={handleReset}
              className="text-slate-600 hover:text-slate-900"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Facet Dropdowns Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Department Filter */}
        <div>
          <label htmlFor="filter-dept" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Department
          </label>
          <select
            id="filter-dept"
            value={filters.department}
            onChange={(e) => onChange({ ...filters, department: e.target.value })}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <label htmlFor="filter-sem" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Semester
          </label>
          <select
            id="filter-sem"
            value={filters.semester}
            onChange={(e) => onChange({ ...filters, semester: e.target.value })}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Semesters</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
          </select>
        </div>

        {/* Academic Risk Filter */}
        <div>
          <label htmlFor="filter-risk" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Academic Risk Tier
          </label>
          <select
            id="filter-risk"
            value={filters.riskLevel}
            onChange={(e) => onChange({ ...filters, riskLevel: e.target.value })}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Risk Tiers</option>
            {RISK_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier} Risk
              </option>
            ))}
          </select>
        </div>

        {/* Placement Readiness Filter */}
        <div>
          <label htmlFor="filter-placement" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Placement Tier
          </label>
          <select
            id="filter-placement"
            value={filters.placementTier}
            onChange={(e) => onChange({ ...filters, placementTier: e.target.value })}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Placement Tiers</option>
            {PLACEMENT_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Indicators & Student Match Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400">Active Criteria:</span>
          {!isFiltered && <span className="text-[11px] text-slate-500 italic">None (Displaying entire cohort)</span>}

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
              Query: "{filters.searchQuery}"
              <button
                type="button"
                onClick={() => onChange({ ...filters, searchQuery: '' })}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.department !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
              {filters.department}
              <button
                type="button"
                onClick={() => onChange({ ...filters, department: 'all' })}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.semester !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
              Semester {filters.semester}
              <button
                type="button"
                onClick={() => onChange({ ...filters, semester: 'all' })}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.riskLevel !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[11px]">
              Risk: {filters.riskLevel}
              <button
                type="button"
                onClick={() => onChange({ ...filters, riskLevel: 'all' })}
                className="hover:text-red-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.placementTier !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px]">
              {filters.placementTier}
              <button
                type="button"
                onClick={() => onChange({ ...filters, placementTier: 'all' })}
                className="hover:text-teal-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.needsReviewOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
              Needs Review Active
              <button
                type="button"
                onClick={() => onChange({ ...filters, needsReviewOnly: false })}
                className="hover:text-rose-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="font-medium text-slate-600 text-right">
          Showing <span className="font-bold text-slate-900 tabular-nums">{filteredCount}</span> of{' '}
          <span className="tabular-nums">{totalStudents}</span> students
        </div>
      </div>
    </div>
  );
}
