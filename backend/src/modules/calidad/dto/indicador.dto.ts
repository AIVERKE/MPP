import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateIndicadorDto {
  @ApiProperty({
    description: 'Denominación del indicador',
    example: 'Índice de satisfacción al cliente',
  })
  denominacion: string;

  @ApiProperty({
    description: 'Descripción del indicador',
    example: 'Mide el porcentaje de clientes satisfechos con el servicio',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Fórmula de cálculo',
    example: '(Clientes Satisfechos / Total Encuestados) * 100',
    required: false,
  })
  formula?: string;

  @ApiProperty({
    description: 'Unidad de medida',
    example: 'Porcentaje (%)',
    required: false,
  })
  unidad_medida?: string;

  @ApiProperty({
    description: 'Fuente de datos para el indicador',
    example: 'Encuestas de satisfacción mensuales',
    required: false,
  })
  fuente_datos?: string;

  @ApiProperty({
    description: 'Método de verificación',
    example: 'Revisión de reportes del sistema de encuestas',
    required: false,
  })
  metodo_verificacion?: string;

  @ApiProperty({
    description: 'Meta a alcanzar',
    example: '95%',
    required: false,
  })
  meta?: string;

  @ApiProperty({
    description: 'Frecuencia de medición',
    example: 'Mensual',
    required: false,
  })
  frecuencia?: string;

  @ApiProperty({
    description: 'IDs de los procedimientos asociados',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  id_procedimientos?: number[];
}

export class UpdateIndicadorDto extends PartialType(CreateIndicadorDto) {}
