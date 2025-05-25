// --- Data Storage ---
let moneyData = JSON.parse(localStorage.getItem('moneyData')) || {};
let historyData = JSON.parse(localStorage.getItem('historyData')) || [];

// Ensure "Normal" head always exists
if (!moneyData['Normal']) moneyData['Normal'] = 0;

function saveData() {
    localStorage.setItem('moneyData', JSON.stringify(moneyData));
    localStorage.setItem('historyData', JSON.stringify(historyData));
}

// --- UI Update Functions ---
function updateBalances() {
    const balancesList = document.getElementById('balancesList');
    balancesList.innerHTML = '';
    let total = 0;

    // Always show all heads, even if zero
    let allHeads = Object.keys(moneyData);
    if (!allHeads.includes('Normal')) allHeads.unshift('Normal');

    allHeads.forEach(head => {
        let amount = moneyData[head] || 0;
        let li = document.createElement('li');
        li.textContent = `${head}: ₹${amount}`;
        li.setAttribute('data-head', head);

        // Long press for head actions
        let pressTimer = null;
        li.addEventListener('touchstart', function(e) {
            pressTimer = setTimeout(() => {
                openHeadActionModal(head);
            }, 600);
        });
        li.addEventListener('touchend', function(e) {
            clearTimeout(pressTimer);
        });
        li.addEventListener('mousedown', function(e) {
            pressTimer = setTimeout(() => {
                openHeadActionModal(head);
            }, 600);
        });
        li.addEventListener('mouseup', function(e) {
            clearTimeout(pressTimer);
        });
        li.addEventListener('mouseleave', function(e) {
            clearTimeout(pressTimer);
        });

        balancesList.appendChild(li);
        total += amount;
    });

    document.getElementById('totalBalance').textContent = `Total Balance: ₹${total}`;
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    let runningMoneyData = {};
    let runningTotal = 0;

    // Get all heads for initial zero
    let allHeads = Object.keys(moneyData);
    if (!allHeads.includes('Normal')) allHeads.unshift('Normal');
    allHeads.forEach(h => runningMoneyData[h] = 0);

    // Reconstruct balances for each history entry
    historyData.forEach((entry, idx) => {
        // Calculate previous balances
        let prevHeadBalance = runningMoneyData[entry.head] || 0;
        let prevTotal = runningTotal;

        // Update balances
        if (entry.type === 'add') {
            runningMoneyData[entry.head] = prevHeadBalance + entry.amount;
            runningTotal += entry.amount;
        } else {
            runningMoneyData[entry.head] = prevHeadBalance - entry.amount;
            runningTotal -= entry.amount;
        }

        // Prepare display
        let li = document.createElement('li');
        li.className = `history-type-${entry.type}`;

        // Format date
        let date = new Date(entry.timestamp);
        let dateStr = date.toLocaleDateString();
        let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let dateTimeStr = `${dateStr} ${timeStr}`;

        // Date/time display (now bold and dark)
        let dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = dateTimeStr;

        // Amount in bold, head in normal
        let details = document.createElement('span');
        details.className = 'history-details';
        details.innerHTML = `<b>₹${entry.amount}</b> (${entry.head})`;
        if (entry.note && entry.note.trim() !== "") {
            let noteSpan = document.createElement('span');
            noteSpan.className = 'history-note';
            noteSpan.textContent = entry.note;
            details.appendChild(noteSpan);
        }

        // Variation with colored right arrow and final value
        let variation = document.createElement('span');
        variation.className = 'history-variation';

        // Head variation
        let headArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let headFinalClass = '';
        if (prevHeadBalance < runningMoneyData[entry.head]) {
            headFinalClass = 'variation-final-up';
        } else if (prevHeadBalance > runningMoneyData[entry.head]) {
            headFinalClass = 'variation-final-down';
        } else {
            headFinalClass = 'variation-final';
        }

        // Total variation
        let totalArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let totalFinalClass = '';
        if (prevTotal < runningTotal) {
            totalFinalClass = 'variation-final-up';
        } else if (prevTotal > runningTotal) {
            totalFinalClass = 'variation-final-down';
        } else {
            totalFinalClass = 'variation-final';
        }

        variation.innerHTML =
            `Head: ${prevHeadBalance} ${headArrow} <span class="${headFinalClass}">${runningMoneyData[entry.head]}</span><br>` +
            `Total: ${prevTotal} ${totalArrow} <span class="${totalFinalClass}">${runningTotal}</span>`;

        // Add date/time at the top of the details
        let detailsWrapper = document.createElement('div');
        detailsWrapper.style.display = 'flex';
        detailsWrapper.style.flexDirection = 'column';
        detailsWrapper.appendChild(dateDiv);
        detailsWrapper.appendChild(details);

        li.appendChild(detailsWrapper);
        li.appendChild(variation);

        historyList.insertBefore(li, historyList.firstChild); // newest on top
    });
}

