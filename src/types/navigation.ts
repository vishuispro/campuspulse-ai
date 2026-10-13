/**
 * CampusPulse - Navigation & Shell Types
 */

export type NavigationPage = 
  | 'overview' 
  | 'students' 
  | 'interventions' 
  | 'placement' 
  | 'data';

export type UserRole = 
  | 'administrator' 
  | 'faculty_advisor' 
  | 'placement_officer';

export interface UserRoleOption {
  id: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  contextFocus: string;
}

export const USER_ROLES: UserRoleOption[] = [
  {
    id: 'administrator',
    label: 'College Administrator / Dean',
    shortLabel: 'Administrator',
    description: 'Campus-wide health, departmental risk patterns, and cohort distributions',
    contextFocus: 'Institutional View',
  },
  {
    id: 'faculty_advisor',
    label: 'Faculty Advisor / Mentor',
    shortLabel: 'Faculty Advisor',
    description: 'Attendance alerts, course backlogs, and student-level counseling interventions',
    contextFocus: 'Advisory View',
  },
  {
    id: 'placement_officer',
    label: 'Placement & Training Officer',
    shortLabel: 'Placement Officer',
    description: 'Corporate eligibility barriers, coding assessments, and interview clinics',
    contextFocus: 'Placement View',
  },
];
