import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Unidad } from '../../estructura-organizacional/entities/unidad.entity';
import { CargoProceso } from './cargo-proceso.entity';

@Entity('Proceso')
export class Proceso {
  @PrimaryGeneratedColumn()
  id_proceso: number;

  @Column({ unique: true, nullable: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToMany(() => Unidad)
  @JoinTable({
    name: 'proceso_unidad',
    joinColumn: { name: 'id_proceso', referencedColumnName: 'id_proceso' },
    inverseJoinColumn: { name: 'id_unidad', referencedColumnName: 'id_unidad' },
  })
  unidades: Unidad[];

  @OneToMany(() => CargoProceso, (cargoProceso) => cargoProceso.proceso)
  cargoProcesos: CargoProceso[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
