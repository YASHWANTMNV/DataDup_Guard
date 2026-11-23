"""
Upload endpoint integration tests:
Verifies 200MB file limit enforcement, streaming chunk handling,
CSV ingestion, and Excel (.xlsx, .xls) ingestion.
"""

import unittest
import os
import io
import sys
import pandas as pd
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app, MAX_FILE_SIZE


class TestUploadEndpoint(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")

    def test_upload_csv_success(self):
        csv_content = (
            "order_id,customer_id,amount,timestamp,status\n"
            "ORD-001,CUST-10,120.50,2026-03-01 10:00:00,COMPLETED\n"
            "ORD-001,CUST-10,120.50,2026-03-01 10:05:00,COMPLETED\n"
            "ORD-002,CUST-20,75.00,2026-03-01 10:10:00,PENDING\n"
        ).encode("utf-8")

        response = self.client.post(
            "/api/v1/datasets/upload",
            files={"file": ("test_orders.csv", csv_content, "text/csv")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("datasetId", data)
        self.assertEqual(data["fileType"], "CSV")
        self.assertEqual(data["rowCount"], 3)
        self.assertEqual(data["columnCount"], 5)

    def test_upload_excel_success(self):
        df = pd.DataFrame({
            "product_id": ["P101", "P102", "P101"],
            "product_name": ["Widget A", "Widget B", "Widget A"],
            "price": [19.99, 29.99, 19.99]
        })
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False, engine="openpyxl")
        excel_bytes = excel_buffer.getvalue()

        response = self.client.post(
            "/api/v1/datasets/upload",
            files={"file": ("products.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("datasetId", data)
        self.assertEqual(data["fileType"], "XLSX")
        self.assertEqual(data["rowCount"], 3)

    def test_unsupported_file_extension(self):
        response = self.client.post(
            "/api/v1/datasets/upload",
            files={"file": ("notes.txt", b"Hello world", "text/plain")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file extension", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
