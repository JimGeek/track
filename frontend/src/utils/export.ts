// Export/Import utilities

export interface ExportData {
  projects: any[];
  features: any[];
  exportDate: string;
  version: string;
}

export const exportToJSON = (data: ExportData): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `track-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        const stringValue = value === null || value === undefined ? '' : String(value);
        // Escape CSV special characters
        return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = async (data: any[], filename: string): Promise<void> => {
  // Simple Excel export using HTML table approach
  const headers = Object.keys(data[0] || {});
  
  const tableHTML = `
    <table border="1">
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.map(row => 
          `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
        ).join('')}
      </tbody>
    </table>
  `;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const importFromCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' && (i === 0 || line[i - 1] === ',')) {
                inQuotes = true;
              } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
                inQuotes = false;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });
        
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid CSV format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Prepare data for export
export const prepareProjectsForExport = (projects: any[]) => {
  return projects.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description,
    priority: project.priority,
    status: project.status,
    deadline: project.deadline,
    created_at: project.created_at,
    updated_at: project.updated_at,
    progress_percentage: project.progress_percentage,
    total_features: project.total_features,
    team_members_count: project.team_members_count,
    is_archived: project.is_archived,
  }));
};

export const prepareFeaturesForExport = (features: any[]) => {
  return features.map(feature => ({
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    priority: feature.priority,
    project_name: feature.project?.name || '',
    assignee: feature.assignee ? `${feature.assignee.first_name} ${feature.assignee.last_name}` : '',
    reporter: feature.reporter ? `${feature.reporter.first_name} ${feature.reporter.last_name}` : '',
    estimated_hours: feature.estimated_hours,
    due_date: feature.due_date,
    created_at: feature.created_at,
    updated_at: feature.updated_at,
    progress_percentage: feature.progress_percentage,
    is_overdue: feature.is_overdue,
    parent_title: feature.parent_title || '',
    hierarchy_level: feature.hierarchy_level,
    order: feature.order,
  }));
};