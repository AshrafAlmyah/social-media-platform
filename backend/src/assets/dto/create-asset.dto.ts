import { IsString, MinLength } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  relativePath: string;
}
