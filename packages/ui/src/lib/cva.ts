import { cn } from './cn';

/**
 * Lightweight Class Variant Authority (CVA) implementation.
 * Creates variant-based component classes with compound variant support.
 */

type VariantValue = string | null | undefined;

type VariantConfig = Record<string, Record<string, string>>;

type CompoundVariant<T extends VariantConfig> = {
  [K in keyof T]?: T[K] extends Record<infer V, unknown> ? V : never;
} & { class: string };

type VariantProps<T extends VariantConfig> = {
  [K in keyof T]?: T[K] extends Record<infer V, unknown> ? V : never;
};

export interface CVAConfig<T extends VariantConfig> {
  base?: string;
  variants: T;
  defaultVariants?: Partial<VariantProps<T>>;
  compoundVariants?: CompoundVariant<T>[];
}

export function cva<T extends VariantConfig>(config: CVAConfig<T>) {
  const { base = '', variants, defaultVariants = {}, compoundVariants = [] } = config;

  return (props?: VariantProps<T> & { class?: string; className?: string }) => {
    const mergedProps = { ...defaultVariants, ...props } as Record<string, VariantValue>;

    let classes = base;

    // Apply variant classes
    for (const [variantKey, variantValue] of Object.entries(mergedProps)) {
      if (variantKey === 'class' || variantKey === 'className') continue;
      const variant = variants[variantKey];
      if (variant && variantValue && variant[variantValue]) {
        classes = cn(classes, variant[variantValue]);
      }
    }

    // Apply compound variants
    for (const compound of compoundVariants) {
      const { class: compoundClass, ...conditions } = compound as Record<string, unknown>;
      let matches = true;
      for (const [key, value] of Object.entries(conditions)) {
        if (mergedProps[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches && typeof compoundClass === 'string') {
        classes = cn(classes, compoundClass);
      }
    }

    // Apply external class/className
    const externalClass = props?.class ?? props?.className;
    if (externalClass) {
      classes = cn(classes, externalClass);
    }

    return classes;
  };
}
