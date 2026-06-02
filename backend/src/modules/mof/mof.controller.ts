import {
  Controller,
  Get,
  Post,
  Logger,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MofService } from './mof.service';
import { MofUnidadDto } from './dto/mof-unidad.dto';
import { MofPersonalDto } from './dto/mof-personal.dto';

@ApiTags('mof')
@Controller('mof')
export class MofController {
  private readonly logger = new Logger(MofController.name);

  constructor(private readonly mofService: MofService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Verifica la conectividad con el API del MOF',
    description:
      'Intenta realizar una petición al servicio externo del MOF para validar que el endpoint esté activo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conectividad exitosa.',
    schema: {
      example: { status: 'OK', message: 'Conectividad con MOF establecida' },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Servicio MOF no disponible.',
    schema: {
      example: {
        status: 'Error',
        message: 'Sin conexión con MOF: [Detalle del error]',
      },
    },
  })
  async health() {
    return await this.mofService.healthCheck();
  }

  @Get('unidades')
  @ApiOperation({
    summary: 'Lista las unidades directamente desde el MOF (sin persistir)',
    description:
      'Obtiene los datos en tiempo real desde el servicio externo sin afectar la base de datos local.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades obtenida.',
    type: [MofUnidadDto],
  })
  async getUnidades() {
    return await this.mofService.fetchUnidades();
  }

  @Post('sync')
  @ApiOperation({
    summary:
      'Sincroniza manualmente los datos del MOF a la base de datos local',
    description:
      'Realiza un Upsert seguro: actualiza Unidades existentes y crea las nuevas. ' +
      'Las unidades que ya no existen en el MOF quedan con soft-delete. ' +
      'Las relaciones con procesos y procedimientos NO se ven afectadas.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sincronización iniciada/completada.',
    schema: {
      example: {
        total: 154,
        timestamp: '2026-05-06T14:30:00Z',
        status: 'Éxito',
      },
    },
  })
  async sync() {
    return await this.mofService.sync();
  }

  @Get('status')
  @ApiOperation({
    summary: 'Muestra el estado de la última sincronización',
    description:
      'Retorna información sobre cuándo fue la última vez que se ejecutó el proceso de sincronización.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de sincronización.',
    schema: {
      example: {
        lastSync: '2026-05-06T14:30:00Z',
        status: 'Éxito',
        apiUrl: 'https://correspondencia.fcpn.edu.bo/...',
      },
    },
  })
  getStatus() {
    return this.mofService.getStatus();
  }

  @Post('cargos/sync')
  @ApiOperation({
    summary: 'Sincroniza todos los cargos desde el MOF',
    description:
      'Realiza un Upsert seguro de Cargos por unidad. Actualiza los existentes, inserta los nuevos ' +
      'y marca con soft-delete los que ya no vienen del MOF. ' +
      'La tabla pivote unidad_cargos solo recibe inserciones nuevas (ON CONFLICT DO NOTHING). ' +
      'Este proceso puede tardar varios minutos por el procesamiento en lotes.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sincronización de cargos completada.',
    schema: {
      example: {
        total_cargos: 120,
        unidades_procesadas: 45,
        timestamp: '2026-05-07T14:30:00Z',
      },
    },
  })
  async syncCargos() {
    return await this.mofService.syncCargos();
  }

  @Get('cargos')
  @ApiOperation({
    summary: 'Lista todos los cargos sincronizados en la base de datos local',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos.',
  })
  async getCargos() {
    return await this.mofService.getCargos();
  }

  @Get('unidades/:id/personal')
  @ApiOperation({
    summary: 'Proxy al endpoint del MOF para obtener personal de una unidad',
    description:
      'Obtiene los cargos/personal directamente desde el MOF sin persistir.',
  })
  @ApiParam({ name: 'id', description: 'ID de la unidad en el MOF' })
  @ApiResponse({
    status: 200,
    description: 'Lista de personal obtenida.',
    type: [MofPersonalDto],
  })
  async getPersonal(@Param('id', ParseIntPipe) id: number) {
    return await this.mofService.fetchPersonalByUnidad(id);
  }
}
