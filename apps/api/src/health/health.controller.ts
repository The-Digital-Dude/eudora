import { Controller, Get } from "@nestjs/common";
import type { ApiSuccess } from "@guidora/contracts";

type HealthStatus = {
  status: "ok";
  service: "api";
};

@Controller("health")
export class HealthController {
  @Get()
  health(): ApiSuccess<HealthStatus> {
    return {
      data: {
        status: "ok",
        service: "api"
      }
    };
  }

  @Get("db")
  database(): ApiSuccess<{ status: "not_configured"; checked: false }> {
    return {
      data: {
        status: "not_configured",
        checked: false
      }
    };
  }

  @Get("integrations")
  integrations(): ApiSuccess<{ status: "not_configured"; providers: string[] }> {
    return {
      data: {
        status: "not_configured",
        providers: []
      }
    };
  }
}
