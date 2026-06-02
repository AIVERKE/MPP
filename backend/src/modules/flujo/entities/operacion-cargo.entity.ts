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
import { Operacion } from './operacion.entity';
import { Cargo } from '../../estructura-organizacional/entities/cargo.entity';

@Entity('operacion_cargo')
export class OperacionCargo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_operacion' })
  id_operacion: number;

  @Column({ name: 'id_cargo' })
  id_cargo: number;

  @Column({ nullable: true })
  tipo_participacion: string;

  @ManyToOne(() => Operacion)
  @JoinColumn({ name: 'id_operacion' })
  operacion: Operacion;

  @ManyToOne(() => Cargo)
  @JoinColumn({ name: 'id_cargo' })
  cargo: Cargo;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
