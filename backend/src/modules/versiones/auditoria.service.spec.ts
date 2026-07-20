import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditoriaCambios } from './entities/auditoria-cambios.entity';

const createQueryBuilderMock = () => ({
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[{ id_auditoria: 1 }], 1]),
});

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn((entity) => Promise.resolve({ id_auditoria: 1, ...entity })),
  createQueryBuilder: jest.fn(() => createQueryBuilderMock()),
});

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    repository = mockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: getRepositoryToken(AuditoriaCambios),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a change successfully', async () => {
    const res = await service.registrarCambio(
      'Procedimiento',
      10,
      'CREATE',
      {},
      { id_procedimiento: 10, nombre: 'Proc test' },
      1,
    );
    expect(res).toBeDefined();
    expect(res.tablaAfectada).toBe('Procedimiento');
    expect(res.idRegistroOriginal).toBe(10);
    expect(res.accion).toBe('CREATE');
    expect(res.idUsuario).toBe(1);
  });

  it('should register a change using EntityManager when provided', async () => {
    const managerRepository = {
      save: jest.fn((entity) =>
        Promise.resolve({ id_auditoria: 2, ...entity }),
      ),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(managerRepository),
    } as any;

    await service.registrarCambio(
      'Procedimiento',
      10,
      'VERSION',
      { version: '1.0' },
      { version: '1.1' },
      1,
      undefined,
      manager,
    );

    expect(manager.getRepository).toHaveBeenCalledWith(AuditoriaCambios);
    expect(managerRepository.save).toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    it('should filter by idRegistroOriginal', async () => {
      const qb = createQueryBuilderMock();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({
        idRegistroOriginal: 42,
        tablaAfectada: 'Procedimiento',
        accion: 'VERSION',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'auditoria.idRegistroOriginal = :idRegistroOriginal',
        { idRegistroOriginal: 42 },
      );
    });

    it('should return paginated result', async () => {
      const result = await service.findAll({ page: 2, limit: 5 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when record does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
