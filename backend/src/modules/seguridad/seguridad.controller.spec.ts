import { Test, TestingModule } from '@nestjs/testing';
import { SeguridadController } from './seguridad.controller';
import { SeguridadService } from './seguridad.service';

describe('SeguridadController', () => {
  let controller: SeguridadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeguridadController],
      providers: [
        {
          provide: SeguridadService,
          useValue: {
            findAllUsuarios: jest.fn(),
            findAllRoles: jest.fn(),
            createUsuario: jest.fn(),
            updateUsuario: jest.fn(),
            removeUsuario: jest.fn(),
            updateEstado: jest.fn(),
            updateRoles: jest.fn(),
            updateAlcances: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SeguridadController>(SeguridadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
