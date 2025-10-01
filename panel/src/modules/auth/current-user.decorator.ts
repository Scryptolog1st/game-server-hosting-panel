import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserT = { id: string; org: string };

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return (req.user ?? null) as CurrentUserT | null;
});
