import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateProcesoDto {
  @ApiProperty({
    description: 'Código único del proceso',
    example: 'PROC-001',
    examples: {
      ejemplo1: { value: 'PROC-001' },
      ejemplo2: { value: 'ADM-050' },
    },
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del proceso',
    example: 'Gestión de Talento Humano',
    examples: {
      ejemplo1: { value: 'Gestión de Talento Humano' },
      ejemplo2: { value: 'Mantenimiento de Sistemas' },
    },
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del proceso',
    example: 'Proceso encargado de la selección y capacitación del personal.',
    examples: {
      ejemplo1: {
        value: 'Proceso encargado de la selección y capacitación del personal.',
      },
      ejemplo2: {
        value:
          'Proceso para asegurar la disponibilidad de los servicios de TI.',
      },
    },
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'IDs de las unidades asociadas al proceso',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  id_unidades?: number[];
}

export class UpdateProcesoDto extends PartialType(CreateProcesoDto) {}
