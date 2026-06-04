import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

class TriggerAttendanceDto {
  @ApiProperty() @IsString() sessionId: string;
}
class ManualAttendanceDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] })
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
class BulkAttendanceDto {
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty() @IsArray() records: { userId: string; status: string; notes?: string }[];
}

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('trigger')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student self-triggers attendance on session login' })
  trigger(@CurrentUser() user: any, @Body() dto: TriggerAttendanceDto) {
    return this.attendanceService.triggerAttendance(user.id, dto.sessionId, user);
  }

  @Post('manual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER)
  @ApiOperation({ summary: 'Manually mark attendance for a student' })
  manual(@Body() dto: ManualAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.markManual(dto.userId, dto.sessionId, dto.status, user, dto.notes);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER)
  @ApiOperation({ summary: 'Bulk mark attendance for a session' })
  bulk(@Body() dto: BulkAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.bulkMark(dto.sessionId, dto.records, user);
  }

  @Get('session/:sessionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get all attendance records for a session' })
  findBySession(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.attendanceService.findBySession(sessionId, user);
  }

  @Get('student/:userId')
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER,
    UserRole.ACCOUNTANT, UserRole.PARENT, UserRole.STUDENT, UserRole.SYSTEM_AUDITOR,
  )
  @ApiOperation({ summary: 'Get attendance history for a student' })
  findByStudent(@Param('userId') userId: string, @CurrentUser() user: any, @Query('courseId') courseId?: string) {
    return this.attendanceService.findByStudent(userId, user, courseId);
  }

  @Get('stats/branch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get attendance statistics for the branch' })
  branchStats(@CurrentUser('tenantId') tenantId: string) {
    return this.attendanceService.getAttendanceStats(tenantId);
  }

  @Get('alerts/low')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER)
  @ApiOperation({ summary: 'Get students with attendance below threshold (default 80%)' })
  lowAttendance(
    @CurrentUser('tenantId') tenantId: string,
    @Query('threshold', new DefaultValuePipe(80), ParseIntPipe) threshold: number,
  ) {
    return this.attendanceService.getStudentsBelowThreshold(tenantId, threshold);
  }
}
