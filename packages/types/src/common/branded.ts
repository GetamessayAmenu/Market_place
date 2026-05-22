/** Branded types for compile-time safety across package boundaries. */

export type Uuid = string & { readonly __brand: unique symbol };

export type IsoDateTime = string & { readonly __brand: unique symbol };
