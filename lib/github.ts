import { PrComment } from "./types";

const GITHUB_API = "https://api.github.com";

// GitHub org that owns the EIPs/ERCs repos in production
const DEFAULT_OWNER = "ethereum";

export interface PrDetail {
  repo: string;
  number: number;
  title: string;
  author: string;
  state: "open" | "closed" | "merged";
  comments: PrComment[];
}

export async function fetchPrDetail(repo: string, number: number): Promise<PrDetail> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return mockPrDetail(repo, number);
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    const [prRes, issueCommentsRes, reviewCommentsRes] = await Promise.all([
      fetch(`${GITHUB_API}/repos/${DEFAULT_OWNER}/${repo}/pulls/${number}`, { headers }),
      fetch(`${GITHUB_API}/repos/${DEFAULT_OWNER}/${repo}/issues/${number}/comments`, { headers }),
      fetch(`${GITHUB_API}/repos/${DEFAULT_OWNER}/${repo}/pulls/${number}/comments`, { headers }),
    ]);

    if (!prRes.ok) throw new Error(`GitHub API error: ${prRes.status}`);

    const pr = await prRes.json();
    const issueComments = issueCommentsRes.ok ? await issueCommentsRes.json() : [];
    const reviewComments = reviewCommentsRes.ok ? await reviewCommentsRes.json() : [];

    const comments: PrComment[] = [
      ...issueComments.map((c: any) => ({
        id: String(c.id),
        author: c.user?.login ?? "unknown",
        body: c.body ?? "",
        createdAt: c.created_at,
        isReviewComment: false,
      })),
      ...reviewComments.map((c: any) => ({
        id: String(c.id),
        author: c.user?.login ?? "unknown",
        body: c.body ?? "",
        createdAt: c.created_at,
        isReviewComment: true,
      })),
    ];

    return {
      repo,
      number,
      title: pr.title,
      author: pr.user?.login ?? "unknown",
      state: pr.merged ? "merged" : pr.state,
      comments,
    };
  } catch (err) {
    // fall back to mock data rather than hard-failing the editor's workflow
    return mockPrDetail(repo, number);
  }
}

function mockPrDetail(repo: string, number: number): PrDetail {
  return {
    repo,
    number,
    title: "Clarify gas accounting edge case in Section 4 (Specification)",
    author: "protocol-contributor",
    state: "open",
    comments: [
      {
        id: "c1",
        author: "editor-alix",
        body: "Thanks for the PR. Can you clarify how this interacts with the existing refund logic mentioned in EIP-3529? It's not obvious from the diff alone.",
        createdAt: "2026-06-20T10:03:00Z",
        isReviewComment: true,
      },
      {
        id: "c2",
        author: "protocol-contributor",
        body: "Good catch — I added a paragraph explaining that refunds are computed before this new accounting step runs, so there's no double-count. Updated in the latest commit.",
        createdAt: "2026-06-20T14:22:00Z",
        isReviewComment: false,
      },
      {
        id: "c3",
        author: "reviewer-dao",
        body: "LGTM on the refund clarification. One remaining concern: the spec doesn't say what clients should do if the accounting step overflows on very large blocks. Should that be explicit?",
        createdAt: "2026-06-21T09:10:00Z",
        isReviewComment: true,
      },
      {
        id: "c4",
        author: "editor-alix",
        body: "Agreed, the overflow case should be explicit rather than implied. This is blocking until addressed.",
        createdAt: "2026-06-21T11:45:00Z",
        isReviewComment: false,
      },
      {
        id: "c5",
        author: "protocol-contributor",
        body: "Why would this overflow in practice though? Block gas limits already bound the input size well below u64 range. I think this is a non-issue but happy to add a note either way.",
        createdAt: "2026-06-21T13:02:00Z",
        isReviewComment: false,
      },
      {
        id: "c6",
        author: "reviewer-dao",
        body: "Fair point on the practical bound. I'm satisfied — a short note for future client implementers is still worth adding, but it's no longer blocking for me.",
        createdAt: "2026-06-22T08:30:00Z",
        isReviewComment: true,
      },
      {
        id: "c7",
        author: "editor-alix",
        body: "Formatting nit: the new section should use sentence case for the heading to match the rest of the EIP.",
        createdAt: "2026-06-22T09:00:00Z",
        isReviewComment: true,
      },
      {
        id: "c8",
        author: "protocol-contributor",
        body: "Fixed the heading casing.",
        createdAt: "2026-06-22T09:40:00Z",
        isReviewComment: false,
      },
    ],
  };
}
