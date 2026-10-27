(function () {
    'use strict';

    const STORAGE_KEY = 'finpay-wallet-state';
    const initialTransactions = [
        { id: 'netflix-oct-28', name: 'Netflix', category: 'Subscription', amount: -15.99, date: '2026-10-28', icon: 'assets/images/netflix-logo.png' },
        { id: 'spotify-oct-27', name: 'Spotify', category: 'Music', amount: -9.99, date: '2026-10-27', icon: 'assets/images/spotify-logo.png' },
        { id: 'amazon-oct-26', name: 'Amazon', category: 'Shopping', amount: -120.50, date: '2026-10-26', icon: 'assets/images/amazon-logo.png' },
        { id: 'salary-oct-25', name: 'Monthly salary', category: 'Income', amount: 3200, date: '2026-10-25', icon: '' },
        { id: 'coffee-oct-24', name: 'Coffee House', category: 'Food & drink', amount: -6.75, date: '2026-10-24', icon: '' }
    ];
    const defaultPreferences = {
        transactionAlerts: true,
        weeklySpendingSummary: false
    };
    let storageWarning = '';

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                return {
                    balance: 15840.50,
                    transactions: initialTransactions.slice(),
                    preferences: Object.assign({}, defaultPreferences)
                };
            }

            const savedState = JSON.parse(saved);
            if (typeof savedState.balance !== 'number' || !Array.isArray(savedState.transactions)) {
                throw new Error('Saved wallet data has an invalid format.');
            }

            return {
                balance: savedState.balance,
                transactions: savedState.transactions,
                preferences: Object.assign({}, defaultPreferences, savedState.preferences)
            };
        } catch (error) {
            console.error('Unable to load saved wallet data:', error);
            storageWarning = 'Saved wallet data could not be loaded. The demo wallet is being shown instead.';
            return {
                balance: 15840.50,
                transactions: initialTransactions.slice(),
                preferences: Object.assign({}, defaultPreferences)
            };
        }
    }

    let state = loadState();
    let toastTimer;

    function saveState(nextState) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
            return true;
        } catch (error) {
            console.error('Unable to save wallet data:', error);
            return false;
        }
    }

    function money(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(value));
    }

    function formatDate(dateString) {
        const date = new Date(dateString + 'T12:00:00');
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            toast.classList.remove('is-visible');
        }, 2800);
    }

    function updateBalance() {
        document.querySelectorAll('[data-balance]').forEach(function (element) {
            element.textContent = money(state.balance);
        });
    }

    function transactionMarkup(transaction) {
        const isIncome = transaction.amount > 0;
        const icon = transaction.icon
            ? '<img src="' + escapeHTML(transaction.icon) + '" alt="" loading="lazy">'
            : '<span class="transaction-icon"><i class="fa-solid ' + (isIncome ? 'fa-arrow-down' : 'fa-bag-shopping') + '" aria-hidden="true"></i></span>';
        const dateLabel = formatDate(transaction.date);
        return '<article class="transaction-card" data-type="' + (isIncome ? 'income' : 'expense') + '" data-search="' +
            escapeHTML((transaction.name + ' ' + transaction.category).toLowerCase()) + '">' +
            '<div class="transaction-left">' + icon + '<div><h4>' + escapeHTML(transaction.name) +
            '</h4><p>' + escapeHTML(transaction.category) + '</p></div></div>' +
            '<div class="transaction-right"><h4 class="' + (isIncome ? 'income' : 'expense') + '">' +
            (isIncome ? '+' : '-') + money(transaction.amount) + '</h4><span>' + dateLabel + '</span></div></article>';
    }

    function renderDashboardTransactions() {
        const list = document.querySelector('[data-recent-transactions]');
        if (!list) return;
        list.innerHTML = state.transactions.slice(0, 3).map(function (transaction) {
            return transactionMarkup(transaction);
        }).join('');
    }

    function renderHistory() {
        const list = document.querySelector('[data-history-list]');
        if (!list) return;

        const activeFilter = document.querySelector('.filter-tab.is-active');
        const filter = activeFilter ? activeFilter.dataset.filter : 'all';
        const search = (document.querySelector('[data-history-search]') || {}).value || '';
        const normalizedSearch = search.trim().toLowerCase();
        const results = state.transactions.filter(function (transaction) {
            const type = transaction.amount > 0 ? 'income' : 'expense';
            const matchesFilter = filter === 'all' || filter === type;
            const matchesSearch = (transaction.name + ' ' + transaction.category).toLowerCase().includes(normalizedSearch);
            return matchesFilter && matchesSearch;
        });

        if (results.length === 0) {
            list.innerHTML = '<div class="history-empty">No transactions match your search.</div>';
            return;
        }

        const groups = new Map();
        results.forEach(function (transaction) {
            if (!groups.has(transaction.date)) groups.set(transaction.date, []);
            groups.get(transaction.date).push(transaction);
        });

        list.innerHTML = Array.from(groups.entries()).map(function (entry) {
            return '<section class="history-group"><h3 class="history-date">' + formatDate(entry[0]) +
                '</h3>' + entry[1].map(function (transaction) {
                    return transactionMarkup(transaction);
                }).join('') + '</section>';
        }).join('');
    }

    function addTransaction(name, category, amount) {
        const transaction = {
            id: 'transaction-' + Date.now(),
            name: name,
            category: category,
            amount: amount,
            date: new Date().toISOString().slice(0, 10),
            icon: ''
        };
        const nextState = {
            balance: state.balance + amount,
            transactions: [transaction].concat(state.transactions),
            preferences: state.preferences
        };
        if (!saveState(nextState)) {
            return false;
        }

        state = nextState;
        updateBalance();
        renderDashboardTransactions();
        renderHistory();
        return true;
    }

    function initTransferForm() {
        const form = document.querySelector('[data-transfer-form]');
        if (!form) return;

        const modeInput = form.querySelector('[name="mode"]');
        const recipientField = form.querySelector('[data-recipient-field]');
        const recipientInput = form.querySelector('[name="recipient"]');
        const recipientLabel = form.querySelector('[data-recipient-label]');
        const error = form.querySelector('[data-form-error]');
        const heading = document.querySelector('[data-transfer-heading]');
        const submitLabel = form.querySelector('[data-submit-label]');

        document.querySelectorAll('[data-mode]').forEach(function (button) {
            button.addEventListener('click', function () {
                const mode = button.dataset.mode;
                modeInput.value = mode;
                document.querySelectorAll('[data-mode]').forEach(function (tab) {
                    tab.classList.toggle('is-active', tab === button);
                });
                const isTopUp = mode === 'topup';
                recipientField.hidden = isTopUp;
                recipientInput.required = !isTopUp;
                recipientLabel.textContent = 'Recipient name';
                heading.textContent = isTopUp ? 'Add money to your wallet' : 'Send money securely';
                submitLabel.textContent = isTopUp ? 'Add money' : 'Review transfer';
                error.classList.remove('is-visible');
            });
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            error.classList.remove('is-visible');
            const amount = Number(form.elements.amount.value);
            const mode = modeInput.value;
            const recipient = recipientInput.value.trim();

            if (!Number.isFinite(amount) || amount <= 0) {
                error.textContent = 'Enter an amount greater than $0.';
                error.classList.add('is-visible');
                return;
            }
            if (mode === 'send' && !recipient) {
                error.textContent = 'Enter the recipient name.';
                error.classList.add('is-visible');
                return;
            }
            if (mode === 'send' && amount > state.balance) {
                error.textContent = 'This transfer is higher than your available balance.';
                error.classList.add('is-visible');
                return;
            }

            if (mode === 'topup') {
                if (!addTransaction('Wallet top up', 'Top up', amount)) {
                    showToast('Could not save this top up in your browser. Check your storage settings and try again.');
                    return;
                }
                showToast(money(amount) + ' was added to your wallet.');
            } else {
                if (!addTransaction(recipient, 'Transfer', -amount)) {
                    showToast('Could not save this transfer in your browser. Check your storage settings and try again.');
                    return;
                }
                showToast('Your transfer to ' + recipient + ' was successful.');
            }
            form.reset();
            modeInput.value = 'send';
            document.querySelectorAll('[data-mode]').forEach(function (tab) {
                tab.classList.toggle('is-active', tab.dataset.mode === 'send');
            });
            recipientField.hidden = false;
            recipientInput.required = true;
            heading.textContent = 'Send money securely';
            submitLabel.textContent = 'Review transfer';
        });
    }

    function initHistoryControls() {
        document.querySelectorAll('.filter-tab').forEach(function (button) {
            button.addEventListener('click', function () {
                document.querySelectorAll('.filter-tab').forEach(function (tab) {
                    tab.classList.toggle('is-active', tab === button);
                });
                renderHistory();
            });
        });
        const search = document.querySelector('[data-history-search]');
        if (search) search.addEventListener('input', renderHistory);
    }

    function initQuickActions() {
        document.querySelectorAll('[data-action="receive"]').forEach(function (button) {
            button.addEventListener('click', async function () {
                const walletId = 'arshiyan@finpay';
                try {
                    await navigator.clipboard.writeText(walletId);
                    showToast('Your wallet ID ' + walletId + ' was copied.');
                } catch (error) {
                    showToast('Your wallet ID is ' + walletId + '.');
                }
            });
        });

        document.querySelectorAll('[data-action="send"], [data-action="topup"]').forEach(function (button) {
            button.addEventListener('click', function () {
                window.location.href = button.dataset.action === 'topup' ? 'transfer.html?mode=topup' : 'transfer.html';
            });
        });

        document.querySelectorAll('[data-action="history"]').forEach(function (button) {
            button.addEventListener('click', function () {
                window.location.href = 'history.html';
            });
        });

        document.querySelectorAll('[data-notifications]').forEach(function (button) {
            button.addEventListener('click', function () {
                showToast('You’re all caught up. No new notifications.');
            });
        });
    }

    function initProfileControls() {
        document.querySelectorAll('[data-toggle]').forEach(function (toggle) {
            const preference = toggle.dataset.toggle;
            toggle.setAttribute('aria-checked', String(Boolean(state.preferences[preference])));
            toggle.addEventListener('click', function () {
                const enabled = !state.preferences[preference];
                const nextState = {
                    balance: state.balance,
                    transactions: state.transactions,
                    preferences: Object.assign({}, state.preferences, {
                        [preference]: enabled
                    })
                };
                if (!saveState(nextState)) {
                    showToast('Could not save this preference in your browser. Check your storage settings and try again.');
                    return;
                }
                state = nextState;
                toggle.setAttribute('aria-checked', String(enabled));
                showToast((enabled ? 'Enabled' : 'Disabled') + ' ' + toggle.getAttribute('aria-label') + '.');
            });
        });
    }

    updateBalance();
    renderDashboardTransactions();
    renderHistory();
    initTransferForm();
    initHistoryControls();
    initQuickActions();
    initProfileControls();

    if (storageWarning) showToast(storageWarning);

    if (window.location.search.includes('mode=topup')) {
        const topupTab = document.querySelector('[data-mode="topup"]');
        if (topupTab) topupTab.click();
    }
}());
