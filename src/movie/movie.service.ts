import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, Series } from './entity/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Series)
    private readonly seriesRepository: Repository<Series>,
  ) {}

  async getManyMovies(title?: string) {
    if (!title) {
      return [
        await this.movieRepository.find(),
        await this.movieRepository.count(),
      ];
    }

    return this.movieRepository.findAndCount({
      where: { title: Like(`%${title}%`) },
    });
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    // const movie = await this.movieRepository.save(createMovieDto);
    const movie = await this.movieRepository.save({
      ...createMovieDto,
      runtime: 100,
    });
    return movie;
  }

  async createSeries(createSeriesDto: CreateMovieDto) {
    const series = await this.seriesRepository.save({
      ...createSeriesDto,
      seriesCount: 16,
    });
    return series;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    await this.movieRepository.update(
      {
        id,
      },
      updateMovieDto,
    );

    const newMovie = await this.movieRepository.findOne({ where: { id } });

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    await this.movieRepository.delete(id);

    return id;
  }
}
