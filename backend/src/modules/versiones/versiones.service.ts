import { Injectable } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';

@Injectable()
export class VersionesService {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  calcularNuevaVersion(versionActual: string | null | undefined): string {
    if (!versionActual || versionActual.trim() === '') {
      return '1.0';
    }
    const parts = versionActual.split('.');
    if (parts.length === 0) return '1.0';
    if (parts.length === 1) {
      const major = parseInt(parts[0], 10);
      return isNaN(major) ? '1.0' : `${major}.1`;
    }
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    if (isNaN(major) || isNaN(minor)) return '1.0';
    return `${major}.${minor + 1}`;
  }

  async registrarVersionamiento(
    procedimientoId: number,
    versionAnterior: string,
    versionNueva: string,
    idUsuario?: number,
  ): Promise<void> {
    await this.auditoriaService.registrarCambio(
      'Procedimiento',
      procedimientoId,
      'VERSION',
      { version: versionAnterior },
      { version: versionNueva },
      idUsuario,
    );
  }
}
