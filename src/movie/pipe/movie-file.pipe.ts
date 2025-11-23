import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { rename } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSize: number;
      mimeType: string;
    },
  ) {}

  async transform(value: Express.Multer.File): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie 필드는 필수 입니다.');
    }

    const byteSize = this.options.maxSize * 10000000;

    if (value.size > byteSize) {
      throw new BadRequestException(
        `movie 필드는 ${this.options.maxSize}MB 이하로 업로드 해주세요.`,
      );
    }

    if (value.mimetype !== this.options.mimeType) {
      throw new BadRequestException(
        `movie 필드는 ${this.options.mimeType} 파일만 업로드 해주세요.`,
      );
    }

    const split = value.originalname.split('.');
    let extension = 'mp4';
    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    const filename = `${uuidv4()}_${Date.now()}.${extension}`;
    const newPath = join(value.destination, filename);
    await rename(value.path, newPath);

    return {
      ...value,
      filename,
      path: newPath,
    };
  }
}
