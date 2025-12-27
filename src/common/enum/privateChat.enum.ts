export enum PrivateChatEvents {
  // Connection events
  SUCCESS = 'success',
  ERROR = 'error',

  // Conversation events
  LOAD_CONVERSATIONS = 'load_conversations',
  CONVERSATION_LIST = 'conversation_list',
  LOAD_SINGLE_CONVERSATION = 'load_single_conversation',
  NEW_CONVERSATION = 'new_conversation',

  // Message events
  SEND_MESSAGE = 'send_message',
  NEW_MESSAGE = 'new_message',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_READ = 'message_read',
  MARK_AS_READ = 'mark_as_read',
USER_STATUS_CHANGED = 'user_status_changed',
  // Typing events
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',

  // Delete events
  DELETE_MESSAGE = 'delete_message',
  MESSAGE_DELETED = 'message_deleted',
}
