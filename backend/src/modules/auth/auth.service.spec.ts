import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { SeguridadService } from '../seguridad/seguridad.service';
import { Usuario } from '../seguridad/entities/usuario.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let seguridadService: { findOneByUsername: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const baseUser = {
    id_usuario: 1,
    username: 'jperez',
    password: 'hashed-password',
    correo: 'jperez@umsa.bo',
    activo: true,
    roles: [{ id_rol: 1, nombre: 'Elaborador' }],
  } as unknown as Usuario;

  beforeEach(async () => {
    seguridadService = {
      findOneByUsername: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SeguridadService, useValue: seguridadService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns null when user is inactive even with correct password', async () => {
      seguridadService.findOneByUsername.mockResolvedValue({
        ...baseUser,
        activo: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('jperez', 'correct-password');

      expect(result).toBeNull();
    });

    it('returns user without password when active and password matches', async () => {
      seguridadService.findOneByUsername.mockResolvedValue({ ...baseUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('jperez', 'correct-password');

      expect(result).toEqual({
        id_usuario: 1,
        username: 'jperez',
        correo: 'jperez@umsa.bo',
        activo: true,
        roles: [{ id_rol: 1, nombre: 'Elaborador' }],
      });
      expect(result).not.toHaveProperty('password');
    });

    it('returns null when password is incorrect', async () => {
      seguridadService.findOneByUsername.mockResolvedValue({ ...baseUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('jperez', 'wrong-password');

      expect(result).toBeNull();
    });

    it('returns null when user does not exist', async () => {
      seguridadService.findOneByUsername.mockResolvedValue(null);

      const result = await service.validateUser('ghost', 'any-password');

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns access_token and user payload', () => {
      const result = service.login(baseUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'jperez',
        sub: 1,
      });
      expect(result).toEqual({
        access_token: 'signed-jwt',
        user: {
          id: 1,
          username: 'jperez',
          roles: [{ id_rol: 1, nombre: 'Elaborador' }],
        },
      });
    });
  });
});
