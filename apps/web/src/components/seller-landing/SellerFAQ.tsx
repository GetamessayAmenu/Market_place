'use client'

import React, { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How much does it cost to sell on Habesha Market?',
    answer: 'Creating your seller account is completely free. There are no listing fees or monthly subscriptions. We only charge a 10% commission on successful sales, which covers payment processing, buyer protection, and platform marketing. You only pay when you make money.',
  },
  {
    question: 'How do I receive payments from buyers?',
    answer: 'Payments are processed securely through our integrated payment system supporting Telebirr, CBE Birr, bank transfers, and international cards. Once a buyer confirms delivery (or after the protection period ends), funds are released to your seller wallet. You can withdraw to your bank account or mobile money at any time.',
  },
  {
    question: 'Can I sell both products and offer rentals?',
    answer: 'Absolutely! Your seller dashboard lets you create listings for product sales, rentals, and custom-made orders — all from one account. Many successful sellers combine all three to maximize their revenue streams.',
  },
  {
    question: 'What if a buyer damages my rental item?',
    answer: 'Every rental includes a security deposit collected from the buyer upfront. If an item is returned damaged, you can file a claim through our Seller Protection program. Our team reviews the case with photo evidence and releases the appropriate deposit amount to you.',
  },
  {
    question: 'How does the custom order process work?',
    answer: 'Buyers submit custom order requests with their measurements, fabric preferences, and design details. You review the request, confirm pricing and timeline, then begin production. Our built-in chat lets you communicate directly with the buyer throughout the process. Payment is held securely until the buyer confirms satisfaction.',
  },
  {
    question: 'Do I need to be a registered business to sell?',
    answer: 'No. Individual artisans, tailors, and designers can sell on Habesha Market. However, verified business sellers get a trust badge that increases buyer confidence. We support both individual and registered business accounts.',
  },
  {
    question: 'How do I ship products to buyers?',
    answer: 'We offer flexible delivery options. You can handle delivery yourself (common in Addis Ababa), use our integrated delivery partners for nationwide shipping, or offer buyer pickup. For rental items, you set the pickup and return logistics that work best for your location.',
  },
  {
    question: 'What happens if there is a dispute with a buyer?',
    answer: 'Our dispute resolution team handles all conflicts fairly. We review evidence from both sides — photos, chat messages, and order details. Sellers in good standing with verified identity and consistent quality are protected under our Seller Guarantee program.',
  },
  {
    question: 'Can I sell internationally or only within Ethiopia?',
    answer: 'You can sell to buyers anywhere! While most transactions are within Ethiopia, our platform supports international buyers interested in authentic Ethiopian fashion. International shipping rates and timelines are calculated at checkout.',
  },
  {
    question: 'How do I get my seller account verified?',
    answer: 'Verification is simple: confirm your email and phone number, then submit a government-issued ID. Business sellers can also upload their trade license. Verified sellers get a blue checkmark badge, higher search ranking, and access to premium features.',
  },
]

export default function SellerFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={index} className="py-4">
            <button
              type="button"
              onClick={() => { toggle(index) }}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-foreground pr-4">{item.question}</span>
              <svg
                className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">
                {item.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
