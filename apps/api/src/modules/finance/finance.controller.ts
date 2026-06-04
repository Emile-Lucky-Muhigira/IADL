import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FinanceService, CreateLedgerEntryDto } from './finance.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Post('entries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Record a payment or charge' })
  createEntry(@Body() dto: CreateLedgerEntryDto, @CurrentUser() user: any) {
    return this.financeService.createEntry(dto, user.tenantId, user.id);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.ACCOUNTANT, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get financial summary for the branch' })
  summary(@CurrentUser('tenantId') tenantId: string) {
    return this.financeService.getFinancialSummary(tenantId);
  }

  @Get('ledger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.ACCOUNTANT, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get full branch ledger' })
  branchLedger(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.financeService.getBranchLedger(tenantId, page, limit);
  }

  @Get('outstanding')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.ACCOUNTANT, UserRole.SCHOOL_GATEKEEPER)
  @ApiOperation({ summary: 'Get students with outstanding balances' })
  outstanding(@CurrentUser('tenantId') tenantId: string) {
    return this.financeService.getStudentsWithOutstanding(tenantId);
  }

  @Get('student/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.ACCOUNTANT, UserRole.PARENT, UserRole.STUDENT, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: "Get a student's ledger / payment history" })
  studentLedger(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.financeService.getStudentLedger(userId, user, page, limit);
  }
}
