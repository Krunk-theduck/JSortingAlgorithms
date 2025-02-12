// ========================================================
// Global Variables and Flags
// ========================================================
// Configuration for bar colors and timing
const config = {
    barColors: {
      default: 'linear-gradient(to top, #3498db, #8e44ad)',
      comparison: '#e74c3c', // Red for comparisons
      swap: '#f1c40f',       // Yellow for swaps
      verification: '#2ecc71' // Green for final verification scan
    },
    delay: 50 // Delay in milliseconds for each step
};

let delay = 100;
let data = [];
let comparisons = 0;
let swaps = 0;
let writes = 0;
let steps = 0; // Current step
let totalSteps = 0; // Total steps (estimated)
let isRunning = false;
let isPaused = false;
let isVerifying = false;

// Global arrays to hold indices that should be highlighted.
let currentSwapIndices = [];
let currentCompareIndices = [];
let verifiedBars = [];

// ========================================================
// Audio Setup: Play a short tone based on a bar's value.
// ========================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(frequency, duration = 50) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
}
function playSoundForValue(value) {
    const minFreq = 200, maxFreq = 800;
    const frequency = (value / data.length) * (maxFreq - minFreq) + minFreq;
    playTone(frequency);
}

// ========================================================
// DOM Element References
// ========================================================
const visualizationArea = document.getElementById('visualization-area');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const speedSlider = document.getElementById('speed-slider');
const elementSlider = document.getElementById('element-slider');
const algorithmSelect = document.getElementById('algorithm-select');
const algorithmName = document.getElementById('algorithm-name');
const elementCount = document.getElementById('element-count');
const delayTime = document.getElementById('delay-time');
const comparisonCount = document.getElementById('comparison-count');
const swapCount = document.getElementById('swap-count');
const writeCount = document.getElementById('write-count');

// ========================================================
// Utility Functions: Data Generation, Rendering, Stats
// ========================================================
function generateData(numElements) {
    data = Array.from({ length: numElements }, (_, i) => i + 1);
    shuffleArray(data);
    comparisons = 0;
    swaps = 0;
    writes = 0;
    steps = 0;
    totalSteps = Math.ceil(estimateTotalSteps(algorithmSelect.value, numElements)); // Estimate total steps
    updateStats();
    renderBars();
}


