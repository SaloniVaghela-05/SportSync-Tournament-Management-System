import React from 'react';

interface ReportTableProps {
  data: any[];
  title?: string;
  description?: string;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, title, description }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  // Get column headers from the first row
  const columns = Object.keys(data[0]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {(title || description) && (
        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-xl font-semibold text-gray-800 mb-1">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600">
        Total records: {data.length}
      </div>
    </div>
  );
};

export default ReportTable;

