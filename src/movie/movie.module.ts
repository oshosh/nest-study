import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Director } from 'src/director/entity/director.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { Genre } from 'src/genre/entity/genre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
