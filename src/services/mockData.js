/**
 * Pre-packaged Realistic Synthetic Dataset and Diagnostic Mock Data
 * 
 * Provides realistic data engineering scenarios for student capstone demonstration
 * when PySpark/Delta Lake backend is operating in Demo Mode.
 */

export const SAMPLE_DATASET_NAME = 'customer_orders_incremental_v2.csv';

// Sample raw dataset rows for browser preview
export const SAMPLE_RAW_ROWS = [
  { order_id: 'ORD-90210', customer_id: 'CUST-101', customer_name: 'Sarah Jenkins', email: 's.jenkins@example.com', transaction_date: '2026-09-18 10:15:00', amount: 149.99, payment_status: 'COMPLETED', shipping_address: '742 Evergreen Terrace, Springfield', batch_id: 'BATCH_2026_09_18_01', source_system: 'WEB_STORE' },
  { order_id: 'ORD-90210', customer_id: 'CUST-101', customer_name: 'Sarah Jenkins', email: 's.jenkins@example.com', transaction_date: '2026-09-18 10:15:00', amount: 149.99, payment_status: 'COMPLETED', shipping_address: '742 Evergreen Terrace, Springfield', batch_id: 'BATCH_2026_09_18_02', source_system: 'WEB_STORE' },
  { order_id: 'ORD-90211', customer_id: 'CUST-102', customer_name: 'Michael Chen', email: 'm.chen@example.com', transaction_date: '2026-09-18 10:30:22', amount: 89.50, payment_status: 'PENDING', shipping_address: '128 Market St, San Francisco, CA', batch_id: 'BATCH_2026_09_18_01', source_system: 'MOBILE_APP' },
  { order_id: 'ORD-90211', customer_id: 'CUST-102', customer_name: 'Michael Chen', email: 'm.chen@example.com', transaction_date: '2026-09-18 10:35:10', amount: 89.50, payment_status: 'COMPLETED', shipping_address: '128 Market St, San Francisco, CA', batch_id: 'BATCH_2026_09_18_02', source_system: 'MOBILE_APP' },
  { order_id: 'ORD-90212', customer_id: 'CUST-103', customer_name: 'David Rodriguez', email: 'd.rod@example.com', transaction_date: '2026-09-18 11:04:15', amount: 320.00, payment_status: 'COMPLETED', shipping_address: '450 Ocean Ave, Miami, FL', batch_id: 'BATCH_2026_09_18_01', source_system: 'WEB_STORE' },
  { order_id: 'ORD-90213', customer_id: 'CUST-104', customer_name: 'Emily Watson', email: 'emily.w@example.com', transaction_date: '2026-09-18 11:20:00', amount: 45.25, payment_status: 'FAILED', shipping_address: '12 Oak Ridge Rd, Austin, TX', batch_id: 'BATCH_2026_09_18_01', source_system: 'POS_TERMINAL' },
  { order_id: 'ORD-90213', customer_id: 'CUST-104', customer_name: 'Emily Watson', email: 'emily.watson@example.com', transaction_date: '2026-09-18 11:20:00', amount: 45.25, payment_status: 'COMPLETED', shipping_address: '12 Oak Ridge Rd, Apt 4B, Austin, TX', batch_id: 'BATCH_2026_09_18_03', source_system: 'POS_TERMINAL' },
  { order_id: 'ORD-90214', customer_id: 'CUST-105', customer_name: 'Robert Taylor', email: 'rtaylor@example.com', transaction_date: '2026-09-18 12:00:11', amount: 512.80, payment_status: 'COMPLETED', shipping_address: '99 Pine Crest Way, Seattle, WA', batch_id: 'BATCH_2026_09_18_01', source_system: 'WEB_STORE' },
  { order_id: 'ORD-90214', customer_id: 'CUST-105', customer_name: 'Robert Taylor', email: 'rtaylor@example.com', transaction_date: '2026-09-18 12:00:11', amount: 512.80, payment_status: 'COMPLETED', shipping_address: '99 Pine Crest Way, Seattle, WA', batch_id: 'BATCH_2026_09_18_01', source_system: 'WEB_STORE' },
  { order_id: 'ORD-90215', customer_id: 'CUST-106', customer_name: 'Amanda Martinez', email: 'amanda.m@example.com', transaction_date: '2026-09-18 13:45:00', amount: 78.00, payment_status: 'COMPLETED', shipping_address: '333 Sunset Blvd, Los Angeles, CA', batch_id: 'BATCH_2026_09_18_02', source_system: 'MOBILE_APP' },
  { order_id: 'ORD-90216', customer_id: 'CUST-107', customer_name: 'James Wilson', email: 'jwilson@example.com', transaction_date: '2026-09-18 14:10:05', amount: 210.50, payment_status: 'PENDING', shipping_address: '55 Beacon St, Boston, MA', batch_id: 'BATCH_2026_09_18_02', source_system: 'WEB_STORE' },
  { order_id: 'ORD-90216-B', customer_id: 'CUST-107', customer_name: 'Jim Wilson', email: 'jwilson@example.com', transaction_date: '2026-09-18 14:10:05', amount: 210.50, payment_status: 'COMPLETED', shipping_address: '55 Beacon St, Suite 2, Boston, MA', batch_id: 'BATCH_2026_09_18_03', source_system: 'WEB_STORE' },
];

