import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { ArrowRightLeft, ChevronDown } from 'lucide-react';

const UnitConverter: React.FC = () => {
    const { t } = useTranslation();
    const [category, setCategory] = useState('length');
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [fromValue, setFromValue] = useState<number | ''>(1);
    const [toValue, setToValue] = useState<number | ''>('');
    const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
    const [toDropdownOpen, setToDropdownOpen] = useState(false);
    const fromDropdownRef = useRef<HTMLDivElement>(null);
    const toDropdownRef = useRef<HTMLDivElement>(null);

    const categories: Record<string, any> = {
        length: {
            base: 'meter',
            units: {
                meter: 1,
                kilometer: 0.001,
                centimeter: 100,
                millimeter: 1000,
                micrometer: 1000000,
                nanometer: 1000000000,
                inch: 39.3701,
                foot: 3.28084,
                yard: 1.09361,
                mile: 0.000621371,
                nauticalMile: 0.000539957
            }
        },
        area: {
            base: 'squareMeter',
            units: {
                squareMeter: 1,
                squareKilometer: 0.000001,
                squareCentimeter: 10000,
                squareMillimeter: 1000000,
                squareMicrometer: 1000000000000,
                hectare: 0.0001,
                squareMile: 3.861e-7,
                squareYard: 1.19599,
                squareFoot: 10.7639,
                squareInch: 1550,
                acre: 0.000247105
            }
        },
        volume: {
            base: 'liter',
            units: {
                liter: 1,
                cubicMeter: 0.001,
                cubicCentimeter: 1000,
                cubicMillimeter: 1000000,
                cubicInch: 61.0237,
                cubicFoot: 0.0353147,
                cubicYard: 0.001308,
                milliliter: 1000,
                usGallon: 0.264172,
                usQuart: 1.05669,
                usPint: 2.11338,
                usCup: 4.22675,
                usFluidOunce: 33.814,
                imperialGallon: 0.219969,
                imperialQuart: 0.879877,
                imperialPint: 1.75975,
                imperialFluidOunce: 35.1951
            }
        },
        weight: {
            base: 'kilogram',
            units: {
                kilogram: 1,
                gram: 1000,
                milligram: 1000000,
                microgram: 1000000000,
                ton: 0.001,
                pound: 2.20462,
                ounce: 35.274,
                carat: 5000,
                grain: 15432.4,
                stone: 0.157473,
                shortTon: 0.00110231,
                longTon: 0.000984207
            }
        },
        temperature: {
            base: 'celsius',
            units: {
                celsius: 'C',
                fahrenheit: 'F',
                kelvin: 'K',
                rankine: 'R'
            }
        },
        data: {
            base: 'byte',
            units: {
                bit: 8,
                byte: 1,
                kilobit: 0.0078125,
                kilobyte: 0.001,
                megabit: 0.00000762939,
                megabyte: 1e-6,
                gigabit: 7.45058e-9,
                gigabyte: 1e-9,
                terabit: 7.27596e-12,
                terabyte: 1e-12,
                petabyte: 1e-15,
                exabyte: 1e-18,
                kibibyte: 0.000976563,
                mebibyte: 9.53674e-7,
                gibibyte: 9.31323e-10,
                tebibyte: 9.09495e-13,
                pebibyte: 8.88178e-16,
                exbibyte: 8.67362e-19
            }
        },
        speed: {
            base: 'mps',
            units: {
                mps: 1,
                kph: 3.6,
                mph: 2.23694,
                knot: 1.94384,
                fps: 3.28084,
                ips: 39.3701,
                mach: 0.00293858
            }
        },
        time: {
            base: 'second',
            units: {
                nanosecond: 1000000000,
                microsecond: 1000000,
                millisecond: 1000,
                second: 1,
                minute: 0.0166667,
                hour: 0.000277778,
                day: 0.0000115741,
                week: 0.00000165344,
                month: 3.80517e-7,
                year: 3.171e-8,
                decade: 3.171e-9,
                century: 3.171e-10
            }
        }
    };

    useEffect(() => {
        const units = Object.keys(categories[category].units);
        setFromUnit(units[0]);
        setToUnit(units[1] || units[0]);
    }, [category]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
                setFromDropdownOpen(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
                setToDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        convert();
    }, [fromValue, fromUnit, toUnit, category]);

    const convert = () => {
        if (fromValue === '') {
            setToValue('');
            return;
        }

        const val = Number(fromValue);
        if (isNaN(val)) return;

        if (category === 'temperature') {
            let celsius = val;
            // Convert to Celsius first
            if (fromUnit === 'fahrenheit') celsius = (val - 32) * 5 / 9;
            if (fromUnit === 'kelvin') celsius = val - 273.15;
            if (fromUnit === 'rankine') celsius = (val - 491.67) * 5 / 9;

            // Convert from Celsius to target
            if (toUnit === 'celsius') setToValue(celsius);
            if (toUnit === 'fahrenheit') setToValue((celsius * 9 / 5) + 32);
            if (toUnit === 'kelvin') setToValue(celsius + 273.15);
            if (toUnit === 'rankine') setToValue((celsius + 273.15) * 9 / 5);
        } else {
            const rates = categories[category].units;
            // Convert to base unit first (value / rate)
            // Then convert to target unit (value * rate)
            // Wait, my rates are "how many units in 1 base unit"
            // So: base = val / rate_from
            // target = base * rate_to

            const baseValue = val / rates[fromUnit];
            const result = baseValue * rates[toUnit];

            // Handle floating point errors
            setToValue(Number(result.toPrecision(6)));
        }
    };

    const swapUnits = () => {
        // Swap units
        const tempUnit = fromUnit;
        setFromUnit(toUnit);
        setToUnit(tempUnit);

        // Swap values
        const tempValue = fromValue;
        setFromValue(toValue);
        setToValue(tempValue);
    };

    // Generate conversion table for all units in the category
    const generateConversionTable = () => {
        if (!categories[category] || !categories[category].units) return [];
        
        const units = Object.keys(categories[category].units);
        const baseUnit = categories[category].base;
        const baseRate = categories[category].units[baseUnit];
        
        // Create table data
        return units.map(unit => {
            // Special handling for temperature
            if (category === 'temperature') {
                // For temperature, we show the conversion of 1 base unit to other units
                let convertedValue;
                const baseValue = 1; // We're converting 1 base unit
                
                // Convert 1 base unit to Celsius first (if not already)
                let celsius = baseValue;
                if (baseUnit === 'fahrenheit') celsius = (baseValue - 32) * 5 / 9;
                if (baseUnit === 'kelvin') celsius = baseValue - 273.15;
                if (baseUnit === 'rankine') celsius = (baseValue - 491.67) * 5 / 9;
                
                // Convert from Celsius to target unit
                if (unit === 'celsius') convertedValue = celsius;
                if (unit === 'fahrenheit') convertedValue = (celsius * 9 / 5) + 32;
                if (unit === 'kelvin') convertedValue = celsius + 273.15;
                if (unit === 'rankine') convertedValue = (celsius + 273.15) * 9 / 5;
                
                // Format the value with space separators for every 3 digits
                let formattedValue = convertedValue.toLocaleString('en-US', {
                    maximumFractionDigits: 6,
                    useGrouping: true
                }).replace(/,/g, ' ');
                
                return {
                    unit: t(`tool.unit-converter.units.${unit}`),
                    value: formattedValue
                };
            }
            
            const rate = categories[category].units[unit];
            // Calculate conversion: 1 base unit = ? this unit
            const convertedValue = (1 / baseRate) * rate;
            
            // Format the value with space separators for every 3 digits
            let formattedValue;
            if (convertedValue >= 1) {
                // For large numbers, add space separators
                formattedValue = convertedValue.toLocaleString('en-US', {
                    maximumFractionDigits: convertedValue > 100 ? 0 : 6,
                    useGrouping: true
                }).replace(/,/g, ' ');
            } else {
                // For small numbers, use scientific notation or clean decimal
                if (convertedValue < 0.001) {
                    formattedValue = convertedValue.toExponential(6);
                } else {
                    formattedValue = convertedValue.toFixed(9).replace(/\.?0+$/, '');
                }
            }
            
            return {
                unit: t(`tool.unit-converter.units.${unit}`),
                value: formattedValue
            };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-6">
                <div className="flex flex-wrap justify-center gap-2">
                    {Object.keys(categories).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${category === cat
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {t(`tool.unit-converter.categories.${cat}`)}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* From */}
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-sm font-medium text-gray-500 uppercase">{t('tool.unit-converter.from')}</label>
                        <input
                            type="number"
                            value={fromValue}
                            onChange={(e) => setFromValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white min-h-[52px]"
                            placeholder="0"
                        />
                        {category === 'data' ? (
                            <div className="relative" ref={fromDropdownRef}>
                                <button
                                    type="button"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-left flex justify-between items-center"
                                    onClick={() => {
                                        setFromDropdownOpen(!fromDropdownOpen);
                                        setToDropdownOpen(false);
                                    }}
                                >
                                    <span>{fromUnit && t(`tool.unit-converter.units.${fromUnit}`)}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>
                                {fromDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        <div className="grid grid-cols-2 gap-4 p-3">
                                            {/* Decimal units (KB, MB, GB, etc.) */}
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">{t('common.decimal')}</div>
                                                {categories[category] && Object.keys(categories[category].units)
                                                    .filter(u => !u.includes('bi')) // Non-binary units
                                                    .map(u => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            className={`block w-full text-left px-3 py-2 text-sm rounded capitalize ${fromUnit === u 
                                                                ? 'bg-blue-500 text-white' 
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            }`}
                                                            onClick={() => {
                                                                setFromUnit(u);
                                                                setFromDropdownOpen(false);
                                                            }}
                                                        >
                                                            {t(`tool.unit-converter.units.${u}`)}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                            {/* Binary units (KiB, MiB, GiB, etc.) */}
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">{t('common.binary')}</div>
                                                {categories[category] && Object.keys(categories[category].units)
                                                    .filter(u => u.includes('bi')) // Binary units
                                                    .map(u => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            className={`block w-full text-left px-3 py-2 text-sm rounded capitalize ${fromUnit === u 
                                                                ? 'bg-blue-500 text-white' 
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            }`}
                                                            onClick={() => {
                                                                setFromUnit(u);
                                                                setFromDropdownOpen(false);
                                                            }}
                                                        >
                                                            {t(`tool.unit-converter.units.${u}`)}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative" ref={fromDropdownRef}>
                                <button
                                    type="button"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-left flex justify-between items-center"
                                    onClick={() => {
                                        setFromDropdownOpen(!fromDropdownOpen);
                                        setToDropdownOpen(false);
                                    }}
                                >
                                    <span>{fromUnit && t(`tool.unit-converter.units.${fromUnit}`)}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>
                                {fromDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        <div className="grid grid-cols-3 gap-1 p-2">
                                            {categories[category] && Object.keys(categories[category].units).map(u => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    className={`text-left px-3 py-2 text-sm rounded capitalize ${fromUnit === u 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    onClick={() => {
                                                        setFromUnit(u);
                                                        setFromDropdownOpen(false);
                                                    }}
                                                >
                                                    {t(`tool.unit-converter.units.${u}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={swapUnits}>
                        <ArrowRightLeft className="w-6 h-6 text-gray-500" />
                    </div>

                    {/* To */}
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-sm font-medium text-gray-500 uppercase">{t('tool.unit-converter.to')}</label>
                        <div className="w-full text-3xl font-bold text-blue-600 dark:text-blue-400 py-2 min-h-[52px]">
                            {toValue}
                        </div>
                        {category === 'data' ? (
                            <div className="relative" ref={toDropdownRef}>
                                <button
                                    type="button"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-left flex justify-between items-center"
                                    onClick={() => {
                                        setToDropdownOpen(!toDropdownOpen);
                                        setFromDropdownOpen(false);
                                    }}
                                >
                                    <span>{toUnit && t(`tool.unit-converter.units.${toUnit}`)}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>
                                {toDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        <div className="grid grid-cols-2 gap-4 p-3">
                                            {/* Decimal units (KB, MB, GB, etc.) */}
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">{t('common.decimal')}</div>
                                                {categories[category] && Object.keys(categories[category].units)
                                                    .filter(u => !u.includes('bi')) // Non-binary units
                                                    .map(u => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            className={`block w-full text-left px-3 py-2 text-sm rounded capitalize ${toUnit === u 
                                                                ? 'bg-blue-500 text-white' 
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            }`}
                                                            onClick={() => {
                                                                setToUnit(u);
                                                                setToDropdownOpen(false);
                                                            }}
                                                        >
                                                            {t(`tool.unit-converter.units.${u}`)}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                            {/* Binary units (KiB, MiB, GiB, etc.) */}
                                            <div>
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">{t('common.binary')}</div>
                                                {categories[category] && Object.keys(categories[category].units)
                                                    .filter(u => u.includes('bi')) // Binary units
                                                    .map(u => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            className={`block w-full text-left px-3 py-2 text-sm rounded capitalize ${toUnit === u 
                                                                ? 'bg-blue-500 text-white' 
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            }`}
                                                            onClick={() => {
                                                                setToUnit(u);
                                                                setToDropdownOpen(false);
                                                            }}
                                                        >
                                                            {t(`tool.unit-converter.units.${u}`)}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative" ref={toDropdownRef}>
                                <button
                                    type="button"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm text-left flex justify-between items-center"
                                    onClick={() => {
                                        setToDropdownOpen(!toDropdownOpen);
                                        setFromDropdownOpen(false);
                                    }}
                                >
                                    <span>{toUnit && t(`tool.unit-converter.units.${toUnit}`)}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>
                                {toDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        <div className="grid grid-cols-3 gap-1 p-2">
                                            {categories[category] && Object.keys(categories[category].units).map(u => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    className={`text-left px-3 py-2 text-sm rounded capitalize ${toUnit === u 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    onClick={() => {
                                                        setToUnit(u);
                                                        setToDropdownOpen(false);
                                                    }}
                                                >
                                                    {t(`tool.unit-converter.units.${u}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Conversion Table */}
            <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                    {t('tool.unit-converter.conversion_table')}
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t('tool.unit-converter.unit')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t('tool.unit-converter.value')} (1 {t(`tool.unit-converter.units.${categories[category].base}`)} = ?)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {generateConversionTable().map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {item.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                                        {item.value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UnitConverter;