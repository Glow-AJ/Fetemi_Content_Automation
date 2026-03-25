# n8n Intake Workflow — Documentation

## Workflow ID: `zRFEjRoIllQKxWQf`
**Status**: Created (inactive — needs credentials configured)

---

## Overview

The Intake Workflow is triggered when a content manager submits a new content project from the frontend. It processes the input, handles scraping (if URL), runs deduplication, normalizes the content via AI, and advances the job to the SEO Research phase.

## Flow Diagram

```
Webhook → Respond OK → Read Job → Status Gate
                                      ↓
                                Prepare Dedup Data
                                      ↓
                              Is URL Input? ─────────┐
                                ↓ (yes)              ↓ (no - idea)
                          URL Dedup Check      Hash Idea Content (Crypto SHA-256)
                                ↓                    ↓
                                │              Idea Dedup Check
                                │                    ↓
                                │              Store Idea Hash
                                ↓                    ↓
                           Merge After Dedup ←───────┘
                                ↓
                        Route: URL or Idea?
                          ↓ (url)        ↓ (idea)
                    URL Type Router    Idea Passthrough
                     ↓     ↓     ↓          ↓
                Social Paywall Standard     ↓
                  ↓      ↓       ↓          ↓
              [Scraping paths]              ↓
                  ↓      ↓       ↓          ↓
                   Merge All Content  ←─────┘
                          ↓
                    Scrape Error? ──→ Write Error (fail job)
                          ↓ (no error)
                    Prepare for AI
                          ↓
                AI Content Normalization (OpenAI GPT-4o)
                          ↓
                Write Results to Supabase (status → seo_research)
```

## Scraping Strategy

| URL Type | Primary | Fallback | No Fallback Behavior |
|----------|---------|----------|---------------------|
| **Social (LinkedIn)** | ScrapeCreators `/v1/linkedin/post` | Apify | Write error to Supabase |
| **Social (Twitter)** | ScrapeCreators `/v1/twitter/tweet` | Apify | Write error to Supabase |
| **Standard** | HTTP GET + HTML→Text | Firecrawl `/v2/scrape` | Write error to Supabase |
| **Paywall** | Firecrawl `/v2/scrape` | None | If < 300 words: error asking user to paste content |

## Credentials Required

| Node | Credential Type | Key Name | Notes |
|------|----------------|----------|-------|
| All Supabase nodes | Supabase API | `supabaseApi` | URL + Service Role Key |
| ScrapeCreators | Generic Header Auth | `httpHeaderAuth` | Header: `x-api-key`, Value: your API key |
| Firecrawl | Generic Header Auth | `httpHeaderAuth` | Header: `Authorization`, Value: `Bearer <token>` |
| OpenAI | OpenAI API | `openAiApi` | Standard API key |

## Webhook Payload

The frontend sends:
```json
{
  "jobId": "uuid",
  "inputType": "idea" | "url",
  "url": "https://...",
  "urlType": "social" | "paywall" | "standard",
  "topic": "raw idea text...",
  "userEmail": "manager@example.com"
}
```

## Setup Steps

1. Open the workflow in n8n: `https://cohort2pod2.app.n8n.cloud/workflow/zRFEjRoIllQKxWQf`
2. Set credentials on all Supabase nodes (there are 7 of them)
3. Create ScrapeCreators credential: `Generic Header Auth` → Header Name: `x-api-key`
4. Create Firecrawl credential: `Generic Header Auth` → Header Name: `Authorization`, Prefix: `Bearer`
5. Set OpenAI credential on the "AI Content Normalization" node
6. Activate the workflow
7. Copy the webhook URL from the "Intake Webhook" node
8. Update `.env.local`: `NEXT_PUBLIC_N8N_WEBHOOK_INTAKE=<webhook-url>`
