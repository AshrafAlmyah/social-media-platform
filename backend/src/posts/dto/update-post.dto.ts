import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @IsString()
  image?: string;
}













