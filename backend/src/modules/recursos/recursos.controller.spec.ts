import { Test, TestingModule } from '@nestjs/testing';
import { RecursosController } from './recursos.controller';
import { RecursosService } from './recursos.service';

describe('RecursosController', () => {
  let controller: RecursosController;

  const mockRecursosService = () => ({
    findAllRequisitos: jest.fn(),
    findOneRequisitos: jest.fn(),
    createRequisitos: jest.fn(),
    updateRequisitos: jest.fn(),
    removeRequisitos: jest.fn(),
    // Agrega más métodos si es necesario para las pruebas
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecursosController],
      providers: [
        { provide: RecursosService, useValue: mockRecursosService() },
      ],
    }).compile();

    controller = module.get<RecursosController>(RecursosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
