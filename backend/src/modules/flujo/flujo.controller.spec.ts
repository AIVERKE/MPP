import { Test, TestingModule } from '@nestjs/testing';
import { FlujoController } from './flujo.controller';

describe('FlujoController', () => {
  let controller: FlujoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlujoController],
    }).compile();

    controller = module.get<FlujoController>(FlujoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
