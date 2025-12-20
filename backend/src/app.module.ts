import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlueprintsModule } from './blueprints/blueprints.module';
import { Blueprint } from './blueprints/entities/blueprint.entity';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { UserProgress } from './users/entities/user_progress.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'journey_map',
      entities: [Blueprint, User, UserProgress],
      synchronize: true,
    }),
    BlueprintsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
