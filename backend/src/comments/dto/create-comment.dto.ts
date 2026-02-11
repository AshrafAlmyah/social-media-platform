import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(300)
  content: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}





