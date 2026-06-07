import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

class ResetPasswordDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER)
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER,
    UserRole.TRAINER, UserRole.ACCOUNTANT, UserRole.SYSTEM_AUDITOR,
  )
  @ApiOperation({ summary: 'List users with optional filters' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @CurrentUser() currentUser: any,
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const globalRoles = [UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN];
    const effectiveTenantId = globalRoles.includes(currentUser.role)
      ? tenantId
      : currentUser.tenantId;
    return this.usersService.findAll(effectiveTenantId, role, page, limit, search);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER,
    UserRole.TRAINER, UserRole.ACCOUNTANT, UserRole.SYSTEM_AUDITOR,
  )
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER)
  @ApiOperation({ summary: 'Update user profile' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER)
  @ApiOperation({ summary: 'Deactivate a user' })
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.deactivate(id, user);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER)
  @ApiOperation({ summary: "Reset a user's password (admin)" })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto, @CurrentUser() user: any) {
    return this.usersService.resetPassword(id, dto.newPassword, user);
  }

  @Post(':parentId/link-student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER)
  @ApiOperation({ summary: 'Link a parent to a student' })
  linkParent(@Param('parentId') parentId: string, @Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.usersService.linkParentToStudent(parentId, studentId, user);
  }

  @Get(':parentId/children')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.PARENT, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get students linked to a parent' })
  getChildren(@Param('parentId') parentId: string, @CurrentUser() user: any) {
    return this.usersService.getParentStudents(parentId, user);
  }
}
