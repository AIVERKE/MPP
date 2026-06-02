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
import { Procedimiento } from '../../procesos/entities/procedimiento.entity';
import { OperacionCargo } from './operacion-cargo.entity';
import { Actividad } from './actividad.entity';

@Entity('Operacion')
export class Operacion {
  @PrimaryGeneratedColumn()
  id_operaciones: number;

  @Column({ name: 'id_procedimiento' })
  id_procedimiento: number;

  @Column({ nullable: true })
  orden: number;

  @Column({ type: 'text', nullable: true })
  salida: string;

  @Column({ type: 'float', nullable: true })
  plazo: number;

  @ManyToOne(() => Procedimiento)
  @JoinColumn({ name: 'id_procedimiento' })
  procedimiento: Procedimiento;

  @OneToMany(() => OperacionCargo, (operacionCargo) => operacionCargo.operacion)
  operacionCargos: OperacionCargo[];

  @OneToMany(() => Actividad, (actividad) => actividad.operacion)
  actividades: Actividad[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
