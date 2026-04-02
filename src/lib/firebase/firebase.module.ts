import { Global, Module } from "@nestjs/common";
import { FirebaseMessagingService } from "./firebase-messaging.service";
import { FirebaseAdminProvider } from "./firebase.admin.provider.service";


@Global()
@Module({
    providers: [FirebaseAdminProvider, FirebaseMessagingService],
    exports: [FirebaseAdminProvider, FirebaseMessagingService],
})
export class FirebaseModule {}