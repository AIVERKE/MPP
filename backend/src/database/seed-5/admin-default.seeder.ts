import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/seguridad/entities/usuario.entity';
import { Rol } from '../../modules/seguridad/entities/rol.entity';
import {
  ROLES_MPP,
  ROLES_MPP_CATALOG,
} from '../../modules/seguridad/roles.constants';

/** El login busca por username, por eso el correo se usa también como username. */
const ADMIN_CORREO = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * Usuario Super admin por defecto. Idempotente: crea el usuario o, si ya
 * existe, restablece su contraseña, lo reactiva y le asigna Super admin.
 *
 * Credenciales:
 *   username: admin@admin.com
 *   password: admin123
 */
export default class AdminDefaultSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const rolRepo = dataSource.getRepository(Rol);
    const userRepo = dataSource.getRepository(Usuario);

    const superAdmin =
      (await rolRepo.findOne({ where: { nombre: ROLES_MPP.SUPER_ADMIN } })) ??
      (await rolRepo.save(
        rolRepo.create(
          ROLES_MPP_CATALOG.find((r) => r.nombre === ROLES_MPP.SUPER_ADMIN)!,
        ),
      ));

    const existente = await userRepo.findOne({
      where: [{ username: ADMIN_CORREO }, { correo: ADMIN_CORREO }],
      relations: ['roles'],
      withDeleted: true,
    });

    const admin = existente ?? userRepo.create();
    admin.username = ADMIN_CORREO;
    admin.correo = ADMIN_CORREO;
    admin.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin.activo = true;
    admin.deletedAt = null;
    admin.roles = [
      ...(admin.roles ?? []).filter((r) => r.id_rol !== superAdmin.id_rol),
      superAdmin,
    ];
    await userRepo.save(admin);

    console.log(
      `  ${existente ? '~ Usuario actualizado' : '+ Usuario creado'}: ${admin.username} (id=${admin.id_usuario})`,
    );
    console.log(`  username: ${ADMIN_CORREO}`);
    console.log(`  password: ${ADMIN_PASSWORD}`);
    console.log(`  rol:      ${ROLES_MPP.SUPER_ADMIN}`);
  }
}
