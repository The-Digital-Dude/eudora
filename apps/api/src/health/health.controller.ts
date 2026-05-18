import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { HealthResponse } from "@guidora/contracts";
import { Public } from "../auth/decorators";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: "Current API and database health status" })
  getHealth(): Promise<HealthResponse> {
    return this.healthService.getHealth();
  }
}
