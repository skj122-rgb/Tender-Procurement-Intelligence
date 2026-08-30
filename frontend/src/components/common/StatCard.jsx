import React from 'react';

const StatCard = ({ title, value, icon, trend, trendLabel, colorClass = "text-blue-600 bg-blue-100" }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`rounded-md p-3 ${colorClass}`}>
              <span className="text-xl">{icon}</span>
            </div>
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <dl>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 leading-tight">{title}</dt>
              <dd className="mt-1">
                <div className="text-2xl font-extrabold text-slate-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {(trend || trendLabel) && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            {trend && (
              <span className={`font-medium mr-2 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            )}
            <span className="text-gray-500">{trendLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
