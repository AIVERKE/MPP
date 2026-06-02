import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateTareaDto {
  @ApiProperty({
    description: 'ID de la actividad a la que pertenece',
    example: 1,
  })
  id_actividad: number;

  @ApiProperty({
    description: 'ID de la acción que se realiza',
    example: 1,
  })
  id_accion: number;

  @ApiProperty({
    description:
      'Descripción operativa o detallada de la tarea (documentación, no necesariamente el texto del nodo en el diagrama)',
    example: 'Firmar el documento de revisión',
    examples: {
      ejemplo1: { value: 'Firmar el documento de revisión' },
      ejemplo2: { value: 'Enviar notificación por correo' },
    },
  })
  descripcion: string;

  @ApiProperty({
    description:
      'Texto corto que se muestra dentro de la figura en el diagrama. La forma visual viene de accion.figura.codigo.',
    example: 'Validar datos',
    examples: {
      ejemplo1: { value: 'Validar datos' },
      ejemplo2: { value: 'Enviar correo' },
    },
  })
  texto_figura: string;

  @ApiProperty({
    description: 'Orden de la tarea dentro de la actividad',
    example: 1,
    required: false,
  })
  orden?: number;
}

export class UpdateTareaDto extends PartialType(CreateTareaDto) {}
