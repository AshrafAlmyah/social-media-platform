import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsNumber, Max } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['text', 'post', 'image', 'video', 'audio'])
  @IsOptional()
  type?: 'text' | 'post' | 'image' | 'video' | 'audio';

  @IsUUID()
  @IsOptional()
  postId?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsNumber()
  @IsOptional()
  @Max(15 * 1024 * 1024, { message: 'File size must not exceed 15MB' })
  fileSize?: number;
}


