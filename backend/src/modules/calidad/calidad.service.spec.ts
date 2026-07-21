import { Test, TestingModule } from '@nestjs/testing';
import { CalidadService } from './calidad.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Normativa } from './entities/normativa.entity';
import { Indicador } from './entities/indicador.entity';
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

describe('CalidadService', () => {
  let service: CalidadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalidadService,
        { provide: getRepositoryToken(Normativa), useValue: mockRepository() },
        { provide: getRepositoryToken(Indicador), useValue: mockRepository() },
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
      ],
    }).compile();

    service = module.get<CalidadService>(CalidadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
