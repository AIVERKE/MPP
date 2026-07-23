import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateCondicionTareaDto {
  @ApiProperty({
    description: 'ID de la tarea (nodo de decisión) a la que pertenece la condición',
    example: 1,
  })
  id_tarea!: number;

  @ApiProperty({
    description: 'Tipo de condición lógica',
    example: 'if',
    enum: ['if', 'else', 'fin_si'],
  })
  tipo_condicion!: 'if' | 'else' | 'fin_si';

  @ApiProperty({
    description: 'Expresión o descripción de la condición a evaluar',
    example: '¿Documento aprobado?',
  })
  expresion_condicion!: string;

  @ApiProperty({
    description: 'ID de la tarea siguiente cuando la condición es verdadera (IF)',
    example: 2,
    required: false,
    nullable: true,
  })
  id_tarea_siguiente_if?: number | null;

  @ApiProperty({
    description: 'ID de la tarea siguiente cuando la condición es falsa (ELSE)',
    example: 3,
    required: false,
    nullable: true,
  })
  id_tarea_siguiente_else?: number | null;

  @ApiProperty({
    description: 'Orden de la condición dentro de la tarea',
    example: 1,
    required: false,
  })
  orden?: number;
}

export class UpdateCondicionTareaDto extends PartialType(
  CreateCondicionTareaDto,
) {}
