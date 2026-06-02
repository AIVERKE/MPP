import { ApiProperty } from '@nestjs/swagger';

class UserProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({ type: [Object] })
  roles: any[];
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  access_token: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
