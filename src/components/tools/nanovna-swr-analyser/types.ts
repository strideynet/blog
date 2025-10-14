// Types for S-parameter data and amateur radio bands

export interface SParameterPoint {
  frequency: number; // Hz
  s11Real: number;
  s11Imag: number;
  s21Real?: number; // Optional for S2P files
  s21Imag?: number;
  s12Real?: number;
  s12Imag?: number;
  s22Real?: number;
  s22Imag?: number;
}

export interface SParameterData {
  points: SParameterPoint[];
  format: 's1p' | 's2p';
  referenceImpedance: number; // Usually 50 ohms
}

export interface Band {
  name: string;
  startFreq: number; // Hz
  endFreq: number; // Hz
  color: string; // For chart display
}

export interface SWRPoint {
  frequency: number; // Hz
  swr: number;
}

export interface BandSWRData {
  band: Band;
  swrPoints: SWRPoint[];
  minSWR: number;
  maxSWR: number;
  avgSWR: number;
}

export interface BandPlanSegment {
  startFreq: number; // Hz
  endFreq: number; // Hz
  mode: 'CW' | 'Digital' | 'SSB' | 'Mixed' | 'Beacon' | 'All';
  label: string;
  color: string; // Background color for the segment
}

// Amateur radio band definitions (in Hz)
export const AMATEUR_BANDS: Band[] = [
  { name: '160m', startFreq: 1800000, endFreq: 2000000, color: '#FF6384' },
  { name: '80m', startFreq: 3500000, endFreq: 4000000, color: '#36A2EB' },
  { name: '40m', startFreq: 7000000, endFreq: 7200000, color: '#FFCE56' },
  { name: '30m', startFreq: 10100000, endFreq: 10150000, color: '#4BC0C0' },
  { name: '20m', startFreq: 14000000, endFreq: 14350000, color: '#9966FF' },
  { name: '17m', startFreq: 18068000, endFreq: 18168000, color: '#FF9F40' },
  { name: '15m', startFreq: 21000000, endFreq: 21450000, color: '#FF6384' },
  { name: '12m', startFreq: 24890000, endFreq: 24990000, color: '#C9CBCF' },
  { name: '10m', startFreq: 28000000, endFreq: 29700000, color: '#36A2EB' },
  { name: '6m', startFreq: 50000000, endFreq: 54000000, color: '#FFCE56' },
  { name: '2m', startFreq: 144000000, endFreq: 148000000, color: '#4BC0C0' },
  { name: '70cm', startFreq: 420000000, endFreq: 450000000, color: '#9966FF' },
];

// RSGB Band Plan definitions (UK allocations)
// Source: RSGB Band Plans
export const RSGB_BAND_PLANS: Record<string, BandPlanSegment[]> = {
  '160m': [
    { startFreq: 1810000, endFreq: 1838000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 1838000, endFreq: 1843000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 1843000, endFreq: 2000000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
  ],
  '80m': [
    { startFreq: 3500000, endFreq: 3570000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 3570000, endFreq: 3600000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 3600000, endFreq: 3800000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
    // Note: 3.8-4.0 MHz varies by country
  ],
  '40m': [
    { startFreq: 7000000, endFreq: 7040000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 7040000, endFreq: 7060000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 7060000, endFreq: 7200000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
    // Note: 7.2-7.3 MHz not available in all regions
  ],
  '30m': [
    { startFreq: 10100000, endFreq: 10130000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 10130000, endFreq: 10150000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    // Note: 30m is CW and narrow-band digital modes only
  ],
  '20m': [
    { startFreq: 14000000, endFreq: 14070000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 14070000, endFreq: 14095000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 14095000, endFreq: 14099000, mode: 'Digital', label: 'IBP', color: 'rgba(255, 206, 86, 0.2)' }, // International Beacon Project
    { startFreq: 14099000, endFreq: 14101000, mode: 'Beacon', label: 'Beacons', color: 'rgba(255, 206, 86, 0.2)' },
    { startFreq: 14101000, endFreq: 14350000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
  ],
  '17m': [
    { startFreq: 18068000, endFreq: 18095000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 18095000, endFreq: 18110000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 18110000, endFreq: 18168000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
  ],
  '15m': [
    { startFreq: 21000000, endFreq: 21070000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 21070000, endFreq: 21110000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 21110000, endFreq: 21149000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 21149000, endFreq: 21151000, mode: 'Beacon', label: 'Beacons', color: 'rgba(255, 206, 86, 0.2)' },
    { startFreq: 21151000, endFreq: 21450000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
  ],
  '12m': [
    { startFreq: 24890000, endFreq: 24915000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 24915000, endFreq: 24930000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 24930000, endFreq: 24990000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
  ],
  '10m': [
    { startFreq: 28000000, endFreq: 28070000, mode: 'CW', label: 'CW', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 28070000, endFreq: 28190000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 28190000, endFreq: 28225000, mode: 'Beacon', label: 'Beacons', color: 'rgba(255, 206, 86, 0.2)' },
    { startFreq: 28225000, endFreq: 29700000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
  ],
  '6m': [
    { startFreq: 50000000, endFreq: 50100000, mode: 'CW', label: 'CW/Beacons', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 50100000, endFreq: 50500000, mode: 'SSB', label: 'SSB/Digital', color: 'rgba(75, 192, 192, 0.2)' },
    { startFreq: 50500000, endFreq: 52000000, mode: 'All', label: 'All Modes', color: 'rgba(153, 102, 255, 0.2)' },
    // Note: 50-54 MHz availability varies by country
  ],
  '2m': [
    { startFreq: 144000000, endFreq: 144150000, mode: 'CW', label: 'CW/SSB', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 144150000, endFreq: 144400000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
    { startFreq: 144400000, endFreq: 144490000, mode: 'Beacon', label: 'Beacons', color: 'rgba(255, 206, 86, 0.2)' },
    { startFreq: 144490000, endFreq: 144990000, mode: 'All', label: 'All Modes', color: 'rgba(153, 102, 255, 0.2)' },
    { startFreq: 144990000, endFreq: 145800000, mode: 'All', label: 'FM/Repeaters', color: 'rgba(153, 102, 255, 0.2)' },
    { startFreq: 145800000, endFreq: 146000000, mode: 'All', label: 'Satellite', color: 'rgba(255, 159, 64, 0.2)' },
  ],
  '70cm': [
    { startFreq: 430000000, endFreq: 431000000, mode: 'CW', label: 'CW/SSB', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 431000000, endFreq: 432000000, mode: 'Digital', label: 'Digital', color: 'rgba(54, 162, 235, 0.2)' },
    { startFreq: 432000000, endFreq: 432100000, mode: 'CW', label: 'CW/SSB', color: 'rgba(255, 99, 132, 0.2)' },
    { startFreq: 432100000, endFreq: 432400000, mode: 'SSB', label: 'SSB', color: 'rgba(75, 192, 192, 0.2)' },
    { startFreq: 432400000, endFreq: 432490000, mode: 'Beacon', label: 'Beacons', color: 'rgba(255, 206, 86, 0.2)' },
    { startFreq: 432490000, endFreq: 438000000, mode: 'All', label: 'All Modes', color: 'rgba(153, 102, 255, 0.2)' },
    { startFreq: 438000000, endFreq: 440000000, mode: 'All', label: 'FM/Repeaters', color: 'rgba(153, 102, 255, 0.2)' },
  ],
};