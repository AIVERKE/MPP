import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Rol } from './rol.entity';

@Entity('Usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  correo: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  creado_en: Date;

  @ManyToMany(() => Rol)
  @JoinTable({
    name: 'usuario_rol',
    joinColumn: { name: 'id_usuario', referencedColumnName: 'id_usuario' },
    inverseJoinColumn: { name: 'id_rol', referencedColumnName: 'id_rol' },
  })
  roles: Rol[];
}
