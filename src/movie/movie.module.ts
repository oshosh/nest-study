import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CommonModule } from 'src/common/common.module';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        // 지금 루트 디렉토리
        destination: join(process.cwd(), 'public', 'movie'),
        // filename: (req, file, callback) => {
        //   const split = file.originalname.split('.');
        //   let extension = 'mp4';
        //   if (split.length > 1) {
        //     extension = split[split.length - 1];
        //   }

        //   callback(null, `${v4()}_${Date.now()}.${extension}`);
        // },
      }),
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
