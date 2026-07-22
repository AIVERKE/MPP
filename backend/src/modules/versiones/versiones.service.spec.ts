import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VersionesService } from './versiones.service';
import { AuditoriaService } from './auditoria.service';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';

const mockAuditoriaService = () => ({
  registrarCambio: jest.fn().mockResolvedValue({}),
});

const mockProcedimientoRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('VersionesService', () => {
  let service: VersionesService;
  let auditoriaService: jest.Mocked<AuditoriaService>;
  let procedimientoRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionesService,
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
        {
          provide: getRepositoryToken(Procedimiento),
          useValue: mockProcedimientoRepository(),
        },
      ],
    }).compile();

    service = module.get<VersionesService>(VersionesService);
    auditoriaService = module.get(AuditoriaService);
    procedimientoRepository = module.get(getRepositoryToken(Procedimiento));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calcularNuevaVersion', () => {
    it('should return 1.0 if version is empty/null/undefined', () => {
      expect(service.calcularNuevaVersion(null)).toBe('1.0');
      expect(service.calcularNuevaVersion(undefined)).toBe('1.0');
      expect(service.calcularNuevaVersion('')).toBe('1.0');
      expect(service.calcularNuevaVersion('   ')).toBe('1.0');
    });

    it('should trim version before parsing', () => {
      expect(service.calcularNuevaVersion(' 1.0 ')).toBe('1.1');
    });

    it('should append .1 if version has no major/minor parts', () => {
      expect(service.calcularNuevaVersion('1')).toBe('1.1');
      expect(service.calcularNuevaVersion('2')).toBe('2.1');
    });

    it('should increment minor version properly', () => {
      expect(service.calcularNuevaVersion('1.0')).toBe('1.1');
      expect(service.calcularNuevaVersion('1.9')).toBe('1.10');
      expect(service.calcularNuevaVersion('2.4')).toBe('2.5');
    });

    it('should return 1.0 for invalid version strings', () => {
      expect(service.calcularNuevaVersion('abc')).toBe('1.0');
      expect(service.calcularNuevaVersion('1.abc')).toBe('1.0');
    });
  });

  describe('debeIncrementarVersion', () => {
    it('should increment when transitioning to Aprobado from other states', () => {
      expect(service.debeIncrementarVersion('Borrador', 'Aprobado')).toBe(true);
      expect(service.debeIncrementarVersion('Renovado', 'Aprobado')).toBe(true);
    });

    it('should not increment when already Aprobado or not approving', () => {
      expect(service.debeIncrementarVersion('Aprobado', 'Aprobado')).toBe(false);
      expect(service.debeIncrementarVersion('Aprobado', 'Renovado')).toBe(false);
      expect(service.debeIncrementarVersion('Borrador', 'En revisión')).toBe(
        false,
      );
    });
  });

  describe('aplicarVersionamientoSiCorresponde', () => {
    const base: Pick<Procedimiento, 'version' | 'estado_version'> = {
      version: '1.0',
      estado_version: 'Borrador',
    };

    it('should increment on approval transition', () => {
      const result = service.aplicarVersionamientoSiCorresponde(
        base,
        'Aprobado',
      );
      expect(result).toEqual({ versionNueva: '1.1', debeRegistrar: true });
    });

    it('should not increment when staying approved', () => {
      const result = service.aplicarVersionamientoSiCorresponde(
        { version: '1.0', estado_version: 'Aprobado' },
        'Aprobado',
      );
      expect(result).toEqual({ versionNueva: '1.0', debeRegistrar: false });
    });

    it('should not increment when moving to Renovado', () => {
      const result = service.aplicarVersionamientoSiCorresponde(
        { version: '1.0', estado_version: 'Aprobado' },
        'Renovado',
      );
      expect(result).toEqual({ versionNueva: '1.0', debeRegistrar: false });
    });
  });

  describe('resolverVersionamientoEnCreacion', () => {
    it('should assign 1.0 when created as Aprobado', () => {
      expect(service.resolverVersionamientoEnCreacion('Aprobado')).toEqual({
        versionNueva: '1.0',
        debeRegistrar: true,
      });
    });

    it('should not assign version for Borrador', () => {
      expect(service.resolverVersionamientoEnCreacion('Borrador')).toEqual({
        versionNueva: null,
        debeRegistrar: false,
      });
    });
  });

  describe('registrarVersionamiento', () => {
    it('should call auditoriaService.registrarCambio with VERSION action', async () => {
      await service.registrarVersionamiento(5, '1.0', '1.1', 123);
      expect(auditoriaService.registrarCambio).toHaveBeenCalledWith(
        'Procedimiento',
        5,
        'VERSION',
        { version: '1.0' },
        { version: '1.1' },
        123,
        undefined,
        undefined,
      );
    });
  });

  describe('cambiarEstadoProcedimiento', () => {
    const procedimientoBase = {
      id_procedimiento: 10,
      codigo: 'PROCD-001',
      nombre: 'Procedimiento test',
      estado_version: 'Borrador' as const,
      version: '1.0',
      proceso: { id_proceso: 1, nombre: 'Proceso A' },
      instalaciones: [{ id_unidad: 2, nombre: 'Unidad 1' }],
    };

    it('should update estado and register CAMBIO_ESTADO with full snapshots', async () => {
      const before = { ...procedimientoBase };
      const after = {
        ...procedimientoBase,
        estado_version: 'En revisión' as const,
      };

      procedimientoRepository.findOne
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(after);
      procedimientoRepository.save.mockResolvedValue(after);

      const result = await service.cambiarEstadoProcedimiento(
        10,
        'En revisión',
        42,
        'Listo para revisión',
      );

      expect(procedimientoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado_version: 'En revisión' }),
      );
      expect(auditoriaService.registrarCambio).toHaveBeenCalledWith(
        'Procedimiento',
        10,
        'CAMBIO_ESTADO',
        expect.objectContaining({
          estado_version: 'Borrador',
          proceso: expect.any(Object),
          instalaciones: expect.any(Array),
        }),
        expect.objectContaining({
          estado_version: 'En revisión',
          proceso: expect.any(Object),
          instalaciones: expect.any(Array),
        }),
        42,
        'Listo para revisión',
        undefined,
      );
      expect(result.estado_version).toBe('En revisión');
    });

    it('should use manager repository when manager is provided', async () => {
      const before = { ...procedimientoBase };
      const after = {
        ...procedimientoBase,
        estado_version: 'Aprobado' as const,
      };
      const managerRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(before)
          .mockResolvedValueOnce(after),
        save: jest.fn().mockResolvedValue(after),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(managerRepo),
      } as any;

      await service.cambiarEstadoProcedimiento(
        10,
        'Aprobado',
        7,
        undefined,
        manager,
      );

      expect(manager.getRepository).toHaveBeenCalledWith(Procedimiento);
      expect(managerRepo.save).toHaveBeenCalled();
      expect(procedimientoRepository.save).not.toHaveBeenCalled();
      expect(auditoriaService.registrarCambio).toHaveBeenCalledWith(
        'Procedimiento',
        10,
        'CAMBIO_ESTADO',
        expect.any(Object),
        expect.any(Object),
        7,
        undefined,
        manager,
      );
    });

    it('should throw NotFoundException when procedimiento does not exist', async () => {
      procedimientoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cambiarEstadoProcedimiento(999, 'Aprobado', 1),
      ).rejects.toThrow(NotFoundException);
      expect(auditoriaService.registrarCambio).not.toHaveBeenCalled();
    });
  });
});
