import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN)
  @ApiOperation({ summary: 'Onboard a new school/branch' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'List all schools' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get school details' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get school statistics' })
  getStats(@Param('id') id: string) {
    return this.tenantsService.getStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN)
  @ApiOperation({ summary: 'Update school details' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a school' })
  deactivate(@Param('id') id: string) {
    return this.tenantsService.deactivate(id);
  }
}
