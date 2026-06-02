import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateOperacionCargoDto {
  @ApiProperty({
    description: 'ID de la operación',
    example: 1,
  })
  id_operacion: number;

  @ApiProperty({
    description: 'ID del cargo',
    example: 1,
  })
  id_cargo: number;

  @ApiProperty({
    description: 'Tipo de participación (Responsable, Consultor, etc.)',
    example: 'Responsable',
    examples: {
      ejemplo1: { value: 'Responsable' },
      ejemplo2: { value: 'Informa' },
    },
    required: false,
  })
  tipo_participacion?: string;
}

export class UpdateOperacionCargoDto extends PartialType(
  CreateOperacionCargoDto,
) {}
