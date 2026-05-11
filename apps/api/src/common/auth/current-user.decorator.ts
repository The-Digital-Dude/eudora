import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { ActorContext } from "@guidora/contracts";

type RequestWithUser = {
  user?: ActorContext;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): ActorContext | undefined => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
