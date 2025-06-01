// import { Exclude, Expose } from 'class-transformer';
// import { Transform } from 'class-transformer';

// @Exclude() // 이 속성은 응답에 포함되지 않음
// export class Movie {
//   @Expose() // 이 속성은 응답에 포함됨
//   id: number;
//   @Expose() // 이 속성은 응답에 포함됨
//   title: string;
//   genre: string;

//   get description() {
//     return `This is ${this.title} movie`;
//   }
// }

export class Movie {
  id: number;
  title: string;
  // @Transform((params) => params.obj.genre.toUpperCase())
  genre: string;
}
