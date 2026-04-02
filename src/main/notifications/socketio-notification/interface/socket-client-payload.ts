export interface SocketClientPayload {
    id: string;
    email: string;
    service: string;
    message: string;
    review: string;
    payment: string;
    userRegistration: string;
    follow: string;
    orderUpdate: string;
    uploadProof: string;
    paymentReminder: string;
    newOrder: string;
    serviceRequestAccepted: string;
    serviceRequestRejected: string;
    serviceRequestCancelled: string;
    paymentSuccessful: string;
    paymentFailed: string;
    inquiryResponse: string;
    reviewReceived: string;
    postCreated : string;
    postLiked: string;
    postCommented: string;
    postShared: string;
    postReplied: string;
    donationReceived: string;
    communityCreated: string;
    communityJoined: string;
}