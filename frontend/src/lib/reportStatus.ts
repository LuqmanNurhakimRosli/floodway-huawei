// One place that decides what a report's status means and how it is worded, so a card, a stat and a filter can never
// disagree. HONESTY: nothing here is an official verification. The operator desk is FloodWay's own review step, and a "human verified"
// report only means an operator pressed Verify in the app (no agency is involved); "published" can also mean demo seed data.
import type { CitizenReport } from '../types';

export type ReportKind = 'reviewed' | 'seed' | 'ai' | 'unverified' | 'rejected';

export interface ReportStatusInfo {
  kind: ReportKind;
  /** Short pill text. */
  pill: string;
  /** Wording for the "Verification" tile. */
  tile: string;
  /** Appears in the public feed. */
  published: boolean;
  /** Waits in the review desk. */
  awaitingReview: boolean;
}

export function reportStatusInfo(status: CitizenReport['status']): ReportStatusInfo {
  switch (status) {
    case 'OFFICIAL_VERIFIED':
      return { kind: 'reviewed', pill: 'HUMAN VERIFIED', tile: 'Human verified', published: true, awaitingReview: false };
    case 'VERIFIED':
      return { kind: 'seed', pill: 'DEMO DATA', tile: 'Demo data', published: true, awaitingReview: false };
    case 'AI_VERIFIED':
      return { kind: 'ai', pill: 'AI CHECKED', tile: 'AI checked', published: false, awaitingReview: true };
    case 'REJECTED':
      return { kind: 'rejected', pill: 'REJECTED', tile: 'Rejected', published: false, awaitingReview: false };
    default:
      return { kind: 'unverified', pill: 'UNVERIFIED', tile: 'Unverified', published: false, awaitingReview: true };
  }
}

export interface ReportCounts {
  total: number;
  published: number;
  awaitingReview: number;
  /** Reports whose photo an AI check actually assessed. */
  aiAssessed: number;
}

export function countReports(reports: CitizenReport[]): ReportCounts {
  const visible = reports.filter((r) => r.status !== 'REJECTED');
  return {
    total: visible.length,
    published: visible.filter((r) => reportStatusInfo(r.status).published).length,
    awaitingReview: visible.filter((r) => reportStatusInfo(r.status).awaitingReview).length,
    aiAssessed: visible.filter((r) => r.status === 'AI_VERIFIED' || r.aiVerification?.ran === true).length,
  };
}
