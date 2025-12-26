import { Global, Module } from '@nestjs/common';
import { FileService } from './services/file.service';
import { SuperAdminService } from './services/super-admin.service';
import { DefaultUsersService } from './services/DefaultUsers.service';

@Global()
@Module({
  imports: [],
  providers: [SuperAdminService, FileService, DefaultUsersService],
})
export class SeedModule {}
