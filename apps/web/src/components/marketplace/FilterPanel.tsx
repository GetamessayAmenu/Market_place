'use client';

import React from 'react';
import { Card, CardContent, Select } from '@marketplace/ui';

interface FilterPanelProps {
  categories?: { value: string; label: string }[];
  conditions?: { value: string; label: string }[];
  cities?: { value: string; label: string }[];
  onFilterChange?: (filters: Record<string, string>) => void;
}

export function FilterPanel({ categories, conditions, cities, onFilterChange }: FilterPanelProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [selectedCondition, setSelectedCondition] = React.useState<string>('');
  const [selectedCity, setSelectedCity] = React.useState<string>('');

  const handleFilterChange = (key: string, value: string) => {
    const filters: Record<string, string> = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedCondition) filters.condition = selectedCondition;
    if (selectedCity) filters.city = selectedCity;
    filters[key] = value;
    onFilterChange?.(filters);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-3">Category</h3>
          <Select
            options={categories || []}
            placeholder="All Categories"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              handleFilterChange('category', e.target.value);
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold mb-3">Condition</h3>
          <Select
            options={conditions || []}
            placeholder="All Conditions"
            value={selectedCondition}
            onChange={(e) => {
              setSelectedCondition(e.target.value);
              handleFilterChange('condition', e.target.value);
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold mb-3">Location</h3>
          <Select
            options={cities || []}
            placeholder="All Cities"
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              handleFilterChange('city', e.target.value);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
