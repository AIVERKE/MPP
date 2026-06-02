import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateEquipoDto {
  @ApiProperty({
    description: 'Nombre del equipo o infraestructura',
    example: 'Servidor Dell PowerEdge',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción del equipo',
    example: 'Servidor de base de datos principal.',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'IDs de los procedimientos asociados al equipo',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  id_procedimientos?: number[];
}

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {}
