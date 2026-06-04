export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADL_ADMIN = 'ADL_ADMIN',
  SCHOOL_GATEKEEPER = 'SCHOOL_GATEKEEPER',
  TRAINER = 'TRAINER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  ACCOUNTANT = 'ACCOUNTANT',
  SYSTEM_AUDITOR = 'SYSTEM_AUDITOR',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  SUSPENDED = 'SUSPENDED',
}

export enum AssessmentType {
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
  EXAM = 'EXAM',
}

export enum LedgerType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  REFUND = 'REFUND',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 8,
  [UserRole.ADL_ADMIN]: 7,
  [UserRole.SCHOOL_GATEKEEPER]: 6,
  [UserRole.TRAINER]: 5,
  [UserRole.ACCOUNTANT]: 4,
  [UserRole.PARENT]: 3,
  [UserRole.SYSTEM_AUDITOR]: 2,
  [UserRole.STUDENT]: 1,
};

export const GLOBAL_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN];
export const BRANCH_ADMIN_ROLES = [UserRole.SCHOOL_GATEKEEPER];
export const EDUCATOR_ROLES = [UserRole.TRAINER];
export const FINANCIAL_ROLES = [UserRole.ACCOUNTANT];
export const LEARNER_ROLES = [UserRole.STUDENT];
export const READ_ONLY_ROLES = [UserRole.SYSTEM_AUDITOR];
