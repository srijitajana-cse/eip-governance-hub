export interface EipChunk {
  eip: string; // e.g. "EIP-1559"
  title: string;
  section: string; // e.g. "Security Considerations"
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: string[]; // EIP ids referenced
}

export interface PrComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  isReviewComment: boolean;
  resolved?: boolean;
}

export interface PrSummary {
  resolved: string[];
  unresolved: string[];
  overallState: "ready-to-merge" | "changes-requested" | "needs-discussion";
}

export type NotificationEventType =
  | "new-draft"
  | "status-change"
  | "new-comment"
  | "final-call";

export interface NotificationSubscription {
  id: string;
  eventType: NotificationEventType;
  category?: string; // e.g. "Account Abstraction"
  telegramChatId?: string;
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  eventType: NotificationEventType;
  category: string;
  message: string;
  createdAt: string;
  link?: string;
}
