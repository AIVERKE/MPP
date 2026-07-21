import { Test, TestingModule } from '@nestjs/testing';
import { CalidadController } from './calidad.controller';
import { CalidadService } from './calidad.service';

const mockCalidadService = () => ({
  createNormativa: jest.fn(),
  findAllNormativas: jest.fn(),
  findOneNormativa: jest.fn(),
  updateNormativa: jest.fn(),
  removeNormativa: jest.fn(),
  createIndicador: jest.fn(),
  findAllIndicadores: jest.fn(),
  findOneIndicador: jest.fn(),
  updateIndicador: jest.fn(),
  removeIndicador: jest.fn(),
});

describe('CalidadController', () => {
  let controller: CalidadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalidadController],
      providers: [{ provide: CalidadService, useValue: mockCalidadService() }],
    }).compile();

    controller = module.get<CalidadController>(CalidadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
