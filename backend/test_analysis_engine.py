"""
Unit and Integration tests for the Root-Cause Classification Engine
Validates all 5 duplicate root-cause categories, unknown cause fallback,
and database persistence.
"""

import unittest
import os
import sys
import pandas as pd
import numpy as np

# Ensure backend directory is in path regardless of invocation working directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis_engine import RootCauseClassifier
from database import get_db_manager, init_database


class TestRootCauseClassifier(unittest.TestCase):

    def setUp(self):
        self.classifier = RootCauseClassifier()
        init_database()

    def test_repeated_ingestion_multi_batch(self):
        """Test detection of repeated batch ingestion across multiple batch IDs"""
        group = {
            'groupId': 'DG-001',
            'keyColumns': ['order_id', 'customer_id'],
            'records': [
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'batch_id': 'BATCH-001'},
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'batch_id': 'BATCH-002'}
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_repeated_ingestion(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'Repeated Batch Processing')
        self.assertGreaterEqual(result['confidence_score'], 80)
        self.assertIn('BATCH-001', result['evidence'])

    def test_repeated_ingestion_exact_parity(self):
        """Test detection of repeated ingestion via 100% attribute parity without batch_id"""
        group = {
            'groupId': 'DG-001B',
            'keyColumns': ['order_id'],
            'records': [
                {'order_id': 'ORD-009', 'amount': 50.0, 'city': 'Austin'},
                {'order_id': 'ORD-009', 'amount': 50.0, 'city': 'Austin'}
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_repeated_ingestion(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'Repeated Batch Processing')
        self.assertGreaterEqual(result['confidence_score'], 85)

    def test_incomplete_merge_keys_detection(self):
        """Test detection of incomplete merge keys (key matches, non-key status differs)"""
        group = {
            'groupId': 'DG-002',
            'keyColumns': ['order_id', 'customer_id'],
            'records': [
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'payment_status': 'PENDING', 'amount': 100.0},
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'payment_status': 'COMPLETED', 'amount': 100.0}
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_incomplete_merge_keys(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'Incorrect Merge Keys')
        self.assertGreaterEqual(result['confidence_score'], 65)
        self.assertIn('payment_status', result['explanation'])

    def test_source_inconsistency_detection(self):
        """Test detection of upstream source system discrepancies"""
        group = {
            'groupId': 'DG-003',
            'keyColumns': ['order_id', 'customer_id'],
            'records': [
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'source_system': 'WEB_STORE'},
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'source_system': 'MOBILE_APP'}
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_source_inconsistency(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'Source Inconsistency')
        self.assertGreaterEqual(result['confidence_score'], 70)
        self.assertIn('WEB_STORE', result['evidence'])

    def test_join_multiplication_dimension_fanout(self):
        """Test detection of 1-to-many Cartesian multiplication on dimension lookup"""
        group = {
            'groupId': 'DG-004',
            'keyColumns': ['order_id', 'customer_id'],
            'records': [
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'currency_rate_id': 'USD-EUR'},
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'currency_rate_id': 'USD-GBP'},
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'currency_rate_id': 'USD-JPY'}
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_join_multiplication(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'JOIN Multiplication')
        self.assertGreaterEqual(result['confidence_score'], 65)
        self.assertIn('currency_rate_id', result['title'])

    def test_late_arriving_records_detection(self):
        """Test detection of late-arriving records exceeding 24h watermark window"""
        group = {
            'groupId': 'DG-005',
            'keyColumns': ['order_id', 'customer_id'],
            'records': [
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'transaction_date': '2026-09-18 10:15:00'},
                {'order_id': 'ORD-001', 'customer_id': 'CUST-001', 'amount': 100.0, 'transaction_date': '2026-09-15 10:15:00'}  # 72h older
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_late_arriving_records(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'Late-Arriving Records')
        self.assertGreaterEqual(result['confidence_score'], 70)
        self.assertIn('72.0 hours', result['evidence'])

    def test_unknown_cause_fallback(self):
        """Test honest classification as Unknown when evidence is insufficient"""
        group = {
            'groupId': 'DG-999',
            'keyColumns': ['id'],
            'records': [
                {'id': 'X-1', 'val': 'A'},
                {'id': 'X-1', 'val': 'B'}
            ]
        }
        group_df = pd.DataFrame(group['records'])
        result = self.classifier._check_unknown_cause(group_df, group)

        self.assertIsNotNone(result)
        self.assertEqual(result['category'], 'Unknown')
        self.assertEqual(result['status_type'], 'Possible')
        self.assertLessEqual(result['confidence_score'], 50)

    def test_full_dataset_pipeline_analysis(self):
        """Test comprehensive end-to-end dataset analysis with real duplicate patterns"""
        data = [
            # Batch duplicates (Repeated Ingestion)
            {'order_id': 'ORD-100', 'customer_id': 'C-1', 'amount': 50.0, 'batch_id': 'B1', 'source_system': 'WEB'},
            {'order_id': 'ORD-100', 'customer_id': 'C-1', 'amount': 50.0, 'batch_id': 'B2', 'source_system': 'WEB'},
            # Status update (Incomplete Merge Keys)
            {'order_id': 'ORD-200', 'customer_id': 'C-2', 'amount': 75.0, 'status': 'NEW', 'batch_id': 'B1'},
            {'order_id': 'ORD-200', 'customer_id': 'C-2', 'amount': 75.0, 'status': 'PROCESSED', 'batch_id': 'B1'},
            # Multi-channel (Source Inconsistency)
            {'order_id': 'ORD-300', 'customer_id': 'C-3', 'amount': 120.0, 'source_system': 'STORE_A'},
            {'order_id': 'ORD-300', 'customer_id': 'C-3', 'amount': 120.0, 'source_system': 'STORE_B'},
            # Normal unique records
            {'order_id': 'ORD-400', 'customer_id': 'C-4', 'amount': 30.0, 'batch_id': 'B1'},
            {'order_id': 'ORD-500', 'customer_id': 'C-5', 'amount': 90.0, 'batch_id': 'B1'}
        ]
        df = pd.DataFrame(data)
        results = self.classifier.analyze_dataset(df)

        self.assertEqual(results['summary']['totalRows'], 8)
        self.assertEqual(results['summary']['duplicateRecordsCount'], 6)
        self.assertEqual(results['summary']['duplicateGroupsCount'], 3)
        self.assertGreaterEqual(len(results['rootCauses']), 3)

        categories_found = {rc['category'] for rc in results['rootCauses']}
        self.assertIn('Repeated Batch Processing', categories_found)
        self.assertIn('Incorrect Merge Keys', categories_found)
        self.assertIn('Source Inconsistency', categories_found)

    def test_database_persistence_integration(self):
        """Test storing and retrieving analysis results via database manager"""
        db = get_db_manager()
        dataset_info = {
            'id': 'DS-TEST-AUTO',
            'name': 'test_data.csv',
            'size': 1024,
            'type': 'CSV',
            'rowCount': 4,
            'columnCount': 3
        }
        df = pd.DataFrame([
            {'order_id': 'O-1', 'customer_id': 'C-1', 'batch_id': 'B1'},
            {'order_id': 'O-1', 'customer_id': 'C-1', 'batch_id': 'B2'},
            {'order_id': 'O-2', 'customer_id': 'C-2', 'batch_id': 'B1'},
            {'order_id': 'O-3', 'customer_id': 'C-3', 'batch_id': 'B1'}
        ])
        analysis_results = self.classifier.analyze_dataset(df)

        # Store in database
        analysis_id = db.store_analysis_results(dataset_info, analysis_results)
        self.assertIsNotNone(analysis_id)

        # Retrieve from database
        retrieved = db.get_analysis_results('DS-TEST-AUTO')
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved['summary']['totalRows'], 4)
        self.assertEqual(retrieved['summary']['duplicateRecordsCount'], 2)
        self.assertGreaterEqual(len(retrieved['rootCauses']), 1)

    def test_fastapi_endpoints_integration(self):
        """Test FastAPI endpoint handlers directly for end-to-end integration"""
        from app import (
            health_check, start_analysis, AnalysisRequest,
            get_root_cause_insights, get_duplicate_groups,
            get_recommended_actions, get_report
        )

        # Health endpoint
        health = health_check()
        self.assertEqual(health['status'], 'ok')
        self.assertIn('database', health)

        # Start analysis endpoint
        req = AnalysisRequest(datasetId='DS-SAMPLE-101')
        results = start_analysis(req)
        self.assertIn('summary', results)
        self.assertIn('rootCauses', results)
        self.assertIn('duplicateGroups', results)

        # Root causes endpoint
        root_causes = get_root_cause_insights('DS-SAMPLE-101')
        self.assertIsInstance(root_causes, list)
        self.assertGreaterEqual(len(root_causes), 1)

        # Duplicate groups endpoint
        duplicates = get_duplicate_groups('DS-SAMPLE-101')
        self.assertIn('groups', duplicates)
        self.assertIn('categories', duplicates)

        # Recommendations endpoint
        recommendations = get_recommended_actions('DS-SAMPLE-101')
        self.assertIsInstance(recommendations, list)
        self.assertGreaterEqual(len(recommendations), 1)

        # Report endpoint
        report = get_report('DS-SAMPLE-101')
        self.assertIn('beforeMetrics', report)
        self.assertIn('afterSimulationMetrics', report)

    def test_excel_parsing_support(self):
        """Test reading and analyzing Excel (.xlsx) files via openpyxl"""
        excel_path = os.path.join(os.path.dirname(__file__), 'uploads', 'Raw_data.xlsx')
        if os.path.exists(excel_path):
            df = pd.read_excel(excel_path, engine='openpyxl')
            self.assertGreater(len(df), 0)
            self.assertGreater(len(df.columns), 0)
            results = self.classifier.analyze_dataset(df)
            self.assertIn('summary', results)
            self.assertEqual(results['summary']['totalRows'], len(df))

    def test_max_file_size_limit_constant(self):
        """Test that 200MB max file size limit is defined and enforced in backend"""
        from app import MAX_FILE_SIZE
        self.assertEqual(MAX_FILE_SIZE, 200 * 1024 * 1024)  # Exactly 200MB in bytes


if __name__ == '__main__':
    unittest.main()
