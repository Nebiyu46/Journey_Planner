import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;  // Hashed!

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: string;
}