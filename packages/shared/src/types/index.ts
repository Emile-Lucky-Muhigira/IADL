import { UserRole, AttendanceStatus, EnrollmentStatus, AssessmentType, LedgerType } from '../constants/roles';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  iat?: number;
  exp?: number;
}

export interface TenantDto {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UserDto {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface CourseDto {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: Date;
}

export interface EnrollmentDto {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  status: EnrollmentStatus;
}

export interface SessionDto {
  id: string;
  courseId: string;
  title: string;
  scheduledAt: Date;
  duration: number;
  isLive: boolean;
  meetingUrl?: string;
}

export interface AttendanceDto {
  id: string;
  userId: string;
  sessionId: string;
  status: AttendanceStatus;
  markedAt: Date;
  notes?: string;
}

export interface AssessmentDto {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: AssessmentType;
  dueDate?: Date;
  maxScore: number;
}

export interface LedgerEntryDto {
  id: string;
  tenantId: string;
  userId: string;
  type: LedgerType;
  amount: number;
  description: string;
  reference?: string;
  balance: number;
  createdAt: Date;
}

export interface CertificateDto {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: Date;
  uniqueCode: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  attendanceRate: number;
  revenueTotal: number;
  outstandingBalance: number;
}
