# Query Examples

Use these prompts in either:

- the `sushi-rag-app` frontend assistant chat
- Cursor chat with `user-sushi-rag-mcp-server` tools

---

## General Menu Discovery

- What kinds of sushi do you have?
- Show me your most affordable options.
- What are your top recommendations for a first-time sushi eater?
- What are some light options for lunch?

## Spicy and Mild

- Show me spicy options.
- What is the spiciest roll on the menu?
- Show me mild rolls.
- I want flavorful but not too spicy options.

## Dietary Preferences

- What vegetarian options do you have?
- Show me vegan items.
- What gluten-free options are available?
- Show me pescatarian-friendly items.

## Price-Focused

- What can I get under $10?
- Show me items between $10 and $15.
- What are the cheapest rolls?
- Give me options around $12.

## Item-Specific Details

- Tell me about the Dragon Roll.
- What ingredients are in the California Roll?
- Is Salmon Nigiri gluten-free?
- What is in your Spicy Tuna Roll?

## Comparison and Decision Help

- Compare California Roll vs Spicy Tuna Roll.
- What is the difference between nigiri and maki?
- Give me 3 options: one mild, one spicy, one vegetarian.
- If I like salmon, what should I order?

---

## MCP Tool-Oriented Examples

These are helpful when you want to be explicit in Cursor chat:

- `use user-sushi-rag-mcp-server sushi_list_topics with limit 20`
- `use user-sushi-rag-mcp-server sushi_semantic_search with query 'spicy maki rolls' and k 10`
- `use user-sushi-rag-mcp-server sushi_semantic_search with query 'vegan appetizers' and k 8`
- `use user-sushi-rag-mcp-server sushi_rag_query with question 'Build me a budget-friendly sushi dinner under $20'`

