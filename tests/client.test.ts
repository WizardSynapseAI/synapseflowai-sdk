import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SynapseFlowClient, SynapseFlowError } from '../src'

const BASE_URL = 'https://api.synapseflowai.com'
const API_KEY = 'sk_test_abc123'

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  })
}

describe('SynapseFlowClient', () => {
  let client: SynapseFlowClient

  beforeEach(() => {
    client = new SynapseFlowClient({ apiKey: API_KEY, baseUrl: BASE_URL })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws if apiKey is missing', () => {
      expect(() => new SynapseFlowClient({ apiKey: '' })).toThrow(SynapseFlowError)
    })

    it('throws if apiKey does not start with sk_', () => {
      expect(() => new SynapseFlowClient({ apiKey: 'bad_key' })).toThrow(SynapseFlowError)
    })

    it('strips trailing slash from baseUrl', () => {
      const c = new SynapseFlowClient({ apiKey: API_KEY, baseUrl: 'https://example.com/' })
      vi.stubGlobal('fetch', mockFetch({ data: [] }))
      void c.listWorkflows()
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/v1/workflows',
        expect.anything()
      )
    })
  })

  // ─── Workflows ─────────────────────────────────────────────────────────────

  describe('listWorkflows', () => {
    it('GET /v1/workflows and returns data array', async () => {
      const workflows = [{ id: 'wf1', name: 'Welcome', is_active: true, updated_at: '2026-01-01' }]
      vi.stubGlobal('fetch', mockFetch({ data: workflows }))

      const result = await client.listWorkflows()

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/workflows`,
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(workflows)
    })
  })

  describe('getWorkflow', () => {
    it('GET /v1/workflows/:id and returns workflow', async () => {
      const workflow = { id: 'wf1', name: 'Welcome', is_active: true, updated_at: '2026-01-01', nodes: [], edges: [] }
      vi.stubGlobal('fetch', mockFetch({ data: workflow }))

      const result = await client.getWorkflow('wf1')

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/workflows/wf1`,
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(workflow)
    })

    it('throws if workflowId is empty', async () => {
      await expect(client.getWorkflow('')).rejects.toThrow(SynapseFlowError)
    })
  })

  describe('triggerWorkflow', () => {
    it('POST /v1/workflows/:id/trigger with payload', async () => {
      vi.stubGlobal('fetch', mockFetch({ message: 'Workflow trigger accepted', workflow_id: 'wf1' }))

      const result = await client.triggerWorkflow('wf1', { payload: { userId: '42' } })

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/workflows/wf1/trigger`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: '42' }),
        })
      )
      expect(result.workflow_id).toBe('wf1')
    })

    it('sends empty body when no payload provided', async () => {
      vi.stubGlobal('fetch', mockFetch({ message: 'ok', workflow_id: 'wf1' }))

      await client.triggerWorkflow('wf1')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({}) })
      )
    })

    it('throws if workflowId is empty', async () => {
      await expect(client.triggerWorkflow('')).rejects.toThrow(SynapseFlowError)
    })
  })

  // ─── Customers ─────────────────────────────────────────────────────────────

  describe('listCustomers', () => {
    it('GET /v1/customers and returns data array', async () => {
      const customers = [{ id: 'c1', email: 'jane@acme.com', name: 'Jane' }]
      vi.stubGlobal('fetch', mockFetch({ data: customers }))

      const result = await client.listCustomers()

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/customers`,
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(customers)
    })
  })

  describe('createCustomer', () => {
    it('POST /v1/customers with input and returns customer', async () => {
      const customer = { id: 'c1', email: 'jane@acme.com', name: 'Jane' }
      vi.stubGlobal('fetch', mockFetch({ data: customer }, 201))

      const result = await client.createCustomer({ email: 'jane@acme.com', name: 'Jane' })

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/customers`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'jane@acme.com', name: 'Jane' }),
        })
      )
      expect(result).toEqual(customer)
    })

    it('throws if email is missing', async () => {
      await expect(client.createCustomer({ email: '' })).rejects.toThrow(SynapseFlowError)
    })
  })

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  describe('subscribeWebhook', () => {
    it('POST /v1/hooks/subscribe and returns subscription', async () => {
      const sub = { id: 'h1', targetUrl: 'https://hooks.zapier.com/abc', event: 'execution.completed' }
      vi.stubGlobal('fetch', mockFetch(sub, 201))

      const result = await client.subscribeWebhook(sub.targetUrl, sub.event)

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/hooks/subscribe`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetUrl: sub.targetUrl, event: sub.event }),
        })
      )
      expect(result).toEqual(sub)
    })

    it('throws if targetUrl is empty', async () => {
      await expect(client.subscribeWebhook('', 'execution.completed')).rejects.toThrow(SynapseFlowError)
    })

    it('throws if event is empty', async () => {
      await expect(client.subscribeWebhook('https://example.com', '')).rejects.toThrow(SynapseFlowError)
    })
  })

  describe('unsubscribeWebhook', () => {
    it('DELETE /v1/hooks/:id', async () => {
      vi.stubGlobal('fetch', mockFetch({}, 200))

      await client.unsubscribeWebhook('h1')

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/hooks/h1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws if hookId is empty', async () => {
      await expect(client.unsubscribeWebhook('')).rejects.toThrow(SynapseFlowError)
    })
  })

  // ─── Auth header ───────────────────────────────────────────────────────────

  describe('request auth', () => {
    it('sends Authorization: Bearer header on every request', async () => {
      vi.stubGlobal('fetch', mockFetch({ data: [] }))

      await client.listWorkflows()

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${API_KEY}`,
          }),
        })
      )
    })
  })

  // ─── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws SynapseFlowError with status code on non-2xx response', async () => {
      vi.stubGlobal('fetch', mockFetch({ message: 'Workflow not found' }, 404))

      const err = await client.listWorkflows().catch((e: unknown) => e)

      expect(err).toBeInstanceOf(SynapseFlowError)
      expect((err as SynapseFlowError).statusCode).toBe(404)
      expect((err as SynapseFlowError).message).toBe('Workflow not found')
    })

    it('falls back to statusText when error body has no message', async () => {
      vi.stubGlobal('fetch', {
        ...mockFetch({}, 500),
        mockResolvedValue: undefined,
      })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: { get: () => null },
        json: () => Promise.resolve({}),
      }))

      const err = await client.listWorkflows().catch((e: unknown) => e)

      expect(err).toBeInstanceOf(SynapseFlowError)
      expect((err as SynapseFlowError).statusCode).toBe(500)
    })
  })
})
