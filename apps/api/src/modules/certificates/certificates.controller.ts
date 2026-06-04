import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/roles.enum';

class IssueCertificateDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() courseId: string;
}

@ApiTags('certificates')
@ApiBearerAuth()
@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Post('issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN)
  @ApiOperation({ summary: 'Issue a certificate to a student' })
  issue(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(dto.userId, dto.courseId);
  }

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Publicly verify a certificate by unique code' })
  verify(@Param('code') code: string) {
    return this.certificatesService.verify(code);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get current student certificates' })
  myCertificates(@CurrentUser() user: any) {
    return this.certificatesService.findByStudent(user.id, user);
  }

  @Get('student/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.TRAINER, UserRole.PARENT, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: "Get a student's certificates" })
  findByStudent(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.certificatesService.findByStudent(userId, user);
  }

  @Get('branch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADL_ADMIN, UserRole.SCHOOL_GATEKEEPER, UserRole.SYSTEM_AUDITOR)
  @ApiOperation({ summary: 'Get all certificates issued by this branch' })
  findByBranch(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.certificatesService.findByTenant(tenantId, page, limit);
  }
}
