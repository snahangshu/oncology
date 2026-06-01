import { BrainCircuit, AlertTriangle, ArrowRight } from 'lucide-react';

export function AIInsightWidget() {
  const insights = [
    {
      id: 1,
      title: 'High Risk Toxicity',
      confidence: '87%',
      reason: 'Rapid neutrophil decline in last 2 CBCs',
      action: 'Review CBC before starting infusion',
      severity: 'high'
    },
    {
      id: 2,
      title: 'Patient Overdue for CT Scan',
      confidence: '99%',
      reason: '21 days past protocol imaging window',
      action: 'Order Restaging CT Chest/Abd/Pelvis',
      severity: 'medium'
    },
    {
      id: 3,
      title: 'Infusion Bottleneck Predicted',
      confidence: '82%',
      reason: '3 complex regimens scheduled at 2 PM',
      action: 'Consider shifting 1 routine patient to 3 PM',
      severity: 'low'
    }
  ];

  return (
    <div className="clinical-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <BrainCircuit className="w-4 h-4 mr-2 text-purple-400" />
          AI Clinical Insights
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Demo Data</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {insights.map(insight => (
          <div key={insight.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg shadow-purple-900/5 hover:border-purple-500/30 transition-colors">
            {/* Header */}
            <div className={`p-2.5 flex justify-between items-center border-b border-slate-800 ${
              insight.severity === 'high' ? 'bg-red-500/10' : 
              insight.severity === 'medium' ? 'bg-amber-500/10' : 'bg-blue-500/10'
            }`}>
              <div className="flex items-center space-x-2">
                {insight.severity === 'high' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                <span className={`text-xs font-bold ${
                  insight.severity === 'high' ? 'text-red-400' : 
                  insight.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {insight.title}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
                CONF: <span className="text-purple-400 font-bold">{insight.confidence}</span>
              </span>
            </div>
            
            {/* Body */}
            <div className="p-3 text-xs space-y-2 bg-slate-900/50">
              <div>
                <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Reason</span>
                <span className="text-white font-medium">{insight.reason}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider text-[9px] block mb-0.5">Recommended Action</span>
                <div className="flex items-start text-emerald-400 font-bold">
                  <ArrowRight className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0" />
                  <span>{insight.action}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
