import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Briefcase,
  Database,
  GraduationCap,
  X,
  Sparkles,
} from 'lucide-react';
import { NavigationPage, UserRole, USER_ROLES } from '../../types/navigation';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  currentRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  openInterventionCount: number;
  criticalRiskCount: number;
}

export function Sidebar({
  currentPage,
  onNavigate,
  currentRole,
  isOpen,
  onClose,
  openInterventionCount,
  criticalRiskCount,
}: SidebarProps) {
  const currentRoleConfig = USER_ROLES.find((r) => r.id === currentRole) || USER_ROLES[0];

  const navItems = [
    {
      id: 'overview' as NavigationPage,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'students' as NavigationPage,
      label: 'Students',
      icon: Users,
      badge: criticalRiskCount > 0 ? `${criticalRiskCount} critical` : null,
      badgeVariant: 'critical' as const,
    },
    {
      id: 'interventions' as NavigationPage,
      label: 'Interventions',
      icon: ClipboardCheck,
      badge: openInterventionCount > 0 ? `${openInterventionCount} open` : null,
      badgeVariant: 'neutral' as const,
    },
    {
      id: 'placement' as NavigationPage,
      label: 'Placement Insights',
      icon: Briefcase,
      badge: null,
    },
    {
      id: 'data' as NavigationPage,
      label: 'Data Management',
      icon: Database,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                  CampusPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  EDU
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                Student Success Platform
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors ${
                  isActive
                    ? 'bg-teal-50/80 text-teal-900 font-semibold border border-teal-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      item.badgeVariant === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Institutional Context & Role Badge Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60 space-y-2.5">
          {/* Active Perspective Context */}
          <div className="p-2.5 rounded-md bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Role View
              </span>
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {currentRoleConfig.shortLabel}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              {currentRoleConfig.contextFocus}
            </div>
          </div>

          {/* Dataset Status Banner */}
          <div className="px-2.5 py-2 rounded bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Synthetic Demo Mode</span>
              <span className="text-amber-800/80 text-[10px] leading-tight block">
                150 students • Benchmark data
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