// --- Modal Logic ---
const modal = document.getElementById('popupModal');
const modalTitle = document.getElementById('modalTitle');
const popupForm = document.getElementById('popupForm');
const popupHead = document.getElementById('popupHead');
const popupAmount = document.getElementById('popupAmount');
const popupNote = document.getElementById('popupNote');
const popupSubmitBtn = document.getElementById('popupSubmitBtn');
const headsDatalist = document.getElementById('headsDatalist');
let currentAction = null; // 'add' or 'spend'

// Populate datalist for heads (for dropdown/autocomplete)
function updateHeadsDatalist() {
    headsDatalist.innerHTML = '';
    Object.keys(moneyData).forEach(head => {
        let opt = document.createElement('option');
        opt.value = head;
        headsDatalist.appendChild(opt);
    });
}

function openModal(action) {
    currentAction = action;
    modal.style.display = 'block';
    popupForm.reset();
    popupHead.value = '';
    popupAmount.value = '';
    popupNote.value = '';
    updateHeadsDatalist();
    if (action === 'add') {
        modalTitle.textContent = 'Add Money';
        popupSubmitBtn.textContent = 'Add';
        popupAmount.placeholder = 'Amount to Add';
    } else {
        modalTitle.textContent = 'Spend Money';
        popupSubmitBtn.textContent = 'Spend';
        popupAmount.placeholder = 'Amount to Spend';
    }
    popupHead.focus();
}

function closeModal() {
    modal.style.display = 'none';
}

document.getElementById('addBtn').onclick = () => openModal('add');
document.getElementById('spendBtn').onclick = () => openModal('spend');
document.getElementById('closeModal').onclick = closeModal;
window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == headActionModal) closeHeadActionModal();
    if (event.target == headDetailsModal) closeHeadDetailsModal();
    if (event.target == profileModal) profileModal.style.display = 'none';
    if (event.target == analysisModal) analysisModal.style.display = 'none';
    if (event.target == exportModal) exportModal.style.display = 'none';
}

// --- Add/Spend Logic ---
popupForm.onsubmit = function(e) {
    e.preventDefault();
    let head = popupHead.value.trim() || 'Normal';
    let amount = parseFloat(popupAmount.value);
    let note = popupNote.value.trim();

    if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount.');
        return;
    }

    if (!moneyData[head]) moneyData[head] = 0;

    if (currentAction === 'add') {
        moneyData[head] += amount;
        historyData.push({
            type: 'add',
            head: head,
            amount: amount,
            note: note,
            timestamp: Date.now()
        });
    } else if (currentAction === 'spend') {
        if (moneyData[head] < amount) {
            alert('Not enough money in this head!');
            return;
        }
        moneyData[head] -= amount;
        historyData.push({
            type: 'spend',
            head: head,
            amount: amount,
            note: note,
            timestamp: Date.now()
        });
    }

    saveData();
    updateBalances();
    updateHistory();
    closeModal();
};

// --- Head Action Modal (Transfer/Delete/Details) ---
const headActionModal = document.getElementById('headActionModal');
const headActionTitle = document.getElementById('headActionTitle');
const closeHeadActionModalBtn = document.getElementById('closeHeadActionModal');
const transferBtn = document.getElementById('transferBtn');
const deleteHeadBtn = document.getElementById('deleteHeadBtn');
const detailsHeadBtn = document.getElementById('detailsHeadBtn');
const transferForm = document.getElementById('transferForm');
const transferToHead = document.getElementById('transferToHead');
const transferAmount = document.getElementById('transferAmount');

let selectedHead = null;

function openHeadActionModal(head) {
    selectedHead = head;
    headActionModal.style.display = 'block';
    headActionTitle.textContent = `Actions for "${head}"`;

    // Setup transfer options
    transferForm.style.display = 'none';
    document.getElementById('headActionOptions').style.display = 'flex';

    // Populate transferToHead options
    transferToHead.innerHTML = '';
    Object.keys(moneyData).forEach(h => {
        if (h !== head) {
            let opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            transferToHead.appendChild(opt);
        }
    });

    // Delete is always enabled except for "Normal"
    deleteHeadBtn.disabled = (head === 'Normal');
}

