import React from 'react';

interface EmissionsChartProps {
  data: { label: string; value: number }[];
  target?: number;
}

export const EmissionsChart: React.FC<EmissionsChartProps> = ({ data, target }) => {
  const maxValue = Math.max(...data.map(d => d.value), target || 0) || 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>CO₂ Emissions (tons)</span>
        {target && <span>Target: {target}t</span>}
      </div>

      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-between space-x-2">
          {data.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100/50 rounded-t-lg overflow-hidden h-full flex flex-col justify-end">
                <div
                  className="bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-700 ease-out rounded-t-lg group relative"
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    minHeight: item.value > 0 ? '4px' : '0px'
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                    {item.value.toFixed(3)} tons
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 mt-2 rotate-45 sm:rotate-0 origin-top font-medium uppercase truncate w-full text-center">{item.label}</span>
            </div>
          ))}
        </div>

        {target && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-red-400 z-0 flex items-center"
            style={{
              bottom: `${(target / maxValue) * 100}%`,
              transition: 'bottom 0.5s ease-in-out'
            }}
          >
            <span className="bg-white px-1 text-[8px] text-red-500 font-bold -mt-1 ml-auto">TARGET</span>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 font-medium border-t border-gray-50 pt-2">
        <span>0.000t</span>
        <span>MAX: {maxValue.toFixed(3)}t</span>
      </div>
    </div>
  );
};