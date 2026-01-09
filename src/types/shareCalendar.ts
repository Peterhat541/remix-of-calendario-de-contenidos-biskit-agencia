export interface PostProposal {
  postId: string;
  titleChange?: string;
  copyChange?: string;
  comment?: string;
  note?: string;
}

export interface ProposalData {
  changes: Record<string, PostProposal>;
  generalNotes: string[];
}

export interface ShareDocument {
  id: string;
  calendar_id: string | null;
  visible_months: string[] | null; // Array of month keys like "2025-01" to show. null = show all
  content_json: {
    calendar: {
      client_name: string;
      brand: string;
      channel: string;
      month_start: string;
      month_end: string;
      responsibles?: string[];
    };
    months: Array<{
      month: string;
      year: number | null;
      posts_count: number;
      posts: Array<{
        id: string;
        day_of_month: number | null;
        image: {
          source: 'none' | 'clipboard' | 'file';
          clipboard_data_url: string;
          file_url: string;
        };
        title: string;
        copy: string;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  document_id: string;
  token: string;
  can_view: boolean;
  can_propose: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Proposal {
  id: string;
  document_id: string;
  token: string;
  proposal_json: ProposalData;
  status: 'draft' | 'submitted';
  created_at: string;
  updated_at: string;
}

export function createEmptyProposal(): ProposalData {
  return {
    changes: {},
    generalNotes: []
  };
}

export function getPostProposal(proposal: ProposalData, postId: string): PostProposal {
  return proposal.changes[postId] || {
    postId,
    titleChange: undefined,
    copyChange: undefined,
    comment: undefined,
    note: undefined
  };
}
