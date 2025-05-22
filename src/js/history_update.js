function saveTransaction(date, content, amount) {
    let yearMonth = date.slice(0, 7).replace("-", "/");
    let transactions = JSON.parse(localStorage.getItem(yearMonth)) || [];

    const newTransaction = {
        date: date,
        content: content,
        amount: amount
    };

    transactions.push(newTransaction);
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    transactions[0].balance = getPreviousBalance(yearMonth) + transactions[0].amount;

    for (let i = 1; i < transactions.length; i++) {
        transactions[i].balance = transactions[i - 1].balance + transactions[i].amount;
    }

    localStorage.setItem(yearMonth, JSON.stringify(transactions));
    updateFutureBalances(yearMonth);
}

function saveTransactionFromInputs() {
    const dateString = document.getElementById("datepicker").value;
    const content = document.getElementById("contentpicker").value;
    const amount = Number(document.getElementById("amountpicker").value);
    const type = document.getElementById("dropdown").value;

    if (dateString && content && !isNaN(amount)) {
        saveTransaction(dateString, content, type === "option1" ? -Math.abs(amount) : Math.abs(amount));
    }

    const dateParts = dateString.split("-");
    const date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));

    loadTransactionsByMonth(date.getFullYear(), date.getMonth() + 1);

    content.value = "";
    amount.value = 0;

}

function deleteTransaction(yearMonth, index) {
    let transactions = JSON.parse(localStorage.getItem(yearMonth)) || [];

    transactions.splice(index, 1);

    if (transactions.length > 0) {
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        transactions[0].balance = getPreviousBalance(yearMonth) + transactions[0].amount;

        for (let i = 1; i < transactions.length; i++) {
            transactions[i].balance = transactions[i - 1].balance + transactions[i].amount;
        }
    }

    localStorage.setItem(yearMonth, JSON.stringify(transactions));

    updateFutureBalances(yearMonth);

    const [year, month] = yearMonth.split('/').map(Number);
    loadTransactionsByMonth(year, month);
}

function deleteFocusedTransaction() {
    const tableBody = document.querySelector("#exampleTable tbody");
    const focusedRow = document.querySelector("#exampleTable tbody tr.custom-focus");

    const index = Array.from(tableBody.children).indexOf(focusedRow);

    const ymDiv = document.getElementById("ym");

    const ymText = ymDiv.textContent.trim();
    const match = ymText.match(/^(\d{4})年(\d{2})月$/);

    if (!match) {
        console.error("Error: 年月のフォーマットが正しくありません:", ymText);
        return;
    }

    const yearMonth = `${match[1]}/${match[2]}`;

    deleteTransaction(yearMonth, index);
}

function editTransaction(yearMonth, index, newDate, newContent, newAmount) {
    let transactions = JSON.parse(localStorage.getItem(yearMonth)) || [];

    transactions[index].date = newDate;
    transactions[index].content = newContent;
    transactions[index].amount = newAmount;

    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    transactions[0].balance = getPreviousBalance(yearMonth) + transactions[0].amount;
    for (let i = 1; i < transactions.length; i++) {
        transactions[i].balance = transactions[i - 1].balance + transactions[i].amount;
    }

    localStorage.setItem(yearMonth, JSON.stringify(transactions));

    updateFutureBalances(yearMonth);

    const [year, month] = yearMonth.split('/').map(Number);
    loadTransactionsByMonth(year, month);
}

function editFocusedTransaction() {
    const tableBody = document.querySelector("#exampleTable tbody");
    const focusedRow = document.querySelector("#exampleTable tbody tr.custom-focus");

    const index = Array.from(tableBody.children).indexOf(focusedRow);
    const ymDiv = document.getElementById("ym");

    const ymText = ymDiv.textContent.trim();
    const match = ymText.match(/^(\d{4})年(\d{2})月$/);

    if (!match) {
        console.error("Error: 年月のフォーマットが正しくありません:", ymText);
        return;
    }

    const yearMonth = `${match[1]}/${match[2]}`;
    const newDate = document.getElementById("datepicker").value;
    const newContent = document.getElementById("contentpicker").value;
    const newAmount = Number(document.getElementById("amountpicker").value);

    editTransaction(yearMonth, index, newDate, newContent, newAmount);
}

