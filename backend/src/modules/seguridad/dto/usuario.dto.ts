import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'jperez', description: 'Nombre de usuario único' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'jperez@umsa.bo',
    description: 'Correo electrónico único',
  })
  @IsEmail()
  correo: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: [1],
    description: 'IDs de roles a asignar',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  roles: number[];

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo del usuario',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}

export class UpdateUsuarioRolesDto {
  @ApiProperty({
    example: [1, 2],
    description: 'IDs de roles (reemplaza la relación completa)',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  roles: number[];
}

export class UpdateUsuarioEstadoDto {
  @ApiProperty({
    example: true,
    description: 'true = activo, false = inactivo',
  })
  @IsBoolean()
  activo: boolean;
}
