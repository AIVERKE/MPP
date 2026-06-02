import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateCargoProcesoDto {
  @ApiProperty({
    description: 'ID del cargo',
    example: 1,
    examples: {
      ejemplo1: { value: 1 },
      ejemplo2: { value: 10 },
    },
  })
  id_cargo: number;

  @ApiProperty({
    description: 'ID del proceso',
    example: 1,
    examples: {
      ejemplo1: { value: 1 },
      ejemplo2: { value: 3 },
    },
  })
  id_proceso: number;

  @ApiProperty({
    description: 'Indica si es el responsable principal del proceso',
    example: true,
    examples: {
      ejemplo1: { value: true },
      ejemplo2: { value: false },
    },
    default: false,
  })
  es_responsable_principal: boolean;
}

export class UpdateCargoProcesoDto extends PartialType(CreateCargoProcesoDto) {}
