import { Test, TestingModule } from '@nestjs/testing';
import { VersionesController } from './versiones.controller';
import { AuditoriaService } from './auditoria.service';

const mockAuditoriaService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
});

describe('VersionesController', () => {
  let controller: VersionesController;
  let service: ReturnType<typeof mockAuditoriaService>;

  beforeEach(async () => {
    service = mockAuditoriaService();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionesController],
      providers: [{ provide: AuditoriaService, useValue: service }],
    }).compile();

    controller = module.get<VersionesController>(VersionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll on service with query parameters', async () => {
    const query = { page: 1, limit: 10 };
    await controller.findAll(query.page, query.limit);
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
    await controller.findAll(1, 10, 'Procedimiento', 'VERSION', undefined, undefined, undefined, 15);
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ idRegistroOriginal: 15 }),
    );
  });

  it('should call findOne on service with id', async () => {
    await controller.findOne(5);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });
});
