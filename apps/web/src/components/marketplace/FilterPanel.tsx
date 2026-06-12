"use client"
import { Button, Input, Select, type SelectOption } from '@marketplace/ui';
import React, { useState } from 'react';

export interface FilterValues {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  city?: string;
}

export interface FilterPanelProps {
  categories?: SelectOption[];
  conditions?: SelectOption[];
  cities?: SelectOption[];
  initialValues?: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset?: () => void;
}

export default function FilterPanel({
  categories = [],
  conditions = [],
  cities = [],
  initialValues = {},
  onApply,
  onReset,
}: FilterPanelProps) {
  const [values, setValues] = useState<FilterValues>(initialValues);

  const updateValue = (key: keyof FilterValues, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-card-foreground">Filters</h3>

      {categories.length > 0 && (
        <Select
          label="Category"
          options={categories}
          placeholder="All categories"
          value={values.category ?? ''}
          onChange={(e) => { updateValue('category', e.target.value); }}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min Price"
          type="number"
          placeholder="0"
          value={values.minPrice ?? ''}
          onChange={(e) => { updateValue('minPrice', e.target.value); }}
        />
        <Input
          label="Max Price"
          type="number"
          placeholder="Any"
          value={values.maxPrice ?? ''}
          onChange={(e) => { updateValue('maxPrice', e.target.value); }}
        />
      </div>

      {conditions.length > 0 && (
        <Select
          label="Condition"
          options={conditions}
          placeholder="Any condition"
          value={values.condition ?? ''}
          onChange={(e) => { updateValue('condition', e.target.value); }}
        />
      )}

      {cities.length > 0 && (
        <Select
          label="City"
          options={cities}
          placeholder="All cities"
          value={values.city ?? ''}
          onChange={(e) => { updateValue('city', e.target.value); }}
        />
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={() => { onApply(values); }} className="flex-1">
          Apply
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setValues({});
            onReset?.();
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
