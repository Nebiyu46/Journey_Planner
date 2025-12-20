import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn } from 'typeorm';
import { Blueprint } from '../../blueprints/entities/blueprint.entity';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Blueprint)
  blueprint: Blueprint;

  @Column()
  blueprintId: string;

  // Custom step structure per user
  @Column()
  stepId: string;  // User-generated ID for their custom steps

  @Column()
  title: string;

  @Column({ nullable: true })
  parentId: string;  // Points to parent stepId in the same user's tree

  @Column({ type: 'int', default: 0 })
  order: number;  // For ordering siblings

  @Column({ type: 'enum', enum: ['To_Do', 'In_Progress', 'Completed', 'Comment'], default: 'To_Do' })
  status: string;

  @Column({ nullable: true })
  userRating: number;

  @Column({ type: 'text', nullable: true })
  userFeedback: string;

  @Column({ type: 'text', nullable: true })
  personalComment: string;

  @Column({ type: 'text', nullable: true })
  details: string;  // Step description

  @Column({ type: 'boolean', default: false })
  hasFeedback: boolean;  // Whether this step should show feedback UI

  @UpdateDateColumn()
  updatedAt: Date;
}