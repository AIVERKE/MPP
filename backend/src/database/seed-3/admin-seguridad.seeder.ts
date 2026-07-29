import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/seguridad/entities/usuario.entity';
import { Rol } from '../../modules/seguridad/entities/rol.entity';

/**
 * Seed enfocado en Seguridad: rol Administrador + usuario admin.
 * Idempotente: no trunca tablas; crea o actualiza si ya existen.
 *
 * Credenciales:
 *   username: admin
 *   password: Admin123!
 *   correo:   admin@mpp.com
 *   rol:      Administrador
 */
export default class AdminSeguridadSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const rolRepo = dataSource.getRepository(Rol);
    const userRepo = dataSource.getRepository(Usuario);

    const rolesCatalog = [
      {
        nombre: 'Administrador',
        descripcion: 'Acceso total al sistema (gestión de usuarios y seguridad)',
      },
      {
        nombre: 'Analista de Procesos',
        descripcion: 'Gestión de flujos y procedimientos',
      },
      {
        nombre: 'Auditor',
        descripcion: 'Consulta y verificación de calidad',
      },
      {
        nombre: 'Operador',
        descripcion: 'Ejecución de tareas',
      },
      {
        nombre: 'Consulta',
        descripcion: 'Acceso de solo lectura',
      },
    ];

    const roles: Rol[] = [];
    for (const item of rolesCatalog) {
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

    const adminRole = roles.find((r) => r.nombre === 'Administrador');
    if (!adminRole) {
      throw new Error('No se pudo resolver el rol Administrador');
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
      admin.roles = [adminRole];
      admin = await userRepo.save(admin);
      console.log(`  ~ Usuario admin actualizado (id=${admin.id_usuario})`);
    } else {
      const existingCorreo = await userRepo.findOne({
        where: { correo: 'admin@mpp.com' },
      });
      if (existingCorreo) {
        existingCorreo.username = 'admin';
        existingCorreo.password = passwordHash;
        existingCorreo.activo = true;
        existingCorreo.roles = [adminRole];
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
            roles: [adminRole],
          }),
        );
        console.log(`  + Usuario admin creado (id=${admin.id_usuario})`);
      }
    }

    console.log('');
    console.log('========================================');
    console.log('  Usuario Administrador listo');
    console.log('  username: admin');
    console.log('  password: Admin123!');
    console.log('  correo:   admin@mpp.com');
    console.log('  rol:      Administrador');
    console.log('========================================');
  }
}
