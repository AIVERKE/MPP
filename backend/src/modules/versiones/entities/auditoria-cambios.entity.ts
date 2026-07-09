import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../seguridad/entities/usuario.entity';

@Entity('Auditoria_Cambios')
export class AuditoriaCambios {
  @PrimaryGeneratedColumn()
  id_auditoria: number;

  @Column({ name: 'tabla_afectada' })
  tablaAfectada: string;

  @Column({ name: 'id_registro_original' })
  idRegistroOriginal: number;

  @Column()
  accion: string;

  @Column({ name: 'datos_anteriores', type: 'json' })
  datosAnteriores: any;

  @Column({ name: 'datos_nuevos', type: 'json', nullable: true })
  datosNuevos: any;

  @Column({ name: 'id_usuario', nullable: true })
  idUsuario: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'fecha_cambio', type: 'timestamp' })
  fechaCambio: Date;

  @Column({ name: 'motivo_cambio', type: 'text', nullable: true })
  motivoCambio: string;
}
