import { Menu, UserCheck } from 'lucide-react';
import { NavigationPage, UserRole, USER_ROLES } from '../../types/navigation';
import { SearchInput } from '../ui/SearchInput';

interface HeaderProps {
  currentPage: NavigationPage;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToStudents: () => void;
}

export function Header({
  currentPage,
  currentRole,
  onRoleChange,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  onNavigateToStudents,
}: HeaderProps) {
  const pageTitles: Record<NavigationPage, { title: string; subtitle: string }> = {
    overview: {
      title: 'Student Success Overview',
      subtitle: 'Institutional risk analytics and cohort monitoring',
    },
    students: {
      title: 'Student Directory & Risk Matrix',
      subtitle: 'Explore 360° student profiles, indicators, and factors',
    },
    interventions: {
      title: 'Intervention Workflow',
      subtitle: 'Assign, manage, and follow up on academic & career interventions',
    },
    placement: {
      title: 'Placement Readiness Insights',
      subtitle: 'Track corporate eligibility, skills assessments, and gap analysis',
    },
    data: {
      title: 'Data Integration & Management',
      subtitle: 'Multi-stream CSV ingestion, schema validation, and health reports',
    },
  };

  const activePageInfo = pageTitles[currentPage];
  const activeRoleConfig = USER_ROLES.find((r) => r.id === currentRole) || USER_ROLES[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            {activePageInfo.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate">
            {activePageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Search Control */}
      <div className="hidden md:block flex-1 max-w-xs lg:max-w-md">
        <SearchInput
          value={searchQuery}
          onChange={(q) => {
            onSearchChange(q);
            if (q.trim() && currentPage !== 'students') {
              onNavigateToStudents();
            }
          }}
          placeholder="Search students (Name, USN, Dept)..."
        />
      </div>

      {/* Right: Synthetic Data Flag & Role Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Synthetic Demo Flag */}
        <div
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium cursor-help"
          title="This platform is currently populated with 150 verified synthetic student records across 4 engineering departments for demonstration and evaluation."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Synthetic Demo Data</span>
        </div>

        <div
          className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200"
          title={`Role context: ${activeRoleConfig.description}`}
        >
          <label htmlFor="role-select" className="sr-only">
            Active Role
          </label>
          <div className="flex items-center px-2 py-1 text-xs text-slate-600 gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline text-[11px] font-medium text-slate-500">Role:</span>
          </div>
          <select
            id="role-select"
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-white text-xs font-semibold text-slate-800 border-0 rounded py-1 pl-2 pr-6 shadow-xs focus:ring-1 focus:ring-teal-600 focus:outline-none cursor-pointer"
          >
            {USER_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
