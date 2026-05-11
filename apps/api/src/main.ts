import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodValidationPipe } from "./common/validation/zod-validation.pipe";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    credentials: true
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new DomainErrorFilter());

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