export const MOCK_ANALYSIS_RESULTS = {
  summary: {
    totalRows: 1250,
    totalColumns: 10,
    missingValuesCount: 42,
    duplicateRecordsCount: 148,
    duplicatePercentage: 11.84,
    duplicateGroupsCount: 52,
    status: 'Completed',
    lastAnalyzed: '2026-09-20 14:40:00',
    summaryText: 'Analysis detected 148 duplicate rows across 52 distinct duplicate groups. Primary driver identified is repeated batch ingestion combined with missing compound merge keys in the incremental pipeline.'
  },
  
  profile: {
    dimensions: '1,250 Rows × 10 Columns',
    completenessScore: 96.64,
    uniquenessScore: 88.16,
    columns: [
      { name: 'order_id', dataType: 'String', nullCount: 0, nullPercentage: 0.0, uniquenessScore: 95.8, sample: 'ORD-90210' },
      { name: 'customer_id', dataType: 'String', nullCount: 0, nullPercentage: 0.0, uniquenessScore: 82.4, sample: 'CUST-101' },
      { name: 'customer_name', dataType: 'String', nullCount: 2, nullPercentage: 0.16, uniquenessScore: 84.1, sample: 'Sarah Jenkins' },
      { name: 'email', dataType: 'String', nullCount: 5, nullPercentage: 0.40, uniquenessScore: 83.9, sample: 's.jenkins@example.com' },
      { name: 'transaction_date', dataType: 'Timestamp', nullCount: 0, nullPercentage: 0.0, uniquenessScore: 91.2, sample: '2026-09-18 10:15:00' },
      { name: 'amount', dataType: 'Float', nullCount: 0, nullPercentage: 0.0, uniquenessScore: 45.6, sample: '149.99' },
      { name: 'payment_status', dataType: 'String', nullCount: 12, nullPercentage: 0.96, uniquenessScore: 0.3, sample: 'COMPLETED' },
      { name: 'shipping_address', dataType: 'String', nullCount: 23, nullPercentage: 1.84, uniquenessScore: 81.0, sample: '742 Evergreen Terrace' },
      { name: 'batch_id', dataType: 'String', nullCount: 0, nullPercentage: 0.0, uniquenessScore: 0.4, sample: 'BATCH_2026_09_18_01' },
      { name: 'source_system', dataType: 'String', nullCount: 0, nullPercentage: 0.0, uniquenessScore: 0.2, sample: 'WEB_STORE' },
    ]
  },

  duplicateCategories: {
    exactCount: 64,
    exactPercentage: 43.2,
    keyBasedCount: 58,
    keyBasedPercentage: 39.2,
    potentialCount: 26,
    potentialPercentage: 17.6,
  },

  duplicateGroups: [
    {
      groupId: 'DG-001',
      matchType: 'Exact Duplicate',
      category: 'exact',
      recordCount: 2,
      keyColumns: ['order_id', 'customer_id', 'transaction_date', 'amount', 'shipping_address'],
      reason: '100% field identity across all columns. Caused by duplicate batch ingestion.',
      recommendation: 'MERGE',
      recommendationText: 'Consolidate duplicate records into a single row; retain original source batch provenance metadata.',
      records: [
        { row_num: 1, order_id: 'ORD-90210', customer_id: 'CUST-101', customer_name: 'Sarah Jenkins', email: 's.jenkins@example.com', transaction_date: '2026-09-18 10:15:00', amount: 149.99, payment_status: 'COMPLETED', shipping_address: '742 Evergreen Terrace, Springfield', batch_id: 'BATCH_2026_09_18_01', source_system: 'WEB_STORE' },
        { row_num: 2, order_id: 'ORD-90210', customer_id: 'CUST-101', customer_name: 'Sarah Jenkins', email: 's.jenkins@example.com', transaction_date: '2026-09-18 10:15:00', amount: 149.99, payment_status: 'COMPLETED', shipping_address: '742 Evergreen Terrace, Springfield', batch_id: 'BATCH_2026_09_18_02', source_system: 'WEB_STORE' }
      ]
    },
    {
      groupId: 'DG-002',
      matchType: 'Key-Based Duplicate',
      category: 'key-based',
      recordCount: 2,
      keyColumns: ['order_id', 'customer_id'],
      reason: 'Matches primary business key (order_id) but state updated from PENDING to COMPLETED.',
      recommendation: 'MERGE',
      recommendationText: 'Deduplicate by keeping latest transaction update (COMPLETED state at 10:35:10).',
      records: [
        { row_num: 3, order_id: 'ORD-90211', customer_id: 'CUST-102', customer_name: 'Michael Chen', email: 'm.chen@example.com', transaction_date: '2026-09-18 10:30:22', amount: 89.50, payment_status: 'PENDING', shipping_address: '128 Market St, San Francisco, CA', batch_id: 'BATCH_2026_09_18_01', source_system: 'MOBILE_APP' },
        { row_num: 4, order_id: 'ORD-90211', customer_id: 'CUST-102', customer_name: 'Michael Chen', email: 'm.chen@example.com', transaction_date: '2026-09-18 10:35:10', amount: 89.50, payment_status: 'COMPLETED', shipping_address: '128 Market St, San Francisco, CA', batch_id: 'BATCH_2026_09_18_02', source_system: 'MOBILE_APP' }
      ]
    },
    {
      groupId: 'DG-003',
      matchType: 'Potential Duplicate',
      category: 'potential',
      recordCount: 2,
      keyColumns: ['customer_name', 'email', 'amount'],
      reason: 'Same transaction details and customer email with slightly mutated order key (ORD-90216 vs ORD-90216-B).',
      recommendation: 'QUARANTINE',
      recommendationText: 'Flagged for data steward review due to key discrepancy and address suite suffix variation.',
      records: [
        { row_num: 11, order_id: 'ORD-90216', customer_id: 'CUST-107', customer_name: 'James Wilson', email: 'jwilson@example.com', transaction_date: '2026-09-18 14:10:05', amount: 210.50, payment_status: 'PENDING', shipping_address: '55 Beacon St, Boston, MA', batch_id: 'BATCH_2026_09_18_02', source_system: 'WEB_STORE' },
        { row_num: 12, order_id: 'ORD-90216-B', customer_id: 'CUST-107', customer_name: 'Jim Wilson', email: 'jwilson@example.com', transaction_date: '2026-09-18 14:10:05', amount: 210.50, payment_status: 'COMPLETED', shipping_address: '55 Beacon St, Suite 2, Boston, MA', batch_id: 'BATCH_2026_09_18_03', source_system: 'WEB_STORE' }
      ]
    },
    {
      groupId: 'DG-004',
      matchType: 'Key-Based Duplicate',
      category: 'key-based',
      recordCount: 2,
      keyColumns: ['customer_id', 'amount'],
      reason: 'Multiple legit orders by customer CUST-104 within same batch timeframe with updated address.',
      recommendation: 'MERGE',
      recommendationText: 'Consolidate customer profile; update failed attempt with completed order detail.',
      records: [
        { row_num: 6, order_id: 'ORD-90213', customer_id: 'CUST-104', customer_name: 'Emily Watson', email: 'emily.w@example.com', transaction_date: '2026-09-18 11:20:00', amount: 45.25, payment_status: 'FAILED', shipping_address: '12 Oak Ridge Rd, Austin, TX', batch_id: 'BATCH_2026_09_18_01', source_system: 'POS_TERMINAL' },
        { row_num: 7, order_id: 'ORD-90213', customer_id: 'CUST-104', customer_name: 'Emily Watson', email: 'emily.watson@example.com', transaction_date: '2026-09-18 11:20:00', amount: 45.25, payment_status: 'COMPLETED', shipping_address: '12 Oak Ridge Rd, Apt 4B, Austin, TX', batch_id: 'BATCH_2026_09_18_03', source_system: 'POS_TERMINAL' }
      ]
    }
  ],

  rootCauses: [
    {
      id: 'RC-01',
      category: 'Repeated Batch Processing',
      title: 'Pipeline Re-ingestion without Idempotency Key',
      statusType: 'Confirmed',
      confidenceScore: 98,
      explanation: 'Ingestion pipeline re-processed BATCH_2026_09_18_02 following a network timeout restart, inserting 64 identical rows without checking Delta table transaction log state.',
      evidence: '64 records share 100% attribute parity with BATCH_2026_09_18_01, originating from same source IP.',
      affectedCount: 64,
      affectedGroups: ['DG-001']
    },
    {
      id: 'RC-02',
      category: 'Incorrect Merge Keys',
      title: 'Incomplete Compound Primary Key in MERGE INTO Clause',
      statusType: 'Confirmed',
      confidenceScore: 92,
      explanation: 'PySpark Delta Lake MERGE statement joined on `order_id` alone instead of `(order_id, customer_id)`. When customer details updated, duplicate rows were inserted rather than updated.',
      evidence: '58 records contain identical order_id but updated payment_status timestamp.',
      affectedCount: 58,
      affectedGroups: ['DG-002', 'DG-004']
    },
    {
      id: 'RC-03',
      category: 'Join-Related Duplication',
      title: '1-to-Many Cartesian Product during Currency Dimension Lookup',
      statusType: 'Confirmed',
      confidenceScore: 88,
      explanation: 'Dimension lookup join on currency exchange rates table matched multiple historic rate records for the same transaction date, duplicating factual sales rows.',
      evidence: 'Duplicated records exhibit identical business keys but paired with multiple currency exchange rate IDs.',
      affectedCount: 16,
      affectedGroups: ['DG-005']
    },
    {
      id: 'RC-04',
      category: 'Late-Arriving Records',
      title: 'Out-of-Order Mobile App Offline Event Sync',
      statusType: 'Possible',
      confidenceScore: 75,
      explanation: 'Mobile application synced offline cash transactions 48 hours late with past timestamps, conflicting with web store real-time orders.',
      evidence: 'Transaction timestamps precede batch ingestion timestamp by over 48 hours.',
      affectedCount: 8,
      affectedGroups: ['DG-006']
    },
    {
      id: 'RC-05',
      category: 'Source Duplicates',
      title: 'Upstream Webhook Event Re-emission',
      statusType: 'Possible',
      confidenceScore: 65,
      explanation: 'Payment gateway emitted duplicate webhook notifications due to client HTTP retry header without unique idempotency token.',
      evidence: 'Identical payment_status transitions received within 500ms of initial event.',
      affectedCount: 2,
      affectedGroups: ['DG-003']
    }
  ],

  report: {
    generatedAt: '2026-09-20 14:40:42',
    datasetName: 'customer_orders_incremental_v2.csv',
    pipelineVersion: 'DEAI-10 DataDup Guard Engine v1.2',
    beforeMetrics: {
      totalRows: 1250,
      uniqueEntities: 1102,
      duplicateRows: 148,
      duplicatePercentage: '11.84%'
    },
    afterSimulationMetrics: {
      totalRows: 1102,
      retainedValidRows: 1088,
      quarantinedRows: 14,
      dataCleanlinessScore: '99.4%',
      storageSavedMB: '0.42 MB'
    },
    actionsSummary: [
      { action: 'MERGE', count: 122, percent: '82.4%', text: 'Consolidated into single master entity via Delta MERGE rules.' },
      { action: 'KEEP', count: 12, percent: '8.1%', text: 'Retained as valid distinct physical events.' },
      { action: 'QUARANTINE', count: 14, percent: '9.5%', text: 'Isolated to Delta Quarantine table for human steward audit.' }
    ]
  }
};
