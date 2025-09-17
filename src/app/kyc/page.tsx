'use client'

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import SimpleTieredKyc from '@/components/kyc/SimpleTieredKyc';

const KycPage = () => {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <SimpleTieredKyc />
      </div>
    </AuthGuard>
  );
};

export default KycPage;
