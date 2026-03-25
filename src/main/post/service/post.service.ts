import { Injectable } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma:PrismaService){}
  createPost(createPostDto: CreatePostDto) {
   const post=await this.prisma.client.post.create(){

   }
  }

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
