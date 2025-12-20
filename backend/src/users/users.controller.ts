import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProgressDto } from './dto/update_progress.dto';
import { CreateProgressDto } from './dto/create_progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get user's step tree for a blueprint
  @Get()
  getUserSteps(
    @CurrentUser() user: any,
    @Query('blueprintId') blueprintId: string
  ) {
    return this.usersService.getUserSteps(user.id, blueprintId);
  }

  // Upsert step progress (create or update)
  @Patch()
  upsertProgress(@CurrentUser() user: any, @Body() dto: UpdateProgressDto) {
    dto.userId = user.id; // Override with authenticated user
    return this.usersService.upsertProgress(dto);
  }

  // Create new step
  @Post()
  createProgress(@CurrentUser() user: any, @Body() dto: CreateProgressDto) {
    dto.userId = user.id; // Override with authenticated user
    return this.usersService.createProgress(dto);
  }

  // Delete step and children
  @Delete(':stepId')
  deleteProgress(
    @CurrentUser() user: any,
    @Param('stepId') stepId: string,
    @Query('blueprintId') blueprintId: string
  ) {
    return this.usersService.deleteProgress(user.id, blueprintId, stepId);
  }
}
