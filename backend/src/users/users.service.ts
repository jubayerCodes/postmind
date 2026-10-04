import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateUser(supabaseUser: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {
        email: supabaseUser.email,
        name: supabaseUser.name ?? undefined,
        avatarUrl: supabaseUser.avatarUrl ?? undefined,
      },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.name,
        avatarUrl: supabaseUser.avatarUrl,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateProfile(
    id: string,
    data: { name?: string; avatarUrl?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  }
}
