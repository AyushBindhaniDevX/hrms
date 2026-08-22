/**
 * Rewards & Recognition Store Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { RewardItem, RewardClaim } from '@/types/database';

let REWARDS_STORE: RewardItem[] = [
  {
    id: 'rew_1',
    organization_id: 'subedge_org',
    title: 'Amazon / Flipkart E-Gift Voucher (₹2,500)',
    points_required: 250,
    category: 'gift_card',
    stock: 50,
    description: 'Instant digital shopping voucher delivered to your work email.',
  },
  {
    id: 'rew_2',
    organization_id: 'subedge_org',
    title: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    points_required: 1800,
    category: 'gadget',
    stock: 8,
    description: 'Industry-leading noise cancelling wireless headphones for deep focus work.',
  },
  {
    id: 'rew_3',
    organization_id: 'subedge_org',
    title: 'Subedge Limited Edition Swag Kit (Hoodie, Bottle & Backpack)',
    points_required: 400,
    category: 'merch',
    stock: 25,
    description: 'Premium organic cotton embroidered team hoodie, thermal bottle and laptop bag.',
  },
  {
    id: 'rew_4',
    organization_id: 'subedge_org',
    title: 'Luxury Weekend Wellness & Spa Retreat',
    points_required: 2500,
    category: 'experience',
    stock: 5,
    description: 'All-expenses-paid 2-day resort getaway for top performers.',
  },
];

let CLAIMS_STORE: RewardClaim[] = [
  {
    id: 'clm_1',
    employee_id: 'emp_demo',
    reward_id: 'rew_1',
    points_spent: 250,
    status: 'delivered',
    claimed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export async function getRewards(): Promise<RewardItem[]> {
  return [...REWARDS_STORE];
}

export async function getEmployeePoints(employeeId: string): Promise<number> {
  return 850; // Mock current balance
}

export async function claimReward(employeeId: string, rewardId: string): Promise<RewardClaim> {
  const reward = REWARDS_STORE.find((r) => r.id === rewardId);
  if (!reward) throw new Error('Reward not found');
  if (reward.stock <= 0) throw new Error('Out of stock');

  reward.stock -= 1;
  const newClaim: RewardClaim = {
    id: `clm_${Date.now()}`,
    employee_id: employeeId,
    reward_id: rewardId,
    points_spent: reward.points_required,
    status: 'pending',
    claimed_at: new Date().toISOString(),
  };
  CLAIMS_STORE.unshift(newClaim);
  return newClaim;
}
