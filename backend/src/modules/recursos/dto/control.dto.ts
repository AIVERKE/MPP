import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateControlDto {
  @ApiProperty({
    description: 'ID de la operación asociada al control',
    example: 1,
  })
  id_operacion: number;

  @ApiProperty({
    description: 'Descripción del control',
    example: 'Uso de UPS y generadores eléctricos.',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de control',
    example: 'Preventivo',
    required: false,
  })
  tipo_control?: string;
}

export class UpdateControlDto extends PartialType(CreateControlDto) {}
