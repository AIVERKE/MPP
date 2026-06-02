import { ApiProperty } from '@nestjs/swagger';

export class MofUnidadDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador único oficial del MOF',
  })
  id: number;

  @ApiProperty({
    example: 'RECTORADO',
    description: 'Nombre completo de la unidad organizacional',
  })
  nombre: string;

  @ApiProperty({
    required: false,
    example: 'REC-01',
    description: 'Código o sigla identificadora del MOF',
  })
  codigo?: string;

  @ApiProperty({
    required: false,
    example: 'EJECUTIVO',
    description: 'Nivel jerárquico dentro de la organización',
  })
  nivel?: string;

  @ApiProperty({
    required: false,
    example: 'ADMINISTRATIVO',
    description: 'Tipo de unidad según su función',
  })
  tipo?: string;
}
