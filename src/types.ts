export interface SynapseFlowClientOptions {
  /** API key starting with `sk_` — create one in Settings → API Keys */
  apiKey: string
  /** Override the base URL (default: https://api.synapseflowai.com) */
  baseUrl?: string
}

// ─── Workflows ───────────────────────────────────────────────────────────────

export interface WorkflowListItem {
  id: string
  name: string
  is_active: boolean
  updated_at: string
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export interface Workflow extends WorkflowListItem {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface TriggerWorkflowOptions {
  /** Arbitrary payload merged into the workflow execution context */
  payload?: Record<string, unknown>
}

export interface TriggerWorkflowResult {
  message: string
  workflow_id: string
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  email: string
  name?: string
}

export interface CustomerCreateInput {
  email: string
  name?: string
  /** Arbitrary key/value attributes stored on the customer record */
  attributes?: Record<string, unknown>
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export interface WebhookSubscription {
  id: string
  targetUrl: string
  event: string
}

// ─── Generic response wrappers ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class SynapseFlowError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'SynapseFlowError'
  }
}
