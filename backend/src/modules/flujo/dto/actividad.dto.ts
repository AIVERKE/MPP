import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateActividadDto {
  @ApiProperty({
    description: 'ID de la operación a la que pertenece',
    example: 1,
  })
  id_operaciones: number;

  @ApiProperty({
    description: 'Descripción de la actividad',
    example: 'Revisión inicial de documentos',
    examples: {
      ejemplo1: { value: 'Revisión inicial de documentos' },
      ejemplo2: { value: 'Carga de datos en el sistema' },
    },
  })
  descripcion: string;

  @ApiProperty({
    description: 'Orden de la actividad en el flujo',
    example: 1,
    required: false,
  })
  orden?: number;
}

export class UpdateActividadDto extends PartialType(CreateActividadDto) {}
