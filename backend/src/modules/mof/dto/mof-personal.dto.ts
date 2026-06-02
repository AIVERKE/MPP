import { ApiProperty } from '@nestjs/swagger';

export class MofPersonalDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador único oficial del cargo en el MOF',
  })
  id: number;

  @ApiProperty({
    example: 'JEFE DE UNIDAD',
    description: 'Nombre o descripción del cargo',
  })
  descripcion: string;

  @ApiProperty({
    required: false,
    example: 'Responsable de la unidad administrativa',
    description: 'Detalle adicional del cargo si está disponible',
  })
  detalle?: string;
}
