import { Test, TestingModule } from '@nestjs/testing';
import { EstructuraOrganizacionalController } from './estructura-organizacional.controller';

describe('EstructuraOrganizacionalController', () => {
  let controller: EstructuraOrganizacionalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstructuraOrganizacionalController],
    }).compile();

    controller = module.get<EstructuraOrganizacionalController>(
      EstructuraOrganizacionalController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
