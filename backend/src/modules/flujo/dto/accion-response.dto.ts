import { ApiProperty } from '@nestjs/swagger';
import { FiguraResponseDto } from './figura-response.dto';

export class AccionResponseDto {
  @ApiProperty({
    description: 'Identificador único de la acción',
    example: 3,
  })
  id_accion: number;

  @ApiProperty({
    description: 'Nombre de la acción (puede cambiar sin afectar la figura del diagrama)',
    example: 'Verificar',
  })
  nombre_accion: string;

  @ApiProperty({
    description: 'ID de la figura asociada',
    example: 2,
  })
  id_figura: number;

  @ApiProperty({
    description: 'Figura del diagrama asociada a esta acción',
    type: FiguraResponseDto,
  })
  figura: FiguraResponseDto;

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
