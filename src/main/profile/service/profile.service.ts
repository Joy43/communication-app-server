import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { HandleError } from '@/core/error/handle-error.decorator';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}
  @HandleError('Error updating profile')
 createProfile(createProfileDto: CreateProfileDto,userId:string) {
   // update and create profile

   const profile = this.prisma.client.profile.upsert({
    where:{
      userId:userId
    },
    update:{
      ...createProfileDto
    },
    create:{
      ...createProfileDto,
      user:{connect:{id:userId}}
    }
   })
   return profile
  }

  findAll() {
    return `This action returns all profile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
