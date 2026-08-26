import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
import { Unidad } from '../../estructura-organizacional/entities/unidad.entity';

@Entity('usuario_rol_unidad')
@Unique(['id_usuario', 'id_rol', 'id_unidad'])
export class UsuarioRolUnidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'id_rol' })
  id_rol: number;

  @Column({ name: 'id_unidad' })
  id_unidad: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.alcances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @ManyToOne(() => Unidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_unidad' })
  unidad: Unidad;
}
