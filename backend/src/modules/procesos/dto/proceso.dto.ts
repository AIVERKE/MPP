import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { TIPOS_PROCESO } from '../../seguridad/roles.constants';

export class CreateProcesoDto {
  @ApiProperty({
    description: 'Código único del proceso',
    example: 'PROC-001',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del proceso',
    example: 'Gestión de Talento Humano',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del proceso',
    required: false,
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Categoría / tipo del proceso',
    enum: TIPOS_PROCESO,
    example: 'Sustantivo',
  })
  @IsOptional()
  @IsString()
  @IsIn([...TIPOS_PROCESO])
  tipo_proceso?: (typeof TIPOS_PROCESO)[number];

  @ApiProperty({
    description: 'IDs de las unidades asociadas al proceso',
    type: [Number],
    example: [1, 2],
    required: false,
  })
  id_unidades?: number[];
}

export class UpdateProcesoDto extends PartialType(CreateProcesoDto) {}
