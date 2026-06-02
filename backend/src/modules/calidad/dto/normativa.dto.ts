import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateNormativaDto {
  @ApiProperty({
    description: 'Código de la normativa',
    example: 'NORM-001',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre de la normativa',
    example: 'Norma ISO 9001',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la normativa',
    example: 'Sistema de gestión de calidad',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'URL de referencia de la normativa',
    example: 'https://example.com/iso9001',
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: 'Fecha de emisión de la normativa',
    example: '2023-01-15',
    required: false,
  })
  fecha_emision?: string;

  @ApiProperty({
    description: 'IDs de los procedimientos asociados',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  id_procedimientos?: number[];
}

export class UpdateNormativaDto extends PartialType(CreateNormativaDto) {}
