
import { Body, Controller, Post, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";


import { GetUser, ValidateAuth } from "@/core/jwt/jwt.decorator";
import { NotificationType, UpdateFcmTokenDto } from "@/lib/firebase/dto/fireabse-notification.dto";
import { FirebaseNotificationService } from "./firebase-notification.service";

@ApiTags("Firebase Notifications")
@ValidateAuth()
@ApiBearerAuth()
@Controller("firebase-notifications")
export class FirebaseNotificationController {
    constructor(private readonly firebaseNotificationService: FirebaseNotificationService) {}

    @Post("update-fcm-token")
    @ApiOperation({ summary: "Update user's FCM token" })
    async updateFcmToken(@GetUser("sub") userId: string, @Body() dto: UpdateFcmTokenDto) {
        await this.firebaseNotificationService.updateFcmToken(userId, dto.fcmToken);
        return { success: true, message: "FCM token updated successfully" };
    }

    @Post("subscribe-topic")
    @ApiOperation({ summary: "Subscribe user to a notification topic" })
    async subscribeToTopic(@GetUser("sub") userId: string, @Body() dto: { topic: string }) {
        const result = await this.firebaseNotificationService.subscribeUserToTopic(
            userId,
            dto.topic,
        );
        return result;
    }

    @Post("unsubscribe-topic")
    @ApiOperation({ summary: "Unsubscribe user from a notification topic" })
    async unsubscribeFromTopic(@GetUser("sub") userId: string, @Body() dto: { topic: string }) {
        const result = await this.firebaseNotificationService.unsubscribeUserFromTopic(
            userId,
            dto.topic,
        );
        return result;
    }

    @Post("test/:sub")
    @ApiOperation({ summary: "Send test notification to a specific user (for testing)" })
    async sendTestNotification(@Param("sub") userId: string) {
        const template = this.firebaseNotificationService.buildNotificationTemplate(
            NotificationType.CUSTOM,
            {
                title: "Test Notification",
                body: "This is a test notification from JConnect",
                data: { test: "true" },
            },
        );

        const result = await this.firebaseNotificationService.sendToUser(userId, template);
        return result;
    }
}