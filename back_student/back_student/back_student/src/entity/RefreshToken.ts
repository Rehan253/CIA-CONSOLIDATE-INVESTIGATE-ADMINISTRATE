import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RefreshToken {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public token: string;

  @Column()
  public userId: number;

  @Column()
  public expiresAt: Date;
}
