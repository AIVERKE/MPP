import { ApiProperty } from '@nestjs/swagger';

export class FiguraResponseDto {
  @ApiProperty({
    description: 'Identificador único de la figura',
    example: 2,
  })
  id_figura: number;

  @ApiProperty({
    description: 'Nombre legible para mostrar en la UI',
    example: 'Rectángulo',
  })
  nombre: string;

  @ApiProperty({
    description:
      'Tipo de forma CSS usado por el frontend (circulo, rectangulo, rombo, elipse, paralelogramo, triangulo, hexagono)',
    example: 'rectangulo',
  })
  codigo: string;

  @ApiProperty({
    description: 'true si pertenece al catálogo oficial (no eliminable)',
    example: true,
  })
  es_oficial: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2026-05-24T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-05-24T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Fecha de borrado lógico (null si está activa)',
    example: null,
    nullable: true,
  })
  deletedAt: Date | null;
}
