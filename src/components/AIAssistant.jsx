import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, ChevronRight, MessageSquare, ShieldCheck } from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { apiRequest } from '../services/api';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { backendStatus, datasetInfo, analysisResults } = useDataset();

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am the DataDup AI Assistant. I analyze pipeline duplicate diagnostics, PySpark Delta MERGE keys, and quarantine strategies. How can I help with your dataset?',
      suggestedActions: [
        'Why did repeated batch processing occur?',
        'What is the quarantine strategy for Group DG-003?',
        'Explain Delta MERGE compound keys'
      ]
    }
  ]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      if (backendStatus.connected) {
        const data = await apiRequest('/ai/chat', {
          method: 'POST',
          body: { prompt: textToSend, datasetId: datasetInfo?.id || 'DS-SAMPLE' }
        });
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.response,
          suggestedActions: data.suggestedActions || []
        }]);
      } else {
        // Fallback demo AI assistant response
        await new Promise(r => setTimeout(r, 600));
        let demoResp = "DataDup AI Assistant: Diagnostic scanning indicates 148 duplicate records across 52 groups. Primary drivers are Repeated Batch Ingestion (43.2%) and Incomplete MERGE Keys (39.2%). Recommended strategy: MERGE 82.4% and QUARANTINE 9.5%.";
        let actions = ["View Root-Cause Findings", "Download Audit Report"];
        
        const q = textToSend.toLowerCase();
        if (q.includes("batch") || q.includes("repeated")) {
          demoResp = "Repeated Batch Ingestion occurs when an incremental pipeline fails mid-execution and re-executes without checking Delta Lake transaction logs. Remediation: Implement idempotency keys in PySpark write streams.";
          actions = ["Enable Delta Lake Idempotent Writes", "Set spark.databricks.delta.write.txnAppId"];
        } else if (q.includes("merge") || q.includes("key")) {
          demoResp = "Incomplete MERGE keys cause PySpark Delta Lake MERGE INTO to insert duplicate rows instead of updating existing entities. Ensure primary compound keys (order_id, customer_id) are defined.";
          actions = ["Update MERGE ON clause to compound key", "Validate unique primary key constraint"];
        } else if (q.includes("quarantine")) {
          demoResp = "Quarantine isolates ambiguous records with key or address discrepancies to a Delta Quarantine table (delta_quarantine_records) so valid business records are not lost.";
          actions = ["Review Group DG-003 in Quarantine Table", "Trigger Data Steward Reconciliation"];
        }

        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: demoResp,
          suggestedActions: actions
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: 'Apologies, I encountered an issue retrieving AI diagnostic assistance. Please try again.',
        suggestedActions: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-3.5 shadow-2xl flex items-center gap-2 font-medium text-xs transition-transform hover:scale-105 cursor-pointer border border-indigo-400/40"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {/* Main Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 m-0 flex items-center gap-1.5">
                  <span>DataDup AI Assistant</span>
                  <span className="bg-indigo-950 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded font-mono border border-indigo-800">
                    AI
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 m-0">Diagnostic & Pipeline Guidance</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[88%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Suggested Prompt Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 max-w-[88%]">
                    {msg.suggestedActions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => handleSendMessage(action)}
                        className="bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 text-[10px] px-2 py-1 rounded-md transition cursor-pointer text-left flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{action}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>AI Assistant is analyzing dataset context...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI about duplicates, MERGE keys..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
