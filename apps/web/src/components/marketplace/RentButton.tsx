'use client';

import React, { useState } from 'react';
import { Button } from '@marketplace/ui';
import RentThisItemModal, { type RentThisItemModalProps } from './RentThisItemModal';

interface RentButtonProps {
  listing: RentThisItemModalProps['listing'];
  isOwner?: boolean;
  className?: string;
}

export default function RentButton({ listing, isOwner, className }: RentButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isOwner) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        Your Item (Rentable)
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="rent"
        size="sm"
        className={className}
        onClick={() => setModalOpen(true)}
      >
        Rent this item
      </Button>

      {modalOpen && (
        <RentThisItemModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          listing={listing}
        />
      )}
    </>
  );
}
