'use client';

import { Card, CardContent, Skeleton } from '@marketplace/ui';
import React from 'react';

export default function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Area Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 hidden sm:block" />
      </div>

      {/* KPIs Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 fashion-lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 fashion-xl:grid-cols-3">
        {/* Left Column - Primary focus */}
        <div className="space-y-6 fashion-xl:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Secondary focus */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[150px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
