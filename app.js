// The Nest - Lock Screen Only
// Handles PIN entry and redirects to dashboard

const CONFIG = {
    PIN: localStorage.getItem('nest_pin') || '0315'
};

class PinLock {
    constructor() {
        this.pin = '';
        this.error = document.getElementById('pin-error');
        this.setupListeners();
    }

    setupListeners() {
        document.querySelectorAll('.pin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleInput(e.target));
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                this.addDigit(e.key);
            } else if (e.key === 'Backspace') {
                this.clear();
            } else if (e.key === 'Enter') {
                this.submit();
            }
        });
    }

    handleInput(btn) {
        const action = btn.dataset.action;
        const num = btn.dataset.num;

        if (action === 'clear') {
            this.clear();
        } else if (action === 'enter') {
            this.submit();
        } else if (num) {
            this.addDigit(num);
        }
    }

    addDigit(digit) {
        if (this.pin.length < 4) {
            this.pin += digit;
            this.updateDisplay();
            this.error.textContent = '';
        }
    }

    clear() {
        this.pin = this.pin.slice(0, -1);
        this.updateDisplay();
        this.error.textContent = '';
    }

    updateDisplay() {
        // Clear all dots first
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`dot-${i}`).classList.remove('filled');
        }
        
        // Fill dots based on PIN length
        for (let i = 1; i <= this.pin.length; i++) {
            document.getElementById(`dot-${i}`).classList.add('filled');
        }
    }

    submit() {
        if (this.pin === CONFIG.PIN) {
            this.unlock();
        } else {
            this.error.textContent = 'Incorrect PIN. Try again.';
            this.pin = '';
            this.updateDisplay();
            
            // Shake animation
            document.querySelector('.pin-container').classList.add('shake');
            setTimeout(() => {
                document.querySelector('.pin-container').classList.remove('shake');
                this.error.textContent = '';
            }, 500);
        }
    }

    unlock() {
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

// Initialize
new PinLock();
