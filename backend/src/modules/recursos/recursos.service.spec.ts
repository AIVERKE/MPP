import { Test, TestingModule } from '@nestjs/testing';
import { RecursosService } from './recursos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Requisitos } from './entities/requisitos.entity';
import { Riesgo } from './entities/riesgo.entity';
import { Control } from './entities/control.entity';
import { SistemaInformacion } from './entities/sistema-informacion.entity';
import { Equipo } from './entities/equipo.entity';
import { DocumentoReferencia } from './entities/documento-referencia.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Operacion } from '../flujo/entities/operacion.entity';

describe('RecursosService', () => {
  let service: RecursosService;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    softRemove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecursosService,
        { provide: getRepositoryToken(Requisitos), useValue: mockRepository() },
        { provide: getRepositoryToken(Riesgo), useValue: mockRepository() },
        { provide: getRepositoryToken(Control), useValue: mockRepository() },
        {
          provide: getRepositoryToken(SistemaInformacion),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Equipo), useValue: mockRepository() },
        {
          provide: getRepositoryToken(DocumentoReferencia),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Procedimiento),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Operacion), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<RecursosService>(RecursosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
