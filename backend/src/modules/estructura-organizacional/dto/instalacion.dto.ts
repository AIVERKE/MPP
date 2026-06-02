import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateInstalacionDto {
  @ApiProperty({
    description: 'Nombre de la instalación',
    example: 'Planta Norte',
    examples: {
      ejemplo1: { value: 'Planta Norte' },
      ejemplo2: { value: 'Oficina Central' },
    },
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada de la instalación',
    required: false,
    example: 'Instalación principal de producción ubicada en el sector norte.',
    examples: {
      ejemplo1: {
        value:
          'Instalación principal de producción ubicada en el sector norte.',
      },
      ejemplo2: {
        value: 'Sede administrativa de la unidad organizacional.',
      },
    },
  })
  descripcion?: string;

  @ApiProperty({
    description: 'ID de la unidad organizacional a la que pertenece la instalación',
    example: 1,
  })
  id_unidad: number;
}

export class UpdateInstalacionDto extends PartialType(CreateInstalacionDto) {}
