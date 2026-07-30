import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas globales del sistema para el Dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del sistema obtenidas exitosamente.',
    type: DashboardStatsDto,
  })
  getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }
}
