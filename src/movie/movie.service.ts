import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

export interface Movie {
  id: number;
  title: string;
  genre: string;
}

@Injectable()
export class MovieService {
  private movies: Movie[] = [
    {
      id: 1,
      title: 'Harry Porter',
      genre: 'Fantasy',
    },
    {
      id: 2,
      title: '반지의 제왕',
      genre: 'Action',
    },
  ];
  private idCount = 3;
  getManyMovies(title?: string) {
    if (!title) {
      return this.movies;
    }
    return this.movies.filter((movie) => movie.title === title);
  }

  getMovieById(id: number) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto) {
    const movie: Movie = {
      id: this.idCount++,
      ...createMovieDto,
    };
    this.movies.push(movie);

    return movie;
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find((movie) => movie.id === +id);

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    Object.assign(movie, updateMovieDto);

    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === +id);

    if (movieIndex === -1) {
      throw new NotFoundException('Movie not found');
    }

    this.movies.splice(movieIndex, 1);

    return id;
  }
}
