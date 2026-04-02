//  -----------------  Event payload interfaces (aligned with NotificationToggle schema) ---------------------
export interface UserRegistrationMeta {
  action: 'created';
  info: {
    id: string;
    email: string;
    name: string;
    phone?: string;

    createdAt: Date;
    recipients: Array<{
      id: string;
      email: string;
    }>;
  };
  meta?: Record<string, any>;
}

export interface ReviewMeta {
  postId: string;
  performedBy: string;
  publishedAt: Date;
}

export interface MessageMeta {
  messageId: string;
  fromUserId: string;
  toUserId: string;
  sentAt: Date;
}

export interface FollowMeta {
  reviewId: string;
  reviewContent: string;
  performedBy: string;
  publishedAt: Date;
}

export interface PostMeta {
  serviceName: string;
  description: string;
  authorId: string;
  publishedAt: Date;
}

export interface InquiryMeta {
  inquiryId: string;
  subject: string;
  message: string;
  fromUserId: string;
  submittedAt: Date;
}

export interface ServiceMeta {
  serviceName: string;
  description: string;
  authorId: string;
  publishedAt: Date;
}

export interface ServiceRequestMeta {
  serviceRequestId: string;
  serviceId: string;
  serviceName: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  status: 'ACCEPTED' | 'DECLINED';
  reason?: string;
  actionAt: Date;
}

export interface UploadProofMeta {
  uploadedFileUrl: string;
  uploadedAt: Date;
}

export interface UserUpdatesMeta {
  userId: string;
  updateType: string;
  updatedAt: Date;
}

export interface OrderUpdateMeta {
  orderId: string;
  status: string;
  updatedAt: Date;
}

export interface PaymentReminderMeta {
  orderId: string;
  amount: number;
  dueAt: Date;
}

export interface NewOrderMeta {
  orderId: string;
  serviceId: string;
  buyerId: string;
  createdAt: Date;
}

export interface ServiceRequestAcceptedMeta {
  requestId: string;
  serviceId: string;
  acceptedAt: Date;
}

export interface ServiceRequestRejectedMeta {
  requestId: string;
  serviceId: string;
  rejectedAt: Date;
  reason?: string;
}

export interface ServiceRequestCancelledMeta {
  requestId: string;
  serviceId: string;
  cancelledAt: Date;
  reason?: string;
}

export interface PaymentSuccessfulMeta {
  transactionId: string;
  amount: number;
  orderId: string;
  completedAt: Date;
}

export interface PaymentFailedMeta {
  transactionId: string;
  amount: number;
  orderId: string;
  reason: string;
  failedAt: Date;
}

export interface InquiryResponseMeta {
  inquiryId: string;
  response: string;
  respondedAt: Date;
}

export interface ReviewReceivedMeta {
  reviewId: string;
  fromUserId: string;
  rating: number;
  receivedAt: Date;
}

export interface PostCreatedMeta {
  postId: string;
  authorId: string;
  createdAt: Date;
}

export interface PostLikedMeta {
  postId: string;
  likedBy: string;
  likedAt: Date;
}

export interface PostCommentedMeta {
  postId: string;
  commentId: string;
  commentBy: string;
  commentedAt: Date;
}

export interface PostSharedMeta {
  postId: string;
  sharedBy: string;
  sharedAt: Date;
}

export interface PostRepliedMeta {
  postId: string;
  commentId: string;
  replyId: string;
  repliedBy: string;
  repliedAt: Date;
}

export interface DonationReceivedMeta {
  donationId: string;
  fromUserId: string;
  amount: number;
  receivedAt: Date;
}

export interface CommunityCreatedMeta {
  communityId: string;
  communityName: string;
  createdBy: string;
  createdAt: Date;
}

export interface CommunityJoinedMeta {
  communityId: string;
  communityName: string;
  joinedBy: string;
  joinedAt: Date;
}

