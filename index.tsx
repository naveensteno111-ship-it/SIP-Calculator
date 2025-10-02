import { GoogleGenAI } from "@google/genai";

// This app does not use the Gemini API, but the import is kept to adhere to project structure.
// If you wish to integrate Gemini features later, you can use this initialized 'ai' instance.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// Define the type for a comparison item
interface ComparisonScenario {
    id: number;
    monthlyInvestment: number;
    returnRate: number;
    timePeriod: number;
    totalValue: number;
}

// DOM Elements
const monthlyInvestmentInput = document.getElementById('monthly-investment-input') as HTMLInputElement;
const monthlyInvestmentSlider = document.getElementById('monthly-investment-slider') as HTMLInputElement;
const returnRateInput = document.getElementById('return-rate-input') as HTMLInputElement;
const returnRateSlider = document.getElementById('return-rate-slider') as HTMLInputElement;
const timePeriodInput = document.getElementById('time-period-input') as HTMLInputElement;
const timePeriodSlider = document.getElementById('time-period-slider') as HTMLInputElement;

const donutChart = document.getElementById('donut-chart') as HTMLDivElement;
const totalValueEl = document.getElementById('total-value') as HTMLSpanElement;
const investedAmountEl = document.getElementById('invested-amount') as HTMLSpanElement;
const estimatedReturnsEl = document.getElementById('estimated-returns') as HTMLSpanElement;

// Comparison Elements
const addToCompareBtn = document.getElementById('add-to-compare-btn') as HTMLButtonElement;
const comparisonSection = document.getElementById('comparison-section') as HTMLElement;
const comparisonListEl = document.getElementById('comparison-list') as HTMLDivElement;

let comparisonScenarios: ComparisonScenario[] = [];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function calculateSIP(): { M: number; totalInvested: number; estimatedReturns: number } {
    const P = parseFloat(monthlyInvestmentInput.value); // Monthly investment
    const r = parseFloat(returnRateInput.value) / 100; // Annual interest rate
    const t = parseFloat(timePeriodInput.value); // Time period in years

    if (isNaN(P) || isNaN(r) || isNaN(t)) return { M: 0, totalInvested: 0, estimatedReturns: 0 };

    const n = t * 12; // Number of months
    const i = r / 12; // Monthly interest rate

    // Calculate future value (M)
    const M = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const totalInvested = P * n;
    const estimatedReturns = M - totalInvested;

    updateUI(M, totalInvested, estimatedReturns);
    return { M, totalInvested, estimatedReturns };
}

function updateUI(totalValue: number, investedAmount: number, returns: number) {
    totalValueEl.textContent = currencyFormatter.format(totalValue);
    investedAmountEl.textContent = currencyFormatter.format(investedAmount);
    estimatedReturnsEl.textContent = currencyFormatter.format(returns);

    const investedPercentage = (investedAmount / totalValue) * 100;
    
    if (isFinite(investedPercentage) && totalValue > 0) {
        const investedColor = 'var(--invested-color)';
        const returnsColor = 'var(--returns-color)';
        donutChart.style.background = `conic-gradient(
            ${investedColor} 0% ${investedPercentage}%, 
            ${returnsColor} ${investedPercentage}% 100%
        )`;
    } else {
        donutChart.style.background = 'var(--slider-track-color)';
    }
}

function syncInputs(input: HTMLInputElement, slider: HTMLInputElement) {
    slider.value = input.value;
    calculateSIP();
}

function syncSliders(slider: HTMLInputElement, input: HTMLInputElement) {
    input.value = slider.value;
    calculateSIP();
}

function renderComparisonList() {
    if (comparisonScenarios.length === 0) {
        comparisonSection.classList.remove('active');
        return;
    }
    comparisonSection.classList.add('active');
    comparisonListEl.innerHTML = '';

    comparisonScenarios.forEach(scenario => {
        const card = document.createElement('div');
        card.className = 'comparison-card';
        card.innerHTML = `
            <button class="remove-btn" data-id="${scenario.id}" aria-label="Remove Scenario">&times;</button>
            <div class="total-value">${currencyFormatter.format(scenario.totalValue)}</div>
            <div class="detail">
                <span class="detail-label">Monthly Sip</span>
                <span class="detail-value">${currencyFormatter.format(scenario.monthlyInvestment)}</span>
            </div>
            <div class="detail">
                <span class="detail-label">Return Rate</span>
                <span class="detail-value">${scenario.returnRate}%</span>
            </div>
            <div class="detail">
                <span class="detail-label">Time Period</span>
                <span class="detail-value">${scenario.timePeriod} yrs</span>
            </div>
        `;
        comparisonListEl.appendChild(card);
    });

    // Add event listeners to new remove buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const idToRemove = parseInt((e.target as HTMLElement).dataset.id!);
            comparisonScenarios = comparisonScenarios.filter(s => s.id !== idToRemove);
            renderComparisonList();
        });
    });
}

function handleAddToCompare() {
    const { M } = calculateSIP();
    const newScenario: ComparisonScenario = {
        id: Date.now(),
        monthlyInvestment: parseFloat(monthlyInvestmentInput.value),
        returnRate: parseFloat(returnRateInput.value),
        timePeriod: parseFloat(timePeriodInput.value),
        totalValue: M,
    };
    comparisonScenarios.push(newScenario);
    renderComparisonList();
}

// Event Listeners
monthlyInvestmentInput.addEventListener('input', () => syncInputs(monthlyInvestmentInput, monthlyInvestmentSlider));
monthlyInvestmentSlider.addEventListener('input', () => syncSliders(monthlyInvestmentSlider, monthlyInvestmentInput));

returnRateInput.addEventListener('input', () => syncInputs(returnRateInput, returnRateSlider));
returnRateSlider.addEventListener('input', () => syncSliders(returnRateSlider, returnRateInput));

timePeriodInput.addEventListener('input', () => syncInputs(timePeriodInput, timePeriodSlider));
timePeriodSlider.addEventListener('input', () => syncSliders(timePeriodSlider, timePeriodInput));

addToCompareBtn.addEventListener('click', handleAddToCompare);

// Initial Calculation on Load
window.addEventListener('load', () => calculateSIP());