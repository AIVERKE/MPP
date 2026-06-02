import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user1', description: 'El nombre de usuario' })
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'La contraseña del usuario',
  })
  password: string;
}
