import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateAccionDto {
  @ApiProperty({
    description: 'Nombre de la acción',
    example: 'Aprobar',
    examples: {
      ejemplo1: { value: 'Aprobar' },
      ejemplo2: { value: 'Revisar' },
    },
  })
  nombre_accion: string;

  @ApiProperty({
    description:
      'ID de la figura del catálogo GET /flujo/figuras. Define qué forma visual tendrá esta acción en el diagrama.',
    example: 2,
  })
  id_figura: number;
}

export class UpdateAccionDto extends PartialType(CreateAccionDto) {}
