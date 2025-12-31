import { Controller, Get, Param } from "@nestjs/common";
import { CallService } from "./call.service";


@Controller("realtime-call")
export class CallController {
    constructor(private readonly callService: CallService) {}

    @Get(":callId/status")
    async getCallStatus(@Param("callId") callId: string) {
        return this.callService.getCallStatus(callId);
    }
}