from typing import Annotated

import os
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from apriori.parser import parse_csv_stream, parse_transactions
from apriori.utils import get_association_rules, get_freq_itemsets, get_subsets


frontend_origin = os.getenv("FRONTEND_ORIGIN")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if frontend_origin:
    allowed_origins.append(frontend_origin)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST"],
    allow_headers=["*"],
)


class TransactionRequest(BaseModel):
    transactions: dict[int, set[str]]
    min_support: float = Field(ge=0, le=1)
    min_confidence: float = Field(ge=0, le=1)

    @field_validator("transactions")
    @classmethod
    def validate_transactions(cls, transactions: dict[int, set[str]]) -> dict[int, set[str]]:
        if not transactions or any(
            not items or any(not item.strip() for item in items)
            for items in transactions.values()
        ):
            raise ValueError("Each transaction must contain at least one nonblank item")
        return transactions


def process_transactions(transactions: pd.DataFrame, min_support: float, min_confidence: float):
    frequent_itemsets = get_freq_itemsets(transactions, min_support)
    subsets = get_subsets(frequent_itemsets)
    rules = get_association_rules(transactions, subsets, min_confidence)
    return {
        "transactions": transactions.to_dict(orient="index"),
        "frequent_itemsets": frequent_itemsets,
        "association_rules": [
            {"antecedent": antecedent, "consequent": consequent, "confidence": confidence} for antecedent, consequent, confidence in rules
        ],
    }

@app.get("/")
def root():
    return {"message": "Welcome to the Apriori API. Use /upload-data to upload a CSV file or /parse-transactions to send transaction data directly."}

@app.post("/upload-data")
def upload_data(
    file: Annotated[UploadFile, File()],
    min_support: Annotated[float, Form(ge=0, le=1)],
    min_confidence: Annotated[float, Form(ge=0, le=1)],
):
    try:
        transactions = parse_csv_stream(file.file)
    except (pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Invalid transaction CSV") from exc
    if transactions.empty:
        raise HTTPException(status_code=422, detail="CSV must contain at least one transaction and item")
    return process_transactions(transactions, min_support, min_confidence)


@app.post("/parse-transactions")
def parse_transaction_data(request: TransactionRequest):
    transactions = parse_transactions(request.transactions)
    return process_transactions(transactions, request.min_support, request.min_confidence)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
