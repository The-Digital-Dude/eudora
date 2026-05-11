import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { validationFailed } from "../errors/domain-errors";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    if (!this.schema) {
      return value;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw validationFailed(error.flatten());
      }

      throw error;
    }
  }
}
