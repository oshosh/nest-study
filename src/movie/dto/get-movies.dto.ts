import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { IsString, IsOptional } from 'class-validator';

export class GetMoviesDto extends PagePaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
