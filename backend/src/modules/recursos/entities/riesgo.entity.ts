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
import { Operacion } from '../../flujo/entities/operacion.entity';

@Entity('Riesgo')
export class Riesgo {
  @PrimaryGeneratedColumn()
  id_riesgo: number;

  @Column({ name: 'id_operacion' })
  id_operacion: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  nivel: string;

  @ManyToOne(() => Operacion)
  @JoinColumn({ name: 'id_operacion' })
  operacion: Operacion;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
