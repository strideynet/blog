import React, { useMemo, useState, useEffect } from 'react';
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
import { formatFrequency, getSWRQuality, applyFrequencyShift, getBandSWRData } from './swrCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  showBufferZones?: boolean;
  height?: number;
  experimentalEnabled?: boolean;
  frequencyShift?: number;
  onShiftChange?: (shift: number) => void;
  onShiftReset?: () => void;
}

export const SWRChart: React.FC<SWRChartProps> = ({
  bandData,
  showGrid = true,
  showBandPlan = false,
  showBufferZones = true,
  height = 300,
  experimentalEnabled = false,
  frequencyShift = 0,
  onShiftChange,
  onShiftReset,
}) => {
  const minSWRQuality = getSWRQuality(bandData.minSWR);
  const bandPlanSegments = showBandPlan ? RSGB_BAND_PLANS[bandData.band.name] : undefined;

  // Local state for input value to allow smooth typing
  const [inputValue, setInputValue] = useState(frequencyShift.toString());

  // Sync input value when frequencyShift changes from outside (e.g., reset button)
  useEffect(() => {
    setInputValue(frequencyShift.toString());
  }, [frequencyShift]);

  // Calculate shifted SWR data if experimental mode is enabled
  const shiftedBandData = useMemo(() => {
    if (!experimentalEnabled || frequencyShift === 0) {
      return null;
    }

    // Apply frequency shift to the SWR points
    const shiftedPoints = applyFrequencyShift(bandData.swrPoints, frequencyShift);

    // Calculate statistics for shifted data
    const swrValues = shiftedPoints.map(p => p.swr);
    const minSWR = Math.min(...swrValues);
    const maxSWR = Math.max(...swrValues);
    const avgSWR = swrValues.reduce((a, b) => a + b, 0) / swrValues.length;

    return {
      band: bandData.band,
      swrPoints: shiftedPoints,
      minSWR,
      maxSWR,
      avgSWR,
    };
  }, [experimentalEnabled, frequencyShift, bandData]);

  // Create band plan background datasets if enabled
  const bandPlanDatasets = [];
  const maxSWR = Math.min(10, Math.ceil(bandData.maxSWR + 1));

  // Add buffer zone shading (100 kHz on each side) if enabled
  const bufferSize = 100000; // 100 kHz in Hz

  if (showBufferZones) {
    const lowerBufferData = bandData.swrPoints
      .filter(point => point.frequency >= bandData.band.startFreq - bufferSize && point.frequency < bandData.band.startFreq)
      .map(point => ({ x: point.frequency, y: maxSWR }));

    const upperBufferData = bandData.swrPoints
      .filter(point => point.frequency > bandData.band.endFreq && point.frequency <= bandData.band.endFreq + bufferSize)
      .map(point => ({ x: point.frequency, y: maxSWR }));

    if (lowerBufferData.length > 0) {
      bandPlanDatasets.push({
        label: 'Out of band',
        data: lowerBufferData,
        backgroundColor: 'rgba(128, 128, 128, 0.15)',
        borderColor: 'transparent',
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: {
          target: 'origin',
          above: 'rgba(128, 128, 128, 0.15)',
        },
        order: 3, // Draw behind everything
        showLine: false,
        spanGaps: false,
      });
    }

    if (upperBufferData.length > 0) {
      bandPlanDatasets.push({
        label: 'Out of band',
        data: upperBufferData,
        backgroundColor: 'rgba(128, 128, 128, 0.15)',
        borderColor: 'transparent',
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: {
          target: 'origin',
          above: 'rgba(128, 128, 128, 0.15)',
        },
        order: 3, // Draw behind everything
        showLine: false,
        spanGaps: false,
      });
    }
  }

  if (showBandPlan && bandPlanSegments) {
    bandPlanSegments.forEach((segment, idx) => {
      // Find the data points that fall within this segment
      const segmentData = bandData.swrPoints
        .filter(point => point.frequency >= segment.startFreq && point.frequency <= segment.endFreq)
        .map(point => ({
          x: point.frequency,
          y: maxSWR,
        }));

      // Only add dataset if it has any data points
      if (segmentData.length > 0) {
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
    datasets: [
      ...bandPlanDatasets,
      {
        label: 'SWR',
        data: bandData.swrPoints.map(point => ({
          x: point.frequency,
          y: point.swr,
        })),
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
      // Add shifted SWR dataset if experimental mode is enabled
      ...(shiftedBandData
        ? [
            {
              label: 'Shifted SWR',
              data: shiftedBandData.swrPoints.map(point => ({
                x: point.frequency,
                y: point.swr,
              })),
              borderColor: '#ff6b6b',
              backgroundColor: '#ff6b6b20',
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#ff6b6b',
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 2,
              borderWidth: 2,
              borderDash: [5, 5],
              order: 1,
            },
          ]
        : []),
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'x',
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
          // Show tooltip for SWR datasets only (not band plan)
          return tooltipItem.dataset.label === 'SWR' || tooltipItem.dataset.label === 'Shifted SWR';
        },
        callbacks: {
          title: (tooltipItems) => {
            // Always use the frequency from the original SWR line
            const originalItem = tooltipItems.find(item => item.dataset.label === 'SWR');
            if (originalItem) {
              const point = originalItem.raw as { x: number; y: number };
              return formatFrequency(point.x);
            }

            // Fallback: if we only see the shifted line, don't show its shifted frequency
            // Instead, return empty and let the label show the details
            return 'Hover position';
          },
          label: (tooltipItem) => {
            const point = tooltipItem.raw as { x: number; y: number };
            const swr = point.y;
            const quality = getSWRQuality(swr);
            const label = tooltipItem.dataset.label;

            // For the original line, show frequency and SWR
            if (label === 'SWR') {
              return `${label}: ${swr.toFixed(2)} (${quality.quality})`;
            }

            // For shifted line, don't show the shifted frequency - just the SWR
            return `${label}: ${swr.toFixed(2)} (${quality.quality})`;
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
        type: 'linear',
        min: showBufferZones ? bandData.band.startFreq - bufferSize : bandData.band.startFreq,
        max: showBufferZones ? bandData.band.endFreq + bufferSize : bandData.band.endFreq,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10,
          callback: function(value) {
            return formatFrequency(value as number);
          },
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

        {/* Per-band frequency shift control */}
        {experimentalEnabled && onShiftChange && onShiftReset && (
          <div className="mt-4 p-3 bg-muted rounded-md flex items-center gap-3">
            <label htmlFor={`shift-${bandData.band.name}`} className="text-sm font-medium whitespace-nowrap">
              Element Length Shift (%):
            </label>
            <input
              type="number"
              id={`shift-${bandData.band.name}`}
              min="-10"
              max="10"
              step="0.1"
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                // Always update the local input state for smooth typing
                setInputValue(val);

                // Update parent state only when we have a valid complete number
                if (val !== '' && val !== '-' && val !== '-.' && val !== '.') {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed) && onShiftChange) {
                    onShiftChange(parsed);
                  }
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                // On blur, ensure we have a valid number
                if (val === '' || val === '-' || val === '-.' || val === '.' || isNaN(parseFloat(val))) {
                  if (onShiftChange) {
                    onShiftChange(0);
                  }
                  setInputValue('0');
                } else {
                  // Ensure the displayed value matches the parsed value
                  const parsed = parseFloat(val);
                  setInputValue(parsed.toString());
                  if (onShiftChange) {
                    onShiftChange(parsed);
                  }
                }
              }}
              className="w-24 px-2 py-1 border rounded text-sm"
            />
            <Button
              onClick={onShiftReset}
              variant="outline"
              size="sm"
              disabled={frequencyShift === 0}
            >
              Reset
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {frequencyShift > 0 ? 'Longer element' : frequencyShift < 0 ? 'Shorter element' : 'No shift'}
            </span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
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

          {/* Shifted SWR Statistics */}
          {shiftedBandData && (
            <div className="pt-4 border-t">
              <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#ff6b6b] border-dashed" style={{ borderTopWidth: '2px', borderTopStyle: 'dashed' }}></div>
                <span>Shifted SWR ({frequencyShift > 0 ? '+' : ''}{frequencyShift.toFixed(1)}%)</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div>
                    <span className="text-muted-foreground">Min SWR:</span>{' '}
                    <span className="font-semibold">{shiftedBandData.minSWR.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    @ {formatFrequency(shiftedBandData.swrPoints.find(p => p.swr === shiftedBandData.minSWR)?.frequency || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Max SWR:</span>{' '}
                  <span className="font-semibold">{shiftedBandData.maxSWR.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg SWR:</span>{' '}
                  <span className="font-semibold">{shiftedBandData.avgSWR.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
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