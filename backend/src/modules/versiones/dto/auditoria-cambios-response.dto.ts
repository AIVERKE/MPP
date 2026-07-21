import { ApiProperty } from '@nestjs/swagger';

export class AuditoriaCambiosResponseDto {
  @ApiProperty({
    description: 'ID autoincremental de la auditoría',
    example: 1,
  })
  id_auditoria: number;

  @ApiProperty({
    description: 'Nombre de la tabla afectada',
    example: 'Procedimiento',
  })
  tablaAfectada: string;

  @ApiProperty({
    description: 'ID del registro original afectado en la tabla',
    example: 10,
  })
  idRegistroOriginal: number;

  @ApiProperty({
    description: 'Acción realizada',
    example: 'UPDATE',
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VERSION'],
  })
  accion: string;

  @ApiProperty({
    description: 'Snapshot del registro antes del cambio',
    example: {},
  })
  datosAnteriores: any;

  @ApiProperty({
    description: 'Snapshot del registro después del cambio',
    example: { id_procedimiento: 10, nombre: 'Procedimiento Actualizado' },
    nullable: true,
  })
  datosNuevos: any;

  @ApiProperty({
    description: 'ID del usuario que realizó la acción',
    example: 1,
    nullable: true,
  })
  idUsuario: number;

  @ApiProperty({
    description: 'Fecha y hora en la que se realizó el cambio',
    example: '2026-07-13T15:00:00.000Z',
  })
  fechaCambio: Date;

  @ApiProperty({
    description: 'Motivo del cambio o comentario opcional',
    example: 'Actualización por nueva normativa',
    nullable: true,
  })
  motivoCambio?: string;
}
