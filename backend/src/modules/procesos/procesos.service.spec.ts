import { Test, TestingModule } from '@nestjs/testing';
import { ProcesosService } from './procesos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Proceso } from './entities/proceso.entity';
import { Procedimiento } from './entities/procedimiento.entity';
import { CargoProceso } from './entities/cargo-proceso.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { AuditoriaService } from '../versiones/auditoria.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
});

const mockAuditoriaService = () => ({
  registrarCambio: jest.fn(),
});

describe('ProcesosService', () => {
  let service: ProcesosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcesosService,
        { provide: getRepositoryToken(Proceso), useValue: mockRepository() },
        {
          provide: getRepositoryToken(Procedimiento),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CargoProceso),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Unidad), useValue: mockRepository() },
        { provide: getRepositoryToken(Cargo), useValue: mockRepository() },
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
      ],
    }).compile();

    service = module.get<ProcesosService>(ProcesosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
