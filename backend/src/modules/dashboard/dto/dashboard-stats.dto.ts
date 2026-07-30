import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total de procesos registrados', example: 10 })
  totalProcesos: number;

  @ApiProperty({ description: 'Total de procedimientos registrados', example: 25 })
  totalProcedimientos: number;

  @ApiProperty({ description: 'Total de usuarios activos', example: 5 })
  totalUsuarios: number;

  @ApiProperty({ description: 'Total de unidades del MOF', example: 12 })
  totalUnidades: number;
}
