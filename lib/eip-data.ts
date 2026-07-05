import { EipChunk } from "./types";

/**
 * MOCK CORPUS
 * ------------------------------------------------------------------
 * In production, replace this with a real ingestion pipeline:
 *   1. Clone/sync https://github.com/ethereum/EIPs (and EIPs/ERCs repos)
 *   2. Parse each EIP's markdown front-matter + body into sections
 *      (Simple Summary, Motivation, Specification, Rationale,
 *      Backwards Compatibility, Security Considerations, etc.)
 *   3. Chunk each section and embed it (e.g. Cohere embed-english-v3.0)
 *   4. Store chunks + vectors in a vector DB (pgvector, Pinecone, etc.)
 *   5. Replace `searchEipContent` below with a real vector similarity
 *      search (top-k retrieval) instead of the keyword match used here.
 *
 * The chunks below are short, hand-written excerpts (not verbatim spec
 * text) purely so the RAG pipeline has something real to retrieve and
 * the chat UI has something to demo end-to-end without network access.
 * ------------------------------------------------------------------
 */
const CORPUS: EipChunk[] = [
  {
    eip: "EIP-1559",
    title: "Fee Market Change for ETH 1.0 Chain",
    section: "Summary",
    content:
      "Introduces a base fee per block that is burned and adjusts up or down depending on how full the previous block was, plus an optional priority fee (tip) paid to the block producer.",
  },
  {
    eip: "EIP-1559",
    title: "Fee Market Change for ETH 1.0 Chain",
    section: "Security Considerations",
    content:
      "Discusses risk of miners/validators manipulating block fullness to push the base fee in a favorable direction, potential for base fee 'oscillation' attacks across blocks, and the importance of the 12.5% max per-block adjustment rate in bounding how quickly fees can change. Also covers concerns about the transition period where legacy transactions coexist with the new fee mechanism.",
  },
  {
    eip: "EIP-1559",
    title: "Fee Market Change for ETH 1.0 Chain",
    section: "Backwards Compatibility",
    content:
      "Legacy transaction types remain valid; wallets and tooling need updates to construct the new fee fields (maxFeePerGas, maxPriorityFeePerGas) correctly.",
  },
  {
    eip: "EIP-4337",
    title: "Account Abstraction Using Alt Mempool",
    section: "Summary",
    content:
      "Defines a higher-layer pseudo-transaction object called a UserOperation, bundled by actors called Bundlers, enabling account abstraction without requiring consensus-layer protocol changes.",
  },
  {
    eip: "EIP-4337",
    title: "Account Abstraction Using Alt Mempool",
    section: "Security Considerations",
    content:
      "Covers denial-of-service risk from invalid UserOperations flooding the alt-mempool, the need for simulation rules that restrict opcode usage during validation, reputation systems for Bundlers and Paymasters, and griefing attacks where validation passes but execution is later made to fail.",
  },
  {
    eip: "EIP-4337",
    title: "Account Abstraction Using Alt Mempool",
    section: "Rationale",
    content:
      "Explains why an alt-mempool approach was chosen over a consensus-layer change: it can ship without a hard fork and iterate faster, at the cost of needing careful anti-DoS rules in the mempool layer itself.",
  },
  {
    eip: "EIP-721",
    title: "Non-Fungible Token Standard",
    section: "Summary",
    content:
      "Defines a standard interface for non-fungible tokens, where each token is distinct and ownership of individual token IDs can be tracked and transferred.",
  },
  {
    eip: "EIP-721",
    title: "Non-Fungible Token Standard",
    section: "Security Considerations",
    content:
      "Highlights the risk of tokens becoming 'stuck' if transferred to a contract address that cannot handle them, which motivated the safeTransferFrom function and the onERC721Received hook.",
  },
  {
    eip: "EIP-4844",
    title: "Shard Blob Transactions",
    section: "Summary",
    content:
      "Introduces a new transaction type carrying 'blob' data that is available for a limited time and is much cheaper than calldata, intended primarily for rollups posting data to L1.",
  },
  {
    eip: "EIP-4844",
    title: "Shard Blob Transactions",
    section: "Security Considerations",
    content:
      "Discusses the data availability window and what happens if blobs expire before all parties have retrieved them, the separate blob gas market and its independent base fee, and considerations for clients that prune blob data aggressively.",
  },
];

export function searchEipContent(query: string, maxChunks = 4): EipChunk[] {
  const q = query.toLowerCase();

  // naive keyword scoring — swap for vector similarity search in production
  const scored = CORPUS.map((chunk) => {
    let score = 0;
    const haystack = `${chunk.eip} ${chunk.title} ${chunk.section} ${chunk.content}`.toLowerCase();

    // direct EIP number mention, e.g. "1559" or "eip-1559"
    const eipNumberMatch = q.match(/\d{2,5}/);
    if (eipNumberMatch && chunk.eip.includes(eipNumberMatch[0])) score += 5;

    if (q.includes("security") && chunk.section.toLowerCase().includes("security")) score += 3;
    if (q.includes("backward") && chunk.section.toLowerCase().includes("backward")) score += 3;
    if (q.includes("rationale") && chunk.section.toLowerCase().includes("rationale")) score += 3;

    for (const word of q.split(/\W+/).filter((w) => w.length > 3)) {
      if (haystack.includes(word)) score += 1;
    }

    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((s) => s.chunk);
}

export function listKnownEips(): string[] {
  return Array.from(new Set(CORPUS.map((c) => c.eip)));
}
