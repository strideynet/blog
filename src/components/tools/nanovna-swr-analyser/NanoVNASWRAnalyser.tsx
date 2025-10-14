import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { SWRChart } from './SWRChart';
import { SWRFullRangeChart } from './SWRFullRangeChart';
import { parseSParameterFile } from './sparamParser';
import { calculateSWR, getBandSWRData, formatFrequency, getSWRQuality } from './swrCalculator';
import type { BandSWRData, Band, SWRPoint } from './types';
import { AMATEUR_BANDS } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface NanoVNASWRAnalyserProps {
  bands?: Band[];
  showAllBands?: boolean;
  showFullRange?: boolean;
  showBandPlan?: boolean;
  chartHeight?: number;
  onDataLoaded?: (bandData: BandSWRData[]) => void;
}

export const NanoVNASWRAnalyser: React.FC<NanoVNASWRAnalyserProps> = ({
  bands = AMATEUR_BANDS,
  showAllBands = false,
  showFullRange = true,
  showBandPlan = false,
  chartHeight = 300,
  onDataLoaded,
}) => {
  const [bandData, setBandData] = useState<BandSWRData[]>([]);
  const [swrPoints, setSWRPoints] = useState<SWRPoint[]>([]);
  const [filename, setFilename] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedBands, setSelectedBands] = useState<Set<string>>(new Set());
  const [showBandPlanOverlay, setShowBandPlanOverlay] = useState<boolean>(showBandPlan);
  const [showBufferZones, setShowBufferZones] = useState<boolean>(true);

  // Experimental settings
  const [experimentalEnabled, setExperimentalEnabled] = useState<boolean>(false);
  const [frequencyShifts, setFrequencyShifts] = useState<Map<string, number>>(new Map());

  const handleFileLoad = useCallback(
    (content: string, loadedFilename: string) => {
      try {
        setError('');

        // Parse the S-parameter file
        const sparamData = parseSParameterFile(content);

        // Calculate SWR from S-parameters
        const calculatedSWRPoints = calculateSWR(sparamData);

        // Store the full SWR data
        setSWRPoints(calculatedSWRPoints);

        // Get SWR data for each band
        const bandsWithData = getBandSWRData(calculatedSWRPoints, bands);

        if (bandsWithData.length === 0) {
          setError('No data found in the selected frequency bands');
          setBandData([]);
          setSWRPoints([]);
          setFilename('');
          return;
        }

        setBandData(bandsWithData);
        setFilename(loadedFilename);

        // Auto-select all bands initially or show all if specified
        if (showAllBands) {
          setSelectedBands(new Set(bandsWithData.map(b => b.band.name)));
        } else {
          // Select bands with good SWR (min SWR < 3)
          const goodBands = bandsWithData
            .filter(b => b.minSWR < 3)
            .map(b => b.band.name);
          setSelectedBands(new Set(goodBands.length > 0 ? goodBands : [bandsWithData[0].band.name]));
        }

        // Callback with loaded data
        if (onDataLoaded) {
          onDataLoaded(bandsWithData);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse S-parameter file');
        setBandData([]);
        setSWRPoints([]);
        setFilename('');
      }
    },
    [bands, showAllBands, onDataLoaded]
  );

  const toggleBandSelection = useCallback((bandName: string) => {
    setSelectedBands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bandName)) {
        newSet.delete(bandName);
      } else {
        newSet.add(bandName);
      }
      return newSet;
    });
  }, []);

  const selectAllBands = useCallback(() => {
    setSelectedBands(new Set(bandData.map(b => b.band.name)));
  }, [bandData]);

  const clearAllBands = useCallback(() => {
    setSelectedBands(new Set());
  }, []);

  const clearData = useCallback(() => {
    setBandData([]);
    setSWRPoints([]);
    setFilename('');
    setSelectedBands(new Set());
    setFrequencyShifts(new Map());
    setError('');
  }, []);

  const updateBandShift = useCallback((bandName: string, shift: number) => {
    setFrequencyShifts(prev => {
      const newMap = new Map(prev);
      newMap.set(bandName, shift);
      return newMap;
    });
  }, []);

  const resetBandShift = useCallback((bandName: string) => {
    setFrequencyShifts(prev => {
      const newMap = new Map(prev);
      newMap.delete(bandName);
      return newMap;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      {bandData.length === 0 && (
        <FileUpload onFileLoad={handleFileLoad} />
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results Card */}
      {swrPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Analysis Results: {filename}</span>
              <Button onClick={clearData} variant="outline" size="sm">
                Clear Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* File Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-muted-foreground">Data Points</div>
                <div className="text-2xl font-bold">{swrPoints.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Frequency Range</div>
                <div className="text-lg font-semibold">
                  {formatFrequency(Math.min(...swrPoints.map(p => p.frequency)))}
                  {' - '}
                  {formatFrequency(Math.max(...swrPoints.map(p => p.frequency)))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bands Detected</div>
                <div className="text-2xl font-bold">{bandData.length}</div>
              </div>
            </div>

            {/* Band Selection Table */}
            {bandData.length > 0 && (
              <>
                <div className="mb-3 flex justify-between items-center">
                  <div className="text-sm font-semibold">Band Details</div>
                  <div className="flex gap-2">
                    <Button onClick={selectAllBands} variant="outline" size="sm">
                      Select All
                    </Button>
                    <Button onClick={clearAllBands} variant="outline" size="sm">
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-center p-2 font-semibold w-12">Show</th>
                        <th className="text-left p-2 font-semibold">Band</th>
                        <th className="text-right p-2 font-semibold">Min SWR</th>
                        <th className="text-right p-2 font-semibold">Max SWR</th>
                        <th className="text-right p-2 font-semibold">Avg SWR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bandData.map((band, idx) => {
                        const isSelected = selectedBands.has(band.band.name);
                        // Find the frequency where min SWR occurs
                        const minSWRPoint = band.swrPoints.find(p => p.swr === band.minSWR);
                        return (
                          <tr
                            key={band.band.name}
                            className={`${idx % 2 === 0 ? 'bg-muted/30' : ''} ${isSelected ? 'ring-2 ring-primary ring-inset' : ''} cursor-pointer hover:bg-muted/50`}
                            onClick={() => toggleBandSelection(band.band.name)}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleBandSelection(band.band.name)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 font-medium">{band.band.name}</td>
                            <td className="text-right p-2">
                              <div className="font-semibold">{band.minSWR.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">
                                @ {formatFrequency(minSWRPoint?.frequency || 0)}
                              </div>
                            </td>
                            <td className="text-right p-2">{band.maxSWR.toFixed(2)}</td>
                            <td className="text-right p-2">{band.avgSWR.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Display Options */}
                <div className="flex gap-4 items-center pt-4 border-t flex-wrap">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBandPlanOverlay}
                      onChange={(e) => setShowBandPlanOverlay(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Show RSGB band plan overlay
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBufferZones}
                      onChange={(e) => setShowBufferZones(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Show buffer around band
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={experimentalEnabled}
                      onChange={(e) => setExperimentalEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Show experimental frequency shift
                  </label>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}


      {/* Full Range Chart */}
      {swrPoints.length > 0 && (
        <SWRFullRangeChart
          swrPoints={swrPoints}
          bandData={bandData}
          height={chartHeight}
        />
      )}

      {/* SWR Charts */}
      {bandData.length > 0 && selectedBands.size > 0 && (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {bandData
            .filter(band => selectedBands.has(band.band.name))
            .map(band => (
              <SWRChart
                key={band.band.name}
                bandData={band}
                showBandPlan={showBandPlanOverlay}
                showBufferZones={showBufferZones}
                height={chartHeight}
                experimentalEnabled={experimentalEnabled}
                frequencyShift={frequencyShifts.get(band.band.name) || 0}
                onShiftChange={(shift) => updateBandShift(band.band.name, shift)}
                onShiftReset={() => resetBandShift(band.band.name)}
              />
            ))}
        </div>
      )}

      {/* Instructions when no bands selected */}
      {bandData.length > 0 && selectedBands.size === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select at least one band to display SWR charts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};