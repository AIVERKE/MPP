import { Test, TestingModule } from '@nestjs/testing';
import { FlujoController } from './flujo.controller';
import { FlujoService } from './flujo.service';

const mockFlujoService = () => ({
  createFigura: jest.fn(),
  findAllFiguras: jest.fn(),
  findOneFigura: jest.fn(),
  updateFigura: jest.fn(),
  removeFigura: jest.fn(),
  createAccion: jest.fn(),
  findAllAcciones: jest.fn(),
  findOneAccion: jest.fn(),
  updateAccion: jest.fn(),
  removeAccion: jest.fn(),
  createActividad: jest.fn(),
  findAllActividades: jest.fn(),
  findOneActividad: jest.fn(),
  updateActividad: jest.fn(),
  removeActividad: jest.fn(),
  createOperacion: jest.fn(),
  findAllOperaciones: jest.fn(),
  findOneOperacion: jest.fn(),
  updateOperacion: jest.fn(),
  removeOperacion: jest.fn(),
  createOperacionCargo: jest.fn(),
  findAllOperacionCargos: jest.fn(),
  findOneOperacionCargo: jest.fn(),
  updateOperacionCargo: jest.fn(),
  removeOperacionCargo: jest.fn(),
  createTarea: jest.fn(),
  findAllTareas: jest.fn(),
  findOneTarea: jest.fn(),
  updateTarea: jest.fn(),
  removeTarea: jest.fn(),
});

describe('FlujoController', () => {
  let controller: FlujoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlujoController],
      providers: [{ provide: FlujoService, useValue: mockFlujoService() }],
    }).compile();

    controller = module.get<FlujoController>(FlujoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
