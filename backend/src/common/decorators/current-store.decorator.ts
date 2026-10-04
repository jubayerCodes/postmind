import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Store } from '@prisma/client';

export const CurrentStore = createParamDecorator(
  (data: keyof Store | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const store = request.store as Store | undefined;

    if (!store) {
      return null;
    }

    return data ? store[data] : store;
  },
);
