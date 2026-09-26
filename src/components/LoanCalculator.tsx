import React, { useState, useMemo, useCallback } from 'react';
import {
  Calculator,
  Calendar,
  RotateCcw,
  Download,
  Printer,
  PieChart as PieChartIcon,
  Table as TableIcon,
  ShieldCheck,
  Info,
  DollarSign,
  Percent,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Locale } from '../i18n/translations';
import { getTranslations } from '../i18n/translations';
import { formatCurrency } from '../i18n/utils';

interface LoanCalculatorProps {
  locale: Locale;
}

interface MonthlyScheduleRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  totalInterest: number;
  endingBalance: number;
  dateStr: string;
}

interface AnnualScheduleRow {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  totalInterest: number;
  endingBalance: number;
}

const CURRENCIES = [
  { symbol: '$', label: 'USD / CAD / AUD ($)' },
  { symbol: '€', label: 'EUR (€)' },
  { symbol: '£', label: 'GBP (£)' },
  { symbol: '¥', label: 'JPY / CNY (¥)' },
  { symbol: 'R$', label: 'BRL (R$)' },
  { symbol: '₹', label: 'INR (₹)' },
  { symbol: 'CHF', label: 'CHF' },
];

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({ locale }) => {
  const t = getTranslations(locale);

  // Set default currency depending on locale
  const initialCurrency = useMemo(() => {
    switch (locale) {
      case 'es':
      case 'de':
      case 'fr':
        return '€';
      case 'pt':
        return 'R$';
      case 'ja':
        return '¥';
      default:
        return '$';
    }
  }, [locale]);

  // Initial Loan amounts tailored to currency/locale
  const initialPrincipal = useMemo(() => {
    if (locale === 'ja') return 30000000;
    if (locale === 'pt') return 250000;
    return 250000;
  }, [locale]);

  const [principal, setPrincipal] = useState<number>(initialPrincipal);
  const [principalInput, setPrincipalInput] = useState<string>(initialPrincipal.toLocaleString());
  const [annualRate, setAnnualRate] = useState<number>(6.5);
  const [rateInput, setRateInput] = useState<string>('6.5');
  const [termMode, setTermMode] = useState<'years' | 'months'>('years');
  const [termYears, setTermYears] = useState<number>(30);
  const [termMonths, setTermMonths] = useState<number>(360);
  const [termInput, setTermInput] = useState<string>('30');
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [scheduleView, setScheduleView] = useState<'annual' | 'monthly'>('annual');
  const [activePreset, setActivePreset] = useState<string | null>('mortgage');

  // Term in months calculation
  const totalMonths = useMemo(() => {
    if (termMode === 'years') {
      return Math.max(1, Math.round(termYears * 12));
    }
    return Math.max(1, Math.round(termMonths));
  }, [termMode, termYears, termMonths]);

  // Main Financial Math Execution
  const financialResults = useMemo(() => {
    const P = Math.max(0, principal);
    const n = totalMonths;
    const r = annualRate > 0 ? annualRate / 100 / 12 : 0;

    let emi = 0;
    if (P > 0 && n > 0) {
      if (r > 0) {
        const factor = Math.pow(1 + r, n);
        emi = (P * r * factor) / (factor - 1);
      } else {
        emi = P / n;
      }
    }

    // Protection against invalid math
    if (isNaN(emi) || !isFinite(emi)) emi = 0;

    const totalPayment = emi * n;
    const totalInterest = Math.max(0, totalPayment - P);

    // Projected Payoff Date
    const today = new Date();
    const payoffDate = new Date(today.getFullYear(), today.getMonth() + n, 1);
    const payoffDateStr = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
      month: 'short',
      year: 'numeric',
    }).format(payoffDate);

    // Detailed Monthly Amortization Schedule
    const monthlySchedule: MonthlyScheduleRow[] = [];
    let currentBalance = P;
    let accumulatedInterest = 0;

    for (let m = 1; m <= n; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const dateFormatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
        month: 'short',
        year: 'numeric',
      }).format(monthDate);

      let interestForMonth = currentBalance * r;
      let principalForMonth = emi - interestForMonth;

      if (principalForMonth > currentBalance || m === n) {
        principalForMonth = currentBalance;
        interestForMonth = Math.max(0, emi - principalForMonth);
        currentBalance = 0;
      } else {
        currentBalance = Math.max(0, currentBalance - principalForMonth);
      }

      accumulatedInterest += interestForMonth;

      monthlySchedule.push({
        month: m,
        year: Math.ceil(m / 12),
        payment: principalForMonth + interestForMonth,
        principal: principalForMonth,
        interest: interestForMonth,
        totalInterest: accumulatedInterest,
        endingBalance: currentBalance,
        dateStr: dateFormatted,
      });

      if (currentBalance <= 0) break;
    }

    // Aggregated Annual Schedule
    const annualScheduleMap = new Map<number, AnnualScheduleRow>();
    monthlySchedule.forEach((row) => {
      const existing = annualScheduleMap.get(row.year);
      if (!existing) {
        annualScheduleMap.set(row.year, {
          year: row.year,
          payment: row.payment,
          principal: row.principal,
          interest: row.interest,
          totalInterest: row.totalInterest,
          endingBalance: row.endingBalance,
        });
      } else {
        existing.payment += row.payment;
        existing.principal += row.principal;
        existing.interest += row.interest;
        existing.totalInterest = row.totalInterest;
        existing.endingBalance = row.endingBalance;
      }
    });

    const annualSchedule = Array.from(annualScheduleMap.values());

    return {
      emi,
      totalPayment,
      totalInterest,
      payoffDateStr,
      monthlySchedule,
      annualSchedule,
      principalRatio: totalPayment > 0 ? (P / totalPayment) * 100 : 100,
      interestRatio: totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0,
    };
  }, [principal, annualRate, totalMonths, locale]);

  // Input Handlers with sanitization
  const handlePrincipalChange = (raw: string) => {
    setActivePreset(null);
    const cleaned = raw.replace(/[^0-9.]/g, '');
    setPrincipalInput(raw);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setPrincipal(Math.min(1000000000, Math.max(0, parsed)));
    } else if (raw === '') {
      setPrincipal(0);
    }
  };

  const handlePrincipalSlider = (val: number) => {
    setActivePreset(null);
    setPrincipal(val);
    setPrincipalInput(val.toLocaleString());
  };

  const handleRateChange = (raw: string) => {
    setActivePreset(null);
    const cleaned = raw.replace(/[^0-9.]/g, '');
    setRateInput(raw);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setAnnualRate(Math.min(99.9, Math.max(0, parsed)));
    } else if (raw === '') {
      setAnnualRate(0);
    }
  };

  const handleRateSlider = (val: number) => {
    setActivePreset(null);
    setAnnualRate(val);
    setRateInput(val.toString());
  };

  const handleTermChange = (raw: string) => {
    setActivePreset(null);
    const cleaned = raw.replace(/[^0-9]/g, '');
    setTermInput(raw);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      if (termMode === 'years') {
        const y = Math.min(50, Math.max(1, parsed));
        setTermYears(y);
        setTermMonths(y * 12);
      } else {
        const m = Math.min(600, Math.max(1, parsed));
        setTermMonths(m);
        setTermYears(Math.round((m / 12) * 10) / 10);
      }
    }
  };

  const handleTermSlider = (val: number) => {
    setActivePreset(null);
    if (termMode === 'years') {
      setTermYears(val);
      setTermMonths(val * 12);
      setTermInput(val.toString());
    } else {
      setTermMonths(val);
      setTermYears(Math.round((val / 12) * 10) / 10);
      setTermInput(val.toString());
    }
  };

  const handleTermModeToggle = (mode: 'years' | 'months') => {
    setTermMode(mode);
    if (mode === 'years') {
      const y = Math.max(1, Math.round(termMonths / 12));
      setTermYears(y);
      setTermInput(y.toString());
    } else {
      const m = Math.max(1, Math.round(termYears * 12));
      setTermMonths(m);
      setTermInput(m.toString());
    }
  };

  // Presets
  const applyPreset = (preset: 'mortgage' | 'auto' | 'personal') => {
    setActivePreset(preset);
    if (preset === 'mortgage') {
      const p = locale === 'ja' ? 35000000 : 300000;
      setPrincipal(p);
      setPrincipalInput(p.toLocaleString());
      setAnnualRate(6.5);
      setRateInput('6.5');
      setTermMode('years');
      setTermYears(30);
      setTermMonths(360);
      setTermInput('30');
    } else if (preset === 'auto') {
      const p = locale === 'ja' ? 3500000 : 35000;
      setPrincipal(p);
      setPrincipalInput(p.toLocaleString());
      setAnnualRate(5.2);
      setRateInput('5.2');
      setTermMode('years');
      setTermYears(5);
      setTermMonths(60);
      setTermInput('5');
    } else if (preset === 'personal') {
      const p = locale === 'ja' ? 1500000 : 15000;
      setPrincipal(p);
      setPrincipalInput(p.toLocaleString());
      setAnnualRate(8.9);
      setRateInput('8.9');
      setTermMode('years');
      setTermYears(3);
      setTermMonths(36);
      setTermInput('3');
    }
  };

  // Reset to original state
  const handleReset = () => {
    setPrincipal(initialPrincipal);
    setPrincipalInput(initialPrincipal.toLocaleString());
    setAnnualRate(6.5);
    setRateInput('6.5');
    setTermMode('years');
    setTermYears(30);
    setTermMonths(360);
    setTermInput('30');
    setCurrency(initialCurrency);
    setActivePreset('mortgage');
  };

  // CSV Export Engine (100% Client-Side)
  const handleExportCSV = useCallback(() => {
    const isMonthly = scheduleView === 'monthly';
    const rows = isMonthly ? financialResults.monthlySchedule : financialResults.annualSchedule;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += isMonthly
      ? 'Month,Date,Payment,Principal,Interest,Total_Interest_To_Date,Ending_Balance\n'
      : 'Year,Payment,Principal,Interest,Total_Interest_To_Date,Ending_Balance\n';

    rows.forEach((row) => {
      const line = isMonthly
        ? [
            (row as MonthlyScheduleRow).month,
            `"${(row as MonthlyScheduleRow).dateStr}"`,
            row.payment.toFixed(2),
            row.principal.toFixed(2),
            row.interest.toFixed(2),
            row.totalInterest.toFixed(2),
            row.endingBalance.toFixed(2),
          ].join(',')
        : [
            (row as AnnualScheduleRow).year,
            row.payment.toFixed(2),
            row.principal.toFixed(2),
            row.interest.toFixed(2),
            row.totalInterest.toFixed(2),
            row.endingBalance.toFixed(2),
          ].join(',');
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `LoanCal_Amortization_${scheduleView}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [financialResults, scheduleView]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Safe formatting helper
  const fmt = (val: number) => formatCurrency(val, currency, locale === 'en' ? 'en-US' : locale);

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Quick Presets Bar: Flex-col on small mobile, row on tablet/desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-theme-card/50 border border-theme-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-theme-textMuted shrink-0">
          <Sparkles className="w-4 h-4 text-theme-accent shrink-0" />
          <span>{t.calculator.presetsTitle}:</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => applyPreset('mortgage')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'mortgage'
                ? 'bg-palette-slate text-[#1a252e] font-bold shadow-soft'
                : 'bg-theme-bg/60 hover:bg-theme-bg text-theme-text border border-theme-border/40'
            }`}
          >
            {t.calculator.presetMortgage}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('auto')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'auto'
                ? 'bg-palette-slate text-[#1a252e] font-bold shadow-soft'
                : 'bg-theme-bg/60 hover:bg-theme-bg text-theme-text border border-theme-border/40'
            }`}
          >
            {t.calculator.presetAuto}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('personal')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activePreset === 'personal'
                ? 'bg-palette-slate text-[#1a252e] font-bold shadow-soft'
                : 'bg-theme-bg/60 hover:bg-theme-bg text-theme-text border border-theme-border/40'
            }`}
          >
            {t.calculator.presetPersonal}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl text-theme-textMuted hover:text-theme-text hover:bg-theme-bg/80 transition-all border border-transparent hover:border-theme-border/40 shrink-0"
            title={t.calculator.reset}
            aria-label={t.calculator.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Sliders & Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 sm:p-7 rounded-3xl bg-theme-card border border-theme-border shadow-soft transition-colors">
            <div className="flex items-center justify-between mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-theme-border/50 gap-2">
              <h2 className="text-lg sm:text-2xl font-extrabold text-theme-text flex items-center gap-2">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-palette-mocha dark:text-palette-slate shrink-0" />
                <span className="truncate">{t.calculator.heading}</span>
              </h2>
              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="currency-select" className="text-xs font-semibold text-theme-textMuted hidden sm:inline">
                  {t.calculator.currency}:
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-theme-bg text-theme-text border border-theme-border focus:outline-none focus:ring-2 focus:ring-palette-slate cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.symbol} ({c.label.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {/* Input 1: Loan Amount */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <label htmlFor="loan-amount-input" className="text-xs sm:text-sm font-bold text-theme-text flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-textMuted shrink-0" />
                    <span className="truncate">{t.calculator.loanAmount}</span>
                  </label>
                  <div className="relative flex items-center shrink-0">
                    <span className="absolute left-2.5 sm:left-3 font-bold text-theme-textMuted text-xs sm:text-sm">{currency}</span>
                    <input
                      id="loan-amount-input"
                      type="text"
                      inputMode="decimal"
                      value={principalInput}
                      onChange={(e) => handlePrincipalChange(e.target.value)}
                      onBlur={() => setPrincipalInput(principal.toLocaleString())}
                      className="w-32 sm:w-44 pl-6 sm:pl-7 pr-2.5 sm:pr-3 py-1.5 rounded-xl font-mono text-xs sm:text-base font-bold bg-theme-bg text-theme-text border border-theme-border text-right focus:outline-none focus:ring-2 focus:ring-palette-slate shadow-inner"
                      placeholder={t.calculator.loanAmountPlaceholder}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={locale === 'ja' ? 100000000 : 1500000}
                  step={locale === 'ja' ? 500000 : 5000}
                  value={principal}
                  onChange={(e) => handlePrincipalSlider(parseFloat(e.target.value))}
                  aria-label={t.calculator.loanAmount}
                />
                <div className="flex justify-between text-[10px] sm:text-[11px] font-mono font-medium text-theme-textMuted">
                  <span>{fmt(1000)}</span>
                  <span>{fmt(locale === 'ja' ? 50000000 : 750000)}</span>
                  <span>{fmt(locale === 'ja' ? 100000000 : 1500000)}</span>
                </div>
              </div>

              {/* Input 2: Interest Rate */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <label htmlFor="interest-rate-input" className="text-xs sm:text-sm font-bold text-theme-text flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-textMuted shrink-0" />
                    <span className="truncate">{t.calculator.interestRate}</span>
                  </label>
                  <div className="relative flex items-center shrink-0">
                    <input
                      id="interest-rate-input"
                      type="text"
                      inputMode="decimal"
                      value={rateInput}
                      onChange={(e) => handleRateChange(e.target.value)}
                      onBlur={() => setRateInput(annualRate.toString())}
                      className="w-24 sm:w-32 pr-6 sm:pr-7 pl-2.5 sm:pl-3 py-1.5 rounded-xl font-mono text-xs sm:text-base font-bold bg-theme-bg text-theme-text border border-theme-border text-right focus:outline-none focus:ring-2 focus:ring-palette-slate shadow-inner"
                      placeholder={t.calculator.interestRatePlaceholder}
                    />
                    <span className="absolute right-2.5 sm:right-3 font-bold text-theme-textMuted text-xs sm:text-sm">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={25}
                  step={0.1}
                  value={annualRate}
                  onChange={(e) => handleRateSlider(parseFloat(e.target.value))}
                  aria-label={t.calculator.interestRate}
                />
                <div className="flex justify-between text-[10px] sm:text-[11px] font-mono font-medium text-theme-textMuted">
                  <span>0.1%</span>
                  <span>5.0%</span>
                  <span>12.0%</span>
                  <span>25.0%</span>
                </div>
              </div>

              {/* Input 3: Loan Term */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <label htmlFor="loan-term-input" className="text-xs sm:text-sm font-bold text-theme-text flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-textMuted shrink-0" />
                      <span className="hidden sm:inline">{t.calculator.loanTerm}</span>
                      <span className="sm:hidden">Term</span>
                    </label>
                    {/* Years / Months Toggle */}
                    <div className="inline-flex rounded-lg border border-theme-border p-0.5 bg-theme-bg text-[11px] sm:text-xs">
                      <button
                        type="button"
                        onClick={() => handleTermModeToggle('years')}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-md font-semibold transition-all ${
                          termMode === 'years'
                            ? 'bg-palette-slate text-[#1a252e]'
                            : 'text-theme-textMuted hover:text-theme-text'
                        }`}
                      >
                        {t.calculator.termYears}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTermModeToggle('months')}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-md font-semibold transition-all ${
                          termMode === 'months'
                            ? 'bg-palette-slate text-[#1a252e]'
                            : 'text-theme-textMuted hover:text-theme-text'
                        }`}
                      >
                        {t.calculator.termMonths}
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center shrink-0">
                    <input
                      id="loan-term-input"
                      type="text"
                      inputMode="numeric"
                      value={termInput}
                      onChange={(e) => handleTermChange(e.target.value)}
                      onBlur={() =>
                        setTermInput(termMode === 'years' ? termYears.toString() : termMonths.toString())
                      }
                      className="w-20 sm:w-28 pr-2.5 sm:pr-3 pl-2.5 sm:pl-3 py-1.5 rounded-xl font-mono text-xs sm:text-base font-bold bg-theme-bg text-theme-text border border-theme-border text-right focus:outline-none focus:ring-2 focus:ring-palette-slate shadow-inner"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={termMode === 'years' ? 40 : 480}
                  step={1}
                  value={termMode === 'years' ? termYears : termMonths}
                  onChange={(e) => handleTermSlider(parseInt(e.target.value, 10))}
                  aria-label={t.calculator.loanTerm}
                />
                <div className="flex justify-between text-[10px] sm:text-[11px] font-mono font-medium text-theme-textMuted">
                  {termMode === 'years' ? (
                    <>
                      <span>1 yr</span>
                      <span>15 yrs</span>
                      <span>30 yrs</span>
                      <span>40 yrs</span>
                    </>
                  ) : (
                    <>
                      <span>12 mos</span>
                      <span>180 mos</span>
                      <span>360 mos</span>
                      <span>480 mos</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Micro Trust Banner */}
            <div className="mt-6 sm:mt-8 pt-4 border-t border-theme-border/50 flex items-center justify-between text-[11px] sm:text-xs text-theme-textMuted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-palette-slate shrink-0" />
                <span className="hidden sm:inline">100% Client-Side Computation</span>
                <span className="sm:hidden">100% Client-Side</span>
              </span>
              <span className="font-mono">Zero Server Calls</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Outputs & Visual Donut */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main EMI Highlight Card */}
          <div className="p-5 sm:p-7 rounded-3xl bg-theme-card border-2 border-palette-slate shadow-soft-lg transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-palette-slate/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-theme-textMuted uppercase tracking-wider mb-1.5 sm:mb-2">
              <span>{t.calculator.monthlyPayment}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-palette-slate text-[#1a252e]">
                Real-Time
              </span>
            </div>

            {/* Giant Monthly Payment Amount */}
            <div className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-mono text-theme-text tracking-tight mb-3 sm:mb-4 break-words">
              {fmt(financialResults.emi)}
            </div>

            {/* Secondary Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3.5 sm:pt-4 border-t border-theme-border/60">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-theme-bg/60 border border-theme-border/40">
                <div className="text-[11px] font-medium text-theme-textMuted mb-0.5 sm:mb-1 leading-tight">
                  {t.calculator.totalInterest}
                </div>
                <div className="text-sm sm:text-lg font-bold font-mono text-theme-text break-words">
                  {fmt(financialResults.totalInterest)}
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-theme-bg/60 border border-theme-border/40">
                <div className="text-[11px] font-medium text-theme-textMuted mb-0.5 sm:mb-1 leading-tight">
                  {t.calculator.totalPayment}
                </div>
                <div className="text-sm sm:text-lg font-bold font-mono text-theme-text break-words">
                  {fmt(financialResults.totalPayment)}
                </div>
              </div>
            </div>

            <div className="mt-3.5 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-theme-textMuted bg-theme-bg/40 px-3 py-2 rounded-xl border border-theme-border/30">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-palette-slate shrink-0" />
                {t.calculator.payoffDate}:
              </span>
              <span className="font-bold text-theme-text">{financialResults.payoffDateStr}</span>
            </div>
          </div>

          {/* Payment Breakdown Donut / Proportions */}
          <div className="p-6 rounded-3xl bg-theme-card border border-theme-border shadow-soft">
            <h3 className="text-sm font-bold text-theme-text flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-theme-textMuted" />
              {t.calculator.breakdownTitle}
            </h3>

            {/* Visual Ratio Bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-theme-bg border border-theme-border/60 mb-3 shadow-inner">
              <div
                style={{ width: `${financialResults.principalRatio}%` }}
                className="bg-palette-slate transition-all duration-300"
                title={`Principal: ${financialResults.principalRatio.toFixed(1)}%`}
              />
              <div
                style={{ width: `${financialResults.interestRatio}%` }}
                className="bg-palette-mocha dark:bg-palette-cream/70 transition-all duration-300"
                title={`Interest: ${financialResults.interestRatio.toFixed(1)}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-md bg-palette-slate shrink-0" />
                <div>
                  <div className="font-semibold text-theme-text">{t.calculator.principalShare}</div>
                  <div className="font-mono text-theme-textMuted font-bold">
                    {financialResults.principalRatio.toFixed(1)}% ({fmt(principal)})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-md bg-palette-mocha dark:bg-palette-cream/70 shrink-0" />
                <div>
                  <div className="font-semibold text-theme-text">{t.calculator.interestShare}</div>
                  <div className="font-mono text-theme-textMuted font-bold">
                    {financialResults.interestRatio.toFixed(1)}% ({fmt(financialResults.totalInterest)})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Amortization Schedule Section */}
      <div className="p-4 sm:p-8 rounded-3xl bg-theme-card border border-theme-border shadow-soft space-y-5 sm:space-y-6 amortization-container">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 pb-4 border-b border-theme-border/60">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-theme-text flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-palette-slate shrink-0" />
              <span>{t.calculator.scheduleTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-theme-textMuted mt-0.5 sm:mt-1">
              {t.calculator.scheduleSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 no-print overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full md:w-auto">
            {/* View Switcher: Annual vs Monthly */}
            <div className="inline-flex rounded-xl border border-theme-border p-1 bg-theme-bg text-[11px] sm:text-xs shrink-0">
              <button
                type="button"
                onClick={() => setScheduleView('annual')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  scheduleView === 'annual'
                    ? 'bg-palette-slate text-[#1a252e] shadow-sm'
                    : 'text-theme-textMuted hover:text-theme-text'
                }`}
              >
                {t.calculator.viewAnnual}
              </button>
              <button
                type="button"
                onClick={() => setScheduleView('monthly')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  scheduleView === 'monthly'
                    ? 'bg-palette-slate text-[#1a252e] shadow-sm'
                    : 'text-theme-textMuted hover:text-theme-text'
                }`}
              >
                {t.calculator.viewMonthly}
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-theme-bg hover:bg-theme-bg/90 text-theme-text border border-theme-border transition-all shadow-sm shrink-0 whitespace-nowrap"
              title={t.calculator.exportCsv}
            >
              <Download className="w-3.5 h-3.5 text-palette-slate shrink-0" />
              <span>{t.calculator.exportCsv}</span>
            </button>

            {/* Print Schedule Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-theme-bg hover:bg-theme-bg/90 text-theme-text border border-theme-border transition-all shadow-sm shrink-0 whitespace-nowrap"
              title={t.calculator.printSchedule}
            >
              <Printer className="w-3.5 h-3.5 text-theme-textMuted shrink-0" />
              <span className="hidden sm:inline">{t.calculator.printSchedule}</span>
            </button>
          </div>
        </div>

        {/* Amortization Table */}
        <div className="overflow-x-auto rounded-2xl border border-theme-border/60 max-h-[460px] relative">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono">
            <thead className="sticky top-0 z-10 bg-theme-bg/95 backdrop-blur-md text-theme-text border-b border-theme-border">
              <tr>
                <th className="py-3 px-3.5 font-bold">{t.calculator.period}</th>
                <th className="py-3 px-3.5 font-bold text-right">{t.calculator.payment}</th>
                <th className="py-3 px-3.5 font-bold text-right text-emerald-700 dark:text-emerald-400">
                  {t.calculator.principalPaid}
                </th>
                <th className="py-3 px-3.5 font-bold text-right text-amber-700 dark:text-amber-400">
                  {t.calculator.interestPaid}
                </th>
                <th className="py-3 px-3.5 font-bold text-right text-theme-textMuted">
                  {t.calculator.totalInterestPaid}
                </th>
                <th className="py-3 px-3.5 font-bold text-right">{t.calculator.balance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/40 bg-theme-card/30">
              {scheduleView === 'annual'
                ? financialResults.annualSchedule.map((row) => (
                    <tr
                      key={row.year}
                      className="hover:bg-theme-bg/40 transition-colors font-medium"
                    >
                      <td className="py-2.5 px-3.5 font-bold text-theme-text">
                        Year {row.year}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-theme-text">
                        {fmt(row.payment)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-emerald-800 dark:text-emerald-400 font-semibold">
                        {fmt(row.principal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-amber-800 dark:text-amber-400 font-semibold">
                        {fmt(row.interest)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-theme-textMuted">
                        {fmt(row.totalInterest)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-theme-text">
                        {fmt(row.endingBalance)}
                      </td>
                    </tr>
                  ))
                : financialResults.monthlySchedule.map((row) => (
                    <tr
                      key={row.month}
                      className="hover:bg-theme-bg/40 transition-colors"
                    >
                      <td className="py-2 px-3.5 text-theme-text">
                        <span className="font-bold">M{row.month}</span>{' '}
                        <span className="text-[11px] text-theme-textMuted">({row.dateStr})</span>
                      </td>
                      <td className="py-2 px-3.5 text-right text-theme-text font-medium">
                        {fmt(row.payment)}
                      </td>
                      <td className="py-2 px-3.5 text-right text-emerald-800 dark:text-emerald-400">
                        {fmt(row.principal)}
                      </td>
                      <td className="py-2 px-3.5 text-right text-amber-800 dark:text-amber-400">
                        {fmt(row.interest)}
                      </td>
                      <td className="py-2 px-3.5 text-right text-theme-textMuted">
                        {fmt(row.totalInterest)}
                      </td>
                      <td className="py-2 px-3.5 text-right font-bold text-theme-text">
                        {fmt(row.endingBalance)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Disclaimer footnote */}
        <div className="flex items-start gap-2 text-[11px] text-theme-textMuted pt-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>{t.calculator.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
export default LoanCalculator;