// Update the estimateTotalSteps function
function estimateTotalSteps(algorithm, numElements) {
    switch (algorithm) {
        case 'bubble':
            return numElements * (numElements - 1);
        case 'insertion':
            return numElements * (numElements - 1) / 2;
        case 'selection':
            return numElements * (numElements - 1) / 2;
        case 'quick':
            return numElements * Math.log2(numElements);
        case 'merge':
            return numElements * Math.log2(numElements);
        case 'heap':
            return numElements * Math.log2(numElements);
        case 'shell':
            return numElements * Math.log2(numElements);
        case 'cocktail':
            return numElements * (numElements - 1);
        default:
            return 0;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateStats() {
    elementCount.textContent = data.length;
    delayTime.textContent = `${delay}ms`;
    comparisonCount.textContent = comparisons;
    swapCount.textContent = swaps;
    writeCount.textContent = writes;
    document.getElementById('step-count').textContent = steps;
    document.getElementById('total-step-count').textContent = totalSteps;
}

// ========================================================
// renderBars() now uses the global highlight arrays to
// determine each bar's color.
// ========================================================
function renderBars() {
    visualizationArea.innerHTML = '';
    const maxHeight = 100;
    data.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${(value / data.length) * maxHeight}%`;
        bar.style.width = `${100 / data.length}%`;

        // Apply colors from config
        let barColor = config.barColors.default;
        if (currentSwapIndices.includes(index)) {
            barColor = config.barColors.swap;
        } else if (currentCompareIndices.includes(index)) {
            barColor = config.barColors.comparison;
        } else if (verifiedBars.includes(index)) {
            barColor = config.barColors.verification;
        }

        if (typeof barColor === 'string') { // Solid color
            bar.style.background = barColor;
        } else if (typeof barColor === 'function') { // Gradient function
            bar.style.background = barColor(value, data.length); // Pass value/length to function
        } else {
            bar.style.background = `linear-gradient(to top, hsl(${(value / data.length) * 240}, 100%, 50%), hsl(${(value / data.length) * 240 + 20}, 100%, 70%))`; // Default gradient
        }

        visualizationArea.appendChild(bar);
    });
}

// ========================================================
// Helper functions to set/clear highlights.
// ========================================================
function setCompare(indices) {
    // Only set compare for indices not already marked as swapped.
    currentCompareIndices = indices.filter(i => !currentSwapIndices.includes(i));
    renderBars();
}
function clearCompare() {
    currentCompareIndices = [];
    renderBars();
}

function clearSwap() {
    currentSwapIndices = [];
    renderBars();
}

function clearVerified() {
    verifiedBars = [];
    renderBars();
}

function setSwap(indices) {
    // When a swap occurs, these indices stay red until the next swap.
    currentSwapIndices = indices;
    renderBars();
}

function updateBarColors(bars, indices, color) {
    indices.forEach(index => {
      bars[index].style.background = color;
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================================
// Sorting Algorithms as Generators (with updated highlighting)
// ========================================================

// Bubble Sort Generator
function* bubbleSortGenerator() {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data.length - i - 1; j++) {
            // Highlight the two bars being compared (blue).
            setCompare([j, j + 1]);
            comparisons++;
            updateStats();
            playSoundForValue(data[j]);
            playSoundForValue(data[j + 1]);
            yield;

            if (data[j] > data[j + 1]) {
                // On a swap, mark the two bars in red.
                setSwap([j, j + 1]);
                playSoundForValue(data[j]);
                playSoundForValue(data[j + 1]);
                [data[j], data[j + 1]] = [data[j + 1], data[j]];
                swaps++;
                writes++;
                updateStats();
                renderBars();
                yield;
            }
            // Clear the blue highlight (if no new comparison is set).
            clearCompare();
        }
    }
}

// Insertion Sort Generator
function* insertionSortGenerator() {
    for (let i = 1; i < data.length; i++) {
        let key = data[i];
        let j = i - 1;
        while (j >= 0 && data[j] > key) {
            comparisons++;
            updateStats();
            setCompare([j, j + 1]);
            playSoundForValue(data[j]);
            yield;
            data[j + 1] = data[j];
            swaps++;
            writes++;
            updateStats();
            setSwap([j, j + 1]);
            renderBars();
            yield;
            j--;
            clearCompare();
        }
        data[j + 1] = key;
        playSoundForValue(key);
        renderBars();
        yield;
    }
}

// Selection Sort Generator
function* selectionSortGenerator() {
    for (let i = 0; i < data.length - 1; i++) {
        let minIndex = i;
        for (let j = i + 1; j < data.length; j++) {
            comparisons++;
            updateStats();
            setCompare([j]); // highlight the current candidate
            playSoundForValue(data[j]);
            yield;
            if (data[j] < data[minIndex]) {
                minIndex = j;
            }
            clearCompare();
        }
        if (minIndex !== i) {
            setSwap([i, minIndex]);
            playSoundForValue(data[i]);
            playSoundForValue(data[minIndex]);
            [data[i], data[minIndex]] = [data[minIndex], data[i]];
            swaps++;
            writes++;
            updateStats();
            renderBars();
            yield;
        }
    }
}

// Quick Sort Generator (iterative with partition generator)
function* quickSortGenerator() {
    let stack = [];
    stack.push(0);
    stack.push(data.length - 1);
    while (stack.length > 0) {
        let high = stack.pop();
        let low = stack.pop();
        if (low < high) {
            let pGen = partitionGenerator(low, high);
            let partitionResult;
            while (true) {
                const { value, done } = pGen.next();
                if (done) {
                    partitionResult = value;
                    break;
                }
                yield;
            }
            let p = partitionResult;
            stack.push(low);
            stack.push(p - 1);
            stack.push(p + 1);
            stack.push(high);
        }
        yield;
    }
}

function* partitionGenerator(low, high) {
    let pivot = data[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        comparisons++;
        updateStats();
        setCompare([j]);
        playSoundForValue(data[j]);
        yield;
        if (data[j] < pivot) {
            i++;
            setSwap([i, j]);
            playSoundForValue(data[i]);
            playSoundForValue(data[j]);
            [data[i], data[j]] = [data[j], data[i]];
            swaps++;
            writes++;
            updateStats();
            renderBars();
            yield;
        }
        clearCompare();
    }
    // Swap the pivot into place.
    setSwap([i + 1, high]);
    playSoundForValue(data[i + 1]);
    playSoundForValue(data[high]);
    [data[i + 1], data[high]] = [data[high], data[i + 1]];
    swaps++;
    writes++;
    updateStats();
    renderBars();
    yield;
    return i + 1;
}

// Merge Sort Generator
function* mergeSortGenerator() {
    yield* mergeSortHelperGenerator(0, data.length - 1);
}

function* mergeSortHelperGenerator(start, end) {
    if (start < end) {
        const mid = Math.floor((start + end) / 2);
        yield* mergeSortHelperGenerator(start, mid);
        yield* mergeSortHelperGenerator(mid + 1, end);
        yield* mergeGenerator(start, mid, end);
    }
}

function* mergeGenerator(start, mid, end) {
    const leftArray = data.slice(start, mid + 1);
    const rightArray = data.slice(mid + 1, end + 1);
    let i = 0, j = 0, k = start;

    while (i < leftArray.length && j < rightArray.length) {
        setCompare([start + i, mid + 1 + j]);
        comparisons++;
        updateStats();
        playSoundForValue(leftArray[i]);
        playSoundForValue(rightArray[j]);
        yield;

        if (leftArray[i] <= rightArray[j]) {
            data[k] = leftArray[i];
            i++;
        } else {
            data[k] = rightArray[j];
            j++;
        }
        setSwap([k]);
        writes++;
        updateStats();
        renderBars();
        k++;
        yield;
    }

    while (i < leftArray.length) {
        data[k] = leftArray[i];
        setSwap([k]);
        writes++;
        updateStats();
        renderBars();
        playSoundForValue(leftArray[i]);
        i++;
        k++;
        yield;
    }

    while (j < rightArray.length) {
        data[k] = rightArray[j];
        setSwap([k]);
        writes++;
        updateStats();
        renderBars();
        playSoundForValue(rightArray[j]);
        j++;
        k++;
        yield;
    }
}

// Heap Sort Generator
function* heapSortGenerator() {
    // Build max heap
    for (let i = Math.floor(data.length / 2) - 1; i >= 0; i--) {
        yield* heapifyGenerator(data.length, i);
    }

    // Extract elements from heap one by one
    for (let i = data.length - 1; i > 0; i--) {
        setSwap([0, i]);
        playSoundForValue(data[0]);
        playSoundForValue(data[i]);
        [data[0], data[i]] = [data[i], data[0]];
        swaps++;
        writes++;
        updateStats();
        renderBars();
        yield;

        yield* heapifyGenerator(i, 0);
    }
}

function* heapifyGenerator(n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    setCompare([largest, left]);
    comparisons++;
    updateStats();
    if (left < n) {
        playSoundForValue(data[left]);
        yield;
        if (data[left] > data[largest]) {
            largest = left;
        }
    }

    setCompare([largest, right]);
    comparisons++;
    updateStats();
    if (right < n) {
        playSoundForValue(data[right]);
        yield;
        if (data[right] > data[largest]) {
            largest = right;
        }
    }

    if (largest !== i) {
        setSwap([i, largest]);
        playSoundForValue(data[i]);
        playSoundForValue(data[largest]);
        [data[i], data[largest]] = [data[largest], data[i]];
        swaps++;
        writes++;
        updateStats();
        renderBars();
        yield;

        yield* heapifyGenerator(n, largest);
    }
}

// Shell Sort Generator
function* shellSortGenerator() {
    let gap = Math.floor(data.length / 2);
    
    while (gap > 0) {
        for (let i = gap; i < data.length; i++) {
            let temp = data[i];
            let j = i;
            
            while (j >= gap) {
                setCompare([j - gap, j]);
                comparisons++;
                updateStats();
                playSoundForValue(data[j - gap]);
                playSoundForValue(data[j]);
                yield;
                
                if (data[j - gap] > temp) {
                    setSwap([j - gap, j]);
                    data[j] = data[j - gap];
                    swaps++;
                    writes++;
                    updateStats();
                    renderBars();
                    yield;
                    j -= gap;
                } else {
                    break;
                }
            }
            
            if (j !== i) {
                data[j] = temp;
                writes++;
                updateStats();
                renderBars();
                yield;
            }
        }
        gap = Math.floor(gap / 2);
    }
}

// Cocktail Sort Generator
function* cocktailSortGenerator() {
    let start = 0;
    let end = data.length - 1;
    let swapped = true;

    while (swapped) {
        swapped = false;

        // Forward pass
        for (let i = start; i < end; i++) {
            setCompare([i, i + 1]);
            comparisons++;
            updateStats();
            playSoundForValue(data[i]);
            playSoundForValue(data[i + 1]);
            yield;

            if (data[i] > data[i + 1]) {
                setSwap([i, i + 1]);
                [data[i], data[i + 1]] = [data[i + 1], data[i]];
                swaps++;
                writes++;
                updateStats();
                renderBars();
                swapped = true;
                yield;
            }
        }

        if (!swapped) break;
        swapped = false;
        end--;

        // Backward pass
        for (let i = end - 1; i >= start; i--) {
            setCompare([i, i + 1]);
            comparisons++;
            updateStats();
            playSoundForValue(data[i]);
            playSoundForValue(data[i + 1]);
            yield;

            if (data[i] > data[i + 1]) {
                setSwap([i, i + 1]);
                [data[i], data[i + 1]] = [data[i + 1], data[i]];
                swaps++;
                writes++;
                updateStats();
                renderBars();
                swapped = true;
                yield;
            }
        }
        start++;
    }
}

// ========================================================
// Scheduler: Run the chosen generator step-by-step.
// ========================================================
async function runGenerator(generator) {
    if (isVerifying) return;

    isRunning = true;
    algorithmGenerator = generator; // Store the generator
    while (isRunning) {
        while (isPaused) {
            await sleep(50);
        }
        const { done } = generator.next();
        if (done) break;
        steps++; // Increment step count
        if (steps > totalSteps) totalSteps = steps;
        updateStats();
        await sleep(delay);
    }
    await verificationScan(); // Start the verification scan
    isRunning = false;
}

async function verificationScan() {
    if (isVerifying) return;
    isVerifying = true;

    clearCompare();
    clearSwap();

    const bars = document.querySelectorAll('.bar');

    // Verification scan
    for (let i = 0; i < bars.length; i++) {
        verifiedBars.push(i);
        playSoundForValue(data[i]);

        renderBars();
        await sleep(10); // Adjust scan speed
    }

    clearVerified();

    updateStats();

    await sleep(10);
    ding();
    isVerifying = false;
}

// ========================================================
// Start, Pause/Resume, and Reset Handlers
// ========================================================
function startSort() {
    if (isRunning) return;
    const algo = algorithmSelect.value;
    switch (algo) {
        case 'bubble':
            algorithmName.textContent = 'Bubble Sort';
            generator = bubbleSortGenerator();
            break;
        case 'insertion':
            algorithmName.textContent = 'Insertion Sort';
            generator = insertionSortGenerator();
            break;
        case 'selection':
            algorithmName.textContent = 'Selection Sort';
            generator = selectionSortGenerator();
            break;
        case 'quick':
            algorithmName.textContent = 'Quick Sort';
            generator = quickSortGenerator();
            break;
        case 'merge':
            algorithmName.textContent = 'Merge Sort';
            generator = mergeSortGenerator();
            break;
        case 'heap':
            algorithmName.textContent = 'Heap Sort';
            generator = heapSortGenerator();
            break;
        case 'shell':
            algorithmName.textContent = 'Shell Sort';
            generator = shellSortGenerator();
            break;
        case 'cocktail':
            algorithmName.textContent = 'Cocktail Sort';
            generator = cocktailSortGenerator();
            break;
        default:
            algorithmName.textContent = 'Bubble Sort';
            generator = bubbleSortGenerator();
    }
    runGenerator(generator);
}

// ========================================================
// Event Listeners (updated)
// ========================================================

algorithmSelect.addEventListener('change', () => {
    totalSteps = Math.ceil(estimateTotalSteps(algorithmSelect.value, data.length));
    updateStats();
});

startButton.addEventListener('click', startSort);
resetButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        verificationScan();
    }


    generateData(parseInt(elementSlider.value));
});
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});
speedSlider.addEventListener('input', (e) => {
    delay = parseInt(e.target.value);
    updateStats();
});
elementSlider.addEventListener('input', (e) => {
    generateData(parseInt(e.target.value));
});

// ========================================================
// Color Input Handlers
// ========================================================

const defaultBarColorInput = document.getElementById('default-bar-color');
const secondColorInput = document.getElementById('second-bar-color');
const comparisonColorInput = document.getElementById('comparison-color');
const swapColorInput = document.getElementById('swap-color');
const scanColorInput = document.getElementById('scan-color');
const barStyleSelect = document.getElementById('bar-style');
const secondColorContainer = document.getElementById('second-color-container');

defaultBarColorInput.addEventListener('input', () => {
    if (barStyleSelect.value === 'gradient') {
        config.barColors.default = `linear-gradient(to top, ${defaultBarColorInput.value}, ${secondColorInput.value})`;
    } else {
        config.barColors.default = defaultBarColorInput.value;
    }

    renderBars();
});

secondColorContainer.addEventListener('input', () => {
    if (barStyleSelect.value === 'gradient') {
        config.barColors.default = `linear-gradient(to top, ${defaultBarColorInput.value}, ${secondColorInput.value})`;
        renderBars();
    }
});

comparisonColorInput.addEventListener('input', () => {
    config.barColors.comparison = comparisonColorInput.value;
    renderBars();
});

swapColorInput.addEventListener('input', () => {
    config.barColors.swap = swapColorInput.value;
    renderBars();
});

scanColorInput.addEventListener('input', () => {
    config.scanColor = scanColorInput.value;
});

barStyleSelect.addEventListener('change', function() {
    if (barStyleSelect.value === 'gradient') {
        secondColorContainer.classList.remove('hidden');
    } else {
        secondColorContainer.classList.add('hidden');
    }
});

// Initial data generation.
generateData(50);
