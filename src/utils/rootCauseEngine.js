/**
 * Client-Side Evidence-Based Root Cause Classification Engine
 * 
 * Mirrors backend Python algorithms to evaluate custom datasets even when operating
 * in offline or Demo Mode.
 * Covers:
 * 1. Repeated Ingestion (Repeated Batch Processing)
 * 2. Incomplete Merge Keys (Compound Primary Key omitted)
 * 3. Source Inconsistency (Cross-channel upstream duplication)
 * 4. JOIN Multiplication (1-to-many dimension fanout)
 * 5. Late-Arriving Records (Watermark exceeded / out-of-order)
 * 6. Unknown / Insufficient Evidence fallback
 */

export function classifyDatasetClientSide(rows) {
  if (!rows || rows.length === 0) {
    return {
      duplicateGroups: [],
      rootCauses: [],
      duplicateCategories: { exactCount: 0, exactPercentage: 0, keyBasedCount: 0, keyBasedPercentage: 0, potentialCount: 0, potentialPercentage: 0 }
    };
  }

  const columns = Object.keys(rows[0] || {});
  const metadataCols = new Set([
    'batch_id', 'batch', 'load_id', 'job_id', 'source_system', 'source',
    'channel', 'platform', 'created_at', 'updated_at', 'timestamp', 'row_num', 'index'
  ]);

  // Identify business key columns
  const potentialKeyCols = columns.filter(col => {
    const low = col.toLowerCase();
    if (metadataCols.has(low)) return false;
    return (
      low.includes('order_id') ||
      low.includes('customer_id') ||
      low.includes('patient_id') ||
      low.includes('user_id') ||
      low.endsWith('_id') ||
      low.endsWith('_key') ||
      low.endsWith('_code') ||
      ['id', 'key', 'email', 'phone'].includes(low)
    );
  });

  const keyCols = potentialKeyCols.length > 0
    ? potentialKeyCols
    : columns.filter(c => !metadataCols.has(c.toLowerCase()));

  const effectiveKeys = keyCols.length > 0 ? keyCols : columns;

  // Group duplicate records by candidate keys
  const groupsMap = new Map();

  rows.forEach((row, idx) => {
    const keyVal = effectiveKeys.map(k => String(row[k] ?? '')).join('||');
    if (!groupsMap.has(keyVal)) {
      groupsMap.set(keyVal, []);
    }
    groupsMap.get(keyVal).push({ row_num: idx + 1, ...row });
  });

  const duplicateGroups = [];
  let groupCounter = 1;
  let totalDuplicateRecords = 0;

  for (const [, groupRows] of groupsMap.entries()) {
    if (groupRows.length > 1) {
      totalDuplicateRecords += groupRows.length;

      // Cap detailed group inspection to top 100 groups to prevent DOM memory bloat
      if (duplicateGroups.length < 100) {
        const groupId = `DG-${String(groupCounter++).padStart(3, '0')}`;

        // Check if exact duplicate across all columns
        const firstRowStr = JSON.stringify(groupRows[0]);
        const isExact = groupRows.every(r => JSON.stringify(r) === firstRowStr);
        const isKeyBased = !isExact && effectiveKeys.length < columns.length;

        let matchType = 'Potential Duplicate';
        let category = 'potential';
        if (isExact) {
          matchType = 'Exact Duplicate';
          category = 'exact';
        } else if (isKeyBased) {
          matchType = 'Key-Based Duplicate';
          category = 'key-based';
        }

        // Check for varying columns
        const varyingCols = columns.filter(col => {
          if (col === 'row_num') return false;
          const vals = new Set(groupRows.map(r => String(r[col] ?? '')));
          return vals.size > 1;
        });

        const recommendation = isExact ? 'MERGE' : (isKeyBased ? 'MERGE' : 'QUARANTINE');
        const recText = isExact
          ? 'Consolidate duplicate records into a single row; retain original source batch provenance metadata.'
          : (isKeyBased
            ? 'Deduplicate by keeping latest transaction update based on timestamp fields.'
            : 'Flagged for data steward review due to discrepancies requiring manual validation.');

        duplicateGroups.push({
          groupId,
          matchType,
          category,
          recordCount: groupRows.length,
          keyColumns: effectiveKeys,
          reason: isExact
            ? '100% field identity across all columns. Caused by duplicate batch ingestion or pipeline replay.'
            : `Matches primary key ${effectiveKeys.join(', ')} but attributes vary: ${varyingCols.slice(0, 3).join(', ')}.`,
          recommendation,
          recommendationText: recText,
          records: groupRows.slice(0, 50)
        });
      }
    }
  }

  // Classify root causes across groups
  const aggregatedCauses = new Map();

  duplicateGroups.forEach(group => {
    const groupRows = group.records;
    const groupCauses = [];

    // 1. Repeated Ingestion check
    const batchCol = columns.find(c => ['batch_id', 'batch', 'load_id'].includes(c.toLowerCase()));
    if (batchCol) {
      const batches = [...new Set(groupRows.map(r => r[batchCol]).filter(Boolean))];
      if (batches.length > 1) {
        groupCauses.push({
          category: 'Repeated Batch Processing',
          title: 'Pipeline Re-ingestion without Idempotency Key',
          statusType: 'Confirmed',
          confidenceScore: 95,
          explanation: `Ingestion pipeline re-processed identical records across batches: ${batches.join(', ')} without idempotency checks.`,
          evidence: `Records share key fields but carry distinct ${batchCol} values: ${batches.join(', ')}`,
          affectedCount: groupRows.length,
          affectedGroups: [group.groupId]
        });
      }
    } else if (group.category === 'exact') {
      groupCauses.push({
        category: 'Repeated Batch Processing',
        title: 'Pipeline Re-ingestion without Idempotency Key',
        statusType: 'Confirmed',
        confidenceScore: 92,
        explanation: 'Multiple records exhibit 100% attribute parity across all columns, indicating redundant ingestion.',
        evidence: `${groupRows.length} records are exact duplicate rows across all fields.`,
        affectedCount: groupRows.length,
        affectedGroups: [group.groupId]
      });
    }

    // 2. Incomplete Merge Keys check
    const nonKeyCols = columns.filter(c => !effectiveKeys.includes(c) && !metadataCols.has(c.toLowerCase()));
    const differingCols = nonKeyCols.filter(c => new Set(groupRows.map(r => String(r[c] ?? ''))).size > 1);
    if (differingCols.length > 0) {
      groupCauses.push({
        category: 'Incorrect Merge Keys',
        title: 'Incomplete Compound Primary Key in MERGE INTO Clause',
        statusType: 'Confirmed',
        confidenceScore: 88,
        explanation: `MERGE statement joined on ${effectiveKeys.join(', ')}, but attributes (${differingCols.slice(0, 3).join(', ')}) were updated, inserting duplicate rows instead of updating in-place.`,
        evidence: `Keys ${effectiveKeys.join(', ')} match, but fields differ: ${differingCols.slice(0, 3).join(', ')}`,
        affectedCount: groupRows.length,
        affectedGroups: [group.groupId]
      });
    }

    // 3. Source Inconsistency check
    const srcCol = columns.find(c => ['source_system', 'source', 'channel', 'platform'].includes(c.toLowerCase()));
    if (srcCol) {
      const sources = [...new Set(groupRows.map(r => r[srcCol]).filter(Boolean))];
      if (sources.length > 1) {
        groupCauses.push({
          category: 'Source Inconsistency',
          title: 'Upstream Source System Duplication',
          statusType: 'Confirmed',
          confidenceScore: 85,
          explanation: `Records originate from disparate upstream sources: ${sources.join(', ')} without cross-system deduplication.`,
          evidence: `Identical business keys found across multiple sources: ${sources.join(', ')}`,
          affectedCount: groupRows.length,
          affectedGroups: [group.groupId]
        });
      }
    }

    // 4. JOIN Multiplication check
    const dimCols = columns.filter(c => 
      (c.toLowerCase().includes('rate') || c.toLowerCase().includes('dimension') || c.toLowerCase().includes('currency')) &&
      !effectiveKeys.includes(c)
    );
    for (const dCol of dimCols) {
      const dimVals = [...new Set(groupRows.map(r => r[dCol]).filter(Boolean))];
      if (dimVals.length > 1) {
        groupCauses.push({
          category: 'JOIN Multiplication',
          title: `1-to-Many Cartesian Product during ${dCol} Lookup`,
          statusType: 'Confirmed',
          confidenceScore: 82,
          explanation: `Dimension lookup join on ${dCol} matched multiple values, multiplying factual rows.`,
          evidence: `Record duplicated across ${dimVals.length} lookup values: ${dimVals.join(', ')}`,
          affectedCount: groupRows.length,
          affectedGroups: [group.groupId]
        });
      }
    }

    // 5. Late-Arriving Records check
    const timeCol = columns.find(c => ['date', 'time', 'timestamp', 'created_at'].some(k => c.toLowerCase().includes(k)));
    if (timeCol) {
      const times = groupRows.map(r => new Date(r[timeCol]).getTime()).filter(t => !isNaN(t));
      if (times.length >= 2) {
        const diffMs = Math.max(...times) - Math.min(...times);
        const hours = diffMs / (1000 * 60 * 60);
        if (hours >= 24) {
          groupCauses.push({
            category: 'Late-Arriving Records',
            title: 'Out-of-Order Event Processing Detected',
            statusType: 'Confirmed',
            confidenceScore: 80,
            explanation: `Records arrived with a ${hours.toFixed(1)}h temporal deviation, exceeding the normal watermark window.`,
            evidence: `Timestamp ${timeCol} spans ${hours.toFixed(1)} hours across matching records.`,
            affectedCount: groupRows.length,
            affectedGroups: [group.groupId]
          });
        }
      }
    }

    // Unknown fallback
    if (groupCauses.length === 0) {
      groupCauses.push({
        category: 'Unknown',
        title: 'Insufficient Diagnostic Evidence for Root Cause Determination',
        statusType: 'Possible',
        confidenceScore: 35,
        explanation: 'Data patterns do not match standard pipeline failure signatures. Stewardship inspection required.',
        evidence: `Keys ${effectiveKeys.join(', ')} match, but attribute correlation is insufficient.`,
        affectedCount: groupRows.length,
        affectedGroups: [group.groupId]
      });
    }

    // Aggregate by category + title
    groupCauses.forEach(c => {
      const key = `${c.category}::${c.title}`;
      if (!aggregatedCauses.has(key)) {
        aggregatedCauses.set(key, {
          category: c.category,
          title: c.title,
          statusType: c.statusType,
          confidenceScores: [c.confidenceScore],
          explanation: c.explanation,
          evidences: [c.evidence],
          affectedCount: c.affectedCount,
          affectedGroups: new Set(c.affectedGroups)
        });
      } else {
        const item = aggregatedCauses.get(key);
        item.confidenceScores.push(c.confidenceScore);
        item.affectedCount += c.affectedCount;
        c.affectedGroups.forEach(g => item.affectedGroups.add(g));
        if (c.statusType === 'Confirmed') item.statusType = 'Confirmed';
        if (item.evidences.length < 2 && !item.evidences.includes(c.evidence)) {
          item.evidences.push(c.evidence);
        }
      }
    });
  });

  const rootCauses = [];
  let causeCounter = 1;
  for (const [, item] of aggregatedCauses.entries()) {
    const avgConfidence = Math.round(
      item.confidenceScores.reduce((a, b) => a + b, 0) / item.confidenceScores.length
    );
    rootCauses.push({
      id: `RC-${String(causeCounter++).padStart(2, '0')}`,
      category: item.category,
      title: item.title,
      statusType: item.statusType,
      confidenceScore: avgConfidence,
      explanation: item.explanation,
      evidence: item.evidences.join(' | '),
      affectedCount: item.affectedCount,
      affectedGroups: Array.from(item.affectedGroups).sort()
    });
  }

  // Calculate duplicate categories counts
  const totalDupRecords = duplicateGroups.reduce((acc, g) => acc + g.recordCount, 0);
  const exactCount = duplicateGroups.filter(g => g.category === 'exact').reduce((acc, g) => acc + g.recordCount, 0);
  const keyBasedCount = duplicateGroups.filter(g => g.category === 'key-based').reduce((acc, g) => acc + g.recordCount, 0);
  const potentialCount = duplicateGroups.filter(g => g.category === 'potential').reduce((acc, g) => acc + g.recordCount, 0);

  const duplicateCategories = {
    exactCount,
    exactPercentage: totalDupRecords > 0 ? parseFloat(((exactCount / totalDupRecords) * 100).toFixed(1)) : 0,
    keyBasedCount,
    keyBasedPercentage: totalDupRecords > 0 ? parseFloat(((keyBasedCount / totalDupRecords) * 100).toFixed(1)) : 0,
    potentialCount,
    potentialPercentage: totalDupRecords > 0 ? parseFloat(((potentialCount / totalDupRecords) * 100).toFixed(1)) : 0
  };

  return {
    duplicateGroups,
    rootCauses,
    duplicateCategories,
    totalDuplicateRecords: totalDupRecords
  };
}

