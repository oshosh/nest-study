import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from 'src/director/entity/director.entity';
import { In, Like, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Genre } from 'src/genre/entity/genre.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async findAll(title?: string) {
    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return qb.getManyAndCount();

    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }

    // return this.movieRepository.findAndCount({
    //   where: { title: Like(`%${title}%`) },
    //   relations: ['director', 'genres'],
    // });
  }

  async findOne(id: number) {
    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .where('movie.id = :id', { id });

    if (!qb.getOne()) {
      throw new NotFoundException('Movie not found');
    }

    return qb.getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    // if (!movie) {
    //   throw new NotFoundException('Movie not found');
    // }

    // return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: { id: createMovieDto.directorId },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    }

    const genres = await this.genreRepository.find({
      where: { id: In(createMovieDto.genreIds) },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres
          .map((item) => item.id)
          .join(', ')}`,
      );
    }

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genres,
      detail: {
        detail: createMovieDto.detail, // cascade 옵션으로 인해 자동으로 저장됨 없으면 id 생성 안됨
      },
      director,
    });
    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    let newDirector: Director | undefined;
    let newGenres: Genre[] | undefined;

    if (genreIds) {
      const genres = await this.genreRepository.find({
        where: { id: In(genreIds) },
      });

      if (genres.length !== genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres
            .map((item) => item.id)
            .join(', ')}`,
        );
      }
      newGenres = genres;
    }

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: { id: directorId },
      });
      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
      }

      newDirector = director;
    }

    const movieUpdateFields = {
      ...movieRest, // title, genre
      ...(newDirector && { director: newDirector }),
    };

    // genreIds 혹은 directorId 가 존재한다면?
    await this.movieRepository.update(
      {
        id,
      },
      movieUpdateFields,
    );

    // detail 이 존재한다면?
    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director'],
    });

    // typeorm 에서 many to many 관계를 업데이트 할 때는 해당하는 객체를 직접 save 해야함
    if (newGenres && newMovie) {
      newMovie.genres = newGenres;
      await this.movieRepository.save(newMovie);
    }

    return this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
