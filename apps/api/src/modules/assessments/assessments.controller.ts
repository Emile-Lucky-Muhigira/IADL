import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssessmentsService, CreateAssessmentDto, GradeSubmissionDto, SubmitAssessmentDto } from './assessments.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Create an assessment or assignment' })
  create(@Body() dto: CreateAssessmentDto, @CurrentUser() user: any) {
    return this.assessmentsService.create(dto, user);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all assessments for a course' })
  findByCourse(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.assessmentsService.findByCourse(courseId, user);
  }

  @Get('my-submissions')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all submissions for current student' })
  mySubmissions(@CurrentUser('id') userId: string) {
    return this.assessmentsService.getStudentSubmissions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment with all submissions' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assessmentsService.findOne(id, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit an assessment' })
  submit(@Param('id') assessmentId: string, @CurrentUser() user: any, @Body() dto: SubmitAssessmentDto) {
    return this.assessmentsService.submit(assessmentId, user.id, dto, user);
  }

  @Post(':id/grade/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Grade a student submission' })
  grade(
    @Param('id') assessmentId: string,
    @Param('studentId') studentId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.grade(assessmentId, studentId, dto, user.id, user);
  }
}
