import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FlujoService } from './flujo.service';
import { Operacion } from './entities/operacion.entity';
import { Actividad } from './entities/actividad.entity';
import { Accion } from './entities/accion.entity';
import { Figura } from './entities/figura.entity';
import { OperacionCargo } from './entities/operacion-cargo.entity';
import { Tarea } from './entities/tarea.entity';
import { CondicionTarea } from './entities/condicion-tarea.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Cargo } from '../estructura-organizacional/entities/cargo.entity';
import { AuditoriaService } from '../versiones/auditoria.service';
import { SeguridadService } from '../seguridad/seguridad.service';

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

const mockSeguridadService = () => ({
  esSoloConsultor: jest.fn(),
});

describe('FlujoService', () => {
  let service: FlujoService;
  let figuraRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    figuraRepo = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlujoService,
        { provide: getRepositoryToken(Operacion), useValue: mockRepository() },
        { provide: getRepositoryToken(Actividad), useValue: mockRepository() },
        { provide: getRepositoryToken(Accion), useValue: mockRepository() },
        { provide: getRepositoryToken(Figura), useValue: figuraRepo },
        {
          provide: getRepositoryToken(OperacionCargo),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Tarea), useValue: mockRepository() },
        {
          provide: getRepositoryToken(CondicionTarea),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Procedimiento),
          useValue: mockRepository(),
        },
        { provide: getRepositoryToken(Cargo), useValue: mockRepository() },
        { provide: AuditoriaService, useValue: mockAuditoriaService() },
        { provide: SeguridadService, useValue: mockSeguridadService() },
      ],
    }).compile();

    service = module.get<FlujoService>(FlujoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('figuras', () => {
    it('creates additional figura with es_oficial false', async () => {
      const created = {
        id_figura: 10,
        nombre: 'Mi círculo',
        codigo: 'circulo',
        es_oficial: false,
      };
      figuraRepo.create.mockReturnValue(created);
      figuraRepo.save.mockResolvedValue(created);
      figuraRepo.findOne.mockResolvedValue(created);

      const result = await service.createFigura({
        nombre: 'Mi círculo',
        codigo: 'circulo',
      });

      expect(figuraRepo.create).toHaveBeenCalledWith({
        nombre: 'Mi círculo',
        codigo: 'circulo',
        es_oficial: false,
      });
      expect(result.es_oficial).toBe(false);
    });

    it('rejects unsupported codigo on create', async () => {
      await expect(
        service.createFigura({
          nombre: 'Inventada',
          codigo: 'estrella' as any,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(figuraRepo.save).not.toHaveBeenCalled();
    });

    it('blocks delete of official figuras', async () => {
      figuraRepo.findOne.mockResolvedValue({
        id_figura: 1,
        nombre: 'Círculo',
        codigo: 'circulo',
        es_oficial: true,
      });

      await expect(service.removeFigura(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(figuraRepo.softRemove).not.toHaveBeenCalled();
    });

    it('allows delete of non-official figuras', async () => {
      const extra = {
        id_figura: 20,
        nombre: 'Extra',
        codigo: 'rombo',
        es_oficial: false,
      };
      figuraRepo.findOne.mockResolvedValue(extra);
      figuraRepo.softRemove.mockResolvedValue(extra);

      await service.removeFigura(20);

      expect(figuraRepo.softRemove).toHaveBeenCalledWith(extra);
    });

    it('blocks changing codigo of official figuras', async () => {
      figuraRepo.findOne.mockResolvedValue({
        id_figura: 1,
        nombre: 'Círculo',
        codigo: 'circulo',
        es_oficial: true,
      });

      await expect(
        service.updateFigura(1, { codigo: 'rombo' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
