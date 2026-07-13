import { Test, TestingModule } from '@nestjs/testing';
import { ProcesosController } from './procesos.controller';
import { ProcesosService } from './procesos.service';

const mockProcesosService = () => ({
  createProceso: jest.fn(),
  findAllProcesos: jest.fn(),
  findOneProceso: jest.fn(),
  updateProceso: jest.fn(),
  removeProceso: jest.fn(),
  createProcedimiento: jest.fn(),
  findAllProcedimientos: jest.fn(),
  findOneProcedimiento: jest.fn(),
  updateProcedimiento: jest.fn(),
  removeProcedimiento: jest.fn(),
  createCargoProceso: jest.fn(),
  findAllCargoProcesos: jest.fn(),
  findOneCargoProceso: jest.fn(),
  updateCargoProceso: jest.fn(),
  removeCargoProceso: jest.fn(),
});

describe('ProcesosController', () => {
  let controller: ProcesosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcesosController],
      providers: [
        { provide: ProcesosService, useValue: mockProcesosService() },
      ],
    }).compile();

    controller = module.get<ProcesosController>(ProcesosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