//--------------------EVENT TYPE CONSTANTS --------------------
export const EVENT_TYPES = {
  USERREGISTRATION_CREATE: 'user.create',
  USERREGISTRATION_UPDATE: 'user.update',
  USERREGISTRATION_DELETE: 'user.delete',

  POST_CREATE: 'post.create',
  POST_UPDATE: 'post.update',
  POST_DELETE: 'post.delete',

  MESSAGE_CREATE: 'message.create',
  SERVICE_CREATE: 'service.create',
  REVIEW_CREATE: 'review.create',
  INQUIRY_CREATE: 'inquiry.create',
  SERVICE_REQUEST_ACCEPTED: 'service_request.accepted',
  SERVICE_REQUEST_DECLINED: 'service_request.declined',
  UPLOAD_PROOF: 'upload_proof',

  USER_UPDATES: 'user.updates',
  ORDER_UPDATE: 'order.update',
  PAYMENT_REMINDER: 'payment.reminder',
  NEW_ORDER: 'order.new',
  SERVICE_REQUEST_REJECTED: 'service_request.rejected',
  SERVICE_REQUEST_CANCELLED: 'service_request.cancelled',
  PAYMENT_SUCCESSFUL: 'payment.successful',
  PAYMENT_FAILED: 'payment.failed',
  INQUIRY_RESPONSE: 'inquiry.response',
  REVIEW_RECEIVED: 'review.received',
  POST_CREATED: 'post.created',
  POST_LIKED: 'post.liked',
  POST_COMMENTED: 'post.commented',
  POST_SHARED: 'post.shared',
  POST_REPLIED: 'post.replied',
  DONATION_RECEIVED: 'donation.received',
  COMMUNITY_CREATED: 'community.created',
  COMMUNITY_JOINED: 'community.joined',
} as const;

// ----------------- Type-safe keys for event types -----------------
export type EventType = keyof typeof EVENT_TYPES;

// ------------------ Event payload mapping ------------------
export type EventPayloadMap = {
  [EVENT_TYPES.USERREGISTRATION_CREATE]: UserRegistrationMeta;
  [EVENT_TYPES.USERREGISTRATION_UPDATE]: UserRegistrationMeta;
  [EVENT_TYPES.USERREGISTRATION_DELETE]: UserRegistrationMeta;

  [EVENT_TYPES.POST_CREATE]: PostMeta;
  [EVENT_TYPES.POST_UPDATE]: PostMeta;
  [EVENT_TYPES.POST_DELETE]: PostMeta;

  [EVENT_TYPES.MESSAGE_CREATE]: MessageMeta;

  [EVENT_TYPES.SERVICE_CREATE]: ServiceMeta;
  [EVENT_TYPES.REVIEW_CREATE]: ReviewMeta;
  [EVENT_TYPES.INQUIRY_CREATE]: InquiryMeta;
  [EVENT_TYPES.SERVICE_REQUEST_ACCEPTED]: ServiceRequestMeta;
  [EVENT_TYPES.SERVICE_REQUEST_DECLINED]: ServiceRequestMeta;

  [EVENT_TYPES.UPLOAD_PROOF]: UploadProofMeta;

  [EVENT_TYPES.USER_UPDATES]: UserUpdatesMeta;
  [EVENT_TYPES.ORDER_UPDATE]: OrderUpdateMeta;
  [EVENT_TYPES.PAYMENT_REMINDER]: PaymentReminderMeta;
  [EVENT_TYPES.NEW_ORDER]: NewOrderMeta;
  [EVENT_TYPES.SERVICE_REQUEST_REJECTED]: ServiceRequestRejectedMeta;
  [EVENT_TYPES.SERVICE_REQUEST_CANCELLED]: ServiceRequestCancelledMeta;
  [EVENT_TYPES.PAYMENT_SUCCESSFUL]: PaymentSuccessfulMeta;
  [EVENT_TYPES.PAYMENT_FAILED]: PaymentFailedMeta;
  [EVENT_TYPES.INQUIRY_RESPONSE]: InquiryResponseMeta;
  [EVENT_TYPES.REVIEW_RECEIVED]: ReviewReceivedMeta;
  [EVENT_TYPES.POST_CREATED]: PostCreatedMeta;
  [EVENT_TYPES.POST_LIKED]: PostLikedMeta;
  [EVENT_TYPES.POST_COMMENTED]: PostCommentedMeta;
  [EVENT_TYPES.POST_SHARED]: PostSharedMeta;
  [EVENT_TYPES.POST_REPLIED]: PostRepliedMeta;
  [EVENT_TYPES.DONATION_RECEIVED]: DonationReceivedMeta;
  [EVENT_TYPES.COMMUNITY_CREATED]: CommunityCreatedMeta;
  [EVENT_TYPES.COMMUNITY_JOINED]: CommunityJoinedMeta;
};
