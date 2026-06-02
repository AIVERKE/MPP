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

@Entity('Normativa')
export class Normativa {
  @PrimaryGeneratedColumn()
  id_normativa: number;

  @Column({ nullable: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'date', nullable: true })
  fecha_emision: Date;

  @ManyToMany(() => Procedimiento)
  @JoinTable({
    name: 'normativa_procedimiento',
    joinColumn: { name: 'id_normativa', referencedColumnName: 'id_normativa' },
    inverseJoinColumn: {
      name: 'id_procedimiento',
      referencedColumnName: 'id_procedimiento',
    },
  })
  procedimientos: Procedimiento[];

  @CreateDateColumn({ type: 'timestamp' })
  creado_en: Date;

  @Column({ nullable: true })
  creado_por: number;

  @UpdateDateColumn({ type: 'timestamp' })
  modificado_en: Date;

  @Column({ nullable: true })
  modificado_por: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  eliminado_en: Date;
}
