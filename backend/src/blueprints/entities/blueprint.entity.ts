import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Blueprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  institution: string;

  @Column()
  targetAudience: string;

  @Column({ type: 'json' })
  rootSteps: any[];
}