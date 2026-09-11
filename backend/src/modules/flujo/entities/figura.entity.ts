import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('Figura')
export class Figura {
  @PrimaryGeneratedColumn()
  id_figura: number;

  @Column()
  nombre: string;

  /** Tipo de forma CSS soportado (puede repetirse en figuras adicionales). */
  @Column()
  codigo: string;

  @Column({ name: 'es_oficial', default: false })
  es_oficial: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
