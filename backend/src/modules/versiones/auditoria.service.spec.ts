import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaService } from './auditoria.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditoriaCambios } from './entities/auditoria-cambios.entity';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn((entity) => Promise.resolve({ id_auditoria: 1, ...entity })),
});

describe('AuditoriaService', () => {
  let service: AuditoriaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: getRepositoryToken(AuditoriaCambios),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a change successfully', async () => {
    const res = await service.registrarCambio(
      'Procedimiento',
      10,
      'CREATE',
      {},
      { id_procedimiento: 10, nombre: 'Proc test' },
      1,
    );
    expect(res).toBeDefined();
    expect(res.tablaAfectada).toBe('Procedimiento');
    expect(res.idRegistroOriginal).toBe(10);
    expect(res.accion).toBe('CREATE');
    expect(res.idUsuario).toBe(1);
  });
});
