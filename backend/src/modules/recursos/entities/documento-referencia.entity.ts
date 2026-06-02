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
import { Operacion } from '../../flujo/entities/operacion.entity';

@Entity('documento_referencia')
export class DocumentoReferencia {
  @PrimaryGeneratedColumn()
  id_documento_referencia: number;

  @Column({ nullable: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  tipo: string;

  @ManyToMany(() => Operacion)
  @JoinTable({
    name: 'operacion_documento_referencia',
    joinColumn: {
      name: 'id_documento_referencia',
      referencedColumnName: 'id_documento_referencia',
    },
    inverseJoinColumn: {
      name: 'id_operacion',
      referencedColumnName: 'id_operaciones',
    },
  })
  operaciones: Operacion[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
