import { Test, TestingModule } from '@nestjs/testing';
import { VersionesController } from './versiones.controller';
import { AuditoriaService } from './auditoria.service';
import { SeguridadService } from '../seguridad/seguridad.service';

const mockAuditoriaService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
});

const mockSeguridadService = () => ({
  esUsuarioSoloConsultor: jest.fn().mockResolvedValue(false),
});

describe('VersionesController', () => {
  let controller: VersionesController;
  let service: ReturnType<typeof mockAuditoriaService>;

  beforeEach(async () => {
    service = mockAuditoriaService();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionesController],
      providers: [
        { provide: AuditoriaService, useValue: service },
        { provide: SeguridadService, useValue: mockSeguridadService() },
      ],
    }).compile();

    controller = module.get<VersionesController>(VersionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll on service with query parameters', async () => {
    const req = { user: { userId: 1 } };
    await controller.findAll(req, 1, 10);
    expect(service.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      tablaAfectada: undefined,
      accion: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
      idUsuario: undefined,
      idRegistroOriginal: undefined,
    });
  });

  it('should pass id_registro_original to findAll', async () => {
    const req = { user: { userId: 1 } };
    await controller.findAll(
      req,
      1,
      10,
      'Procedimiento',
      'VERSION',
      undefined,
      undefined,
      undefined,
      15,
    );
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ idRegistroOriginal: 15 }),
    );
  });

  it('should call findOne on service with id', async () => {
    const req = { user: { userId: 1 } };
    await controller.findOne(5, req);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });
});
