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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AlcanceUnidadDto {
  @ApiProperty({ example: 2, description: 'ID del rol con alcance por unidad' })
  @IsInt()
  @Type(() => Number)
  id_rol: number;

  @ApiProperty({ example: 1, description: 'ID de la unidad autorizada' })
  @IsInt()
  @Type(() => Number)
  id_unidad: number;
}

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
    type: [AlcanceUnidadDto],
    description:
      'Alcances usuario–rol–unidad (Consultor, Elaborador, Validador Técnico)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlcanceUnidadDto)
  alcances?: AlcanceUnidadDto[];

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

export class UpdateUsuarioAlcancesDto {
  @ApiProperty({
    type: [AlcanceUnidadDto],
    description: 'Reemplaza los alcances usuario–rol–unidad del usuario',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlcanceUnidadDto)
  alcances: AlcanceUnidadDto[];
}

export class UpdateUsuarioEstadoDto {
  @ApiProperty({
    example: true,
    description: 'true = activo, false = inactivo',
  })
  @IsBoolean()
  activo: boolean;
}
