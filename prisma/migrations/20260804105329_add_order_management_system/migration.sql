-- Drop existing orders table if it exists
DROP TABLE IF EXISTS orders CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS "OrderType" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;

-- Create new OrderType enum
CREATE TYPE "OrderType" AS ENUM ('SALE', 'RENTAL', 'CUSTOM_TAILORING');

-- Create new OrderStatus enum
CREATE TYPE "OrderStatus" AS ENUM ('INQUIRY_PENDING', 'QUOTE_PROPOSED', 'APPROVED_RESERVED', 'READY_FOR_HANDOVER', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'MEASUREMENTS_SUBMITTED', 'FABRIC_CUTTING', 'TAILORING_IN_PROGRESS', 'FITTING_READY', 'HANDOVER_PENDING_DEPOSIT', 'RENTAL_ACTIVE', 'RETURN_INITIATED', 'RETURNED_INSPECTED');

-- Create the new orders table with the updated structure
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    type "OrderType" NOT NULL,
    status "OrderStatus" NOT NULL DEFAULT 'INQUIRY_PENDING',
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES listings(id),
    conversation_id UUID UNIQUE REFERENCES conversations(id),
    agreed_price DECIMAL(10,2) NOT NULL,
    agreed_deposit DECIMAL(10,2),
    offline_deposit_refunded BOOLEAN DEFAULT false,
    custom_measurements JSONB,
    fitting_date TIMESTAMP,
    rental_start_date TIMESTAMP,
    rental_end_date TIMESTAMP,
    extension_days_requested INTEGER DEFAULT 0,
    extension_approved BOOLEAN,
    pre_handover_photos TEXT[] DEFAULT '{}',
    post_return_photos TEXT[] DEFAULT '{}',
    dispute_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX orders_seller_status_idx ON orders(seller_id, status);
CREATE INDEX orders_buyer_status_idx ON orders(buyer_id, status);
CREATE INDEX orders_order_number_idx ON orders(order_number);

-- Create the custom_quotes table
CREATE TABLE custom_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    offered_by_user_id UUID NOT NULL REFERENCES users(id),
    proposed_price DECIMAL(10,2) NOT NULL,
    proposed_deposit DECIMAL(10,2),
    notes TEXT,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX custom_quotes_order_idx ON custom_quotes(order_id);
CREATE INDEX custom_quotes_offered_by_idx ON custom_quotes(offered_by_user_id);