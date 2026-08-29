import React from 'react';

const RiskReasons = ({ reasons }) => {
  if (!reasons || reasons.length === 0) {
    return <p className="text-gray-500 text-sm">No significant risk factors identified.</p>;
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Key Risk Indicators</h3>
      <ul className="space-y-3">
        {reasons.map((reason, idx) => (
          <li key={idx} className="flex items-start bg-gray-50 p-3 rounded-md">
            <span className="flex-shrink-0 mt-0.5">
              {reason.severity === 'CRITICAL' && <span className="text-red-500 text-xl">⚠️</span>}
              {reason.severity === 'HIGH' && <span className="text-orange-500 text-xl">⚠️</span>}
              {reason.severity === 'MEDIUM' && <span className="text-yellow-500 text-xl">!</span>}
              {reason.severity === 'LOW' && <span className="text-blue-500 text-xl">ℹ️</span>}
            </span>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{reason.title}</p>
              <p className="text-sm text-gray-500 mt-1">{reason.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RiskReasons;
