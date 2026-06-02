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
import { Figura } from './figura.entity';

@Entity('Accion')
export class Accion {
  @PrimaryGeneratedColumn()
  id_accion: number;

  @Column()
  nombre_accion: string;

  @Column({ name: 'id_figura' })
  id_figura: number;

  @ManyToOne(() => Figura)
  @JoinColumn({ name: 'id_figura' })
  figura: Figura;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
