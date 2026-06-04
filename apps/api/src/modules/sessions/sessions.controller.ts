import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, DefaultValuePipe, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionsService, CreateSessionDto, UpdateSessionDto } from './sessions.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Create a class session' })
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: any) {
    return this.sessionsService.create(dto, user);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List sessions for a course' })
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.sessionsService.findByCourse(courseId, user, page, limit);
  }

  @Get('branch')
  @ApiOperation({ summary: 'List all sessions for current branch' })
  findByBranch(
    @CurrentUser('tenantId') tenantId: string,
    @Query('upcoming', new DefaultValuePipe(false), ParseBoolPipe) upcoming: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.sessionsService.findByTenant(tenantId, upcoming, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session details with attendance' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Update session' })
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto, @CurrentUser() user: any) {
    return this.sessionsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.TRAINER)
  @ApiOperation({ summary: 'Delete session' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionsService.delete(id, user);
  }
}
