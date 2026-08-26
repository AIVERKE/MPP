import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeguridadService } from './seguridad.service';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { UsuarioRolUnidad } from './entities/usuario-rol-unidad.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';

describe('SeguridadService', () => {
  let service: SeguridadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeguridadService,
        { provide: getRepositoryToken(Usuario), useValue: {} },
        { provide: getRepositoryToken(Rol), useValue: {} },
        { provide: getRepositoryToken(UsuarioRolUnidad), useValue: {} },
        { provide: getRepositoryToken(Unidad), useValue: {} },
      ],
    }).compile();

    service = module.get<SeguridadService>(SeguridadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('esSoloConsultor detects consultor-only users', () => {
    expect(service.esSoloConsultor(['Consultor'])).toBe(true);
    expect(service.esSoloConsultor(['Consultor', 'Elaborador'])).toBe(false);
    expect(service.esSoloConsultor(['Super admin'])).toBe(false);
  });
});
