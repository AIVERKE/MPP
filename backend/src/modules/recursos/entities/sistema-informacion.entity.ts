import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Procedimiento } from '../../procesos/entities/procedimiento.entity';

@Entity('sistema_informacion')
export class SistemaInformacion {
  @PrimaryGeneratedColumn()
  id_sistema_informacion: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  version: string;

  @ManyToMany(() => Procedimiento)
  @JoinTable({
    name: 'procedimiento_sistema_informacion',
    joinColumn: {
      name: 'id_sistema_informacion',
      referencedColumnName: 'id_sistema_informacion',
    },
    inverseJoinColumn: {
      name: 'id_procedimiento',
      referencedColumnName: 'id_procedimiento',
    },
  })
  procedimientos: Procedimiento[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
