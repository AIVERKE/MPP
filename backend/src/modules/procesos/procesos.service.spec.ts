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
import { SeguridadService } from '../seguridad/seguridad.service';
import { ROLES_MPP } from '../seguridad/roles.constants';

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

  const mockManagerRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEntityManager = {
    save: jest.fn(),
    findOne: jest.fn(),
    getRepository: jest.fn().mockReturnValue(mockManagerRepo),
  };

  const mockDataSource = {
    transaction: jest.fn(
      (cb: (manager: typeof mockEntityManager) => Promise<unknown>) =>
        cb(mockEntityManager),
    ),
  };

  const mockSeguridadService = {
    getNombresRoles: jest.fn().mockResolvedValue([ROLES_MPP.SUPER_ADMIN]),
    esSoloConsultor: jest.fn().mockReturnValue(false),
    esSuperAdmin: jest.fn().mockReturnValue(true),
    getUnidadesAlcance: jest.fn().mockResolvedValue([]),
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
        { provide: SeguridadService, useValue: mockSeguridadService },
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
      id_elaborador: 1,
      proceso: null as any,
      instalaciones: [{ id_unidad: 10 }],
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
      mockManagerRepo.findOne.mockResolvedValue({
        ...procedimientoBase,
        estado_version: 'Aprobado',
        version: '1.0',
      });
      mockManagerRepo.save.mockImplementation(async (entity) => entity);
      mockSeguridadService.getNombresRoles.mockResolvedValue([
        ROLES_MPP.SUPER_ADMIN,
      ]);
      mockSeguridadService.esSoloConsultor.mockReturnValue(false);
      mockSeguridadService.esSuperAdmin.mockReturnValue(true);
    });

    it('should register CAMBIO_ESTADO and VERSION when transitioning to Aprobado', async () => {
      const cambiarEstadoSpy = jest.spyOn(
        service['versionesService'],
        'cambiarEstadoProcedimiento',
      );
      const registrarVersionSpy = jest.spyOn(
        service['versionesService'],
        'registrarVersionamiento',
      );

      await service.updateProcedimiento(
        1,
        { estado_version: 'Aprobado' },
        99,
      );

      expect(cambiarEstadoSpy).toHaveBeenCalledWith(
        1,
        'Aprobado',
        99,
        undefined,
        expect.anything(),
      );
      expect(registrarVersionSpy).toHaveBeenCalled();
    });

    it('should increment version on Borrador to Aprobado transition', async () => {
      const result = await service.updateProcedimiento(
        1,
        { estado_version: 'Aprobado' },
        99,
      );

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ version: '1.0' }),
      );
      expect(result).toBeDefined();
    });

    it('should not register VERSION when staying Aprobado', async () => {
      jest.spyOn(service, 'findOneProcedimiento').mockResolvedValue({
        ...procedimientoBase,
        estado_version: 'Aprobado',
        version: '1.0',
      });
      const registrarVersionSpy = jest.spyOn(
        service['versionesService'],
        'registrarVersionamiento',
      );

      await service.updateProcedimiento(1, { nombre: 'Actualizado' }, 99);

      expect(registrarVersionSpy).not.toHaveBeenCalled();
    });

    it('should block elaborador from approving own procedimiento', async () => {
      jest.spyOn(service, 'findOneProcedimiento').mockResolvedValue({
        ...procedimientoBase,
        id_elaborador: 99,
      });
      mockSeguridadService.getNombresRoles.mockResolvedValue([
        ROLES_MPP.VALIDADOR_TECNICO,
        ROLES_MPP.ELABORADOR,
      ]);
      mockSeguridadService.esSuperAdmin.mockReturnValue(false);
      mockSeguridadService.getUnidadesAlcance.mockResolvedValue([10]);

      await expect(
        service.updateProcedimiento(1, { estado_version: 'Aprobado' }, 99),
      ).rejects.toThrow(/Segregación de funciones/);
    });
  });
});
