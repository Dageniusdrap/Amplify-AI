import React, { useState } from 'react';
import { RetirementPlan } from '../types';
import { Loader } from './Loader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PiggyBankIcon } from './icons/PiggyBankIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface RetirementPlannerProps {
    onGenerate: (inputs: any) => void;
    isLoading: boolean;
    error: string | null;
    plan: RetirementPlan | null;
    onCancel: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const RetirementPlanner: React.FC<RetirementPlannerProps> = ({ onGenerate, isLoading, error, plan, onCancel }) => {
    const [inputs, setInputs] = useState({
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 50000,
        monthlyContribution: 500,
        investmentStyle: 'Moderate',
        retirementIncome: 4000,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: name === 'investmentStyle' ? value : Number(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(inputs);
    };

    const InputField: React.FC<{ label: string, name: string, type: string, value: any, prefix?: string }> = ({ label, name, type, value, prefix }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                {prefix && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-500 sm:text-sm">{prefix}</span></div>}
                <input
                    type={type}
                    name={name}
                    id={name}
                    value={value}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-gray-300 bg-white dark:bg-gray-700/50 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${prefix ? 'pl-7' : 'pl-3'}`}
                />
            </div>
        </div>
    );
    
    if (isLoading) {
        return <Loader message="Generating your retirement plan..." onCancel={onCancel} />;
    }
    
    if(error) {
        return <div className="text-center p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>;
    }

    if (plan) {
        return (
            <div className="space-y-8">
                <div className={`p-6 rounded-2xl border-2 ${plan.isFeasible ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-red-50 dark:bg-red-900/30 border-red-500'}`}>
                    <div className="flex items-center">
                        {plan.isFeasible ? <CheckIcon className="h-8 w-8 text-green-600 mr-4" /> : <XIcon className="h-8 w-8 text-red-600 mr-4" />}
                        <div>
                            <h2 className="text-2xl font-bold">{plan.isFeasible ? "You're On Track!" : "Adjustments Needed"}</h2>
                            <p className="text-md">{plan.summary}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Projected Nest Egg</h3>
                        <p className="mt-1 text-3xl font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(plan.projectedNestEgg)}</p>
                    </div>
                     <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Desired Monthly Income</h3>
                        <p className="mt-1 text-3xl font-semibold text-gray-800 dark:text-white">{formatCurrency(inputs.retirementIncome)}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Projected Monthly Income</h3>
                        <p className={`mt-1 text-3xl font-semibold ${plan.isFeasible ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(plan.projectedMonthlyIncome)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-96">
                    <h3 className="font-semibold mb-4">Projected Growth</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={plan.projections} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="year" name="Year" />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                            <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shadow-md">
                    <h3 className="font-semibold flex items-center mb-2"><LightbulbIcon className="h-5 w-5 mr-2 text-indigo-500" /> AI Recommendations</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">{plan.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="font-semibold mb-2">{plan.accumulationPhase.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{plan.accumulationPhase.summary}</p>
                        <ul className="list-disc list-inside space-y-2 text-sm">{plan.accumulationPhase.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                    </div>
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="font-semibold mb-2">{plan.decumulationPhase.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{plan.decumulationPhase.summary}</p>
                        <ul className="list-disc list-inside space-y-2 text-sm">{plan.decumulationPhase.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                    </div>
                </div>
                
                 <div className="text-center">
                    <button onClick={() => onGenerate(inputs)} className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Regenerate Plan</button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
                <PiggyBankIcon className="h-12 w-12 mx-auto text-indigo-500 mb-2" />
                <h2 className="text-2xl font-bold">Retirement Planner</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Let's map out your financial future.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Current Age" name="currentAge" type="number" value={inputs.currentAge} />
                    <InputField label="Retirement Age" name="retirementAge" type="number" value={inputs.retirementAge} />
                </div>
                <InputField label="Current Savings" name="currentSavings" type="number" value={inputs.currentSavings} prefix="$" />
                <InputField label="Monthly Contribution" name="monthlyContribution" type="number" value={inputs.monthlyContribution} prefix="$" />
                 <div>
                    <label htmlFor="investmentStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Investment Style</label>
                    <select id="investmentStyle" name="investmentStyle" value={inputs.investmentStyle} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-gray-700/50 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                        <option>Conservative</option>
                        <option>Moderate</option>
                        <option>Aggressive</option>
                    </select>
                </div>
                <InputField label="Desired Monthly Retirement Income" name="retirementIncome" type="number" value={inputs.retirementIncome} prefix="$" />

                <button
                    id="analysis-submit-button"
                    type="submit"
                    className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                    Generate Plan
                </button>
            </form>
             <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
                Disclaimer: The information provided is for informational purposes only and does not constitute financial advice. Consult with a qualified professional before making any financial decisions.
            </div>
        </div>
    );
};
