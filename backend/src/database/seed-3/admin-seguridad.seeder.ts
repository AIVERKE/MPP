import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/seguridad/entities/usuario.entity';
import { Rol } from '../../modules/seguridad/entities/rol.entity';
import {
  ROLES_MPP,
  ROLES_MPP_CATALOG,
  ROL_ADMIN_LEGACY,
} from '../../modules/seguridad/roles.constants';

/**
 * Seed enfocado en Seguridad: catálogo de 5 roles MPP + usuario admin.
 * Idempotente: no trunca tablas; crea o actualiza si ya existen.
 *
 * Credenciales:
 *   username: admin
 *   password: Admin123!
 *   correo:   admin@mpp.com
 *   rol:      Super admin
 */
export default class AdminSeguridadSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const rolRepo = dataSource.getRepository(Rol);
    const userRepo = dataSource.getRepository(Usuario);

    const roles: Rol[] = [];
    for (const item of ROLES_MPP_CATALOG) {
      let rol = await rolRepo.findOne({ where: { nombre: item.nombre } });
      if (!rol) {
        rol = await rolRepo.save(rolRepo.create(item));
        console.log(`  + Rol creado: ${rol.nombre}`);
      } else {
        rol.descripcion = item.descripcion;
        rol = await rolRepo.save(rol);
        console.log(`  ~ Rol existente: ${rol.nombre}`);
      }
      roles.push(rol);
    }

    const superAdminRole = roles.find(
      (r) => r.nombre === ROLES_MPP.SUPER_ADMIN,
    );
    if (!superAdminRole) {
      throw new Error('No se pudo resolver el rol Super admin');
    }

    // Migración suave: usuarios con rol legacy Administrador → Super admin
    const legacyAdmin = await rolRepo.findOne({
      where: { nombre: ROL_ADMIN_LEGACY },
    });
    if (legacyAdmin) {
      const usuariosLegacy = await userRepo.find({
        where: { roles: { id_rol: legacyAdmin.id_rol } },
        relations: ['roles'],
      });
      for (const u of usuariosLegacy) {
        const sinLegacy = (u.roles || []).filter(
          (r) => r.nombre !== ROL_ADMIN_LEGACY,
        );
        const yaTieneSuper = sinLegacy.some(
          (r) => r.nombre === ROLES_MPP.SUPER_ADMIN,
        );
        u.roles = yaTieneSuper
          ? sinLegacy
          : [...sinLegacy, superAdminRole];
        await userRepo.save(u);
        console.log(
          `  ~ Migrado ${u.username}: ${ROL_ADMIN_LEGACY} → ${ROLES_MPP.SUPER_ADMIN}`,
        );
      }
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);

    let admin = await userRepo.findOne({
      where: { username: 'admin' },
      relations: ['roles'],
      withDeleted: true,
    });

    if (admin) {
      if (admin.deletedAt) {
        admin.deletedAt = null;
      }
      admin.password = passwordHash;
      admin.correo = 'admin@mpp.com';
      admin.activo = true;
      admin.roles = [superAdminRole];
      admin = await userRepo.save(admin);
      console.log(`  ~ Usuario admin actualizado (id=${admin.id_usuario})`);
    } else {
      const existingCorreo = await userRepo.findOne({
        where: { correo: 'admin@mpp.com' },
        relations: ['roles'],
      });
      if (existingCorreo) {
        existingCorreo.username = 'admin';
        existingCorreo.password = passwordHash;
        existingCorreo.activo = true;
        existingCorreo.roles = [superAdminRole];
        admin = await userRepo.save(existingCorreo);
        console.log(
          `  ~ Usuario existente actualizado a admin (id=${admin.id_usuario})`,
        );
      } else {
        admin = await userRepo.save(
          userRepo.create({
            username: 'admin',
            password: passwordHash,
            correo: 'admin@mpp.com',
            activo: true,
            roles: [superAdminRole],
          }),
        );
        console.log(`  + Usuario admin creado (id=${admin.id_usuario})`);
      }
    }

    // Asegurar catálogo: roles legacy ya no se re-siembran
    console.log('');
    console.log('========================================');
    console.log('  Usuario Super admin listo');
    console.log('  username: admin');
    console.log('  password: Admin123!');
    console.log('  correo:   admin@mpp.com');
    console.log('  rol:      Super admin');
    console.log('========================================');
  }
}
