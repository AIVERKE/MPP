import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateProcedimientoDto {
  @ApiProperty({
    description: 'ID del proceso al que pertenece el procedimiento',
    example: 1,
    examples: {
      ejemplo1: { value: 1 },
      ejemplo2: { value: 5 },
    },
  })
  id_proceso: number;

  @ApiProperty({
    description: 'Código único del procedimiento',
    example: 'PROCD-001',
    examples: {
      ejemplo1: { value: 'PROCD-001' },
      ejemplo2: { value: 'TI-002' },
    },
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del procedimiento',
    example: 'Inducción de nuevo personal',
    examples: {
      ejemplo1: { value: 'Inducción de nuevo personal' },
      ejemplo2: { value: 'Backup de base de datos' },
    },
  })
  nombre: string;

  @ApiProperty({
    description: 'Objetivos del procedimiento',
    example:
      'Asegurar que el nuevo personal conozca las políticas de la empresa.',
    examples: {
      ejemplo1: {
        value:
          'Asegurar que el nuevo personal conozca las políticas de la empresa.',
      },
      ejemplo2: { value: 'Garantizar la recuperación de datos ante fallos.' },
    },
    required: false,
  })
  objetivos?: string;

  @ApiProperty({
    description: 'Alcance del procedimiento',
    example: 'Todo el personal de nuevo ingreso.',
    examples: {
      ejemplo1: { value: 'Todo el personal de nuevo ingreso.' },
      ejemplo2: { value: 'Todas las bases de datos de producción.' },
    },
    required: false,
  })
  alcance?: string;

  @ApiProperty({
    description: 'Periodicidad del procedimiento',
    example: 'Cada vez que ingrese personal',
    examples: {
      ejemplo1: { value: 'Cada vez que ingrese personal' },
      ejemplo2: { value: 'Diario' },
    },
    required: false,
  })
  periodicidad?: string;

  @ApiProperty({
    description: 'Estado del procedimiento',
    example: 'Activo',
    examples: {
      ejemplo1: { value: 'Activo' },
      ejemplo2: { value: 'En revisión' },
    },
    required: false,
  })
  estado?: string;

  @ApiProperty({
    description: 'IDs de las instalaciones (unidades) asociadas',
    type: [Number],
    example: [1, 3],
    required: false,
  })
  id_instalaciones?: number[];

  @ApiProperty({
    description: 'Estado de la versión del procedimiento',
    example: 'Borrador',
    enum: ['Borrador', 'En revisión', 'Aprobado', 'Renovado'],
    required: false,
  })
  estado_version?: 'Borrador' | 'En revisión' | 'Aprobado' | 'Renovado';
}

export class UpdateProcedimientoDto extends PartialType(
  CreateProcedimientoDto,
) {}

export class ProcedimientoResponseDto extends CreateProcedimientoDto {
  @ApiProperty({
    description: 'Versión actual del procedimiento (gestionada por el sistema)',
    example: '1.0',
    nullable: true,
  })
  version?: string;

  @ApiProperty({
    description: 'ID del procedimiento',
    example: 1,
  })
  id_procedimiento: number;
}
