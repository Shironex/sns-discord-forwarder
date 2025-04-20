export interface BounceRecipient {
  emailAddress: string;
}

export interface ComplaintRecipient {
  emailAddress: string;
}

export interface ParsedNotification {
  notificationType: string;
  bounce?: { bouncedRecipients?: BounceRecipient[] };
  complaint?: { complainedRecipients?: ComplaintRecipient[] };
  delivery?: { recipients?: string[] };
}
