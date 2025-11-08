import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsInt()
  // id_52, likeCount_20
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  // id_ASC id_DESC
  // [id_DESC, likeCount_DESC]
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  take: number = 5;
}
