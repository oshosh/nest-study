import { BaseTable } from 'src/common/entity/base-table.entity';
import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    // @Exclude 데코레이터를 사용하여 비밀번호를 제외하고 응답할 때는 toPlainOnly를 사용하고, 요청 시는 toClassOnly를 사용한다.
    // toClassOnly: true, // 요청 시 비밀번호 제외
    toPlainOnly: true, // 응답 시 비밀번호 제외
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;
}
