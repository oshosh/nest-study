import { BadRequestException, Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { PagePaginationDto } from './dto/page-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;

    const skip = (page - 1) * take;
    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { cursor, take } = dto;
    let { order } = dto;

    if (cursor) {
      const decodedCursor = JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf-8'),
      ) as string;

      const cursorObj = JSON.parse(decodedCursor) as {
        values: Record<string, string>;
        order: string[];
      };
      order = cursorObj.order;
      const { values } = cursorObj;

      // (column1, column2) > (values1, values2, )
      const columns = Object.keys(values);
      const comparisonOperator = order.some((order) => order.endsWith('DESC'))
        ? '<'
        : '>';

      // (movie.column1, movie.column2) > (values1, values2, )
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');
      // (movie.column1, movie.column2) > (:values1, :values2, )
      const whereParams = columns.map((c) => `:${c}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    for (let i = 0; i < order.length; i++) {
      // ["likeCount_DESC", "id_DESC"]
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException('Order는 ASC 또는 DESC로 작성해주세요!');
      }

      // 일반적인 orderBy
      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();

    const nextCursor = this.generateNextCursor(results, order);

    return {
      qb,
      nextCursor,
    };
  }

  generateNextCursor<T>(result: T[], order: string[] | null) {
    if (result.length === 0) {
      return null;
    }

    /**
     * {
     *   values: {
     *     id: 27,
     *   },
     *   order: [
     *     'id_DESC',
     *   ],
     * }
     */
    const lastItem = result[result.length - 1];
    const values: Record<string, string> = {};

    if (order) {
      order.forEach((columnOrder) => {
        const [column] = columnOrder.split('_');
        values[column] = lastItem[column] as string;
      });

      const cursorObj = {
        values,
        order,
      };
      const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
        'base64',
      );

      return nextCursor;
    }
  }
}
