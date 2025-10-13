import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { BandSWRData } from './types';
import { RSGB_BAND_PLANS } from './types';
import { formatFrequency, getSWRQuality } from './swrCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SWRChartProps {
  bandData: BandSWRData;
  showGrid?: boolean;
  showBandPlan?: boolean;
  height?: number;
}

export const SWRChart: React.FC<SWRChartProps> = ({
  bandData,
  showGrid = true,
  showBandPlan = false,
  height = 300,
}) => {
  const minSWRQuality = getSWRQuality(bandData.minSWR);
  const bandPlanSegments = showBandPlan ? RSGB_BAND_PLANS[bandData.band.name] : undefined;

  // Create band plan background datasets if enabled
  const bandPlanDatasets = [];
  if (showBandPlan && bandPlanSegments) {
    const maxSWR = Math.min(10, Math.ceil(bandData.maxSWR + 1));

    bandPlanSegments.forEach((segment, idx) => {
      // Find the data points that fall within this segment
      const segmentData = bandData.swrPoints.map(point => {
        if (point.frequency >= segment.startFreq && point.frequency <= segment.endFreq) {
          return maxSWR; // Return max value to fill the area
        }
        return null; // Return null for points outside this segment
      });

      // Only add dataset if it has any data points
      if (segmentData.some(val => val !== null)) {
        // Increase opacity by replacing the alpha value in rgba colors
        const enhancedColor = segment.color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, 'rgba($1, $2, $3, 0.4)');

        bandPlanDatasets.push({
          label: segment.label,
          data: segmentData,
          backgroundColor: enhancedColor,
          borderColor: 'transparent',
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: {
            target: 'origin',
            above: enhancedColor,
          },
          order: 2, // Draw behind the SWR line
          showLine: false,
          spanGaps: false,
        });
      }
    });
  }

  const chartData = {
    labels: bandData.swrPoints.map(point => formatFrequency(point.frequency)),
    datasets: [
      ...bandPlanDatasets,
      {
        label: 'SWR',
        data: bandData.swrPoints.map(point => point.swr),
        borderColor: bandData.band.color,
        backgroundColor: bandData.band.color + '20', // Add transparency
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: bandData.band.color,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        borderWidth: 3,
        order: 1, // Draw on top
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        displayColors: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: bandData.band.color,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        titleFont: {
          size: 13,
          weight: 'normal',
        },
        bodyFont: {
          size: 13,
          weight: 'bold',
        },
        filter: function(tooltipItem) {
          // Only show tooltip for the SWR dataset
          return tooltipItem.dataset.label === 'SWR';
        },
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
          label: (tooltipItem) => {
            const swr = tooltipItem.raw as number;
            const quality = getSWRQuality(swr);
            return `SWR: ${swr.toFixed(2)} - ${quality.quality}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 1,
        max: Math.min(10, Math.ceil(bandData.maxSWR + 1)),
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          stepSize: 0.5,
          callback: function(value) {
            return value + ':1';
          },
        },
        title: {
          display: true,
          text: 'SWR',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10,
        },
        title: {
          display: true,
          text: 'Frequency',
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{bandData.band.name} Band</span>
          <span className="text-sm font-normal" style={{ color: minSWRQuality.color }}>
            Min SWR: {bandData.minSWR.toFixed(2)} ({minSWRQuality.quality})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Line data={chartData} options={options} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div>
              <span className="text-muted-foreground">Min SWR:</span>{' '}
              <span className="font-semibold">{bandData.minSWR.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              @ {formatFrequency(bandData.swrPoints.find(p => p.swr === bandData.minSWR)?.frequency || 0)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Max SWR:</span>{' '}
            <span className="font-semibold">{bandData.maxSWR.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg SWR:</span>{' '}
            <span className="font-semibold">{bandData.avgSWR.toFixed(2)}</span>
          </div>
        </div>

        {/* Band Plan Legend */}
        {showBandPlan && bandPlanSegments && bandPlanSegments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-semibold mb-2">Band Plan (RSGB):</div>
            <div className="flex flex-wrap gap-2">
              {bandPlanSegments.map((segment, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span>
                    {segment.label} ({formatFrequency(segment.startFreq)} - {formatFrequency(segment.endFreq)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};