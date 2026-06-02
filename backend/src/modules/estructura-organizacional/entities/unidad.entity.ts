import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Cargo } from './cargo.entity';
import { Instalacion } from './instalacion.entity';

@Entity('Unidad')
export class Unidad {
  @PrimaryColumn()
  id_unidad: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  sigla: string;

  @Column({ nullable: true })
  nivel: string;

  @Column({ nullable: true })
  tipo_unidad: string;

  @ManyToMany(() => Cargo)
  @JoinTable({
    name: 'unidad_cargos',
    joinColumn: { name: 'id_unidad', referencedColumnName: 'id_unidad' },
    inverseJoinColumn: { name: 'id_cargo', referencedColumnName: 'id_cargo' },
  })
  cargos: Cargo[];

  @OneToMany(() => Instalacion, (instalacion) => instalacion.unidad)
  instalaciones: Instalacion[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
