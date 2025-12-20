import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProgress } from './entities/user_progress.entity';
import { UpdateProgressDto } from './dto/update_progress.dto';
import { CreateProgressDto } from './dto/create_progress.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProgress)
    private progressRepository: Repository<UserProgress>,
  ) {}

  // User CRUD
  async create(userData: Partial<User>) {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  // Check if user has started a blueprint
  async hasStartedBlueprint(userId: string, blueprintId: string): Promise<boolean> {
    const count = await this.progressRepository.count({
      where: { userId, blueprintId }
    });
    return count > 0;
  }

  // Get all blueprint IDs that user has started
  async getStartedBlueprintIds(userId: string): Promise<string[]> {
    const progress = await this.progressRepository.find({
      where: { userId },
      select: ['blueprintId']
    });
    return [...new Set(progress.map(p => p.blueprintId))];
  }

  // Upsert: Create if not exists, update if exists
  async upsertProgress(dto: UpdateProgressDto) {
    const { userId, blueprintId, stepId, ...updateData } = dto;

    if (!userId) {
      throw new Error('UserId is required');
    }

    let progress = await this.progressRepository.findOne({
      where: { userId, blueprintId, stepId }
    });

    if (progress) {
      // Update existing
      Object.assign(progress, updateData);
    } else {
      // Create new - need to get step details from template first
      // For now, create with minimal data
      progress = this.progressRepository.create({
        userId,
        blueprintId,
        stepId,
        ...updateData
      });
    }

    return this.progressRepository.save(progress);
  }

  // Create new step for user
  async createProgress(dto: CreateProgressDto) {
    const progress = this.progressRepository.create(dto);
    return this.progressRepository.save(progress);
  }

  // Delete step and all its children
  async deleteProgress(userId: string, blueprintId: string, stepId: string) {
    // Find all descendants to delete
    const toDelete = await this.findDescendants(userId, blueprintId, stepId);
    toDelete.push(stepId);

    // Delete in batches
    if (toDelete.length > 0) {
      await this.progressRepository
        .createQueryBuilder()
        .delete()
        .from(UserProgress)
        .where('userId = :userId AND blueprintId = :blueprintId AND stepId IN (:...stepIds)', {
          userId,
          blueprintId,
          stepIds: toDelete
        })
        .execute();
    }
  }

  // Get user's complete step tree for a blueprint
  async getUserSteps(userId: string, blueprintId: string) {
    const allSteps = await this.progressRepository.find({
      where: { userId, blueprintId },
      order: { order: 'ASC' }
    });

    if (allSteps.length === 0) {
      return [];
    }

    // Build nested structure
    const stepMap = new Map();
    const roots: any[] = [];

    // First pass: create all nodes
    allSteps.forEach(step => {
      stepMap.set(step.stepId, {
        id: step.stepId,
        title: step.title,
        status: step.status,
        details: step.details,
        hasFeedback: step.hasFeedback,
        userRating: step.userRating,
        userFeedback: step.userFeedback,
        personalComment: step.personalComment,
        children: []
      });
    });

    // Second pass: build hierarchy
    allSteps.forEach(step => {
      if (step.parentId && stepMap.has(step.parentId)) {
        stepMap.get(step.parentId).children.push(stepMap.get(step.stepId));
      } else {
        roots.push(stepMap.get(step.stepId));
      }
    });

    return roots;
  }

  // Initialize user's blueprint with template steps (idempotent)
  async initializeBlueprint(userId: string, blueprintId: string, templateSteps: any[]) {
    // Check if user already has steps for this blueprint
    const existingCount = await this.progressRepository.count({
      where: { userId, blueprintId }
    });

    if (existingCount > 0) {
      return; // Already initialized - idempotent
    }

    // Convert template to UserProgress records
    const progressRecords: CreateProgressDto[] = [];

    const processSteps = (steps: any[], parentId?: string, order = 0) => {
      steps.forEach((step, index) => {
        progressRecords.push({
          userId,
          blueprintId,
          stepId: step.id,
          title: step.title || '',
          details: step.details || null,
          parentId: parentId,
          order: order + index,
          status: step.status || 'To_Do',
          hasFeedback: step.hasFeedback || false
        });

        if (step.children && step.children.length > 0) {
          processSteps(step.children, step.id, 0);
        }
      });
    };

    processSteps(templateSteps);

    // Bulk insert
    if (progressRecords.length > 0) {
      await this.progressRepository.save(
        progressRecords.map(dto => this.progressRepository.create(dto))
      );
    }
  }

  // Helper: find all descendant stepIds
  private async findDescendants(userId: string, blueprintId: string, parentId: string): Promise<string[]> {
    const children = await this.progressRepository.find({
      where: { userId, blueprintId, parentId },
      select: ['stepId']
    });

    const descendants: string[] = [];
    for (const child of children) {
      descendants.push(child.stepId);
      descendants.push(...await this.findDescendants(userId, blueprintId, child.stepId));
    }

    return descendants;
  }
}
