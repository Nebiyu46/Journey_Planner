import { Test, TestingModule } from '@nestjs/testing';
import { BlueprintsService } from './blueprints.service';

describe('BlueprintsService', () => {
  let service: BlueprintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlueprintsService],
    }).compile();

    service = module.get<BlueprintsService>(BlueprintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
