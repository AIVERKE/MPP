import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateRiesgoDto {
  @ApiProperty({
    description: 'ID de la operación asociada al riesgo',
    example: 1,
  })
  id_operacion: number;

  @ApiProperty({
    description: 'Descripción del riesgo',
    example: 'Pérdida de información por fallo eléctrico.',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Nivel del riesgo',
    example: 'Alto',
    required: false,
  })
  nivel?: string;
}

export class UpdateRiesgoDto extends PartialType(CreateRiesgoDto) {}
