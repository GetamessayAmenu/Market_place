import { ChatService } from '../chat.service';
import { ConversationsRepository } from '../conversations.repository';
import { MessagesRepository } from '../messages.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ChatModule', () => {
  let chatService: ChatService;
  let conversationsRepo: any;
  let messagesRepo: any;
  let notificationsService: any;

  const mockUser = {
    id: 'user-111',
    email: 'buyer@example.com',
    role: 'buyer',
    permissions: [],
    status: 'active',
  } as any;

  const mockSeller = {
    id: 'user-222',
    email: 'seller@example.com',
    role: 'seller',
    permissions: [],
    status: 'active',
  } as any;

  const mockConversation = {
    id: 'conv-123',
    listingId: 'listing-999',
    orderId: null,
    rentalId: null,
    customOrderId: null,
    buyerId: mockUser.id,
    sellerId: mockSeller.id,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isFlagged: false,
    deletedAt: null,
    buyer: { id: mockUser.id, displayName: 'Buyer', email: mockUser.email, avatarUrl: null, phone: '0911000000' },
    seller: { id: mockSeller.id, displayName: 'Seller', email: mockSeller.email, avatarUrl: null, phone: '0911222333' },
    listing: { id: 'listing-999', title: 'Traditional Habesha Dress', slug: 'traditional-habesha-dress', price: 2500, currency: 'ETB', status: 'active', images: [] },
    order: null,
    rental: null,
    customOrderRef: null,
    messages: [],
    _count: { messages: 0 },
  };

  const mockMessage = {
    id: 'msg-555',
    conversationId: 'conv-123',
    senderId: mockUser.id,
    content: 'Hi, is this item available?',
    messageType: 'TEXT',
    attachments: null,
    replyToId: null,
    replyTo: null,
    readAt: null,
    editedAt: null,
    deletedAt: null,
    deliveryStatus: 'SENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    sender: { id: mockUser.id, displayName: 'Buyer', email: mockUser.email, avatarUrl: null },
  };

  beforeEach(async () => {
    conversationsRepo = {
      findById: jest.fn(),
      findByParticipants: jest.fn(),
      findUserConversations: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      markMessagesAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      isUserBlocked: jest.fn().mockResolvedValue(false),
      blockUser: jest.fn().mockResolvedValue({ id: 'block-1' } as any),
      unblockUser: jest.fn().mockResolvedValue({ count: 1 } as any),
      getBlockedUsers: jest.fn().mockResolvedValue([]),
      createReport: jest.fn().mockResolvedValue({ id: 'report-1' } as any),
    };

    messagesRepo = {
      findById: jest.fn(),
      findByConversation: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      markAsRead: jest.fn(),
      softDelete: jest.fn(),
      getUnreadCount: jest.fn().mockResolvedValue(0),
      searchMessages: jest.fn().mockResolvedValue([]),
    };

    notificationsService = {
      createCustomNotification: jest.fn().mockResolvedValue({ id: 'notif-1' } as any),
    };

    chatService = new ChatService(
      conversationsRepo as any,
      messagesRepo as any,
      notificationsService as any
    );
  });

  describe('findOrCreateConversation', () => {
    it('should prevent self-conversation', async () => {
      await expect(
        chatService.findOrCreateConversation(mockUser, mockUser.id)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is blocked', async () => {
      conversationsRepo.isUserBlocked!.mockResolvedValue(true);
      await expect(
        chatService.findOrCreateConversation(mockUser, mockSeller.id)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create new conversation if not found', async () => {
      conversationsRepo.findByParticipants!.mockResolvedValue(null);
      conversationsRepo.create!.mockResolvedValue(mockConversation as any);

      const result = await chatService.findOrCreateConversation(mockUser, mockSeller.id, {
        listingId: 'listing-999',
      });

      expect(conversationsRepo.create).toHaveBeenCalledWith({
        buyerId: mockUser.id,
        sellerId: mockSeller.id,
        listingId: 'listing-999',
      });
      expect(result.id).toEqual('conv-123');
    });
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if conversation does not exist', async () => {
      conversationsRepo.findById!.mockResolvedValue(null);
      await expect(
        chatService.sendMessage('invalid-id', mockUser, { content: 'Hello' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      conversationsRepo.findById!.mockResolvedValue(mockConversation as any);
      const strangerUser = { ...mockUser, id: 'stranger-999' };
      await expect(
        chatService.sendMessage('conv-123', strangerUser, { content: 'Hello' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create message and trigger notification', async () => {
      conversationsRepo.findById!.mockResolvedValue(mockConversation as any);
      messagesRepo.create!.mockResolvedValue(mockMessage as any);

      const res = await chatService.sendMessage('conv-123', mockUser, { content: 'Hi, is this item available?' });

      expect(messagesRepo.create).toHaveBeenCalled();
      expect(notificationsService.createCustomNotification).toHaveBeenCalledWith(
        mockSeller.id,
        'new_message',
        'New message received',
        'Hi, is this item available?',
        expect.any(Object)
      );
      expect(res.id).toEqual('msg-555');
    });
  });

  describe('blockUser & reportMessageOrUser', () => {
    it('should block user', async () => {
      const res = await chatService.blockUser(mockUser, mockSeller.id, 'Spam');
      expect(conversationsRepo.blockUser).toHaveBeenCalledWith(mockUser.id, mockSeller.id, 'Spam');
      expect(res.success).toBe(true);
    });

    it('should report user', async () => {
      const res = await chatService.reportMessageOrUser(mockUser, {
        targetType: 'user',
        reportedUserId: mockSeller.id,
        reason: 'Harassment',
      });
      expect(conversationsRepo.createReport).toHaveBeenCalledWith({
        reporterId: mockUser.id,
        targetType: 'user',
        reportedUserId: mockSeller.id,
        reason: 'Harassment',
      });
      expect(res.id).toBe('report-1');
    });
  });
});
