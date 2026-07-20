import { Test, TestingModule } from '@nestjs/testing';
import { ProcesosService } from './procesos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Proceso } from './entities/proceso.entity';
import { Procedimiento } from './entities/procedimiento.entity';
import { CargoProceso } from './entities/cargo-proceso.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { AuditoriaService } from '../versiones/auditoria.service';
import { VersionesService } from '../versiones/versiones.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  softRemove: jest.fn(),
});

describe('ProcesosService', () => {
  let service: ProcesosService;
  let procedimientoRepository: ReturnType<typeof mockRepository>;
  let auditoriaService: jest.Mocked<AuditoriaService>;

  const mockEntityManager = {
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb: (manager: typeof mockEntityManager) => Promise<unknown>) =>
      cb(mockEntityManager),
    ),
  };

  beforeEach(async () => {
    procedimientoRepository = mockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcesosService,
        VersionesService,
        { provide: getRepositoryToken(Proceso), useValue: mockRepository() },
        {
          provide: getRepositoryToken(Procedimiento),
          useValue: procedimientoRepository,
        },
        {
          provide: getRepositoryToken(CargoProceso),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Unidad), useValue: mockRepository() },
        { provide: getRepositoryToken(Cargo), useValue: mockRepository() },
        {
          provide: AuditoriaService,
          useValue: {
            registrarCambio: jest.fn().mockResolvedValue({}),
            findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
          },
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ProcesosService>(ProcesosService);
    auditoriaService = module.get(AuditoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProcedimiento versioning', () => {
    const procedimientoBase = {
      id_procedimiento: 1,
      id_proceso: 1,
      codigo: 'P-001',
      nombre: 'Test',
      estado: 'Activo',
      estado_version: 'Borrador' as const,
      proceso: null as any,
      instalaciones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Procedimiento;

    beforeEach(() => {
      jest.spyOn(service, 'findOneProcedimiento').mockResolvedValue({
        ...procedimientoBase,
      });
      mockEntityManager.save.mockImplementation(async (entity) => entity);
      mockEntityManager.findOne.mockResolvedValue({
        ...procedimientoBase,
        estado_version: 'Aprobado',
        version: '1.0',
      });
    });

    it('should increment version on Borrador to Aprobado transition', async () => {
      const result = await service.updateProcedimiento(
        1,
        { estado_version: 'Aprobado' },
        99,
      );

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(auditoriaService.registrarCambio).toHaveBeenCalledWith(
        'Procedimiento',
        1,
        'VERSION',
        { version: '' },
        { version: '1.0' },
        99,
        undefined,
        mockEntityManager,
      );
      expect(result.version).toBe('1.0');
    });

    it('should not register VERSION when staying Aprobado', async () => {
      jest.spyOn(service, 'findOneProcedimiento').mockResolvedValue({
        ...procedimientoBase,
        estado_version: 'Aprobado',
        version: '1.0',
      });
      mockEntityManager.findOne.mockResolvedValue({
        ...procedimientoBase,
        estado_version: 'Aprobado',
        version: '1.0',
        nombre: 'Actualizado',
      });

      await service.updateProcedimiento(1, { nombre: 'Actualizado' }, 99);

      expect(auditoriaService.registrarCambio).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'VERSION',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should rollback transaction when audit fails', async () => {
      auditoriaService.registrarCambio.mockRejectedValueOnce(
        new Error('audit failed'),
      );

      await expect(
        service.updateProcedimiento(1, { estado_version: 'Aprobado' }, 99),
      ).rejects.toThrow('audit failed');
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('createProcedimiento versioning', () => {
    beforeEach(() => {
      procedimientoRepository.findOne.mockResolvedValue(null);
      procedimientoRepository.create.mockImplementation((dto) => dto);
      mockEntityManager.save.mockResolvedValue({
        id_procedimiento: 5,
        id_proceso: 1,
        nombre: 'Nuevo',
        estado_version: 'Aprobado',
        version: '1.0',
      });
      mockEntityManager.findOne.mockResolvedValue({
        id_procedimiento: 5,
        id_proceso: 1,
        nombre: 'Nuevo',
        estado_version: 'Aprobado',
        version: '1.0',
        instalaciones: [],
        proceso: null,
      });
    });

    it('should assign version 1.0 when created as Aprobado', async () => {
      await service.createProcedimiento(
        {
          id_proceso: 1,
          nombre: 'Nuevo',
          estado_version: 'Aprobado',
        },
        10,
      );

      expect(procedimientoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ version: '1.0', estado_version: 'Aprobado' }),
      );
      expect(auditoriaService.registrarCambio).toHaveBeenCalledWith(
        'Procedimiento',
        5,
        'VERSION',
        { version: '' },
        { version: '1.0' },
        10,
        undefined,
        mockEntityManager,
      );
    });
  });

  describe('findHistorialVersionesProcedimiento', () => {
    it('should delegate to auditoriaService with VERSION filter', async () => {
      jest.spyOn(service, 'findOneProcedimiento').mockResolvedValue({} as Procedimiento);

      await service.findHistorialVersionesProcedimiento(7, { page: 1, limit: 10 });

      expect(auditoriaService.findAll).toHaveBeenCalledWith({
        tablaAfectada: 'Procedimiento',
        idRegistroOriginal: 7,
        accion: 'VERSION',
        page: 1,
        limit: 10,
      });
    });
  });
});
