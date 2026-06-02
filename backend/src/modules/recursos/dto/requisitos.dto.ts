import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateRequisitosDto {
  @ApiProperty({
    description: 'ID de la operación asociada al requisito',
    example: 1,
  })
  id_operacion: number;

  @ApiProperty({
    description: 'Descripción del requisito',
    example: 'Disponer de conexión a internet estable.',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de entrada del requisito',
    example: 'Física / Digital',
    required: false,
  })
  tipo_entrada?: string;
}

export class UpdateRequisitosDto extends PartialType(CreateRequisitosDto) {}
