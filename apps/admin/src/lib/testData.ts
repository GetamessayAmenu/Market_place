import type { VerificationRequest } from './adminApi'

export const mockVerificationRequests: VerificationRequest[] = [
  {
    id: '1',
    userId: 'user-1',
    type: 'seller_verification',
    status: 'pending',
    documentUrl: 'https://example.com/doc1.pdf',
    notes: 'I would like to become a verified seller on the platform.',
    reviewerNotes: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    user: {
      id: 'user-1',
      displayName: 'John Doe',
      email: 'john.doe@example.com'
    },
    businessInfo: {
      businessName: 'Doe Enterprises LLC',
      businessType: 'LLC',
      taxId: '12-3456789',
      registrationNumber: 'REG-2024-001',
      address: '123 Business Ave, Suite 100',
      city: 'New York',
      country: 'United States'
    },
    storeInfo: {
      storeName: 'Doe Electronics',
      storeDescription: 'Premium electronics and accessories',
      storeUrl: 'https://doeelectronics.example.com',
      category: 'Electronics'
    },
    identityDocument: {
      type: 'passport',
      documentNumber: 'P123456789',
      expiryDate: '2028-12-31',
      frontUrl: 'https://example.com/passport-front.jpg',
      backUrl: 'https://example.com/passport-back.jpg'
    },
    documents: [
      { type: 'business_license', url: 'https://example.com/license.pdf' },
      { type: 'tax_document', url: 'https://example.com/tax.pdf' }
    ],
    history: []
  },
  {
    id: '2',
    userId: 'user-2',
    type: 'seller_verification',
    status: 'under_review',
    documentUrl: 'https://example.com/doc2.pdf',
    notes: 'Applying for seller verification with my online store.',
    reviewerNotes: null,
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    user: {
      id: 'user-2',
      displayName: 'Jane Smith',
      email: 'jane.smith@example.com'
    },
    businessInfo: {
      businessName: 'Smith Retail Inc',
      businessType: 'Corporation',
      taxId: '98-7654321',
      registrationNumber: 'REG-2024-002',
      address: '456 Commerce St',
      city: 'Los Angeles',
      country: 'United States'
    },
    storeInfo: {
      storeName: 'Smith Fashion',
      storeDescription: 'Trendy clothing and accessories',
      storeUrl: 'https://smithfashion.example.com',
      category: 'Fashion'
    },
    identityDocument: {
      type: 'drivers_license',
      documentNumber: 'DL987654321',
      expiryDate: '2027-06-15',
      frontUrl: 'https://example.com/license-front.jpg',
      backUrl: 'https://example.com/license-back.jpg'
    },
    documents: [
      { type: 'business_license', url: 'https://example.com/license2.pdf' }
    ],
    history: [
      {
        id: 'h1',
        action: 'start_review',
        status: 'under_review',
        notes: 'Started review process',
        actorId: 'admin-1',
        actorName: 'Admin User',
        createdAt: '2024-01-15T09:00:00Z'
      }
    ]
  },
  {
    id: '3',
    userId: 'user-3',
    type: 'identity_verification',
    status: 'approved',
    documentUrl: 'https://example.com/doc3.pdf',
    notes: 'Identity verification for personal account.',
    reviewerNotes: 'All documents verified successfully.',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-12T16:30:00Z',
    user: {
      id: 'user-3',
      displayName: 'Bob Johnson',
      email: 'bob.johnson@example.com'
    },
    businessInfo: null,
    storeInfo: null,
    identityDocument: {
      type: 'national_id',
      documentNumber: 'ID555666777',
      expiryDate: '2029-03-20',
      frontUrl: 'https://example.com/id-front.jpg',
      backUrl: null
    },
    documents: [],
    history: [
      {
        id: 'h2',
        action: 'start_review',
        status: 'under_review',
        notes: 'Started identity verification review',
        actorId: 'admin-1',
        actorName: 'Admin User',
        createdAt: '2024-01-11T10:00:00Z'
      },
      {
        id: 'h3',
        action: 'approve',
        status: 'approved',
        notes: 'All documents verified successfully',
        actorId: 'admin-1',
        actorName: 'Admin User',
        createdAt: '2024-01-12T16:30:00Z'
      }
    ]
  },
  {
    id: '4',
    userId: 'user-4',
    type: 'business_verification',
    status: 'rejected',
    documentUrl: 'https://example.com/doc4.pdf',
    notes: 'Business verification for new company.',
    reviewerNotes: 'Tax ID could not be verified. Please provide valid documentation.',
    createdAt: '2024-01-08T11:45:00Z',
    updatedAt: '2024-01-09T14:20:00Z',
    user: {
      id: 'user-4',
      displayName: 'Alice Williams',
      email: 'alice.williams@example.com'
    },
    businessInfo: {
      businessName: 'Williams Startup',
      businessType: 'Sole Proprietorship',
      taxId: 'INVALID-ID',
      registrationNumber: 'REG-2024-003',
      address: '789 Innovation Blvd',
      city: 'San Francisco',
      country: 'United States'
    },
    storeInfo: null,
    identityDocument: null,
    documents: [
      { type: 'business_license', url: 'https://example.com/license3.pdf' },
      { type: 'tax_document', url: 'https://example.com/tax3.pdf' }
    ],
    history: [
      {
        id: 'h4',
        action: 'start_review',
        status: 'under_review',
        notes: 'Started business verification review',
        actorId: 'admin-2',
        actorName: 'Super Admin',
        createdAt: '2024-01-09T09:00:00Z'
      },
      {
        id: 'h5',
        action: 'reject',
        status: 'rejected',
        notes: 'Tax ID could not be verified. Please provide valid documentation.',
        actorId: 'admin-2',
        actorName: 'Super Admin',
        createdAt: '2024-01-09T14:20:00Z'
      }
    ]
  },
  {
    id: '5',
    userId: 'user-5',
    type: 'seller_verification',
    status: 'changes_requested',
    documentUrl: 'https://example.com/doc5.pdf',
    notes: 'Seller verification application.',
    reviewerNotes: 'Please update your store description and provide additional business documents.',
    createdAt: '2024-01-07T15:30:00Z',
    updatedAt: '2024-01-08T11:00:00Z',
    user: {
      id: 'user-5',
      displayName: 'Charlie Brown',
      email: 'charlie.brown@example.com'
    },
    businessInfo: {
      businessName: 'Brown Goods Co',
      businessType: 'LLC',
      taxId: '33-4455667',
      registrationNumber: 'REG-2024-004',
      address: '321 Market St',
      city: 'Chicago',
      country: 'United States'
    },
    storeInfo: {
      storeName: 'Brown Home Goods',
      storeDescription: 'Home goods and furniture',
      storeUrl: 'https://brownhome.example.com',
      category: 'Home & Garden'
    },
    identityDocument: {
      type: 'passport',
      documentNumber: 'P987654321',
      expiryDate: '2026-11-30',
      frontUrl: 'https://example.com/passport2-front.jpg',
      backUrl: 'https://example.com/passport2-back.jpg'
    },
    documents: [
      { type: 'business_license', url: 'https://example.com/license4.pdf' }
    ],
    history: [
      {
        id: 'h6',
        action: 'start_review',
        status: 'under_review',
        notes: 'Started review process',
        actorId: 'admin-1',
        actorName: 'Admin User',
        createdAt: '2024-01-08T09:00:00Z'
      },
      {
        id: 'h7',
        action: 'request_changes',
        status: 'changes_requested',
        notes: 'Please update your store description and provide additional business documents.',
        actorId: 'admin-1',
        actorName: 'Admin User',
        createdAt: '2024-01-08T11:00:00Z'
      }
    ]
  }
]

export const mockPaginatedResponse = {
  success: true,
  data: mockVerificationRequests,
  meta: {
    total: 5,
    page: 1,
    limit: 10,
    totalPages: 1
  }
}
