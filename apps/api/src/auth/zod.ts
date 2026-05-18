import { BadRequestException } from "@nestjs/common";
import { ZodError, ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException({
        message: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      });
    }

    throw error;
  }
}
