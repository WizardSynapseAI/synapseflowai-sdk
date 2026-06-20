import type {
  ApiListResponse,
  ApiResponse,
  Customer,
  CustomerCreateInput,
  SynapseFlowClientOptions,
  TriggerWorkflowOptions,
  TriggerWorkflowResult,
  WebhookSubscription,
  Workflow,
  WorkflowListItem
} from './types'
import { SynapseFlowError } from './types'

export class SynapseFlowClient {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(options: SynapseFlowClientOptions) {
    if (!options.apiKey) throw new SynapseFlowError('apiKey is required')
    if (!options.apiKey.startsWith('sk_')) throw new SynapseFlowError('apiKey must start with sk_')
    this.apiKey = options.apiKey
    this.baseUrl = (options.baseUrl ?? 'https://api.synapseflowai.com').replace(/\/$/, '')
  }

  // ─── Workflows ─────────────────────────────────────────────────────────────

  async listWorkflows(): Promise<WorkflowListItem[]> {
    const res = await this.request<ApiListResponse<WorkflowListItem>>('GET', '/v1/workflows')
    return res.data
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    if (!workflowId) throw new SynapseFlowError('workflowId is required')
    const res = await this.request<ApiResponse<Workflow>>('GET', `/v1/workflows/${workflowId}`)
    return res.data
  }

  async triggerWorkflow(workflowId: string, options?: TriggerWorkflowOptions): Promise<TriggerWorkflowResult> {
    if (!workflowId) throw new SynapseFlowError('workflowId is required')
    return this.request<TriggerWorkflowResult>('POST', `/v1/workflows/${workflowId}/trigger`, options?.payload ?? {})
  }

  // ─── Customers ─────────────────────────────────────────────────────────────

  async listCustomers(): Promise<Customer[]> {
    const res = await this.request<ApiListResponse<Customer>>('GET', '/v1/customers')
    return res.data
  }

  async createCustomer(input: CustomerCreateInput): Promise<Customer> {
    if (!input.email) throw new SynapseFlowError('email is required')
    const res = await this.request<ApiResponse<Customer>>('POST', '/v1/customers', input)
    return res.data
  }

  // ─── Zapier / REST Hooks ───────────────────────────────────────────────────

  async subscribeWebhook(targetUrl: string, event: string): Promise<WebhookSubscription> {
    if (!targetUrl) throw new SynapseFlowError('targetUrl is required')
    if (!event) throw new SynapseFlowError('event is required')
    return this.request<WebhookSubscription>('POST', '/v1/hooks/subscribe', { targetUrl, event })
  }

  async unsubscribeWebhook(hookId: string): Promise<void> {
    if (!hookId) throw new SynapseFlowError('hookId is required')
    await this.request<unknown>('DELETE', `/v1/hooks/${hookId}`)
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `@synapseflowai/sdk`
    }

    const res = await fetch(url, {
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
      method,
      signal: AbortSignal.timeout(30_000)
    })

    if (!res.ok) {
      let message = `SynapseFlowAI API error ${res.status}: ${res.statusText}`
      try {
        const json = (await res.json()) as { message?: string }
        if (json.message) message = json.message
      } catch {}
      throw new SynapseFlowError(message, res.status)
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T
    }

    return res.json() as Promise<T>
  }
}
