import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateSistemaInformacionDto {
  @ApiProperty({
    description: 'Nombre del sistema de información',
    example: 'SAP ERP',
  })
  nombre: string;

  @ApiProperty({
    description: 'Versión del sistema de información',
    example: '6.0',
    required: false,
  })
  version?: string;

  @ApiProperty({
    description: 'IDs de los procedimientos asociados al sistema',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  id_procedimientos?: number[];
}

export class UpdateSistemaInformacionDto extends PartialType(
  CreateSistemaInformacionDto,
) {}
