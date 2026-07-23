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
import { Tarea } from './tarea.entity';

@Entity('CondicionTarea')
export class CondicionTarea {
  @PrimaryGeneratedColumn()
  id_condicion: number;

  @Column({ name: 'id_tarea' })
  id_tarea: number;

  @Column({ name: 'tipo_condicion', type: 'varchar' })
  tipo_condicion: 'if' | 'else' | 'fin_si';

  @Column({ name: 'expresion_condicion', type: 'text' })
  expresion_condicion: string;

  @Column({ name: 'id_tarea_siguiente_if', nullable: true })
  id_tarea_siguiente_if: number | null;

  @Column({ name: 'id_tarea_siguiente_else', nullable: true })
  id_tarea_siguiente_else: number | null;

  @Column({ nullable: true })
  orden: number;

  @ManyToOne(() => Tarea)
  @JoinColumn({ name: 'id_tarea' })
  tarea: Tarea;

  @ManyToOne(() => Tarea)
  @JoinColumn({ name: 'id_tarea_siguiente_if' })
  tareaSiguienteIf: Tarea | null;

  @ManyToOne(() => Tarea)
  @JoinColumn({ name: 'id_tarea_siguiente_else' })
  tareaSiguienteElse: Tarea | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
