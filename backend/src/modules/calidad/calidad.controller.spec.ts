import { Test, TestingModule } from '@nestjs/testing';
import { CalidadController } from './calidad.controller';

describe('CalidadController', () => {
  let controller: CalidadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalidadController],
    }).compile();

    controller = module.get<CalidadController>(CalidadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
