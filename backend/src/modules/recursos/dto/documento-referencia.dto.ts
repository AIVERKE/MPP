import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateDocumentoReferenciaDto {
  @ApiProperty({
    description: 'Código único del documento de referencia',
    example: 'DOC-001',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del documento',
    example: 'Manual de Seguridad de la Información',
  })
  nombre: string;

  @ApiProperty({
    description: 'Tipo de documento',
    example: 'Manual',
    required: false,
  })
  tipo?: string;

  @ApiProperty({
    description: 'IDs de las operaciones asociadas al documento',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  id_operaciones?: number[];
}

export class UpdateDocumentoReferenciaDto extends PartialType(
  CreateDocumentoReferenciaDto,
) {}
