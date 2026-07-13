import { ApiProperty } from '@nestjs/swagger';
import { AuditoriaCambiosResponseDto } from './auditoria-cambios-response.dto';

export class PaginatedAuditoriaResponseDto {
  @ApiProperty({
    type: [AuditoriaCambiosResponseDto],
    description: 'Registros de auditoría obtenidos',
  })
  data: AuditoriaCambiosResponseDto[];

  @ApiProperty({
    description: 'Total de registros que coinciden con los filtros',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Límite de registros por página',
    example: 20,
  })
  limit: number;
}
