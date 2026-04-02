import {
  CommunityCreatedMeta,
  CommunityJoinedMeta,
  DonationReceivedMeta,
  InquiryMeta,
  InquiryResponseMeta,
  MessageMeta,
  NewOrderMeta,
  OrderUpdateMeta,
  PaymentFailedMeta,
  PaymentReminderMeta,
  PaymentSuccessfulMeta,
  PostCommentedMeta,
  PostCreatedMeta,
  PostLikedMeta,
  PostMeta,
  PostRepliedMeta,
  PostSharedMeta,
  ReviewMeta,
  ReviewReceivedMeta,
  ServiceMeta,
  ServiceRequestCancelledMeta,
  ServiceRequestRejectedMeta,
  UploadProofMeta,
  UserRegistrationMeta,
  UserUpdatesMeta,
} from './events.name';

// Generic Base Event
export interface BaseEvent<TMeta> {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  meta: TMeta;
}

// Notification Base
export interface Notification {
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  meta: Record<string, any>;
}

// User Registration Event
export interface UserRegistration extends BaseEvent<UserRegistrationMeta> {
  info: {
    email: string;
    id: string;
    name: string;
    role: string;
    recipients: { id: string; email: string }[];
  };
}

//----------------------- Post Event ----------------------
export interface PostEvent extends BaseEvent<PostMeta> {
  info: {
    title: string;
    message: string;
    authorId: string;
    recipients: { id: string; email: string }[];
  };
}
export interface ServiceEvent extends BaseEvent<ServiceMeta> {
  info: {
    serviceName: string;
    description: string;
    authorId: string;
    publishedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

// --------------------- Message Event ----------------------
export interface Message extends BaseEvent<MessageMeta> {
  info: {
    fromUserId: string;
    toUserId: string;
    content: string;
    sendEmail: boolean;
  };
}

//  ---------------------Review Event ----------------------
export interface ReviewEvent extends BaseEvent<ReviewMeta> {
  info: {
    reviewId: string;
    reviewContent: string;
    performedBy: string;
    recipients: { id: string; email: string }[];
  };
}
//  ---------------------Inquiry Event ----------------------
export interface InquiryEvent extends BaseEvent<InquiryMeta> {
  info: {
    inquiryId: string;
    subject: string;
    message: string;
    fromUserId: string;
    recipients: { id: string; email: string }[];
  };
}
//  ---------------------Upload Proof Event ----------------------
export interface UploadProofEvent extends BaseEvent<UploadProofMeta> {
  info: {
    uploadedFileUrl: string;
    uploadedAt: Date;
    uploadedByUserId: string;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------User Updates Event ----------------------
export interface UserUpdatesEvent extends BaseEvent<UserUpdatesMeta> {
  info: {
    userId: string;
    updateType: string;
    updatedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Order Update Event ----------------------
export interface OrderUpdateEvent extends BaseEvent<OrderUpdateMeta> {
  info: {
    orderId: string;
    status: string;
    updatedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Payment Reminder Event ----------------------
export interface PaymentReminderEvent extends BaseEvent<PaymentReminderMeta> {
  info: {
    orderId: string;
    amount: number;
    dueAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------New Order Event ----------------------
export interface NewOrderEvent extends BaseEvent<NewOrderMeta> {
  info: {
    orderId: string;
    serviceId: string;
    buyerId: string;
    createdAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Service Request Rejected Event ----------------------
export interface ServiceRequestRejectedEvent extends BaseEvent<ServiceRequestRejectedMeta> {
  info: {
    requestId: string;
    serviceId: string;
    rejectedAt: Date;
    reason?: string;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Service Request Cancelled Event ----------------------
export interface ServiceRequestCancelledEvent extends BaseEvent<ServiceRequestCancelledMeta> {
  info: {
    requestId: string;
    serviceId: string;
    cancelledAt: Date;
    reason?: string;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Payment Successful Event ----------------------
export interface PaymentSuccessfulEvent extends BaseEvent<PaymentSuccessfulMeta> {
  info: {
    transactionId: string;
    amount: number;
    orderId: string;
    completedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Payment Failed Event ----------------------
export interface PaymentFailedEvent extends BaseEvent<PaymentFailedMeta> {
  info: {
    transactionId: string;
    amount: number;
    orderId: string;
    reason: string;
    failedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Inquiry Response Event ----------------------
export interface InquiryResponseEvent extends BaseEvent<InquiryResponseMeta> {
  info: {
    inquiryId: string;
    response: string;
    respondedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Review Received Event ----------------------
export interface ReviewReceivedEvent extends BaseEvent<ReviewReceivedMeta> {
  info: {
    reviewId: string;
    fromUserId: string;
    rating: number;
    receivedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Post Created Event ----------------------
export interface PostCreatedEvent extends BaseEvent<PostCreatedMeta> {
  info: {
    postId: string;
    authorId: string;
    createdAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Post Liked Event ----------------------
export interface PostLikedEvent extends BaseEvent<PostLikedMeta> {
  info: {
    postId: string;
    likedBy: string;
    likedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Post Commented Event ----------------------
export interface PostCommentedEvent extends BaseEvent<PostCommentedMeta> {
  info: {
    postId: string;
    commentId: string;
    commentBy: string;
    commentedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Post Shared Event ----------------------
export interface PostSharedEvent extends BaseEvent<PostSharedMeta> {
  info: {
    postId: string;
    sharedBy: string;
    sharedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Post Replied Event ----------------------
export interface PostRepliedEvent extends BaseEvent<PostRepliedMeta> {
  info: {
    postId: string;
    commentId: string;
    replyId: string;
    repliedBy: string;
    repliedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Donation Received Event ----------------------
export interface DonationReceivedEvent extends BaseEvent<DonationReceivedMeta> {
  info: {
    donationId: string;
    fromUserId: string;
    amount: number;
    receivedAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Community Created Event ----------------------
export interface CommunityCreatedEvent extends BaseEvent<CommunityCreatedMeta> {
  info: {
    communityId: string;
    communityName: string;
    createdBy: string;
    createdAt: Date;
    recipients: { id: string; email: string }[];
  };
}

//  ---------------------Community Joined Event ----------------------
export interface CommunityJoinedEvent extends BaseEvent<CommunityJoinedMeta> {
  info: {
    communityId: string;
    communityName: string;
    joinedBy: string;
    joinedAt: Date;
    recipients: { id: string; email: string }[];
  };
}
