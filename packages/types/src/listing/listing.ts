export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'changes_requested',
  'active',
  'sold',
  'expired',
  'rejected',
  'archived',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;

export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export interface OccasionOption {
  id: string;
  label: string;
  labelAm: string;
  icon: string;
  description: string;
}

export const OCCASION_OPTIONS: readonly OccasionOption[] = [
  {
    id: 'wedding',
    label: 'Wedding & Melse',
    labelAm: 'ሰርግ እና መልስ',
    icon: '💍',
    description: 'Bridal kemis, groom kuta, melse dresses',
  },
  {
    id: 'holiday',
    label: 'Holidays & Festivals',
    labelAm: 'በዓላት',
    icon: '🕊️',
    description: 'Timket, Meskel, Enkutatash, Genna, Fasika',
  },
  {
    id: 'church',
    label: 'Church & Spiritual',
    labelAm: 'የቤተክርስቲያን',
    icon: '⛪',
    description: 'White kemis, netela, gabi, sunday service',
  },
  {
    id: 'graduation',
    label: 'Graduation & Events',
    labelAm: 'ምረቃ እና ዝግጅቶች',
    icon: '🎓',
    description: 'Celebrations, prom & milestone outfits',
  },
  {
    id: 'casual',
    label: 'Casual & Daily Wear',
    labelAm: 'የቀን / ዘመናዊ',
    icon: '☕',
    description: 'Modern casual Habesha shirts & light dresses',
  },
] as const;