////////////////////////////////////////////////////////////////////////////////////

function changeMonth(direction) {
    const ymDiv = document.getElementById("ym");
    if (!ymDiv) {
        console.error("Error: id='ym' の要素が見つかりません");
        return;
    }

    const ymText = ymDiv.textContent.trim();
    const match = ymText.match(/^(\d{4})年(\d{2})月$/);

    if (!match) {
        console.error("Error: 年月のフォーマットが正しくありません:", ymText);
        return;
    }

    let year = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);

    if (direction === "back") {
        month -= 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
    } else if (direction === "next") {
        month += 1;
        if (month === 13) {
            month = 1;
            year += 1;
        }
    } else {
        console.error("Error: 無効な direction 値:", direction);
        return;
    }

    loadTransactionsByMonth(year, month);
}

function getPreviousBalance(yearMonth) {
    const [year, month] = yearMonth.split('/').map(Number);
    const previousMonth = month === 1 ? `${year - 1}/12` : `${year}/${(month - 1).toString().padStart(2, '0')}`;
    const previousTransactions = JSON.parse(localStorage.getItem(previousMonth)) || [];

    return previousTransactions.length > 0 ? previousTransactions[previousTransactions.length - 1].balance : 0;
}

function updateFutureBalances(startYearMonth) {
    const [startYear, startMonth] = startYearMonth.split('/').map(Number);
    let previousBalance = getPreviousBalance(startYearMonth) || 0;

    for (let year = startYear; year <= new Date().getFullYear() + 1; year++) {
        for (let month = (year === startYear ? startMonth : 1); month <= 12; month++) {
            const yearMonth = `${year}/${month.toString().padStart(2, '0')}`;
            let transactions = JSON.parse(localStorage.getItem(yearMonth)) || [];

            if (transactions.length === 0) continue;

            transactions[0].balance = previousBalance + transactions[0].amount;

            for (let i = 1; i < transactions.length; i++) {
                transactions[i].balance = transactions[i - 1].balance + transactions[i].amount;
            }

            previousBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : previousBalance;

            localStorage.setItem(yearMonth, JSON.stringify(transactions));
        }
    }
}

function loadTransactionsByMonth(year, month) {
    const yearMonthText = `${year}年${month.toString().padStart(2, '0')}月`;
    const storageKey = `${year}/${month.toString().padStart(2, '0')}`;
    const storedData = localStorage.getItem(storageKey);
    let transactions = storedData ? JSON.parse(storedData) : [];

    document.getElementById("datepicker").value = `${year}-${month.toString().padStart(2, '0')}-01`;

    const ymDiv = document.getElementById("ym");
    if (ymDiv) {
        ymDiv.textContent = yearMonthText;
    }

    const tableBody = document.querySelector("#exampleTable tbody");
    if (tableBody) {
        tableBody.innerHTML = "";

        transactions.forEach(transaction => {
            const row = document.createElement("tr");

            ["date", "content", "amount", "balance"].forEach(key => {
                const cell = document.createElement("td");
                cell.textContent = transaction[key];
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            tableBody.appendChild(row);
        });
    }

    updateTopRightButtonState();

}

function updateTopRightButtonState() {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月`;

    const ymDiv = document.getElementById("ym");
    const topRightButton = document.getElementById("top-right");

    if (ymDiv && topRightButton) {
        if (ymDiv.textContent.trim() === currentYearMonth) {
            topRightButton.disabled = true;
        } else {
            topRightButton.disabled = false;
        }
    }
}