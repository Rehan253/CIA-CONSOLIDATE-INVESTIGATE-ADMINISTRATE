import { IsNotEmpty, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// This defines the product table in the database.
// TypeORM will auto-create the table with these columns when the app starts.
@Entity()
export class Product {

  // Auto-increments: 1, 2, 3... so we never set this manually
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Length(1, 100)
  public name: string;

  @Column()
  @IsNotEmpty()
  public category: string;

  // Description is optional, a product can exist without one
  @Column({ nullable: true })
  public description: string;

  @Column({ default: 0 })
  public amount: number;

  // precision: total digits, scale: digits after decimal point (e.g. 999.99)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  public price: number;

  @Column({ default: false })
  public hasExpiryDate: boolean;
}