function closeHeadActionModal() {
    headActionModal.style.display = 'none';
    transferForm.style.display = 'none';
    document.getElementById('headActionOptions').style.display = 'flex';
    transferAmount.value = '';
}

// Transfer button
transferBtn.onclick = function() {
    transferForm.style.display = 'flex';
    document.getElementById('headActionOptions').style.display = 'none';
    transferAmount.value = '';
};

// Transfer form submit
transferForm.onsubmit = function(e) {
    e.preventDefault();
    let fromHead = selectedHead;
    let toHead = transferToHead.value;
    let amount = parseFloat(transferAmount.value);

    if (fromHead === toHead) {
        alert("Cannot transfer to the same head.");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }
    if ((moneyData[fromHead] || 0) < amount) {
        alert("Not enough balance in this head.");
        return;
    }

    // Transfer
    moneyData[fromHead] -= amount;
    if (!moneyData[toHead]) moneyData[toHead] = 0;
    moneyData[toHead] += amount;

    // Add to history
    historyData.push({
        type: 'spend',
        head: fromHead,
        amount: amount,
        note: `Transferred to "${toHead}"`,
        timestamp: Date.now()
    });
    historyData.push({
        type: 'add',
        head: toHead,
        amount: amount,
        note: `Received from "${fromHead}"`,
        timestamp: Date.now()
    });

    saveData();
    updateBalances();
    updateHistory();
    closeHeadActionModal();
};

// Delete head button (now allows deleting with balance, moves to Normal)
deleteHeadBtn.onclick = function() {
    if (selectedHead === 'Normal') {
        alert('Cannot delete the "Normal" head.');
        return;
    }
    let balance = moneyData[selectedHead] || 0;
    if (!confirm(`Are you sure you want to delete the head "${selectedHead}"?${balance !== 0 ? `\n\nThe balance ₹${balance} will be moved to "Normal".` : ''}`)) {
        return;
    }
    // Move balance to Normal if any
    if (balance !== 0) {
        moneyData['Normal'] += balance;
        historyData.push({
            type: 'add',
            head: 'Normal',
            amount: balance,
            note: `Balance moved from deleted head "${selectedHead}"`,
            timestamp: Date.now()
        });
        historyData.push({
            type: 'spend',
            head: selectedHead,
            amount: balance,
            note: `Balance moved to "Normal" before deletion`,
            timestamp: Date.now()
        });
    }
    delete moneyData[selectedHead];
    saveData();
    updateBalances();
    updateHistory();
    closeHeadActionModal();
};

// Show details button
detailsHeadBtn.onclick = function() {
    openHeadDetailsModal(selectedHead);
    closeHeadActionModal();
};

// --- Head Details Modal ---
const headDetailsModal = document.getElementById('headDetailsModal');
const closeHeadDetailsModalBtn = document.getElementById('closeHeadDetailsModal');
const headDetailsTitle = document.getElementById('headDetailsTitle');
const headDetailsList = document.getElementById('headDetailsList');
const headDetailsBalance = document.getElementById('headDetailsBalance');

