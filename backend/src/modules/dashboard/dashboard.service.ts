import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proceso } from '../procesos/entities/proceso.entity';
import { Procedimiento } from '../procesos/entities/procedimiento.entity';
import { Usuario } from '../seguridad/entities/usuario.entity';
import { Unidad } from '../estructura-organizacional/entities/unidad.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Proceso)
    private readonly procesoRepository: Repository<Proceso>,
    @InjectRepository(Procedimiento)
    private readonly procedimientoRepository: Repository<Procedimiento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Unidad)
    private readonly unidadRepository: Repository<Unidad>,
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    const [totalProcesos, totalProcedimientos, totalUsuarios, totalUnidades] =
      await Promise.all([
        this.procesoRepository.count(),
        this.procedimientoRepository.count(),
        this.usuarioRepository.count({ where: { activo: true } }),
        this.unidadRepository.count(),
      ]);

    return {
      totalProcesos,
      totalProcedimientos,
      totalUsuarios,
      totalUnidades,
    };
  }
}
