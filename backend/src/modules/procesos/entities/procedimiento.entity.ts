import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Proceso } from './proceso.entity';
import { Unidad } from '../../estructura-organizacional/entities/unidad.entity';
import { Usuario } from '../../seguridad/entities/usuario.entity';

@Entity('Procedimiento')
export class Procedimiento {
  @PrimaryGeneratedColumn()
  id_procedimiento: number;

  @Column({ name: 'id_proceso' })
  id_proceso: number;

  @Column({ unique: true, nullable: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  objetivos: string;

  @Column({ type: 'text', nullable: true })
  alcance: string;

  @Column({ nullable: true })
  periodicidad: string;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  estado: string;

  @Column({ name: 'estado_version', type: 'varchar', default: 'Borrador' })
  estado_version: 'Borrador' | 'En revisión' | 'Aprobado' | 'Renovado';

  @Column({ name: 'id_elaborador', nullable: true })
  id_elaborador: number | null;

  @ManyToOne(() => Proceso)
  @JoinColumn({ name: 'id_proceso' })
  proceso: Proceso;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_elaborador' })
  elaborador: Usuario | null;

  @ManyToMany(() => Unidad)
  @JoinTable({
    name: 'procedimiento_instalacion',
    joinColumn: {
      name: 'id_procedimiento',
      referencedColumnName: 'id_procedimiento',
    },
    inverseJoinColumn: { name: 'id_unidad', referencedColumnName: 'id_unidad' },
  })
  instalaciones: Unidad[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
