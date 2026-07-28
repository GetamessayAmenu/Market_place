export type Language = 'en' | 'am'

export interface Translations {
  common: {
    loading: string
    save: string
    cancel: string
    delete: string
    edit: string
    view: string
    search: string
    filter: string
    all: string
    actions: string
    status: string
    createdAt: string
    updatedAt: string
  }
  admin: {
    dashboard: string
    orders: string
    users: string
    listings: string
    categories: string
    attributes: string
    disputes: string
    taxonomies: string
    rentals: string
    heroBanners: string
    vendorKyc: string
  }
  rentals: {
    title: string
    sellerQueue: string
    totalRentals: string
    activeRentals: string
    pendingReturns: string
    overdue: string
    pendingRequests: string
    dueSoon: string
    totalRevenue: string
    orderId: string
    customer: string
    item: string
    rentalPeriod: string
    amount: string
    deposit: string
    accept: string
    reject: string
    markReturned: string
    viewDetails: string
    daysLeft: string
  }
  heroBanners: {
    title: string
    create: string
    edit: string
    publish: string
    unpublish: string
    delete: string
    titleEn: string
    titleAm: string
    subtitleEn: string
    subtitleAm: string
    imageUrl: string
    linkUrl: string
    holidayTheme: string
    themeStartDate: string
    themeEndDate: string
    sortOrder: string
    status: string
  }
  vendorKyc: {
    title: string
    businessName: string
    businessNameAm: string
    tinNumber: string
    licenseUrl: string
    status: string
    pending: string
    approved: string
    rejected: string
    rejectionReason: string
    review: string
    approve: string
    reject: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      actions: 'Actions',
      status: 'Status',
      createdAt: 'Created',
      updatedAt: 'Updated',
    },
    admin: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      users: 'Users',
      listings: 'Listings',
      categories: 'Categories',
      attributes: 'Attributes',
      disputes: 'Disputes',
      taxonomies: 'Taxonomies',
      rentals: 'Rentals',
      heroBanners: 'Hero Banners',
      vendorKyc: 'Vendor KYC',
    },
    rentals: {
      title: 'Rental Tracker',
      sellerQueue: 'Seller Rental Queue',
      totalRentals: 'Total Rentals',
      activeRentals: 'Active Rentals',
      pendingReturns: 'Pending Returns',
      overdue: 'Overdue',
      pendingRequests: 'Pending Requests',
      dueSoon: 'Due Soon (3 days)',
      totalRevenue: 'Total Revenue',
      orderId: 'Order ID',
      customer: 'Customer',
      item: 'Item',
      rentalPeriod: 'Rental Period',
      amount: 'Amount',
      deposit: 'Deposit',
      accept: 'Accept',
      reject: 'Reject',
      markReturned: 'Mark Returned',
      viewDetails: 'View Details',
      daysLeft: 'days left',
    },
    heroBanners: {
      title: 'Hero Banners',
      create: 'Create Banner',
      edit: 'Edit Banner',
      publish: 'Publish',
      unpublish: 'Unpublish',
      delete: 'Delete',
      titleEn: 'Title (English)',
      titleAm: 'Title (Amharic)',
      subtitleEn: 'Subtitle (English)',
      subtitleAm: 'Subtitle (Amharic)',
      imageUrl: 'Image URL',
      linkUrl: 'Link URL',
      holidayTheme: 'Holiday Theme',
      themeStartDate: 'Theme Start Date',
      themeEndDate: 'Theme End Date',
      sortOrder: 'Sort Order',
      status: 'Status',
    },
    vendorKyc: {
      title: 'Vendor KYC Profiles',
      businessName: 'Business Name',
      businessNameAm: 'Business Name (Amharic)',
      tinNumber: 'TIN Number',
      licenseUrl: 'License URL',
      status: 'Status',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      rejectionReason: 'Rejection Reason',
      review: 'Review',
      approve: 'Approve',
      reject: 'Reject',
    },
  },
  am: {
    common: {
      loading: 'በመጫን ላይ...',
      save: 'አስቀምጥ',
      cancel: 'ተው',
      delete: 'ሰርዝ',
      edit: 'አርትዕ',
      view: 'ተመልከት',
      search: 'ፈልግ',
      filter: 'ማጣሪያ',
      all: 'ሁሉም',
      actions: 'ተግባራት',
      status: 'ሁኔታ',
      createdAt: 'ተፈጥሯል',
      updatedAt: 'ተሻሽሏል',
    },
    admin: {
      dashboard: 'ዳሽቦርድ',
      orders: 'ትዕዛዛት',
      users: 'ተጠቃሚዎች',
      listings: 'ዝርዝሮች',
      categories: 'ምድቦች',
      attributes: 'ባህሪያት',
      disputes: 'ክርክሮች',
      taxonomies: 'ታክሶኖሚዎች',
      rentals: 'ኪራዮች',
      heroBanners: 'ዋና ባነሮች',
      vendorKyc: 'ከሰራተኛ KYC',
    },
    rentals: {
      title: 'ኪራይ ትራከር',
      sellerQueue: 'ሽያጭ ኪራይ ሰርግ',
      totalRentals: 'ጠቅላላ ኪራዮች',
      activeRentals: 'ንቁ ኪራዮች',
      pendingReturns: 'በመጠባበቅ ላይ ያሉ መመለሻዎች',
      overdue: 'የጊዜ ወሰነ',
      pendingRequests: 'በመጠባበቅ ላይ ያሉ ጥያቄዎች',
      dueSoon: 'በቅርብ የሚያበቃ (3 ቀናት)',
      totalRevenue: 'ጠቅላላ ገቢ',
      orderId: 'የትዕዛዝ ID',
      customer: 'ደንበኛ',
      item: 'እቃ',
      rentalPeriod: 'የኪራይ ጊዜ',
      amount: 'መጠን',
      deposit: 'አስተዳዳሪ',
      accept: 'ተቀበል',
      reject: 'አልተቀበለም',
      markReturned: 'እንደ ተመለሰ ምልክት',
      viewDetails: 'ዝርዝሮችን ተመልከት',
      daysLeft: 'ቀናት ይቀሩታል',
    },
    heroBanners: {
      title: 'ዋና ባነሮች',
      create: 'ባነር ፍጠር',
      edit: 'ባነር አርትዕ',
      publish: 'አሳድር',
      unpublish: 'አልአሳድር',
      delete: 'ሰርዝ',
      titleEn: 'ርዕስ (እንግሊዝኛ)',
      titleAm: 'ርዕስ (አማርኛ)',
      subtitleEn: 'ንዑስ ርዕስ (እንግሊዝኛ)',
      subtitleAm: 'ንዑስ ርዕስ (አማርኛ)',
      imageUrl: 'የምስል URL',
      linkUrl: 'የአገናኝ URL',
      holidayTheme: 'በዓል ገጽታ',
      themeStartDate: 'የገጽታ መጀመሪያ ቀን',
      themeEndDate: 'የገጽታ መጨረሻ ቀን',
      sortOrder: 'የማመስገሪያ ቅደም ተከተል',
      status: 'ሁኔታ',
    },
    vendorKyc: {
      title: 'የከሰራተኛ KYC መገለጫዎች',
      businessName: 'የንግድ ስም',
      businessNameAm: 'የንግድ ስም (አማርኛ)',
      tinNumber: 'የታክስ ቁጥር',
      licenseUrl: 'የፈቃድ URL',
      status: 'ሁኔታ',
      pending: 'በመጠባበቅ ላይ',
      approved: 'ተፈቅዷል',
      rejected: 'ተከልኗል',
      rejectionReason: 'የከልኗልበት ምክንያት',
      review: 'ተመልከት',
      approve: 'ፍቀድ',
      reject: 'አልፍቀድ',
    },
  },
}

export function useTranslation(language: Language = 'en') {
  const t = translations[language]
  return { t, language }
}
