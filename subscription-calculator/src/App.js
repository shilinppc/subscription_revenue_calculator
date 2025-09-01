import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
// PapaParse will be loaded via a script tag in the App component
// import Papa from 'https://esm.sh/papaparse'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { Download, UploadCloud, X, FileText, Filter, Calendar, Users, BarChart2, DollarSign, Target, MousePointerClick, TrendingUp, Ratio } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
// Note: The stylesheet for react-day-picker is now loaded dynamically in the App component.

// Constants
const REQUIRED_COLUMNS = ['Clicks', 'Cost', 'Avg. CPC', 'Installs', 'Trials', 'Subscriptions', 'Subscription Value', 'Start Date', 'End Date', 'Ad Group'];
const FUNNEL_STAGES = ['Clicks', 'Installs', 'Trials', 'Subscriptions'];
const FUNNEL_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

// Helper Functions
const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const formatPercentage = (value) => `${(value * 100).toFixed(2)}%`;
const safeDivide = (numerator, denominator) => (denominator ? numerator / denominator : 0);

// Reusable UI Components
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl ${className}`}>
        {children}
    </div>
);

const MetricCard = ({ title, value, icon, color, tooltip }) => (
    <Card className="relative group">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
                {icon}
            </div>
        </div>
        {tooltip && (
            <div className="absolute bottom-full mb-2 w-max px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:bg-gray-700">
                {tooltip}
            </div>
        )}
    </Card>
);

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };
    return (
        <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

// Main Application Components
const FileUpload = ({ onDataLoaded, setAppError }) => {
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        if (typeof window.Papa === 'undefined') {
            setAppError("Parsing library not loaded yet. Please try again in a moment.");
            return;
        }
        setLoading(true);
        setAppError(null);

        const file = acceptedFiles[0];
        window.Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const { data, errors, meta } = results;
                if (errors.length > 0) {
                    setAppError(`Error parsing CSV: ${errors[0].message}`);
                    setLoading(false);
                    return;
                }

                const headers = meta.fields;
                const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

                if (missingColumns.length > 0) {
                    setAppError(`Missing required columns: ${missingColumns.join(', ')}`);
                    setLoading(false);
                    return;
                }

                const processedData = data.map((row, index) => {
                    try {
                        return {
                            id: index,
                            ...row,
                            Clicks: parseInt(row.Clicks, 10) || 0,
                            Cost: parseFloat(row.Cost) || 0,
                            'Avg. CPC': parseFloat(row['Avg. CPC']) || 0,
                            Installs: parseInt(row.Installs, 10) || 0,
                            Trials: parseInt(row.Trials, 10) || 0,
                            Subscriptions: parseInt(row.Subscriptions, 10) || 0,
                            'Subscription Value': parseFloat(row['Subscription Value']) || 0,
                            'Start Date': new Date(row['Start Date']),
                            'End Date': new Date(row['End Date']),
                        };
                    } catch (e) {
                        throw new Error(`Error processing row ${index + 2}: ${e.message}`);
                    }
                });

                onDataLoaded(processedData);
                setLoading(false);
            },
            error: (error) => {
                setAppError(`CSV parsing error: ${error.message}`);
                setLoading(false);
            }
        });
    }, [onDataLoaded, setAppError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false
    });
    
    const downloadTemplate = () => {
        const templateData = [REQUIRED_COLUMNS];
        const csvContent = "data:text/csv;charset=utf-8," + templateData.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-center">
            <Card className="p-10">
                <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-4">
                        <UploadCloud className="w-16 h-16 text-gray-400" />
                        {loading ? (
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Processing...</p>
                        ) : isDragActive ? (
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Drop the files here ...</p>
                        ) : (
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Drag & drop a CSV file here, or click to select</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">Requires columns: Clicks, Cost, Installs, Trials, etc.</p>
                    </div>
                </div>
                <div className="mt-6">
                    <Button onClick={downloadTemplate} variant="secondary">
                        <Download className="w-4 h-4" /> Download CSV Template
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const Filters = ({ data, filters, setFilters }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const adGroups = useMemo(() => ['All Ad Groups', ...new Set(data.map(item => item['Ad Group']))], [data]);

    const handleDateChange = (range) => {
        setFilters(prev => ({ ...prev, dateRange: range }));
    };

    const handleAdGroupChange = (e) => {
        setFilters(prev => ({ ...prev, adGroup: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ dateRange: { from: undefined, to: undefined }, adGroup: 'All Ad Groups' });
        setShowDatePicker(false);
    };
    
    const dateRangeText = filters.dateRange?.from
        ? `${format(filters.dateRange.from, 'LLL dd, y')} - ${filters.dateRange.to ? format(filters.dateRange.to, 'LLL dd, y') : ''}`
        : 'Select Date Range';

    return (
        <Card className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
                    <Filter className="w-5 h-5" />
                    <span>Filters</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <Button onClick={() => setShowDatePicker(!showDatePicker)} variant="secondary">
                            <Calendar className="w-4 h-4" />
                            {dateRangeText}
                        </Button>
                        {showDatePicker && (
                            <div className="absolute z-10 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                <DayPicker
                                    mode="range"
                                    selected={filters.dateRange}
                                    onSelect={handleDateChange}
                                />
                                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                                  <Button onClick={() => setShowDatePicker(false)} className="w-full">Done</Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         <Users className="w-5 h-5 text-gray-500" />
                        <select
                            value={filters.adGroup}
                            onChange={handleAdGroupChange}
                            className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {adGroups.map(group => <option key={group} value={group}>{group}</option>)}
                        </select>
                    </div>
                    <Button onClick={clearFilters} variant="danger">
                        Clear Filters
                    </Button>
                </div>
            </div>
        </Card>
    );
};


const Dashboard = ({ data, onReset }) => {
    const [filters, setFilters] = useState({
        dateRange: { from: undefined, to: undefined },
        adGroup: 'All Ad Groups',
    });

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const itemDate = item['Start Date'];
            const inDateRange = !filters.dateRange.from || (itemDate >= filters.dateRange.from && (!filters.dateRange.to || itemDate <= filters.dateRange.to));
            const inAdGroup = filters.adGroup === 'All Ad Groups' || item['Ad Group'] === filters.adGroup;
            return inDateRange && inAdGroup;
        });
    }, [data, filters]);

    const summary = useMemo(() => {
        const initial = { Clicks: 0, Cost: 0, Installs: 0, Trials: 0, Subscriptions: 0, 'Subscription Value': 0 };
        const totals = filteredData.reduce((acc, row) => {
            acc.Clicks += row.Clicks;
            acc.Cost += row.Cost;
            acc.Installs += row.Installs;
            acc.Trials += row.Trials;
            acc.Subscriptions += row.Subscriptions;
            acc['Subscription Value'] += row.Subscriptions * row['Subscription Value'];
            return acc;
        }, initial);

        return {
            ...totals,
            cpi: safeDivide(totals.Cost, totals.Installs),
            installRate: safeDivide(totals.Installs, totals.Clicks),
            installToTrialRate: safeDivide(totals.Trials, totals.Installs),
            trialCost: safeDivide(totals.Cost, totals.Trials),
            installToPaidRate: safeDivide(totals.Subscriptions, totals.Installs),
            cac: safeDivide(totals.Cost, totals.Subscriptions),
            valueCostRatio: safeDivide(totals['Subscription Value'], totals.Cost),
            overallConversion: safeDivide(totals.Subscriptions, totals.Clicks),
            roi: safeDivide(totals['Subscription Value'] - totals.Cost, totals.Cost)
        };
    }, [filteredData]);

    const funnelData = FUNNEL_STAGES.map(stage => ({
        name: stage,
        value: summary[stage]
    }));

    const exportData = () => {
        if (typeof window.Papa === 'undefined') {
            alert("Parsing library not loaded yet. Please try again in a moment.");
            return;
        }
        const csv = window.Papa.unparse(filteredData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Revenue Dashboard</h1>
                 <div className="flex gap-4">
                    <Button onClick={exportData} variant="secondary"><Download className="w-4 h-4" /> Export Report</Button>
                    <Button onClick={onReset}><UploadCloud className="w-4 h-4" /> New Upload</Button>
                </div>
            </div>

            <Filters data={data} filters={filters} setFilters={setFilters} />
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                    Showing <span className="text-xl">{filteredData.length}</span> of <span className="text-xl">{data.length}</span> records.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Cost" value={formatCurrency(summary.Cost)} icon={<DollarSign className="w-6 h-6" />} color="text-red-500" tooltip="Total spend on acquisition." />
                <MetricCard title="CAC" value={formatCurrency(summary.cac)} icon={<Target className="w-6 h-6" />} color="text-orange-500" tooltip="Customer Acquisition Cost (Cost / Subscriptions)" />
                <MetricCard title="Total Revenue" value={formatCurrency(summary['Subscription Value'])} icon={<TrendingUp className="w-6 h-6" />} color="text-green-500" tooltip="Total value from all subscriptions." />
                <MetricCard title="ROI" value={formatPercentage(summary.roi)} icon={<Ratio className="w-6 h-6" />} color="text-teal-500" tooltip="Return on Investment ((Revenue - Cost) / Cost)" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Acquisition Funnel</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <FunnelChart>
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                    border: '1px solid #ccc',
                                    borderRadius: '8px'
                                }}
                                formatter={(value, name, props) => {
                                    if (name === 'value') return [value, props.payload.name];
                                    return [value, name];
                                }}
                            />
                            <Funnel
                                dataKey="value"
                                data={funnelData}
                                isAnimationActive
                            >
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                                ))}
                                <LabelList
                                    position="right"
                                    fill="#000"
                                    stroke="none"
                                    dataKey="name"
                                    className="font-semibold"
                                />
                                <LabelList
                                    position="center"
                                    fill="#fff"
                                    stroke="none"
                                    dataKey="value"
                                    formatter={(value) => value.toLocaleString()}
                                    className="font-bold text-lg"
                                />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </Card>
                 <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Funnel Conversion Rates</h2>
                    <div className="space-y-4 pt-6">
                        <div className="flex items-center">
                            <div className="w-1/3 text-sm text-gray-600 dark:text-gray-400">Clicks to Install</div>
                            <div className="w-2/3">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                    <div className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${summary.installRate * 100}%` }}>
                                        {formatPercentage(summary.installRate)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-1/3 text-sm text-gray-600 dark:text-gray-400">Install to Trial</div>
                            <div className="w-2/3">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                    <div className="bg-green-500 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${summary.installToTrialRate * 100}%` }}>
                                        {formatPercentage(summary.installToTrialRate)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-1/3 text-sm text-gray-600 dark:text-gray-400">Trial to Subscription</div>
                            <div className="w-2/3">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                    <div className="bg-yellow-500 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${safeDivide(summary.Subscriptions, summary.Trials) * 100}%` }}>
                                        {formatPercentage(safeDivide(summary.Subscriptions, summary.Trials))}
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="flex items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                            <div className="w-1/3 text-sm font-bold text-gray-800 dark:text-gray-200">Overall Conversion</div>
                            <div className="w-2/3">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                    <div className="bg-purple-500 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ width: `${summary.overallConversion * 100}%` }}>
                                        {formatPercentage(summary.overallConversion)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Cost Per Install" value={formatCurrency(summary.cpi)} icon={<MousePointerClick className="w-6 h-6" />} color="text-blue-500" tooltip="Cost / Installs" />
                <MetricCard title="Install Rate" value={formatPercentage(summary.installRate)} icon={<BarChart2 className="w-6 h-6" />} color="text-indigo-500" tooltip="Installs / Clicks" />
                <MetricCard title="Install to Trial %" value={formatPercentage(summary.installToTrialRate)} icon={<Users className="w-6 h-6" />} color="text-purple-500" tooltip="Trials / Installs" />
                <MetricCard title="Trial Cost" value={formatCurrency(summary.trialCost)} icon={<DollarSign className="w-6 h-6" />} color="text-pink-500" tooltip="Cost / Trials" />
            </div>

            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Detailed Data</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {REQUIRED_COLUMNS.map(col => <th key={col} className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{col}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredData.slice(0, 10).map(row => (
                                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    {REQUIRED_COLUMNS.map(col => (
                                        <td key={col} className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            {col.includes('Date') ? format(row[col], 'yyyy-MM-dd') : 
                                             typeof row[col] === 'number' && !col.includes('Rate') ? row[col].toLocaleString() : 
                                             row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.length > 10 && <p className="text-center mt-4 text-sm text-gray-500">Showing first 10 rows...</p>}
                </div>
            </Card>
        </div>
    );
};

// Main App Component
export default function App() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    // Dynamically load external scripts and stylesheets
    React.useEffect(() => {
        const scripts = [
            { id: 'papaparse-script', src: 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js' }
        ];
        const styles = [
            { id: 'react-day-picker-styles', href: 'https://unpkg.com/react-day-picker/dist/style.css' }
        ];

        scripts.forEach(scriptInfo => {
            if (document.getElementById(scriptInfo.id)) return;
            const script = document.createElement('script');
            script.id = scriptInfo.id;
            script.src = scriptInfo.src;
            script.async = true;
            document.head.appendChild(script);
        });

        styles.forEach(styleInfo => {
            if (document.getElementById(styleInfo.id)) return;
            const link = document.createElement('link');
            link.id = styleInfo.id;
            link.rel = 'stylesheet';
            link.href = styleInfo.href;
            document.head.appendChild(link);
        });

        // Cleanup function is not strictly necessary for this use case,
        // as the scripts and styles are needed for the app's lifetime.
    }, []); 

    const handleDataLoaded = (loadedData) => {
        setData(loadedData);
        setError(null);
    };
    
    const handleReset = () => {
        setData(null);
        setError(null);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto">
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md relative" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                            <X className="w-6 h-6 text-red-500" />
                        </button>
                    </div>
                )}

                {!data ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">Subscription Revenue Calculator</h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">Upload your campaign data to visualize your acquisition funnel and key metrics.</p>
                        </div>
                        <FileUpload onDataLoaded={handleDataLoaded} setAppError={setError} />
                    </div>
                ) : (
                    <Dashboard data={data} onReset={handleReset} />
                )}
                
                <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
                    <p>Built with React & Tailwind CSS. Deployed on Vercel.</p>
                </footer>
            </div>
        </div>
    );
}


