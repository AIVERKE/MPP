import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateCargoDto {
  @ApiProperty({
    description: 'Nombre del cargo',
    example: 'Analista de Sistemas',
    examples: {
      ejemplo1: { value: 'Analista de Sistemas' },
      ejemplo2: { value: 'Gerente General' },
    },
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del cargo',
    required: false,
    example:
      'Responsable de la gestión y mantenimiento de los sistemas de información.',
    examples: {
      ejemplo1: {
        value:
          'Responsable de la gestión y mantenimiento de los sistemas de información.',
      },
      ejemplo2: {
        value: 'Encargado de la dirección estratégica de la empresa.',
      },
    },
  })
  descripcion?: string;
}

export class UpdateCargoDto extends PartialType(CreateCargoDto) {}
