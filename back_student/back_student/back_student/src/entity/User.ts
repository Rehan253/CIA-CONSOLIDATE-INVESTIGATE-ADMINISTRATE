import  {compareSync, hashSync} from 'bcryptjs';
import {IsNotEmpty, Length, Matches} from 'class-validator';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['username'])
export class User {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Length(4, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username can only contain letters, numbers and underscores' })
  public username: string;

  @Column()
  @Exclude()
  @Length(8, 100, { message: 'password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain at least one uppercase letter, one lowercase letter and one number',
  })
  public password: string;

  @Column()
  @IsNotEmpty()
  public role: string;

  @Column()
  @CreateDateColumn()
  public createdAt: Date;

  @Column()
  @UpdateDateColumn()
  public updatedAt: Date;

  public hashPassword() {
    this.password = hashSync(this.password, 12);
  }

  public checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return compareSync(unencryptedPassword, this.password);
  }
}
