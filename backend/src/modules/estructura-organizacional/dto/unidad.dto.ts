import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUnidadDto {
  @ApiProperty({
    description: 'Nombre de la unidad organizacional',
    example: 'Dirección de Tecnologías de Información',
    examples: {
      ejemplo1: { value: 'Dirección de Tecnologías de Información' },
      ejemplo2: { value: 'Departamento de Recursos Humanos' },
    },
  })
  nombre: string;

  @ApiProperty({
    description: 'Sigla de la unidad',
    required: false,
    example: 'DTI',
    examples: {
      ejemplo1: { value: 'DTI' },
      ejemplo2: { value: 'RRHH' },
    },
  })
  sigla?: string;

  @ApiProperty({
    description: 'Nivel jerárquico de la unidad',
    required: false,
    example: 'Nivel 2',
    examples: {
      ejemplo1: { value: 'Nivel 2' },
      ejemplo2: { value: 'Nivel 3' },
    },
  })
  nivel?: string;

  @ApiProperty({
    description: 'Tipo de unidad (ej. Administrativa, Operativa)',
    required: false,
    example: 'Administrativa',
    examples: {
      ejemplo1: { value: 'Administrativa' },
      ejemplo2: { value: 'Asesoría' },
    },
  })
  tipo_unidad?: string;

  @ApiProperty({
    description: 'IDs de los cargos asociados a esta unidad',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  id_cargos?: number[];
}

export class UpdateUnidadDto extends PartialType(CreateUnidadDto) {}
