import React from 'react';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { HelpCenter } from '@/components/help/HelpCenter';
import { ADMIN_NAV } from '@/constants/navigation';

export default function AdminHelpScreen() {
  return (
    <SidebarLayout items={ADMIN_NAV}>
      <HelpCenter />
    </SidebarLayout>
  );
}
