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
import { Proceso } from './proceso.entity';
import { Cargo } from '../../estructura-organizacional/entities/cargo.entity';
import { Unidad } from '../../estructura-organizacional/entities/unidad.entity';

@Entity('cargo_proceso')
export class CargoProceso {
  @PrimaryGeneratedColumn()
  id: number; // Aunque sea PK compuesta en DB, TypeORM prefiere una PK o manejarlo con PrimaryColumn

  @Column({ name: 'id_cargo' })
  id_cargo: number;

  @Column({ name: 'id_proceso' })
  id_proceso: number;

  @Column({ name: 'id_unidad', nullable: true })
  id_unidad?: number;

  @Column({ default: false })
  es_responsable_principal: boolean;

  @ManyToOne(() => Cargo)
  @JoinColumn({ name: 'id_cargo' })
  cargo: Cargo;

  @ManyToOne(() => Proceso)
  @JoinColumn({ name: 'id_proceso' })
  proceso: Proceso;

  @ManyToOne(() => Unidad, { nullable: true })
  @JoinColumn({ name: 'id_unidad' })
  unidad?: Unidad;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
