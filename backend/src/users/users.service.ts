import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { User } from '@prisma/client';

export interface FindOrCreateUserInput {
  id: string; // Supabase auth UUID
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  authProvider?: 'email' | 'facebook';
  facebookId?: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateUser(input: FindOrCreateUserInput): Promise<User> {
    const { id, email, name, avatarUrl, authProvider = 'email', facebookId } = input;

    // 1. FACEBOOK AUTHENTICATION PATH: Keyed by Facebook Account ID
    if (authProvider === 'facebook' && facebookId) {
      // 1A. Search by permanent Facebook Account ID
      const existingByFbId = await this.prisma.user.findUnique({
        where: { facebookId },
      });

      if (existingByFbId) {
        this.logger.log(
          `Found existing user by permanent Facebook ID: ${facebookId} (PostMind User ID: ${existingByFbId.id})`,
        );
        return this.prisma.user.update({
          where: { id: existingByFbId.id },
          data: {
            name: name ?? existingByFbId.name,
            avatarUrl: avatarUrl ?? existingByFbId.avatarUrl,
            ...(email && !email.endsWith('@postmind.local') ? { email } : {}),
          },
        });
      }

      // 1B. If not linked yet, check by Supabase Auth UUID
      const existingById = await this.prisma.user.findUnique({
        where: { id },
      });

      if (existingById) {
        this.logger.log(
          `Linking Facebook ID ${facebookId} to existing user record by ID ${id}`,
        );
        return this.prisma.user.update({
          where: { id },
          data: {
            facebookId,
            authProvider: 'facebook',
            name: name ?? existingById.name,
            avatarUrl: avatarUrl ?? existingById.avatarUrl,
            ...(email && !email.endsWith('@postmind.local') ? { email } : {}),
          },
        });
      }

      // 1C. Check if a user with this email exists to link
      if (email && !email.endsWith('@postmind.local')) {
        const existingByEmail = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingByEmail) {
          this.logger.log(
            `Linking Facebook ID ${facebookId} to existing user record by email ${email} (${existingByEmail.id})`,
          );
          return this.prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              facebookId,
              authProvider: 'facebook',
              name: name ?? existingByEmail.name,
              avatarUrl: avatarUrl ?? existingByEmail.avatarUrl,
            },
          });
        }
      }

      // 1D. Brand new Facebook-authenticated merchant
      this.logger.log(`Creating new user account anchored to Facebook ID: ${facebookId}`);
      return this.prisma.user.create({
        data: {
          id,
          email: email ?? `fb_${facebookId}@postmind.local`,
          facebookId,
          authProvider: 'facebook',
          name: name ?? 'Facebook Merchant',
          avatarUrl: avatarUrl ?? undefined,
        },
      });
    }

    // 2. EMAIL & PASSWORD AUTHENTICATION PATH: Keyed by Email
    const userEmail = email ?? `${id}@postmind.local`;

    return this.prisma.user.upsert({
      where: { id },
      update: {
        email: userEmail,
        name: name ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      },
      create: {
        id,
        email: userEmail,
        name: name ?? 'Merchant',
        avatarUrl: avatarUrl ?? undefined,
        authProvider: 'email',
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
