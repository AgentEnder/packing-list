# Test info

- Name: Packing List View >> can toggle between view modes
- Location: /Users/agentender/repos/packing-list/e2e/frontend-e2e/src/packing-list.spec.ts:13:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

    at setupTestSession (/Users/agentender/repos/packing-list/e2e/frontend-e2e/src/utils.ts:14:14)
    at /Users/agentender/repos/packing-list/e2e/frontend-e2e/src/packing-list.spec.ts:7:5
```

# Test source

```ts
   1 | import { BrowserContext, Page } from '@playwright/test';
   2 |
   3 | export async function setupTestSession(
   4 |   page: Page,
   5 |   context: BrowserContext,
   6 |   useDemoData = false
   7 | ) {
   8 |   await context.addInitScript(
   9 |     // Set session storage to skip demo modal
  10 |     `sessionStorage.setItem('session-demo-choice', ${
  11 |       useDemoData ? 'demo' : 'fresh'
  12 |     })`
  13 |   );
> 14 |   await page.goto('/');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  15 | }
  16 |
```