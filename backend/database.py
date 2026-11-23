"""
Database Connection and Schema Management for DataDup Guard
Provides seamless MySQL database integration for enterprise deployments,
with automatic resilient SQLite fallback for local development or environments
without an active MySQL server.
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Try importing mysql.connector safely
try:
    import mysql.connector  # type: ignore[import-untyped]
    from mysql.connector import Error as MySQLError  # type: ignore[import-untyped]
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False
    MySQLError = Exception  # type: ignore[assignment,misc]

import sqlite3


class DatabaseManager:
    """
    Unified Database Manager supporting both MySQL and fallback SQLite.
    Stores and retrieves datasets, duplicate groups, root causes, and verification reports.
    """

    def __init__(self):
        self.db_host = os.getenv('DB_HOST', 'localhost')
        self.db_name = os.getenv('DB_NAME', 'datadup_guard')
        self.db_user = os.getenv('DB_USER', 'root')
        self.db_password = os.getenv('DB_PASSWORD', '')
        self.db_port = int(os.getenv('DB_PORT', 3306))

        self.sqlite_path = os.path.join(os.path.dirname(__file__), 'datadup_guard.db')
        self.mysql_connection = None
        self.is_mysql = False
        self._mysql_failed_timestamp = 0.0

    def connect(self) -> bool:
        """Attempt connection to MySQL; if unavailable, fall back cleanly to SQLite with cooldown caching."""
        now = time.time()
        if MYSQL_AVAILABLE and (now - self._mysql_failed_timestamp > 30.0):
            try:
                if self.mysql_connection is None or not self.mysql_connection.is_connected():
                    self.mysql_connection = mysql.connector.connect(
                        host=self.db_host,
                        database=self.db_name,
                        user=self.db_user,
                        password=self.db_password,
                        port=self.db_port,
                        connect_timeout=1
                    )
                    if self.mysql_connection.is_connected():
                        self.is_mysql = True
                        logger.info("Connected to MySQL database successfully.")
                        return True
            except Exception as e:
                self._mysql_failed_timestamp = now
                logger.info(f"MySQL unavailable ({e}). Falling back to local SQLite database.")
                self.is_mysql = False
                self.mysql_connection = None
        elif not self.is_mysql:
            # MySQL unavailable or in cooldown; using SQLite
            pass

        # SQLite connection verification
        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to SQLite fallback: {e}")
            return False

    def disconnect(self):
        """Close active database connections"""
        if self.mysql_connection and self.mysql_connection.is_connected():
            self.mysql_connection.close()
            self.mysql_connection = None
            logger.info("MySQL connection closed.")

    def initialize_schema(self) -> bool:
        """Create necessary tables in MySQL or SQLite"""
        self.connect()

        if self.is_mysql and self.mysql_connection:
            try:
                cursor = self.mysql_connection.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS datasets (
                        id VARCHAR(50) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        size BIGINT,
                        file_type VARCHAR(10),
                        upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        row_count INT,
                        column_count INT
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS analysis_results (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        dataset_id VARCHAR(50),
                        total_rows INT,
                        total_columns INT,
                        missing_values_count INT,
                        duplicate_records_count INT,
                        duplicate_percentage DECIMAL(5,2),
                        duplicate_groups_count INT,
                        status VARCHAR(20),
                        last_analyzed DATETIME,
                        summary_text TEXT,
                        profile_json JSON,
                        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS duplicate_categories (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        analysis_id INT,
                        category_type VARCHAR(20),
                        count INT,
                        percentage DECIMAL(5,2),
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS duplicate_groups (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        analysis_id INT,
                        group_id VARCHAR(20),
                        match_type VARCHAR(50),
                        category VARCHAR(20),
                        record_count INT,
                        key_columns JSON,
                        reason TEXT,
                        recommendation VARCHAR(20),
                        recommendation_text TEXT,
                        records JSON,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS root_causes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        analysis_id INT,
                        cause_id VARCHAR(20),
                        category VARCHAR(100),
                        title VARCHAR(255),
                        status_type VARCHAR(20),
                        confidence_score INT,
                        explanation TEXT,
                        evidence TEXT,
                        affected_count INT,
                        affected_groups JSON,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS reports (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        analysis_id INT,
                        generated_at DATETIME,
                        dataset_name VARCHAR(255),
                        pipeline_version VARCHAR(100),
                        before_total_rows INT,
                        before_unique_entities INT,
                        before_duplicate_rows INT,
                        before_duplicate_percentage DECIMAL(5,2),
                        after_total_rows INT,
                        after_retained_valid_rows INT,
                        after_quarantined_rows INT,
                        after_data_cleanliness_score DECIMAL(5,2),
                        after_storage_saved_mb VARCHAR(50),
                        actions_summary JSON,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                self.mysql_connection.commit()
                cursor.close()
                logger.info("MySQL schema initialized successfully.")
                return True
            except Exception as e:
                logger.error(f"Error initializing MySQL schema: {e}")
                self.is_mysql = False

        # SQLite fallback schema
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS datasets (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        size INTEGER,
                        file_type TEXT,
                        upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        row_count INTEGER,
                        column_count INTEGER
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS analysis_results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        dataset_id TEXT,
                        total_rows INTEGER,
                        total_columns INTEGER,
                        missing_values_count INTEGER,
                        duplicate_records_count INTEGER,
                        duplicate_percentage REAL,
                        duplicate_groups_count INTEGER,
                        status TEXT,
                        last_analyzed TEXT,
                        summary_text TEXT,
                        profile_json TEXT,
                        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS duplicate_categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id INTEGER,
                        category_type TEXT,
                        count INTEGER,
                        percentage REAL,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS duplicate_groups (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id INTEGER,
                        group_id TEXT,
                        match_type TEXT,
                        category TEXT,
                        record_count INTEGER,
                        key_columns TEXT,
                        reason TEXT,
                        recommendation TEXT,
                        recommendation_text TEXT,
                        records TEXT,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS root_causes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id INTEGER,
                        cause_id TEXT,
                        category TEXT,
                        title TEXT,
                        status_type TEXT,
                        confidence_score INTEGER,
                        explanation TEXT,
                        evidence TEXT,
                        affected_count INTEGER,
                        affected_groups TEXT,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id INTEGER,
                        generated_at TEXT,
                        dataset_name TEXT,
                        pipeline_version TEXT,
                        before_total_rows INTEGER,
                        before_unique_entities INTEGER,
                        before_duplicate_rows INTEGER,
                        before_duplicate_percentage REAL,
                        after_total_rows INTEGER,
                        after_retained_valid_rows INTEGER,
                        after_quarantined_rows INTEGER,
                        after_data_cleanliness_score REAL,
                        after_storage_saved_mb TEXT,
                        actions_summary TEXT,
                        FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
                    )
                """)
                conn.commit()
                logger.info("SQLite fallback schema initialized successfully.")
                return True
        except Exception as e:
            logger.error(f"Error initializing SQLite schema: {e}")
            return False

    def save_dataset(self, dataset_info: Dict[str, Any]) -> bool:
        """Save dataset metadata to database"""
        self.connect()
        dataset_id = dataset_info['id']
        name = dataset_info['name']
        size = dataset_info.get('size', 0)
        file_type = dataset_info.get('type', 'CSV')
        row_count = dataset_info.get('rowCount', 0)
        col_count = dataset_info.get('columnCount', 0)

        if self.is_mysql and self.mysql_connection:
            try:
                cursor = self.mysql_connection.cursor()
                cursor.execute("""
                    INSERT INTO datasets (id, name, size, file_type, row_count, column_count)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    name=VALUES(name), size=VALUES(size), file_type=VALUES(file_type),
                    row_count=VALUES(row_count), column_count=VALUES(column_count)
                """, (dataset_id, name, size, file_type, row_count, col_count))
                self.mysql_connection.commit()
                cursor.close()
                return True
            except Exception as e:
                logger.warning(f"MySQL error saving dataset, fallback to SQLite: {e}")

        # SQLite fallback
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO datasets (id, name, size, file_type, row_count, column_count)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name, size=excluded.size, file_type=excluded.file_type,
                    row_count=excluded.row_count, column_count=excluded.column_count
                """, (dataset_id, name, size, file_type, row_count, col_count))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error saving dataset in SQLite: {e}")
            return False

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve dataset metadata by ID"""
        self.connect()
        if self.is_mysql and self.mysql_connection:
            try:
                cursor = self.mysql_connection.cursor(dictionary=True)
                cursor.execute("SELECT * FROM datasets WHERE id = %s", (dataset_id,))
                row = cursor.fetchone()
                cursor.close()
                if row:
                    return dict(row)
            except Exception as e:
                logger.warning(f"MySQL error getting dataset: {e}")

        # SQLite fallback
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
                row = cursor.fetchone()
                if row:
                    return dict(row)
        except Exception as e:
            logger.error(f"Error getting dataset from SQLite: {e}")
        return None

    def store_analysis_results(self, dataset_info: Dict[str, Any], analysis_results: Dict[str, Any]) -> Optional[int]:
        """Store complete analysis results including duplicate groups, root causes, profile, and report"""
        self.save_dataset(dataset_info)
        summary = analysis_results['summary']
        dataset_id = dataset_info['id']

        # 1. Try MySQL
        if self.is_mysql and self.mysql_connection:
            try:
                cursor = self.mysql_connection.cursor()
                profile_json = json.dumps(analysis_results.get('profile', {}))
                cursor.execute("""
                    INSERT INTO analysis_results (
                        dataset_id, total_rows, total_columns, missing_values_count,
                        duplicate_records_count, duplicate_percentage, duplicate_groups_count,
                        status, last_analyzed, summary_text, profile_json
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    dataset_id,
                    summary['totalRows'],
                    summary['totalColumns'],
                    summary['missingValuesCount'],
                    summary['duplicateRecordsCount'],
                    summary['duplicatePercentage'],
                    summary['duplicateGroupsCount'],
                    summary['status'],
                    summary['lastAnalyzed'],
                    summary['summaryText'],
                    profile_json
                ))
                analysis_id = cursor.lastrowid

                # Store duplicate categories
                categories = analysis_results.get('duplicateCategories', {})
                for cat_type, count, pct in [
                    ('exact', categories.get('exactCount', 0), categories.get('exactPercentage', 0.0)),
                    ('key-based', categories.get('keyBasedCount', 0), categories.get('keyBasedPercentage', 0.0)),
                    ('potential', categories.get('potentialCount', 0), categories.get('potentialPercentage', 0.0))
                ]:
                    cursor.execute("""
                        INSERT INTO duplicate_categories (analysis_id, category_type, count, percentage)
                        VALUES (%s, %s, %s, %s)
                    """, (analysis_id, cat_type, count, pct))

                # Store duplicate groups with records
                for group in analysis_results.get('duplicateGroups', []):
                    cursor.execute("""
                        INSERT INTO duplicate_groups (
                            analysis_id, group_id, match_type, category, record_count,
                            key_columns, reason, recommendation, recommendation_text, records
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        analysis_id,
                        group['groupId'],
                        group['matchType'],
                        group['category'],
                        group['recordCount'],
                        json.dumps(group['keyColumns']),
                        group['reason'],
                        group['recommendation'],
                        group['recommendationText'],
                        json.dumps(group.get('records', []))
                    ))

                # Store root causes
                for cause in analysis_results.get('rootCauses', []):
                    cursor.execute("""
                        INSERT INTO root_causes (
                            analysis_id, cause_id, category, title, status_type,
                            confidence_score, explanation, evidence, affected_count, affected_groups
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        analysis_id,
                        cause['id'],
                        cause['category'],
                        cause['title'],
                        cause['statusType'],
                        cause['confidenceScore'],
                        cause['explanation'],
                        cause['evidence'],
                        cause['affectedCount'],
                        json.dumps(cause['affectedGroups'])
                    ))

                # Store report
                report = analysis_results.get('report', {})
                if report:
                    b_pct = float(str(report.get('beforeMetrics', {}).get('duplicatePercentage', '0')).rstrip('%'))
                    a_score = float(str(report.get('afterSimulationMetrics', {}).get('dataCleanlinessScore', '0')).rstrip('%'))
                    cursor.execute("""
                        INSERT INTO reports (
                            analysis_id, generated_at, dataset_name, pipeline_version,
                            before_total_rows, before_unique_entities, before_duplicate_rows,
                            before_duplicate_percentage, after_total_rows, after_retained_valid_rows,
                            after_quarantined_rows, after_data_cleanliness_score, after_storage_saved_mb,
                            actions_summary
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        analysis_id,
                        report.get('generatedAt', ''),
                        report.get('datasetName', ''),
                        report.get('pipelineVersion', ''),
                        report.get('beforeMetrics', {}).get('totalRows', 0),
                        report.get('beforeMetrics', {}).get('uniqueEntities', 0),
                        report.get('beforeMetrics', {}).get('duplicateRows', 0),
                        b_pct,
                        report.get('afterSimulationMetrics', {}).get('totalRows', 0),
                        report.get('afterSimulationMetrics', {}).get('retainedValidRows', 0),
                        report.get('afterSimulationMetrics', {}).get('quarantinedRows', 0),
                        a_score,
                        str(report.get('afterSimulationMetrics', {}).get('storageSavedMB', '0 MB')),
                        json.dumps(report.get('actionsSummary', []))
                    ))

                self.mysql_connection.commit()
                cursor.close()
                return analysis_id
            except Exception as e:
                logger.warning(f"MySQL error storing results: {e}. Falling back to SQLite.")

        # 2. SQLite Fallback Storage
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                cursor = conn.cursor()
                profile_json = json.dumps(analysis_results.get('profile', {}))
                cursor.execute("""
                    INSERT INTO analysis_results (
                        dataset_id, total_rows, total_columns, missing_values_count,
                        duplicate_records_count, duplicate_percentage, duplicate_groups_count,
                        status, last_analyzed, summary_text, profile_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    dataset_id,
                    summary['totalRows'],
                    summary['totalColumns'],
                    summary['missingValuesCount'],
                    summary['duplicateRecordsCount'],
                    summary['duplicatePercentage'],
                    summary['duplicateGroupsCount'],
                    summary['status'],
                    summary['lastAnalyzed'],
                    summary['summaryText'],
                    profile_json
                ))
                analysis_id = cursor.lastrowid

                categories = analysis_results.get('duplicateCategories', {})
                for cat_type, count, pct in [
                    ('exact', categories.get('exactCount', 0), categories.get('exactPercentage', 0.0)),
                    ('key-based', categories.get('keyBasedCount', 0), categories.get('keyBasedPercentage', 0.0)),
                    ('potential', categories.get('potentialCount', 0), categories.get('potentialPercentage', 0.0))
                ]:
                    cursor.execute("""
                        INSERT INTO duplicate_categories (analysis_id, category_type, count, percentage)
                        VALUES (?, ?, ?, ?)
                    """, (analysis_id, cat_type, count, pct))

                for group in analysis_results.get('duplicateGroups', []):
                    cursor.execute("""
                        INSERT INTO duplicate_groups (
                            analysis_id, group_id, match_type, category, record_count,
                            key_columns, reason, recommendation, recommendation_text, records
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        analysis_id,
                        group['groupId'],
                        group['matchType'],
                        group['category'],
                        group['recordCount'],
                        json.dumps(group['keyColumns']),
                        group['reason'],
                        group['recommendation'],
                        group['recommendationText'],
                        json.dumps(group.get('records', []))
                    ))

                for cause in analysis_results.get('rootCauses', []):
                    cursor.execute("""
                        INSERT INTO root_causes (
                            analysis_id, cause_id, category, title, status_type,
                            confidence_score, explanation, evidence, affected_count, affected_groups
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        analysis_id,
                        cause['id'],
                        cause['category'],
                        cause['title'],
                        cause['statusType'],
                        cause['confidenceScore'],
                        cause['explanation'],
                        cause['evidence'],
                        cause['affectedCount'],
                        json.dumps(cause['affectedGroups'])
                    ))

                report = analysis_results.get('report', {})
                if report:
                    b_pct = float(str(report.get('beforeMetrics', {}).get('duplicatePercentage', '0')).rstrip('%'))
                    a_score = float(str(report.get('afterSimulationMetrics', {}).get('dataCleanlinessScore', '0')).rstrip('%'))
                    cursor.execute("""
                        INSERT INTO reports (
                            analysis_id, generated_at, dataset_name, pipeline_version,
                            before_total_rows, before_unique_entities, before_duplicate_rows,
                            before_duplicate_percentage, after_total_rows, after_retained_valid_rows,
                            after_quarantined_rows, after_data_cleanliness_score, after_storage_saved_mb,
                            actions_summary
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        analysis_id,
                        report.get('generatedAt', ''),
                        report.get('datasetName', ''),
                        report.get('pipelineVersion', ''),
                        report.get('beforeMetrics', {}).get('totalRows', 0),
                        report.get('beforeMetrics', {}).get('uniqueEntities', 0),
                        report.get('beforeMetrics', {}).get('duplicateRows', 0),
                        b_pct,
                        report.get('afterSimulationMetrics', {}).get('totalRows', 0),
                        report.get('afterSimulationMetrics', {}).get('retainedValidRows', 0),
                        report.get('afterSimulationMetrics', {}).get('quarantinedRows', 0),
                        a_score,
                        str(report.get('afterSimulationMetrics', {}).get('storageSavedMB', '0 MB')),
                        json.dumps(report.get('actionsSummary', []))
                    ))

                conn.commit()
                return analysis_id
        except Exception as e:
            logger.error(f"Error storing analysis results in SQLite: {e}")
            return None

    def get_analysis_results(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored analysis results for a dataset"""
        self.connect()

        # 1. Try MySQL
        if self.is_mysql and self.mysql_connection:
            try:
                cursor = self.mysql_connection.cursor(dictionary=True)
                cursor.execute(
                    "SELECT * FROM analysis_results WHERE dataset_id = %s ORDER BY id DESC LIMIT 1",
                    (dataset_id,)
                )
                analysis = cursor.fetchone()
                if analysis:
                    analysis_id = analysis['id']
                    cursor.execute("SELECT * FROM duplicate_categories WHERE analysis_id = %s", (analysis_id,))
                    categories = cursor.fetchall()
                    cursor.execute("SELECT * FROM duplicate_groups WHERE analysis_id = %s", (analysis_id,))
                    groups = cursor.fetchall()
                    cursor.execute("SELECT * FROM root_causes WHERE analysis_id = %s", (analysis_id,))
                    causes = cursor.fetchall()
                    cursor.execute("SELECT * FROM reports WHERE analysis_id = %s", (analysis_id,))
                    report = cursor.fetchone()
                    cursor.close()

                    return self._format_results(analysis, categories, groups, causes, report)
            except Exception as e:
                logger.warning(f"MySQL error getting analysis results: {e}")

        # 2. SQLite Fallback
        try:
            with sqlite3.connect(self.sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM analysis_results WHERE dataset_id = ? ORDER BY id DESC LIMIT 1",
                    (dataset_id,)
                )
                analysis = cursor.fetchone()
                if analysis:
                    analysis_id = analysis['id']
                    cursor.execute("SELECT * FROM duplicate_categories WHERE analysis_id = ?", (analysis_id,))
                    categories = [dict(r) for r in cursor.fetchall()]
                    cursor.execute("SELECT * FROM duplicate_groups WHERE analysis_id = ?", (analysis_id,))
                    groups = [dict(r) for r in cursor.fetchall()]
                    cursor.execute("SELECT * FROM root_causes WHERE analysis_id = ?", (analysis_id,))
                    causes = [dict(r) for r in cursor.fetchall()]
                    cursor.execute("SELECT * FROM reports WHERE analysis_id = ?", (analysis_id,))
                    rep_row = cursor.fetchone()
                    report = dict(rep_row) if rep_row else None

                    return self._format_results(dict(analysis), categories, groups, causes, report)
        except Exception as e:
            logger.error(f"Error retrieving analysis results from SQLite: {e}")

        return None

    def _format_results(self, analysis, categories, groups, causes, report) -> Dict[str, Any]:
        """Format database rows into canonical API JSON payload"""
        profile_data = {}
        if 'profile_json' in analysis and analysis['profile_json']:
            try:
                profile_data = json.loads(analysis['profile_json']) if isinstance(analysis['profile_json'], str) else analysis['profile_json']
            except Exception:
                profile_data = {}

        return {
            'summary': {
                'totalRows': analysis.get('total_rows', 0),
                'totalColumns': analysis.get('total_columns', 0),
                'missingValuesCount': analysis.get('missing_values_count', 0),
                'duplicateRecordsCount': analysis.get('duplicate_records_count', 0),
                'duplicatePercentage': float(analysis.get('duplicate_percentage', 0.0)),
                'duplicateGroupsCount': analysis.get('duplicate_groups_count', 0),
                'status': analysis.get('status', 'Completed'),
                'lastAnalyzed': str(analysis.get('last_analyzed', '')),
                'summaryText': analysis.get('summary_text', '')
            },
            'profile': profile_data,
            'duplicateCategories': {
                'exactCount': next((c['count'] for c in categories if c['category_type'] == 'exact'), 0),
                'exactPercentage': float(next((c['percentage'] for c in categories if c['category_type'] == 'exact'), 0.0)),
                'keyBasedCount': next((c['count'] for c in categories if c['category_type'] == 'key-based'), 0),
                'keyBasedPercentage': float(next((c['percentage'] for c in categories if c['category_type'] == 'key-based'), 0.0)),
                'potentialCount': next((c['count'] for c in categories if c['category_type'] == 'potential'), 0),
                'potentialPercentage': float(next((c['percentage'] for c in categories if c['category_type'] == 'potential'), 0.0))
            },
            'duplicateGroups': [{
                'groupId': g['group_id'],
                'matchType': g['match_type'],
                'category': g['category'],
                'recordCount': g['record_count'],
                'keyColumns': json.loads(g['key_columns']) if isinstance(g.get('key_columns'), str) else (g.get('key_columns') or []),
                'reason': g['reason'],
                'recommendation': g['recommendation'],
                'recommendationText': g['recommendation_text'],
                'records': json.loads(g['records']) if isinstance(g.get('records'), str) else (g.get('records') or [])
            } for g in groups],
            'rootCauses': [{
                'id': c['cause_id'],
                'category': c['category'],
                'title': c['title'],
                'statusType': c['status_type'],
                'confidenceScore': int(c['confidence_score']),
                'explanation': c['explanation'],
                'evidence': c['evidence'],
                'affectedCount': int(c['affected_count']),
                'affectedGroups': json.loads(c['affected_groups']) if isinstance(c.get('affected_groups'), str) else (c.get('affected_groups') or [])
            } for c in causes],
            'report': {
                'generatedAt': str(report.get('generated_at', '')) if report else '',
                'datasetName': report.get('dataset_name', '') if report else '',
                'pipelineVersion': report.get('pipeline_version', '') if report else '',
                'beforeMetrics': {
                    'totalRows': report.get('before_total_rows', 0) if report else 0,
                    'uniqueEntities': report.get('before_unique_entities', 0) if report else 0,
                    'duplicateRows': report.get('before_duplicate_rows', 0) if report else 0,
                    'duplicatePercentage': f"{report.get('before_duplicate_percentage', 0.0)}%" if report else '0%'
                },
                'afterSimulationMetrics': {
                    'totalRows': report.get('after_total_rows', 0) if report else 0,
                    'retainedValidRows': report.get('after_retained_valid_rows', 0) if report else 0,
                    'quarantinedRows': report.get('after_quarantined_rows', 0) if report else 0,
                    'dataCleanlinessScore': f"{report.get('after_data_cleanliness_score', 0.0)}%" if report else '0%',
                    'storageSavedMB': report.get('after_storage_saved_mb', '0 MB') if report else '0 MB'
                },
                'actionsSummary': json.loads(report['actions_summary']) if (report and isinstance(report.get('actions_summary'), str)) else (report.get('actions_summary') or [] if report else [])
            }
        }


# Global database manager instance
db_manager = DatabaseManager()


def init_database() -> bool:
    """Initialize database connection and schema"""
    return db_manager.initialize_schema()


def get_db_manager() -> DatabaseManager:
    """Get the singleton database manager"""
    return db_manager
