import type { UpdateListingDto } from '../dto/update-listing.dto';

export type RiskLevel = 'LOW' | 'SIGNIFICANT' | 'HIGH';

export interface ClassificationResult {
  requiresReview: boolean;
  riskLevel: RiskLevel;
  changedFields: string[];
  diffSummary: Record<string, { old: any; new: any }>;
}

/**
 * Calculates Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = new Array<number>(a.length + 1).fill(0);
    const row = matrix[i];
    if (row) {
      row[0] = i;
    }
  }

  const firstRow = matrix[0];
  if (firstRow) {
    for (let j = 0; j <= a.length; j++) {
      firstRow[j] = j;
    }
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const row = matrix[i];
      const prevRow = matrix[i - 1];
      if (row && prevRow) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          row[j] = prevRow[j - 1] ?? 0;
        } else {
          row[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1, // substitution
            (row[j - 1] ?? 0) + 1,     // insertion
            (prevRow[j] ?? 0) + 1,     // deletion
          );
        }
      }
    }
  }

  return matrix[b.length]?.[a.length] ?? Math.max(a.length, b.length);
}

/**
 * Calculates similarity ratio between 0 and 1.
 */
function stringSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  const distance = levenshteinDistance(a, b);
  return (maxLength - distance) / maxLength;
}

