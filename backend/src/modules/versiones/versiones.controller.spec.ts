import { Test, TestingModule } from '@nestjs/testing';
import { VersionesController } from './versiones.controller';
import { AuditoriaService } from './auditoria.service';

const mockAuditoriaService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
});

describe('VersionesController', () => {
  let controller: VersionesController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionesController],
      providers: [
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
      ],
    }).compile();

    controller = module.get<VersionesController>(VersionesController);
    service = module.get<AuditoriaService>(AuditoriaService);
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
    });
  });

  it('should call findOne on service with id', async () => {
    await controller.findOne(5);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });
});
