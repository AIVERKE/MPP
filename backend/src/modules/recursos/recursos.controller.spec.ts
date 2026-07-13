import { Test, TestingModule } from '@nestjs/testing';
import { RecursosController } from './recursos.controller';
import { RecursosService } from './recursos.service';

const mockRecursosService = () => ({
  createRequisitos: jest.fn(),
  findAllRequisitos: jest.fn(),
  findOneRequisitos: jest.fn(),
  updateRequisitos: jest.fn(),
  removeRequisitos: jest.fn(),
  createRiesgo: jest.fn(),
  findAllRiesgos: jest.fn(),
  findOneRiesgo: jest.fn(),
  updateRiesgo: jest.fn(),
  removeRiesgo: jest.fn(),
  createControl: jest.fn(),
  findAllControles: jest.fn(),
  findOneControl: jest.fn(),
  updateControl: jest.fn(),
  removeControl: jest.fn(),
  createSistemaInformacion: jest.fn(),
  findAllSistemasInformacion: jest.fn(),
  findOneSistemaInformacion: jest.fn(),
  updateSistemaInformacion: jest.fn(),
  removeSistemaInformacion: jest.fn(),
  createEquipo: jest.fn(),
  findAllEquipos: jest.fn(),
  findOneEquipo: jest.fn(),
  updateEquipo: jest.fn(),
  removeEquipo: jest.fn(),
  createDocumentoReferencia: jest.fn(),
  findAllDocumentosReferencia: jest.fn(),
  findOneDocumentoReferencia: jest.fn(),
  updateDocumentoReferencia: jest.fn(),
  removeDocumentoReferencia: jest.fn(),
});

describe('RecursosController', () => {
  let controller: RecursosController;

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