function openHeadDetailsModal(head) {
    headDetailsModal.style.display = 'block';
    headDetailsTitle.textContent = `Transactions for "${head}"`;
    headDetailsList.innerHTML = '';

    // Filter history for this head
    let filtered = historyData.filter(entry => entry.head === head);
    if (filtered.length === 0) {
        headDetailsBalance.innerHTML = '';
        let emptyLi = document.createElement('li');
        emptyLi.className = 'head-details-empty';
        emptyLi.textContent = 'No transactions for this head.';
        headDetailsList.appendChild(emptyLi);
        return;
    }

    // Calculate running balances for this head and total
    let runningMoneyData = {};
    let runningTotal = 0;
    let allHeads = Object.keys(moneyData);
    if (!allHeads.includes('Normal')) allHeads.unshift('Normal');
    allHeads.forEach(h => runningMoneyData[h] = 0);

    // Build a list of all history entries, so we can reconstruct balances at each step
    let allHistory = historyData.slice();
    let headEntries = [];
    allHistory.forEach((entry, idx) => {
        let prevHeadBalance = runningMoneyData[entry.head] || 0;
        let prevTotal = runningTotal;

        // Update balances
        if (entry.type === 'add') {
            runningMoneyData[entry.head] = prevHeadBalance + entry.amount;
            runningTotal += entry.amount;
        } else {
            runningMoneyData[entry.head] = prevHeadBalance - entry.amount;
            runningTotal -= entry.amount;
        }

        // If this entry is for the selected head, store the info
        if (entry.head === head) {
            headEntries.push({
                entry,
                prevHeadBalance,
                prevTotal,
                newHeadBalance: runningMoneyData[entry.head],
                newTotal: runningTotal
            });
        }
    });

    // Show current balance at the top
    let finalBalance = runningMoneyData[head] || 0;
    headDetailsBalance.innerHTML = `Current Balance: ₹${finalBalance}`;

    // Show newest first
    headEntries.slice().reverse().forEach(obj => {
        let entry = obj.entry;
        let date = new Date(entry.timestamp);
        let dateStr = date.toLocaleDateString();
        let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let dateTimeStr = `${dateStr} ${timeStr}`;

        let li = document.createElement('li');
        li.className = `history-type-${entry.type}`;

        // Date/time
        let dateDiv = document.createElement('div');
        dateDiv.className = 'history-date';
        dateDiv.textContent = dateTimeStr;

        // Amount in bold, head in normal
        let details = document.createElement('span');
        details.className = 'history-details';
        details.innerHTML = `<b>₹${entry.amount}</b> (${entry.head})`;
        if (entry.note && entry.note.trim() !== "") {
            let noteSpan = document.createElement('span');
            noteSpan.className = 'history-note';
            noteSpan.textContent = entry.note;
            details.appendChild(noteSpan);
        }

        // Variation with colored right arrow and final value
        let variation = document.createElement('span');
        variation.className = 'history-variation';

        // Head variation
        let headArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let headFinalClass = '';
        if (obj.prevHeadBalance < obj.newHeadBalance) {
            headFinalClass = 'variation-final-up';
        } else if (obj.prevHeadBalance > obj.newHeadBalance) {
            headFinalClass = 'variation-final-down';
        } else {
            headFinalClass = 'variation-final';
        }

        // Total variation
        let totalArrow = '<span class="variation-arrow variation-arrow-right ' + li.className + '">→</span>';
        let totalFinalClass = '';
        if (obj.prevTotal < obj.newTotal) {
            totalFinalClass = 'variation-final-up';
        } else if (obj.prevTotal > obj.newTotal) {
            totalFinalClass = 'variation-final-down';
        } else {
            totalFinalClass = 'variation-final';
        }

        variation.innerHTML =
            `Head: ${obj.prevHeadBalance} ${headArrow} <span class="${headFinalClass}">${obj.newHeadBalance}</span><br>` +
            `Total: ${obj.prevTotal} ${totalArrow} <span class="${totalFinalClass}">${obj.newTotal}</span>`;

        // Add date/time at the top of the details
        let detailsWrapper = document.createElement('div');
        detailsWrapper.style.display = 'flex';
        detailsWrapper.style.flexDirection = 'column';
        detailsWrapper.appendChild(dateDiv);
        detailsWrapper.appendChild(details);

        li.appendChild(detailsWrapper);
        li.appendChild(variation);

        headDetailsList.appendChild(li);
    });
}

function closeHeadDetailsModal() {
    headDetailsModal.style.display = 'none';
}

closeHeadActionModalBtn.onclick = closeHeadActionModal;
closeHeadDetailsModalBtn.onclick = closeHeadDetailsModal;

// --- Profile/Options Modal ---
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
profileBtn.onclick = () => profileModal.style.display = 'block';
closeProfileModal.onclick = () => profileModal.style.display = 'none';

// --- Dark Mode Toggle ---
const darkModeBtn = document.getElementById('toggleDarkModeBtn');
darkModeBtn.onclick = function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// --- Analysis Modal ---
const analysisModal = document.getElementById('analysisModal');
const closeAnalysisModal = document.getElementById('closeAnalysisModal');
const openAnalysisBtn = document.getElementById('openAnalysisBtn');
openAnalysisBtn.onclick = () => {
    analysisModal.style.display = 'block';
};
closeAnalysisModal.onclick = () => analysisModal.style.display = 'none';

// Analysis controls
const analysisType = document.getElementById('analysisType');
const analysisMonth = document.getElementById('analysisMonth');
const analysisYear = document.getElementById('analysisYear');
const analysisDay = document.getElement
