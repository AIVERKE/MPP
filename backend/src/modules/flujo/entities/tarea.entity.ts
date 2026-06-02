import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Actividad } from './actividad.entity';
import { Accion } from './accion.entity';

@Entity('Tarea')
export class Tarea {
  @PrimaryGeneratedColumn()
  id_tarea: number;

  @Column({ name: 'id_actividad' })
  id_actividad: number;

  @Column({ name: 'id_accion' })
  id_accion: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'texto_figura' })
  texto_figura: string;

  @Column({ nullable: true })
  orden: number;

  @ManyToOne(() => Actividad)
  @JoinColumn({ name: 'id_actividad' })
  actividad: Actividad;

  @ManyToOne(() => Accion)
  @JoinColumn({ name: 'id_accion' })
  accion: Accion;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
