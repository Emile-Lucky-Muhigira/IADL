import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockTenant = { id: 'tenant-1', name: 'ADL Nairobi', domain: 'nairobi.adlschools.ac.ke', isActive: true, createdAt: new Date() };

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: { count: jest.fn() },
  course: { count: jest.fn() },
  ledgerEntry: { aggregate: jest.fn() },
};

describe('TenantsService', () => {
  let service: TenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a tenant when domain is unique', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create({ name: 'ADL Nairobi', domain: 'nairobi.adlschools.ac.ke' });
      expect(result.name).toBe('ADL Nairobi');
      expect(mockPrisma.tenant.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when domain already exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      await expect(service.create({ name: 'Duplicate', domain: 'nairobi.adlschools.ac.ke' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('returns tenant when found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      const result = await service.findOne('tenant-1');
      expect(result.id).toBe('tenant-1');
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
