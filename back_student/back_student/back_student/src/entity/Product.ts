import { IsNotEmpty, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Length(1, 100)
  public name: string;

  @Column()
  @IsNotEmpty()
  public category: string;

  @Column({ nullable: true })
  public description: string;

  @Column({ default: 0 })
  public amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  public price: number;

  @Column({ default: false })
  public hasExpiryDate: boolean;
}
