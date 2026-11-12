# Apriori App

A small web app for exploring the Apriori algorithm. Enter transactions in the browser or upload a CSV file, choose minimum support and confidence, and view the encoded transactions, frequent itemsets, and association rules.

The frontend uses React and Vite. The API uses FastAPI, pandas, and Python 3.13 or newer.

## Run locally

You need [Node.js and npm](https://nodejs.org/) and [uv](https://docs.astral.sh/uv/). Open two terminals at the project root.

Start the API:

```powershell
cd server
uv sync
uv run uvicorn server.app:app --reload --host localhost --port 8000
```

Start the frontend in the other terminal:

```powershell
cd client
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). The frontend sends requests to `http://localhost:8000`, so keep both processes running. FastAPI's interactive API documentation is at `http://localhost:8000/docs`.

## Use the app

- **Upload a CSV file:** Each row is one transaction, with item names in separate comma-separated cells. There is no header row. Empty cells are ignored. For example:

  ```csv
  Onion,Potato,Burger
  Potato,Burger,Milk
  Milk,Beer,
  ```

- **Type transactions:** Add instances and items in the form, then analyze them.

Set both thresholds between `0` and `1`. **Support** is the fraction of transactions containing an itemset. **Confidence** is the fraction of transactions containing an antecedent that also contain its consequent. An itemset or rule qualifies when its value is at least the corresponding threshold.

Results show a one-hot encoded transaction table, frequent itemsets grouped by round, and association rules with confidence percentages. The current implementation generates rules from the itemsets in the final frequent round.

Sample files are available in [`server/data`](server/data), including market basket and medical symptom transactions.

## API

| Endpoint | Input | Purpose |
| --- | --- | --- |
| `POST /upload-data` | Multipart form with `file`, `min_support`, and `min_confidence` | Analyze a headerless transaction CSV |
| `POST /parse-transactions` | JSON with `transactions`, `min_support`, and `min_confidence` | Analyze transactions supplied directly |

For JSON input, `transactions` maps transaction IDs to arrays of item names:

```json
{
  "transactions": {
    "1": ["Onion", "Potato", "Burger"],
    "2": ["Potato", "Burger", "Milk"]
  },
  "min_support": 0.5,
  "min_confidence": 0.7
}
```

Both endpoints return `transactions`, `frequent_itemsets`, and `association_rules`. The API validates thresholds and rejects empty transactions.

## Project layout

| Path | Contents |
| --- | --- |
| `client/` | React interface and Vite configuration |
| `server/server/app.py` | FastAPI endpoints |
| `server/apriori/` | CSV parsing and Apriori calculations |
| `server/data/` | Example transaction CSV files |
