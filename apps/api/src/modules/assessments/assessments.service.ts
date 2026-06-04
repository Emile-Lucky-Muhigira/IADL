import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertSameTenant } from '../../common/utils/tenant.util';
import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty() @IsString() courseId: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: ['QUIZ', 'ASSIGNMENT', 'PROJECT', 'EXAM'] })
  @IsEnum(['QUIZ', 'ASSIGNMENT', 'PROJECT', 'EXAM'])
  type: 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'EXAM';
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(1000) maxScore?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
}

export class GradeSubmissionDto {
  @ApiProperty() @IsNumber() @Min(0) score: number;
  @ApiPropertyOptional() @IsOptional() @IsString() feedback?: string;
}

export class SubmitAssessmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
}

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  /** Load an assessment together with its owning course's tenant, enforcing tenant scope. */
  private async getScopedAssessment(assessmentId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: { select: { tenantId: true } } },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    assertSameTenant(assessment.course.tenantId, actor);
    return assessment;
  }

  async create(dto: CreateAssessmentDto, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, actor);

    return this.prisma.assessment.create({
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async findByCourse(courseId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { tenantId: true } });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, actor);

    return this.prisma.assessment.findMany({
      where: { courseId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.getScopedAssessment(id, actor);
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          include: { student: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async submit(assessmentId: string, studentId: string, dto: SubmitAssessmentDto, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.getScopedAssessment(assessmentId, actor);

    return this.prisma.assessmentSubmission.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      create: { assessmentId, studentId, ...dto, submittedAt: new Date() },
      update: { ...dto, submittedAt: new Date() },
    });
  }

  async grade(assessmentId: string, studentId: string, dto: GradeSubmissionDto, gradedById: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.getScopedAssessment(assessmentId, actor);
    const submission = await this.prisma.assessmentSubmission.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId } },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.assessmentSubmission.update({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      data: { score: dto.score, feedback: dto.feedback, gradedById, gradedAt: new Date() },
    });
  }

  async getStudentSubmissions(studentId: string) {
    return this.prisma.assessmentSubmission.findMany({
      where: { studentId },
      include: {
        assessment: { select: { id: true, title: true, type: true, maxScore: true, dueDate: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
