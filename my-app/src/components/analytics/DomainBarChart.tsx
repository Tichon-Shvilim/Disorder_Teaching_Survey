import React from 'react';

interface DomainData {
  nodeId: string;
  title: string;
  averageScore: number;
  totalQuestions: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // For additional properties that may vary by type
}

interface DomainBarChartProps {
  data: DomainData[];
  type: 'student' | 'class';
}

const DomainBarChart: React.FC<DomainBarChartProps> = ({ data }) => {
  const getBarWidth = (score: number) => {
    // Score is already 0-100, so use directly
    return `${Math.max(2, score)}%`; // Minimum 2% for visibility
  };

  const getScoreColor = (score: number) => {
    // Score is already 0-100, so use directly
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange  
    if (score >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getScoreGradient = (score: number) => {
    const color = getScoreColor(score);
    return `linear-gradient(90deg, ${color} 0%, ${color}aa 100%)`;
  };

  return (
    <div className="domain-bar-chart">
      <div className="chart-container">
        {data.map((domain, index) => (
          <div key={domain.nodeId} className="bar-row">
            <div className="bar-label">
              <span className="domain-title">{domain.title}</span>
              <span className="domain-questions">({domain.totalQuestions} questions)</span>
            </div>
            
            <div className="bar-container">
              <div className="bar-background">
                <div 
                  className="bar-fill"
                  style={{
                    width: getBarWidth(domain.averageScore),
                    background: getScoreGradient(domain.averageScore),
                    transition: `width 0.8s ease-in-out ${index * 0.1}s`
                  }}
                />
              </div>
              
              <div className="bar-value">
                {Math.round(domain.averageScore)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
          <span>Excellent (80%+)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
          <span>Good (60-79%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FFC107' }}></div>
          <span>Needs Improvement (40-59%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
          <span>Concerning (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
};

export default DomainBarChart;
