import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Operacion } from './operacion.entity';
import { Tarea } from './tarea.entity';

@Entity('Actividad')
export class Actividad {
  @PrimaryGeneratedColumn()
  id_actividad: number;

  @Column({ name: 'id_operaciones' })
  id_operaciones: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ nullable: true })
  orden: number;

  @ManyToOne(() => Operacion)
  @JoinColumn({ name: 'id_operaciones' })
  operacion: Operacion;

  @OneToMany(() => Tarea, (tarea) => tarea.actividad)
  tareas: Tarea[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
