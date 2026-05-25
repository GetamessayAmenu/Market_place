/** Contact channels exposed on a listing (stored as JSON on Listing). */
export interface ListingContactOptions {
  readonly showPhone?: boolean;
  readonly whatsapp?: string;
  readonly telegram?: string;
  readonly inAppMessaging?: boolean;
}
