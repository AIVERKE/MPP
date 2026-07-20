import { Test, TestingModule } from '@nestjs/testing';
import { VersionesService } from './versiones.service';
import { AuditoriaService } from './auditoria.service';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';

const mockAuditoriaService = () => ({
  registrarCambio: jest.fn().mockResolvedValue({}),
});

describe('VersionesService', () => {
  let service: VersionesService;
  let auditoriaService: jest.Mocked<AuditoriaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionesService,
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
      ],
    }).compile();

    service = module.get<VersionesService>(VersionesService);
    auditoriaService = module.get(AuditoriaService);
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
});
