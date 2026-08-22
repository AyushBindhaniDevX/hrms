/**
 * Pulse Surveys & eNPS Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { PulseSurvey } from '@/types/database';

let SURVEYS_STORE: PulseSurvey[] = [
  {
    id: 'srv_1',
    organization_id: 'subedge_org',
    title: 'Q1 2026 Workplace Happiness & Team Collaboration',
    question: 'How satisfied are you with your team’s tooling and psychological safety?',
    type: 'rating_1_5',
    status: 'active',
    responses_count: 48,
    average_score: 4.7,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'srv_2',
    organization_id: 'subedge_org',
    title: 'Employee Net Promoter Score (eNPS)',
    question: 'On a scale of 1-10, how likely are you to recommend Subedge Technology as a great place to work?',
    type: 'enps_1_10',
    status: 'active',
    responses_count: 52,
    average_score: 9.2,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'srv_3',
    organization_id: 'subedge_org',
    title: 'Hybrid Office Ergonomics & Amenities',
    question: 'Do you have all the hardware and ergonomic support needed for high productivity?',
    type: 'yes_no',
    status: 'closed',
    responses_count: 60,
    average_score: 4.5,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export async function getSurveys(): Promise<PulseSurvey[]> {
  return [...SURVEYS_STORE];
}

export async function submitSurveyResponse(surveyId: string, score: number): Promise<void> {
  const survey = SURVEYS_STORE.find((s) => s.id === surveyId);
  if (!survey) throw new Error('Survey not found');
  const totalScore = survey.average_score * survey.responses_count + score;
  survey.responses_count += 1;
  survey.average_score = Math.round((totalScore / survey.responses_count) * 10) / 10;
}

export async function createSurvey(survey: Omit<PulseSurvey, 'id' | 'responses_count' | 'average_score' | 'created_at'>): Promise<PulseSurvey> {
  const newSurvey: PulseSurvey = {
    ...survey,
    id: `srv_${Date.now()}`,
    responses_count: 0,
    average_score: 5.0,
    created_at: new Date().toISOString(),
  };
  SURVEYS_STORE.unshift(newSurvey);
  return newSurvey;
}
