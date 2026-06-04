import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('global')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN)
  @ApiOperation({ summary: 'Global platform dashboard stats' })
  globalDashboard() {
    return this.analyticsService.getGlobalDashboard();
  }

  @Get('branch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Branch-level dashboard stats' })
  branchDashboard(@CurrentUser('tenantId') tenantId: string) {
    return this.analyticsService.getBranchDashboard(tenantId);
  }

  @Get('course/:courseId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Analytics for a specific course' })
  courseAnalytics(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.analyticsService.getCourseAnalytics(courseId, user);
  }

  @Get('student/:userId')
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER,
    UserRole.TRAINER, UserRole.PARENT, UserRole.STUDENT, UserRole.SYSTEM_AUDITOR,
  )
  @ApiOperation({ summary: 'Learning progress for a student' })
  studentProgress(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.analyticsService.getStudentProgress(userId, user);
  }

  @Get('revenue-timeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.ACCOUNTANT, UserRole.SCHOOL_GATEKEEPER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Revenue timeline for the branch' })
  revenueTimeline(
    @CurrentUser('tenantId') tenantId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getRevenueTimeline(tenantId, days);
  }
}
