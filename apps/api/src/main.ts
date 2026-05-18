import "reflect-metadata";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const allowedOrigins = [configService.get<string>("CONSOLE_ORIGIN", "http://localhost:3002")];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
}

export function configureOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Guidora API")
    .setDescription("REST API for the Guidora platform")
    .setVersion("0.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
}

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  configureOpenApi(app);

  const configService = app.get(ConfigService);
  await app.listen(configService.get<number>("PORT", 3001));
}

if (process.env.NODE_ENV !== "test") {
  void bootstrap();
}
