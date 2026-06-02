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
import { Unidad } from './unidad.entity';

@Entity('Instalacion')
export class Instalacion {
  @PrimaryGeneratedColumn()
  id_instalacion: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'id_unidad' })
  id_unidad: number;

  @ManyToOne(() => Unidad)
  @JoinColumn({ name: 'id_unidad' })
  unidad: Unidad;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
