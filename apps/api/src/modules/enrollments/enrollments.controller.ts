import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

class EnrollDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() courseId: string;
}
class UpdateStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED'] })
  @IsEnum(['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED'])
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
}

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Enroll a student in a course' })
  enroll(@Body() dto: EnrollDto, @CurrentUser() user: any) {
    return this.enrollmentsService.enroll(dto.userId, dto.courseId, user);
  }

  @Get('my')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get current student enrollments' })
  myEnrollments(@CurrentUser() user: any) {
    return this.enrollmentsService.findByStudent(user.id, user);
  }

  @Get('student/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER, UserRole.ACCOUNTANT, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: "Get a student's enrollments" })
  findByStudent(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.enrollmentsService.findByStudent(userId, user);
  }

  @Get('course/:courseId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get all enrollments for a course' })
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.enrollmentsService.findByCourse(courseId, user, page, limit);
  }

  @Patch(':userId/course/:courseId/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER)
  @ApiOperation({ summary: 'Update enrollment status' })
  updateStatus(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.updateStatus(userId, courseId, dto.status, user);
  }
}
