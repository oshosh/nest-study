import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

// inheritance
export class BaseTable {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
