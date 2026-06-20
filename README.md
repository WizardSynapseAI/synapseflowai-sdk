# @synapseflowai/sdk

Official Node.js SDK for the [SynapseFlowAI](https://synapseflowai.com) public REST API.

## Requirements

- Node.js **≥ 18** (uses native `fetch`)

## Installation

```bash
npm install @synapseflowai/sdk
# or
pnpm add @synapseflowai/sdk
# or
yarn add @synapseflowai/sdk
```

## Quick start

```ts
import { SynapseFlowClient } from '@synapseflowai/sdk'

const client = new SynapseFlowClient({ apiKey: 'sk_...' })

// Trigger a workflow
const result = await client.triggerWorkflow('wf_abc123', {
  payload: { userId: '42', plan: 'pro' },
})
console.log(result.message)
```

Get your API key from **Settings → API Keys** in the SynapseFlowAI dashboard.

## Client options

| Option | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | Yes | API key starting with `sk_` |
| `baseUrl` | `string` | No | Override the API base URL (default: `https://api.synapseflowai.com`) |

## API reference

### Workflows

#### `listWorkflows()`

Returns all workflows in your organization.

```ts
const workflows = await client.listWorkflows()
// WorkflowListItem[]
```

#### `getWorkflow(workflowId)`

Returns a single workflow including its node/edge graph.

```ts
const workflow = await client.getWorkflow('wf_abc123')
// Workflow (extends WorkflowListItem + nodes + edges)
```

#### `triggerWorkflow(workflowId, options?)`

Triggers a workflow execution. Pass an optional `payload` object that is merged into the workflow's execution context.

```ts
const result = await client.triggerWorkflow('wf_abc123', {
  payload: { userId: '42', event: 'signup' },
})
// { message: string; workflow_id: string }
```

### Customers

#### `listCustomers()`

Returns all customer records.

```ts
const customers = await client.listCustomers()
// Customer[]
```

#### `createCustomer(input)`

Creates a new customer record.

```ts
const customer = await client.createCustomer({
  email: 'jane@acme.com',
  name: 'Jane Doe',
  attributes: { plan: 'pro', company: 'Acme' },
})
// Customer
```

| Field | Type | Required |
|---|---|---|
| `email` | `string` | Yes |
| `name` | `string` | No |
| `attributes` | `Record<string, unknown>` | No |

### Webhooks (REST Hooks)

#### `subscribeWebhook(targetUrl, event)`

Registers a webhook URL to receive events (compatible with Zapier REST Hooks).

```ts
const hook = await client.subscribeWebhook(
  'https://hooks.zapier.com/hooks/catch/xxx/yyy/',
  'execution.completed'
)
// { id: string; targetUrl: string; event: string }
```

#### `unsubscribeWebhook(hookId)`

Removes a webhook subscription.

```ts
await client.unsubscribeWebhook('h_abc123')
```

## Error handling

All API errors throw a `SynapseFlowError` with an optional `statusCode`.

```ts
import { SynapseFlowClient, SynapseFlowError } from '@synapseflowai/sdk'

try {
  await client.triggerWorkflow('wf_missing')
} catch (err) {
  if (err instanceof SynapseFlowError) {
    console.error(err.message, err.statusCode) // e.g. "Workflow not found" 404
  }
}
```

## Development

```bash
pnpm install
pnpm build        # compile to dist/
pnpm test         # run tests with vitest
pnpm typecheck    # tsc --noEmit
pnpm lint:fix     # eslint --fix
```

## License

[MIT](LICENSE)
