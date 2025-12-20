import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blueprint } from './entities/blueprint.entity';
import { CreateBlueprintDto } from './dto/create-blueprint.dto';
import { UpdateBlueprintDto } from './dto/update-blueprint.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class BlueprintsService {
  constructor(
    @InjectRepository(Blueprint)
    private blueprintRepository: Repository<Blueprint>,
    private usersService: UsersService,
  ) {}

  create(createBlueprintDto: CreateBlueprintDto): Promise<Blueprint> {
    const blueprint = this.blueprintRepository.create(createBlueprintDto);
    return this.blueprintRepository.save(blueprint);
  }

  findAll(): Promise<Blueprint[]> {
    return this.blueprintRepository.find({
      select: ['id', 'title', 'institution', 'targetAudience'],
    });
  }

  // Get blueprints with user's started status
  async findAllWithUserStatus(userId: string) {
    const blueprints = await this.findAll();
    const startedIds = await this.usersService.getStartedBlueprintIds(userId);
    
    return blueprints.map(bp => ({
      ...bp,
      hasStarted: startedIds.includes(bp.id)
    }));
  }

  async findOne(id: string): Promise<Blueprint> {
    const blueprint = await this.blueprintRepository.findOne({ where: { id } });
    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID "${id}" not found`);
    }
    return blueprint;
  }

  // Get blueprint with user's custom steps
  async findOneWithUserSteps(blueprintId: string, userId: string) {
    const blueprint = await this.findOne(blueprintId);
    const hasStarted = await this.usersService.hasStartedBlueprint(userId, blueprintId);

    if (!hasStarted) {
      // User hasn't started - return template only
      return {
        ...blueprint,
        hasStarted: false,
        isNew: true
      };
    }

    // User has started - get their progress
    const userSteps = await this.usersService.getUserSteps(userId, blueprintId);

    return {
      ...blueprint,
      rootSteps: userSteps.length > 0 ? userSteps : blueprint.rootSteps,
      hasStarted: true,
      isNew: false
    };
  }

  // Start a new blueprint (initialize user's progress)
  async startBlueprint(blueprintId: string, userId: string) {
    const blueprint = await this.findOne(blueprintId);
    
    // Check if already started
    const hasStarted = await this.usersService.hasStartedBlueprint(userId, blueprintId);
    if (hasStarted) {
      throw new Error('Blueprint already started');
    }

    // Initialize user's blueprint with template
    await this.usersService.initializeBlueprint(userId, blueprintId, blueprint.rootSteps);

    // Return user's initialized steps
    const userSteps = await this.usersService.getUserSteps(userId, blueprintId);
    
    return {
      ...blueprint,
      rootSteps: userSteps,
      hasStarted: true,
      isNew: false
    };
  }

  async update(id: string, updateBlueprintDto: UpdateBlueprintDto): Promise<Blueprint> {
    const blueprint = await this.findOne(id);
    Object.assign(blueprint, updateBlueprintDto);
    return this.blueprintRepository.save(blueprint);
  }

  async remove(id: string): Promise<void> {
    const blueprint = await this.findOne(id);
    await this.blueprintRepository.remove(blueprint);
  }
}
