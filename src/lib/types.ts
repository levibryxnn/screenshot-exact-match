export interface Citation {
  id: string; publisher: string; title: string; url: string; documentId: string | null;
  eventDate: string | null; publishedAt: string | null; collectedAt: string; verifiedAt: string | null;
  excerpt: string | null; kind: 'primary' | 'secondary'; verification: 'official-import' | 'reviewed' | 'unverified';
}
export interface TimelineEvent { id: string; date: string; title: string; description: string; source: Citation }
export interface Proposal { id: string; code: string; title: string; date: string | null; status: string; source: Citation }
export type LegalStatus = 'allegation'|'investigation'|'formal-accusation'|'ongoing'|'appealable-conviction'|'final-conviction'|'acquittal'|'dismissed'|'annulled'|'other';
export interface LegalRecord {
  id: string; title: string; nature: 'criminal'|'civil'|'electoral'|'administrative'; status: LegalStatus;
  summary: string; body: string; caseNumber: string; individualInvolvement: string;
  defense: string | null; verifiedAt: string; reviewer: string; reviewReason: string;
  source: Citation; history: {date:string; status:LegalStatus; description:string; source:Citation}[];
}
export interface Politician {
  id: string; officialId: number; name: string; fullName: string | null; party: string; uf: string;
  role: string; municipality: string | null; status: string; legislature: number | null;
  photoUrl: string | null; referenceDate: string | null; collectedAt: string;
  coverage: 'historical' | 'live'; education: string | null; source: Citation;
  timeline: TimelineEvent[]; proposals: Proposal[]; legalRecords: LegalRecord[];
}
export interface ImportRun { id: string; startedAt: string; completedAt: string | null; status: 'running'|'success'|'failed'; count: number; message: string; source: string }
export interface Correction {id:string; politicianId:string; subject:string; evidenceUrl:string; submittedAt:string; status:string}
export interface EditorialRecord { id:string; politicianId:string; kind:'fact'|'legal'; title:string; payload:unknown; status:'draft'|'approved'|'rejected'; locked:boolean; reviewer:string|null; reason:string|null; updatedAt:string }
export interface AuditEntry { id:string; action:string; actor:string; reason:string; createdAt:string; recordId:string }
export interface DataStatus {count:number; lastSuccess:string|null; lastRun:ImportRun|null; stale:boolean; coverage:string}
