'use client'

import React, { useState } from 'react'

interface RevealContactProps {
  phoneNumber?: string | null | undefined
}

const RevealContact = ({ phoneNumber }: RevealContactProps) => {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <button
      onClick={() => setIsRevealed(true)}
      className="w-full rounded-lg border bg-muted/50 p-3 text-center text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
    >
      {isRevealed ? (phoneNumber || 'Contact seller for phone number') : 'Show contact'}
    </button>
  )
}

export default RevealContact
