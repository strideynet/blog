import type { SParameterData, SWRPoint, Band, BandSWRData } from './types';
import { AMATEUR_BANDS } from './types';

/**
 * Calculate SWR (Standing Wave Ratio) from S11 parameters
 * SWR = (1 + |Γ|) / (1 - |Γ|) where Γ is the reflection coefficient (S11)
 */
export function calculateSWR(data: SParameterData): SWRPoint[] {
  return data.points.map(point => {
    // Calculate magnitude of S11 (reflection coefficient)
    const magnitude = Math.sqrt(
      point.s11Real * point.s11Real + point.s11Imag * point.s11Imag
    );

    // Calculate SWR
    // Protect against division by zero and limit maximum SWR for display
    let swr: number;
    if (magnitude >= 0.99) {
      swr = 100; // Cap at 100:1 for practical display
    } else {
      swr = (1 + magnitude) / (1 - magnitude);
    }

    return {
      frequency: point.frequency,
      swr: Math.max(1, swr), // SWR cannot be less than 1
    };
  });
}

/**
 * Filter SWR data for a specific frequency band
 */
export function filterSWRByBand(swrPoints: SWRPoint[], band: Band): SWRPoint[] {
  return swrPoints.filter(
    point => point.frequency >= band.startFreq && point.frequency <= band.endFreq
  );
}

/**
 * Get SWR data for all amateur bands present in the data
 */
export function getBandSWRData(
  swrPoints: SWRPoint[],
  bands: Band[] = AMATEUR_BANDS
): BandSWRData[] {
  const bandDataArray: BandSWRData[] = [];

  for (const band of bands) {
    const bandPoints = filterSWRByBand(swrPoints, band);

    // Skip bands with no data
    if (bandPoints.length === 0) continue;

    // Calculate statistics
    const swrValues = bandPoints.map(p => p.swr);
    const minSWR = Math.min(...swrValues);
    const maxSWR = Math.max(...swrValues);
    const avgSWR = swrValues.reduce((a, b) => a + b, 0) / swrValues.length;

    bandDataArray.push({
      band,
      swrPoints: bandPoints,
      minSWR,
      maxSWR,
      avgSWR,
    });
  }

  return bandDataArray;
}

/**
 * Calculate return loss in dB from SWR
 * Return Loss (dB) = -20 * log10(|Γ|)
 */
export function swrToReturnLoss(swr: number): number {
  if (swr <= 1) return Infinity; // Perfect match
  const gamma = (swr - 1) / (swr + 1);
  return -20 * Math.log10(Math.abs(gamma));
}

/**
 * Calculate power reflected percentage from SWR
 */
export function swrToPowerReflected(swr: number): number {
  if (swr <= 1) return 0; // Perfect match
  const gamma = (swr - 1) / (swr + 1);
  return gamma * gamma * 100; // Percentage
}

/**
 * Calculate power transmitted percentage from SWR
 */
export function swrToPowerTransmitted(swr: number): number {
  return 100 - swrToPowerReflected(swr);
}

/**
 * Format frequency for display (Hz to MHz with appropriate decimals)
 */
export function formatFrequency(freqHz: number): string {
  const freqMHz = freqHz / 1e6;
  if (freqMHz >= 100) {
    return freqMHz.toFixed(1) + ' MHz';
  } else if (freqMHz >= 10) {
    return freqMHz.toFixed(2) + ' MHz';
  } else {
    return freqMHz.toFixed(3) + ' MHz';
  }
}

/**
 * Get SWR quality description
 */
export function getSWRQuality(swr: number): {
  quality: string;
  color: string;
  description: string;
} {
  if (swr <= 1.5) {
    return {
      quality: 'Excellent',
      color: '#10b981', // Green
      description: 'Ideal match, minimal power loss',
    };
  } else if (swr <= 2.0) {
    return {
      quality: 'Good',
      color: '#3b82f6', // Blue
      description: 'Acceptable for most applications',
    };
  } else if (swr <= 3.0) {
    return {
      quality: 'Fair',
      color: '#f59e0b', // Amber
      description: 'Some power loss, tuning recommended',
    };
  } else {
    return {
      quality: 'Poor',
      color: '#ef4444', // Red
      description: 'Significant power loss, tuning required',
    };
  }
}