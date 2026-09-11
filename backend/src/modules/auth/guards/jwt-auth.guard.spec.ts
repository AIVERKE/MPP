import {
  Controller,
  INestApplication,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('procesos')
class StubProcesosController {
  @UseGuards(JwtAuthGuard)
  @Patch('procedimientos/:id')
  updateProcedimiento() {
    return { ok: true };
  }
}

describe('JwtAuthGuard', () => {
  const JWT_SECRET = 'test-secret';
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET })],
        }),
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [StubProcesosController],
      providers: [JwtStrategy],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 when JWT is signed with the wrong secret', async () => {
    const badToken = new JwtService({ secret: 'wrong-secret' }).sign({
      sub: '1',
      username: 'attacker',
    });

    await request(app.getHttpServer())
      .patch('/procesos/procedimientos/1')
      .set('Authorization', `Bearer ${badToken}`)
      .expect(401);
  });

  it('returns 401 for UMSA-like payload without a valid local signature', async () => {
    const umsaLikeToken = new JwtService({ secret: 'umsa-core-secret' }).sign({
      sub: 'umsa-user-id',
      user_name: 'jperez@umsa.bo',
      username: 'jperez@umsa.bo',
    });

    await request(app.getHttpServer())
      .patch('/procesos/procedimientos/1')
      .set('Authorization', `Bearer ${umsaLikeToken}`)
      .expect(401);
  });

  it('returns 200 when JWT is signed with the local secret', async () => {
    const token = jwtService.sign({ sub: '1', username: 'valid-user' });

    await request(app.getHttpServer())
      .patch('/procesos/procedimientos/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ ok: true });
  });
});
