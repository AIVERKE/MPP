import { Test, TestingModule } from '@nestjs/testing';
import { FlujoService } from './flujo.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Operacion } from './entities/operacion.entity';
import { Actividad } from './entities/actividad.entity';
import { Accion } from './entities/accion.entity';
import { Figura } from './entities/figura.entity';
import { OperacionCargo } from './entities/operacion-cargo.entity';
import { Tarea } from './entities/tarea.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
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

describe('FlujoService', () => {
  let service: FlujoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlujoService,
        { provide: getRepositoryToken(Operacion), useValue: mockRepository() },
        { provide: getRepositoryToken(Actividad), useValue: mockRepository() },
        { provide: getRepositoryToken(Accion), useValue: mockRepository() },
        { provide: getRepositoryToken(Figura), useValue: mockRepository() },
        {
          provide: getRepositoryToken(OperacionCargo),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Tarea), useValue: mockRepository() },
        {
          provide: getRepositoryToken(Procedimiento),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Cargo), useValue: mockRepository() },
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
      ],
    }).compile();

    service = module.get<FlujoService>(FlujoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
