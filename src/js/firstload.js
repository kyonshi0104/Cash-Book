// ページ読み込み時の初期化処理
document.addEventListener("DOMContentLoaded", function () {
    if (typeof nw === "undefined" || !nw.Window) {document.body.innerHTML = "<h1 style='text-align:center; color:red;'>Error: Not using NW.js</h1>";}
    initializePage();
    setupTableInteractions();
    setupInputHandlers();
    setupFullscreenToggle();
    handleResize();
});

// 初期化：現在の日付や年月を設定
function initializePage() {
    const now = new Date();
    const yearMonthText = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月`;

    const datepicker = document.getElementById("datepicker");
    if (datepicker) {
        const todayString = now.toISOString().split('T')[0];
        datepicker.value = todayString;
        datepicker.max = todayString;
    }

    const ymDiv = document.getElementById("ym");
    if (ymDiv) {
        ymDiv.textContent = yearMonthText;
    }

    loadTransactionsFromLocalStorage(now);
}

// `localStorage` 読み込みと表示
function loadTransactionsFromLocalStorage(date) {
    const storageKey = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    let transactions = [];

    try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            transactions = JSON.parse(storedData);
        }
    } catch (e) {
        console.error("localStorage の読み込みエラー:", e);
    }

    populateTransactionTable(transactions);
}

// データをテーブルに表示
function populateTransactionTable(transactions) {
    const tableBody = document.querySelector("#exampleTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    transactions.forEach(transaction => {
        const row = document.createElement("tr");
        row.tabIndex = 0;

        ["date", "content", "amount", "balance"].forEach(key => {
            const cell = document.createElement("td");
            cell.textContent = transaction[key];
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// テーブルのクリックやフォーカス関連
function setupTableInteractions() {
    const tableBody = document.querySelector("#exampleTable tbody");
    const addButton = document.getElementById("addButton");
    const deleteButton = document.getElementById("deleteButton");

    if (!tableBody || !addButton || !deleteButton) {
        console.error("Error: テーブルまたはボタンが見つかりません");
        return;
    }

    tableBody.addEventListener("focusin", updateButtonStates);
    tableBody.addEventListener("focusout", updateButtonStates);

    const observer = new MutationObserver(() => {
        attachRowClickEvents();
    });

    observer.observe(tableBody, { childList: true, subtree: true });

    // 初期実行
    attachRowClickEvents();
}

// `tr` のクリックイベント
function attachRowClickEvents() {
    document.querySelectorAll("#exampleTable tbody tr").forEach(row => {
        row.addEventListener("click", function (event) {
            document.querySelectorAll("#exampleTable tbody tr").forEach(r => r.classList.remove("custom-focus"));
            this.classList.add("custom-focus");
            updateButtonStates();

            const cells = this.children;
            document.getElementById("datepicker").value = cells[0].textContent.replace(/\//g, "-");
            document.getElementById("contentpicker").value = cells[1].textContent;
            document.getElementById("amountpicker").value = Number(cells[2].textContent);

            event.stopPropagation();
        });
    });
}

// 入力フィールドの変更監視
function setupInputHandlers() {
    document.getElementById("contentpicker").addEventListener("input", checkInputs);
    document.getElementById("amountpicker").addEventListener("input", checkInputs);
}

// F4キーでフルスクリーン切り替え
function setupFullscreenToggle() {
    document.addEventListener("keydown", function (event) {
        if (event.key === "F4" && typeof nw !== "undefined" && nw.Window) {
            var win = nw.Window.get();
            win.toggleFullscreen();
        }
    });
}

// ボタンの状態を更新
function updateButtonStates() {
    const focusedRow = document.querySelector("#exampleTable tbody tr.custom-focus");
    const addButton = document.getElementById("addButton");
    const deleteButton = document.getElementById("deleteButton");

    if (deleteButton) {
        deleteButton.disabled = !focusedRow;
    }

    if (addButton) {
        addButton.innerText = focusedRow ? "編集" : "追加";
        addButton.onclick = focusedRow ? editFocusedTransaction : saveTransactionFromInputs;
    }
}

// 入力チェック関数
function checkInputs() {
    const content = document.getElementById("contentpicker").value.trim();
    const amount = document.getElementById("amountpicker").value.trim();
    const addButton = document.getElementById("addButton");

    addButton.disabled = content === "" || amount === "";
}

//ウィンドウサイズに応じて著作権表示の表示を管理
function handleResize() {
    const widthThreshold = 1515;
    const targetElementId = "copyright";
    const footer = document.querySelector(".footer");

    if (window.innerWidth > widthThreshold) {
        if (!document.getElementById(targetElementId)) {
            const newElement = document.createElement("div");
            newElement.id = targetElementId;
            newElement.style.display = "flex";
            newElement.style.gap = "10px";
            newElement.style.alignItems = "center";
            newElement.innerHTML = "<h1 style='margin-right:10px'>小遣い帳</h1><p>© 2025 kyonshi All rights reserved.</p>";
            newElement.style.fontSize = "12px";
            newElement.style.marginLeft = "auto";
            newElement.style.marginRight = "auto";
            newElement.style.marginTop = "auto";
            newElement.style.padding = "px";
            footer.appendChild(newElement);
        }
    } else {
        const existingElement = document.getElementById(targetElementId);
        if (existingElement) {
            existingElement.remove();
        }
    }
}

// ウィンドウサイズ変更時に処理を実行
window.addEventListener("resize", handleResize);

document.addEventListener("click", function (event) {
    const footer = document.querySelector("footer");

    if (!footer || !footer.contains(event.target)) {
        document.querySelectorAll("#exampleTable tbody tr").forEach(row => row.classList.remove("custom-focus"));
        updateButtonStates();
    }
});