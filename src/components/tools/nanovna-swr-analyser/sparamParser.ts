import type { SParameterData, SParameterPoint } from './types';

/**
 * Parse S-parameter files (S1P or S2P format) from NanoVNA or similar devices
 *
 * S1P format: frequency S11_real S11_imag
 * S2P format: frequency S11_real S11_imag S21_real S21_imag S12_real S12_imag S22_real S22_imag
 *
 * Files can be in various formats (RI - real/imaginary, MA - magnitude/angle, DB - dB/angle)
 */
export function parseSParameterFile(content: string): SParameterData {
  const lines = content.split('\n').map(line => line.trim());
  const points: SParameterPoint[] = [];

  let format: 's1p' | 's2p' | null = null;
  let dataFormat: 'RI' | 'MA' | 'DB' = 'RI'; // Default to Real/Imaginary
  let referenceImpedance = 50; // Default to 50 ohms
  let frequencyUnit = 1; // Multiplier for frequency (Hz, kHz, MHz, GHz)

  for (const line of lines) {
    // Skip empty lines
    if (!line) continue;

    // Parse option lines (start with #)
    if (line.startsWith('#')) {
      const upperLine = line.toUpperCase();

      // Parse frequency unit
      if (upperLine.includes('HZ')) {
        if (upperLine.includes('GHZ')) {
          frequencyUnit = 1e9;
        } else if (upperLine.includes('MHZ')) {
          frequencyUnit = 1e6;
        } else if (upperLine.includes('KHZ')) {
          frequencyUnit = 1e3;
        } else {
          frequencyUnit = 1;
        }
      }

      // Parse data format
      if (upperLine.includes(' RI')) {
        dataFormat = 'RI';
      } else if (upperLine.includes(' MA')) {
        dataFormat = 'MA';
      } else if (upperLine.includes(' DB')) {
        dataFormat = 'DB';
      }

      // Parse reference impedance
      const rMatch = upperLine.match(/R\s+(\d+)/);
      if (rMatch) {
        referenceImpedance = parseInt(rMatch[1]);
      }

      continue;
    }

    // Skip comment lines (start with !)
    if (line.startsWith('!')) continue;

    // Parse data lines
    const values = line.split(/\s+/).map(v => parseFloat(v));
    if (values.some(isNaN)) continue;

    // Determine format based on number of values
    if (!format) {
      if (values.length === 3) {
        format = 's1p';
      } else if (values.length === 9) {
        format = 's2p';
      } else {
        continue; // Invalid line
      }
    }

    const frequency = values[0] * frequencyUnit;

    let s11Real: number, s11Imag: number;
    let s21Real: number | undefined, s21Imag: number | undefined;
    let s12Real: number | undefined, s12Imag: number | undefined;
    let s22Real: number | undefined, s22Imag: number | undefined;

    if (format === 's1p') {
      [s11Real, s11Imag] = convertToRI(values[1], values[2], dataFormat);
    } else {
      // S2P format
      [s11Real, s11Imag] = convertToRI(values[1], values[2], dataFormat);
      [s21Real, s21Imag] = convertToRI(values[3], values[4], dataFormat);
      [s12Real, s12Imag] = convertToRI(values[5], values[6], dataFormat);
      [s22Real, s22Imag] = convertToRI(values[7], values[8], dataFormat);
    }

    points.push({
      frequency,
      s11Real,
      s11Imag,
      s21Real,
      s21Imag,
      s12Real,
      s12Imag,
      s22Real,
      s22Imag,
    });
  }

  if (!format || points.length === 0) {
    throw new Error('Invalid S-parameter file format or no data found');
  }

  return {
    points,
    format,
    referenceImpedance,
  };
}

/**
 * Convert S-parameter values from various formats to Real/Imaginary
 */
function convertToRI(
  val1: number,
  val2: number,
  format: 'RI' | 'MA' | 'DB'
): [number, number] {
  switch (format) {
    case 'RI':
      // Already in Real/Imaginary format
      return [val1, val2];

    case 'MA':
      // Magnitude/Angle format (angle in degrees)
      const magLinear = val1;
      const angleRad = (val2 * Math.PI) / 180;
      return [
        magLinear * Math.cos(angleRad),
        magLinear * Math.sin(angleRad),
      ];

    case 'DB':
      // dB/Angle format (magnitude in dB, angle in degrees)
      const magFromDb = Math.pow(10, val1 / 20);
      const angleRadDb = (val2 * Math.PI) / 180;
      return [
        magFromDb * Math.cos(angleRadDb),
        magFromDb * Math.sin(angleRadDb),
      ];

    default:
      return [val1, val2];
  }
}