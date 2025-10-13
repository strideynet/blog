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
import type { SWRPoint, BandSWRData } from './types';
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

interface SWRFullRangeChartProps {
  swrPoints: SWRPoint[];
  bandData: BandSWRData[];
  height?: number;
}

export const SWRFullRangeChart: React.FC<SWRFullRangeChartProps> = ({
  swrPoints,
  bandData,
  height = 400,
}) => {
  // Calculate the max Y value for the chart
  const maxSWR = Math.min(10, Math.max(...swrPoints.map(p => p.swr)) + 1);

  // Create datasets for band highlighting - use fixed height rectangles
  const bandHighlightDatasets = bandData.map((band, index) => {
    const bandPoints = swrPoints.map(point => {
      if (point.frequency >= band.band.startFreq && point.frequency <= band.band.endFreq) {
        return maxSWR; // Use max height to create full-height colored areas
      }
      return null;
    });

    return {
      label: band.band.name,
      data: bandPoints,
      borderColor: 'transparent',
      backgroundColor: band.band.color + '60', // Increased opacity for better contrast
      fill: {
        target: 'origin',
        above: band.band.color + '60',
      },
      pointRadius: 0,
      pointHoverRadius: 0,
      spanGaps: false,
      showLine: true,
      borderWidth: 0,
      order: 2 + index, // Draw behind the main line
    };
  });

  // Main SWR line dataset
  const mainDataset = {
    label: 'SWR',
    data: swrPoints.map(p => p.swr),
    borderColor: '#6b7280',
    backgroundColor: 'transparent',
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHoverBackgroundColor: '#6b7280',
    pointHoverBorderColor: '#ffffff',
    pointHoverBorderWidth: 2,
    tension: 0.4,
    order: 1, // Draw on top
  };

  const chartData = {
    labels: swrPoints.map(point => formatFrequency(point.frequency)),
    datasets: [...bandHighlightDatasets, mainDataset],
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
        display: true,
        position: 'bottom',
        labels: {
          filter: (legendItem) => {
            // Only show band labels in legend, not the main SWR line
            return legendItem.text !== 'SWR';
          },
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
      tooltip: {
        enabled: true,
        displayColors: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#6b7280',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        filter: function(tooltipItem) {
          // Only show tooltip for the main SWR dataset
          return tooltipItem.dataset.label === 'SWR';
        },
        callbacks: {
          title: (tooltipItems) => {
            if (tooltipItems.length > 0) {
              const freq = swrPoints[tooltipItems[0].dataIndex].frequency;
              // Find which band this frequency belongs to
              const band = bandData.find(b =>
                freq >= b.band.startFreq && freq <= b.band.endFreq
              );
              if (band) {
                return `${formatFrequency(freq)} (${band.band.name})`;
              }
              return formatFrequency(freq);
            }
            return '';
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
        max: maxSWR,
        grid: {
          display: true,
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
          autoSkip: true,
          maxTicksLimit: 20,
        },
        title: {
          display: true,
          text: 'Frequency',
        },
      },
    },
  };

  // Calculate overall statistics
  const overallMinSWR = Math.min(...swrPoints.map(p => p.swr));
  const overallMaxSWR = Math.max(...swrPoints.map(p => p.swr));
  const overallAvgSWR = swrPoints.reduce((sum, p) => sum + p.swr, 0) / swrPoints.length;
  const minSWRQuality = getSWRQuality(overallMinSWR);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Full Range Analysis</span>
          <span className="text-sm font-normal" style={{ color: minSWRQuality.color }}>
            Best SWR: {overallMinSWR.toFixed(2)} ({minSWRQuality.quality})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Line data={chartData} options={options} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Min SWR:</span>{' '}
            <span className="font-semibold">{overallMinSWR.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max SWR:</span>{' '}
            <span className="font-semibold">{overallMaxSWR.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg SWR:</span>{' '}
            <span className="font-semibold">{overallAvgSWR.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};