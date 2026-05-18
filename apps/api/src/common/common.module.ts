import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionEnvelopeFilter } from "./http/http-exception.filter";
import { RequestContextMiddleware } from "./http/request-context";
import { ResponseEnvelopeInterceptor } from "./http/response.interceptor";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionEnvelopeFilter
    }
  ]
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