export function classifyListingChanges(
  existing: Record<string, any>,
  dto: UpdateListingDto,
): ClassificationResult {
  const changedFields: string[] = [];
  const diffSummary: Record<string, { old: any; new: any }> = {};

  let isHighRisk = false;
  let isSignificant = false;

  // 🔴 1. ALWAYS REQUIRE ADMIN REVIEW (HIGH RISK)

  // Primary image replacement or reorder
  if (dto.images && dto.images.length > 0) {
    const oldImages: any[] = existing.images || [];
    const oldPrimary = oldImages.find((img) => img.isPrimary) || oldImages[0];
    const newPrimary = dto.images.find((img) => img.isPrimary) || dto.images[0];

    const oldPrimaryId = oldPrimary?.cloudinaryPublicId || oldPrimary?.url;
    const newPrimaryId = newPrimary?.cloudinaryPublicId || newPrimary?.url;

    if (oldPrimaryId !== newPrimaryId) {
      isHighRisk = true;
      changedFields.push('primaryImage');
      diffSummary['primaryImage'] = {
        old: oldPrimaryId ?? null,
        new: newPrimaryId ?? null,
      };
    }
  }

  // Category or Subcategory change
  if (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId) {
    isHighRisk = true;
    changedFields.push('categoryId');
    diffSummary['categoryId'] = {
      old: existing.categoryId,
      new: dto.categoryId,
    };
  }

  // Sale ↔ Rent toggle flip
  const oldPurchase = Boolean(existing.availableForPurchase);
  const newPurchase = dto.availableForPurchase !== undefined ? Boolean(dto.availableForPurchase) : oldPurchase;
  const oldRent = Boolean(existing.availableForRent);
  const newRent = dto.availableForRent !== undefined ? Boolean(dto.availableForRent) : oldRent;

  if (oldPurchase !== newPurchase || oldRent !== newRent) {
    if ((oldPurchase && !oldRent && !newPurchase && newRent) || (!oldPurchase && oldRent && newPurchase && !newRent)) {
      isHighRisk = true;
      changedFields.push('listingModeFlip');
      diffSummary['listingModeFlip'] = {
        old: { sale: oldPurchase, rent: oldRent },
        new: { sale: newPurchase, rent: newRent },
      };
    } else {
      isSignificant = true;
      changedFields.push('availabilityOptions');
      diffSummary['availabilityOptions'] = {
        old: { sale: oldPurchase, rent: oldRent },
        new: { sale: newPurchase, rent: newRent },
      };
    }
  }

  // Condition change
  if (dto.condition !== undefined && dto.condition !== existing.condition) {
    isHighRisk = true;
    changedFields.push('condition');
    diffSummary['condition'] = {
      old: existing.condition,
      new: dto.condition,
    };
  }

  // Custom-made availability change
  const oldCustom = Boolean(existing.customOrderAvailable || existing.supportsCustomDesign);
  const newCustomOrder = dto.customOrderAvailable !== undefined ? Boolean(dto.customOrderAvailable) : Boolean(existing.customOrderAvailable);
  const newSupportsCustom = dto.supportsCustomDesign !== undefined ? Boolean(dto.supportsCustomDesign) : Boolean(existing.supportsCustomDesign);
  const newCustom = newCustomOrder || newSupportsCustom;

  if (oldCustom !== newCustom) {
    isHighRisk = true;
    changedFields.push('customOrderAvailable');
    diffSummary['customOrderAvailable'] = {
      old: oldCustom,
      new: newCustom,
    };
  }

  // 🟡 2. SIGNIFICANT CHANGES (ADMIN REVIEW REQUIRED)

  // Price change > 10%
  if (dto.price !== undefined) {
    const oldPrice = Number(existing.price);
    const newPrice = Number(dto.price);
    if (oldPrice > 0) {
      const priceDiffRatio = Math.abs((newPrice - oldPrice) / oldPrice);
      if (priceDiffRatio > 0.10) {
        isSignificant = true;
        changedFields.push('price');
        diffSummary['price'] = { old: oldPrice, new: newPrice };
      } else if (priceDiffRatio > 0) {
        if (!changedFields.includes('price')) {
          changedFields.push('price');
          diffSummary['price'] = { old: oldPrice, new: newPrice };
        }
      }
    }
  }

  // Major title change
  if (dto.title !== undefined && dto.title !== existing.title) {
    const sim = stringSimilarity(existing.title || '', dto.title);
    if (sim < 0.80 || Math.abs((existing.title || '').length - dto.title.length) > 10) {
      isSignificant = true;
    }
    if (!changedFields.includes('title')) {
      changedFields.push('title');
      diffSummary['title'] = { old: existing.title, new: dto.title };
    }
  }

  // Major description change
  if (dto.description !== undefined && dto.description !== existing.description) {
    const sim = stringSimilarity(existing.description || '', dto.description);
    if (sim < 0.75 || Math.abs((existing.description || '').length - dto.description.length) > 50) {
      isSignificant = true;
    }
    if (!changedFields.includes('description')) {
      changedFields.push('description');
      diffSummary['description'] = { old: existing.description, new: dto.description };
    }
  }

  // Secondary images changes
  if (dto.images && dto.images.length > 0) {
    const oldImages: any[] = existing.images || [];
    if (dto.images.length !== oldImages.length) {
      isSignificant = true;
      if (!changedFields.includes('images')) {
        changedFields.push('images');
        diffSummary['images'] = { old: oldImages.length, new: dto.images.length };
      }
    }
  }

  // Attributes: size, color, material
  if (dto.attributes !== undefined && JSON.stringify(dto.attributes) !== JSON.stringify(existing.attributes)) {
    const oldAttrs = existing.attributes || {};
    const newAttrs = dto.attributes || {};
    if (
      oldAttrs.size !== newAttrs.size ||
      oldAttrs.color !== newAttrs.color ||
      oldAttrs.material !== newAttrs.material ||
      oldAttrs.fabric !== newAttrs.fabric
    ) {
      isSignificant = true;
    }
    if (!changedFields.includes('attributes')) {
      changedFields.push('attributes');
      diffSummary['attributes'] = { old: oldAttrs, new: newAttrs };
    }
  }

  // Location change
  if (
    (dto.city !== undefined && dto.city !== existing.city) ||
    (dto.country !== undefined && dto.country !== existing.country) ||
    (dto.state !== undefined && dto.state !== existing.state)
  ) {
    isSignificant = true;
    if (!changedFields.includes('location')) {
      changedFields.push('location');
      diffSummary['location'] = {
        old: { city: existing.city, state: existing.state, country: existing.country },
        new: { city: dto.city ?? existing.city, state: dto.state ?? existing.state, country: dto.country ?? existing.country },
      };
    }
  }

  // Final Risk Classification
  let riskLevel: RiskLevel = 'LOW';
  if (isHighRisk) {
    riskLevel = 'HIGH';
  } else if (isSignificant) {
    riskLevel = 'SIGNIFICANT';
  }

  const requiresReview = isHighRisk || isSignificant;

  return {
    requiresReview,
    riskLevel,
    changedFields,
    diffSummary,
  };
}
