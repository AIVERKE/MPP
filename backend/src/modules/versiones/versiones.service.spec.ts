import { Test, TestingModule } from '@nestjs/testing';
import { VersionesService } from './versiones.service';
import { AuditoriaService } from './auditoria.service';

const mockAuditoriaService = () => ({
  registrarCambio: jest.fn().mockResolvedValue({}),
});

describe('VersionesService', () => {
  let service: VersionesService;
  let auditoriaService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionesService,
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
      ],
    }).compile();

    service = module.get<VersionesService>(VersionesService);
    auditoriaService = module.get<AuditoriaService>(AuditoriaService);
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
      );
    });
  });
});
