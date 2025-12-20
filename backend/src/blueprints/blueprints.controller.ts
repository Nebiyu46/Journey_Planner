import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlueprintsService } from './blueprints.service';
import { CreateBlueprintDto } from './dto/create-blueprint.dto';
import { UpdateBlueprintDto } from './dto/update-blueprint.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('blueprints')
export class BlueprintsController {
  constructor(private readonly blueprintsService: BlueprintsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBlueprintDto: CreateBlueprintDto, @CurrentUser() user: any) {
    // Only admins can create blueprints
    if (user.role !== 'admin') {
      throw new Error('Only admins can create blueprints');
    }
    return this.blueprintsService.create(createBlueprintDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: any) {
    return this.blueprintsService.findAllWithUserStatus(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.blueprintsService.findOneWithUserSteps(id, user.id);
  }

  // Start a new blueprint
  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  startBlueprint(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.blueprintsService.startBlueprint(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateBlueprintDto: UpdateBlueprintDto,
    @CurrentUser() user: any
  ) {
    // Only admins can update blueprints
    if (user.role !== 'admin') {
      throw new Error('Only admins can update blueprints');
    }
    return this.blueprintsService.update(id, updateBlueprintDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    // Only admins can delete blueprints
    if (user.role !== 'admin') {
      throw new Error('Only admins can delete blueprints');
    }
    return this.blueprintsService.remove(id);
  }
}
