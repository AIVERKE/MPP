import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateFiguraDto {
  @ApiProperty({
    description: 'Nombre legible de la figura para la UI',
    example: 'Rectángulo',
    examples: {
      circulo: { value: 'Círculo' },
      rectangulo: { value: 'Rectángulo' },
      rombo: { value: 'Rombo' },
    },
  })
  nombre: string;

  @ApiProperty({
    description:
      'Código único en minúsculas sin espacios. El frontend lo usa para elegir el componente/SVG (ej. circulo, rectangulo, rombo). Debe ser único en el catálogo.',
    example: 'rectangulo',
    examples: {
      circulo: { value: 'circulo' },
      rectangulo: { value: 'rectangulo' },
      rombo: { value: 'rombo' },
    },
  })
  codigo: string;
}

export class UpdateFiguraDto extends PartialType(CreateFiguraDto) {}
