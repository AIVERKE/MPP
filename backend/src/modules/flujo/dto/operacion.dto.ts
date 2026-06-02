import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateOperacionDto {
  @ApiProperty({
    description: 'ID del procedimiento al que pertenece',
    example: 1,
  })
  id_procedimiento: number;

  @ApiProperty({
    description: 'Orden de la operación',
    example: 1,
    required: false,
  })
  orden?: number;

  @ApiProperty({
    description: 'Producto o resultado de la operación',
    example: 'Informe de auditoría',
    examples: {
      ejemplo1: { value: 'Informe de auditoría' },
      ejemplo2: { value: 'Solicitud aprobada' },
    },
    required: false,
  })
  salida?: string;

  @ApiProperty({
    description: 'Plazo de ejecución en días',
    example: 5.5,
    required: false,
  })
  plazo?: number;
}

export class UpdateOperacionDto extends PartialType(CreateOperacionDto) {}
