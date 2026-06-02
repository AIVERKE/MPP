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

@Entity('Indicador')
export class Indicador {
  @PrimaryGeneratedColumn()
  id_indicador: number;

  @Column()
  denominacion: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  formula: string;

  @Column({ nullable: true })
  unidad_medida: string;

  @Column({ nullable: true })
  fuente_datos: string;

  @Column({ type: 'text', nullable: true })
  metodo_verificacion: string;

  @Column({ nullable: true })
  meta: string;

  @Column({ nullable: true })
  frecuencia: string;

  @ManyToMany(() => Procedimiento)
  @JoinTable({
    name: 'procedimiento_indicador',
    joinColumn: { name: 'id_indicador', referencedColumnName: 'id_indicador' },
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
