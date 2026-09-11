import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { FORMAS_SOPORTADAS } from '../figuras.constants';

export class CreateFiguraDto {
  @ApiProperty({
    description: 'Nombre legible de la figura para la UI',
    example: 'Rectángulo',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description:
      'Tipo de forma ya soportado por el frontend (clase CSS). No define CSS nuevo.',
    example: 'rectangulo',
    enum: FORMAS_SOPORTADAS,
  })
  @IsString()
  @IsIn([...FORMAS_SOPORTADAS])
  codigo: (typeof FORMAS_SOPORTADAS)[number];
}

export class UpdateFiguraDto extends PartialType(CreateFiguraDto) {}
