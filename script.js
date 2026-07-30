/**
 * ==========================================================================
 * 【玉兔中秋租稅大冒險 - script.js】
 * 採用 ES6 物件導向架構，無全域污染
 * 包含：Question, Score, Animation, CodeVerify, Game 類別
 * ==========================================================================
 */

/**
 * 類別 1: Question - 題目與驗證管理
 */
class Question {
    constructor() {
        // 定義5題中秋租稅宣導單選題
        this.questions = [
            {
                id: 1,
                title: "買東西可以使用什麼工具儲存雲端發票？",
                options: ["1 健保卡", "2 手機條碼（載具）", "3 身分證"],
                correctIndex: 1 // 2 手機條碼（載具）
            },
            {
                id: 2,
                title: "擁有自用住宅要如何節稅？",
                options: ["1 申請稅單分期繳納", "2 申請地價稅自用住宅優惠稅率", "3 申請轉帳納稅"],
                correctIndex: 1 // 2 申請地價稅自用住宅優惠稅率
            },
            {
                id: 3,
                title: "地價稅自用住宅優惠稅率申請期限",
                options: ["1 9月1日", "2 9月22日", "3 11月1日"],
                correctIndex: 1 // 2 9月22日
            },
            {
                id: 4,
                title: "何時繳納地價稅？",
                options: ["1 5/1~5/30", "2 11/1~11/30", "3 12/1~12/31"],
                correctIndex: 1 // 2 11/1~11/30
            },
            {
                id: 5,
                title: "哪裡不能繳稅？",
                options: ["1 超商", "2 郵局", "3 銀行"],
                correctIndex: 1 // 2 郵局
            }
        ];
        this.currentIndex = 0;
    }

    /**
     * 取得目前題目
     */
    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    /**
     * 檢查選取的選項是否正確
     * @param {number} optionIndex - 使用者選擇的選項索引 (0, 1, 2)
     * @returns {boolean}
     */
    checkAnswer(optionIndex) {
        return optionIndex === this.questions[this.currentIndex].correctIndex;
    }

    /**
     * 前往下一題
     * @returns {boolean} 是否還有下一題
     */
    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    /**
     * 取得目前題號 (從 1 開始)
     */
    get currentNumber() {
        return this.currentIndex + 1;
    }

    /**
     * 取得總題數
     */
    get totalQuestions() {
        return this.questions.length;
    }

    /**
     * 重設題目索引
     */
    reset() {
        this.currentIndex = 0;
    }
}

/**
 * 類別 2: Score - 月餅收集與分數紀錄
 */
class Score {
    constructor() {
        this.collectedMooncakes = 0;
        this.maxMooncakes = 5;
    }

    /**
     * 增加一塊月餅
     */
    addMooncake() {
        if (this.collectedMooncakes < this.maxMooncakes) {
            this.collectedMooncakes++;
            this.updateTrackerUI();
        }
    }

    /**
     * 更新頂部月餅收集欄 UI: □□□□□ -> 🥮🥮□□□
     */
    updateTrackerUI() {
        const slots = document.querySelectorAll('.slot-item');
        slots.forEach((slot, index) => {
            if (index < this.collectedMooncakes) {
                slot.classList.remove('empty');
                slot.classList.add('filled');
                slot.innerHTML = '<span class="slot-icon">🥮</span>';
            } else {
                slot.classList.remove('filled');
                slot.classList.add('empty');
                slot.innerHTML = '<span class="slot-icon">□</span>';
            }
        });
    }

    /**
     * 重設月餅計數器
     */
    reset() {
        this.collectedMooncakes = 0;
        this.updateTrackerUI();
    }
}

/**
 * 類別 3: Animation - 視覺動畫與音效管理 (Web Audio API & Canvas 煙火/彩帶)
 */
class Animation {
    constructor() {
        this.audioCtx = null;
        this.soundEnabled = true;
        this.fireworksCanvas = document.getElementById('fireworks-canvas');
        this.fireworksCtx = this.fireworksCanvas ? this.fireworksCanvas.getContext('2d') : null;
        this.particles = [];
        this.animFrameId = null;

        this.initCanvasSize();
        window.addEventListener('resize', () => this.initCanvasSize());
    }

    /**
     * 初始化 Web Audio API (延遲至使用者第一次點擊以遵循瀏覽器政策)
     */
    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    /**
     * 播放答對/成功正向音效 (C-E-G-C6 輕鬆合音)
     */
    playSuccessSound() {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.15, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
        });
    }

    /**
     * 播放答錯提示音效
     */
    playErrorSound() {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.setValueAtTime(180, now + 0.15); // Low note

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    /**
     * 播放點擊通用音效
     */
    playClickSound() {
        if (!this.soundEnabled) return;
        this.initAudio();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * 初始化 Canvas 煙火尺寸
     */
    initCanvasSize() {
        if (this.fireworksCanvas) {
            this.fireworksCanvas.width = window.innerWidth;
            this.fireworksCanvas.height = window.innerHeight;
        }
    }

    /**
     * 啟動慶祝煙火動畫
     */
    startFireworks() {
        if (!this.fireworksCtx) return;
        this.stopFireworks();
        this.particles = [];

        // 產生多波煙火
        const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#fef08a'];
        let burstCount = 0;

        const createBurst = () => {
            const cx = Math.random() * this.fireworksCanvas.width;
            const cy = Math.random() * (this.fireworksCanvas.height * 0.5);
            const count = 40;

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const speed = 2 + Math.random() * 5;
                this.particles.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    size: 3 + Math.random() * 3
                });
            }
        };

        const burstInterval = setInterval(() => {
            createBurst();
            burstCount++;
            if (burstCount > 8) clearInterval(burstInterval);
        }, 300);

        const render = () => {
            this.fireworksCtx.clearRect(0, 0, this.fireworksCanvas.width, this.fireworksCanvas.height);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05; // 重力效果
                p.alpha -= 0.012;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.fireworksCtx.save();
                this.fireworksCtx.globalAlpha = p.alpha;
                this.fireworksCtx.fillStyle = p.color;
                this.fireworksCtx.beginPath();
                this.fireworksCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.fireworksCtx.fill();
                this.fireworksCtx.restore();
            }

            this.animFrameId = requestAnimationFrame(render);
        };

        render();
    }

    /**
     * 停止煙火畫布
     */
    stopFireworks() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.fireworksCtx) {
            this.fireworksCtx.clearRect(0, 0, this.fireworksCanvas.width, this.fireworksCanvas.height);
        }
        this.particles = [];
    }

    /**
     * 產生畫面彩帶飄落效果
     */
    startConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        container.innerHTML = '';

        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (3 + Math.random() * 2) + 's';
            container.appendChild(piece);
        }
    }

    /**
     * 清除彩帶
     */
    stopConfetti() {
        const container = document.getElementById('confetti-container');
        if (container) container.innerHTML = '';
    }

    /**
     * 觸發玉兔跳躍動畫
     */
    triggerRabbitJump() {
        const rabbitSprite = document.querySelector('.rabbit-sprite');
        if (rabbitSprite) {
            rabbitSprite.classList.remove('jump');
            void rabbitSprite.offsetWidth; // 強制重繪
            rabbitSprite.classList.add('jump');
        }
    }
}

/**
 * 類別 4: CodeVerify - 4位數兌換代碼驗證管理
 */
class CodeVerify {
    constructor(onSuccess, onError) {
        this.inputs = [
            document.getElementById('digit-1'),
            document.getElementById('digit-2'),
            document.getElementById('digit-3'),
            document.getElementById('digit-4')
        ];
        this.targetCode = "7777";
        this.onSuccess = onSuccess;
        this.onError = onError;

        this.initInputEvents();
    }

    /**
     * 初始化 4 位數獨立輸入框的事件監聽 (自動跳格、退格處理、貼上處理)
     */
    initInputEvents() {
        this.inputs.forEach((input, index) => {
            if (!input) return;

            // 限制僅輸入數字與自動跳至下一個
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = value;

                if (value && index < this.inputs.length - 1) {
                    this.inputs[index + 1].focus();
                }
            });

            // 監聽退格鍵 Backspace (自動回前一格)
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    this.inputs[index - 1].focus();
                } else if (e.key === 'Enter') {
                    this.submit();
                }
            });

            // 支援複製貼上4位數字
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const digits = pastedText.replace(/[^0-9]/g, '').slice(0, 4);

                digits.split('').forEach((digit, i) => {
                    if (this.inputs[i]) {
                        this.inputs[i].value = digit;
                    }
                });

                if (digits.length > 0) {
                    const focusIndex = Math.min(digits.length, 3);
                    this.inputs[focusIndex].focus();
                }
            });
        });
    }

    /**
     * 取得目前輸入的完整4位數字代碼
     */
    getCode() {
        return this.inputs.map(input => input ? input.value : '').join('');
    }

    /**
     * 執行驗證比對
     */
    submit() {
        const code = this.getCode();
        if (code === this.targetCode) {
            if (typeof this.onSuccess === 'function') this.onSuccess();
        } else {
            this.showErrorStyle();
            if (typeof this.onError === 'function') this.onError();
        }
    }

    /**
     * 顯示錯誤紅框動態
     */
    showErrorStyle() {
        this.inputs.forEach(input => {
            if (input) {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 600);
            }
        });
    }

    /**
     * 清空輸入框與重設狀態
     */
    reset() {
        this.inputs.forEach(input => {
            if (input) {
                input.value = '';
                input.classList.remove('error');
            }
        });
        if (this.inputs[0]) this.inputs[0].focus();
    }
}

/**
 * 類別 5: Game - 主遊戲核心邏輯與畫面流轉控制器
 */
class Game {
    constructor() {
        // 實例化模組
        this.questionEngine = new Question();
        this.scoreEngine = new Score();
        this.animationEngine = new Animation();

        this.currentScreenId = 'screen-home';
        this.isAnsweringLocked = false; // 答題動畫鎖定

        this.initDOMReferences();
        this.codeVerifier = new CodeVerify(
            () => this.handleVerifySuccess(),
            () => this.handleVerifyError()
        );

        this.generateStarsBackground();
        this.bindEvents();
    }

    /**
     * 初始化頁面元件參照
     */
    initDOMReferences() {
        this.screens = {
            home: document.getElementById('screen-home'),
            quiz: document.getElementById('screen-quiz'),
            complete: document.getElementById('screen-complete'),
            verify: document.getElementById('screen-verify')
        };

        this.startBtn = document.getElementById('start-game-btn');
        this.soundBtn = document.getElementById('sound-btn');
        this.restartHeaderBtn = document.getElementById('restart-header-btn');
        this.nextToVerifyBtn = document.getElementById('next-to-verify-btn');
        this.verifySubmitBtn = document.getElementById('verify-submit-btn');
        this.restartGameFinalBtn = document.getElementById('restart-game-final-btn');

        // Quiz elements
        this.questionBadge = document.getElementById('question-badge');
        this.quizProgressFill = document.getElementById('quiz-progress-fill');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.feedbackMsg = document.getElementById('feedback-message');
        this.rabbitSpeech = document.getElementById('rabbit-speech');

        // Verify elements
        this.verifyFormState = document.getElementById('verify-form-state');
        this.verifySuccessState = document.getElementById('verify-success-state');
        this.verifyErrorMsg = document.getElementById('verify-error-msg');

        // Worksheet elements
        this.openWorksheetBtnForm = document.getElementById('open-worksheet-btn-form');
        this.openWorksheetBtnSuccess = document.getElementById('open-worksheet-btn-success');
        this.worksheetModal = document.getElementById('worksheet-modal');
        this.closeWorksheetModalBtn = document.getElementById('close-worksheet-modal-btn');
        this.worksheetTotalCount = document.getElementById('worksheet-total-count');
        this.worksheetTbody = document.getElementById('worksheet-tbody');
        this.worksheetEmptyMsg = document.getElementById('worksheet-empty-msg');
        this.exportCsvBtn = document.getElementById('export-csv-btn');
        this.clearWorksheetBtn = document.getElementById('clear-worksheet-btn');

        // Password Verification Modal elements
        this.pwdModal = document.getElementById('pwd-modal');
        this.staffPwdInput = document.getElementById('staff-pwd-input');
        this.pwdErrorMsg = document.getElementById('pwd-error-msg');
        this.pwdSubmitBtn = document.getElementById('pwd-submit-btn');
        this.pwdClearBtn = document.getElementById('pwd-clear-btn');
        this.closePwdModalBtn = document.getElementById('close-pwd-modal-btn');

        // Clear Confirm Modal elements
        this.clearConfirmModal = document.getElementById('clear-confirm-modal');
        this.closeClearConfirmBtn = document.getElementById('close-clear-confirm-btn');
        this.clearCancelBtn = document.getElementById('clear-cancel-btn');
        this.clearSubmitBtn = document.getElementById('clear-submit-btn');
    }

    /**
     * 綁定全局點擊事件
     */
    bindEvents() {
        // 開始遊戲
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.startQuiz();
            });
        }

        // 切換音效
        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                this.animationEngine.soundEnabled = !this.animationEngine.soundEnabled;
                this.soundBtn.textContent = this.animationEngine.soundEnabled ? '🔊' : '🔇';
            });
        }

        // 頂部重新開始按鈕
        if (this.restartHeaderBtn) {
            this.restartHeaderBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.restartGame();
            });
        }

        // 完成頁前往驗證頁
        if (this.nextToVerifyBtn) {
            this.nextToVerifyBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.animationEngine.stopFireworks();
                this.animationEngine.stopConfetti();
                this.showScreen('verify');
            });
        }

        // 驗證按鈕提交
        if (this.verifySubmitBtn) {
            this.verifySubmitBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.codeVerifier.submit();
            });
        }

        // 驗證成功頁重設遊戲按鈕
        if (this.restartGameFinalBtn) {
            this.restartGameFinalBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.restartGame();
            });
        }

        // 開啟宣導品發放紀錄工作表 (先跳出工作人員密碼驗證 Modal)
        const handleOpenPwdModal = () => {
            this.animationEngine.playClickSound();
            this.openPwdModal();
        };
        if (this.openWorksheetBtnForm) this.openWorksheetBtnForm.addEventListener('click', handleOpenPwdModal);
        if (this.openWorksheetBtnSuccess) this.openWorksheetBtnSuccess.addEventListener('click', handleOpenPwdModal);

        // 關閉密碼 Modal
        const handleClosePwdModal = () => {
            this.closePwdModal();
        };
        if (this.closePwdModalBtn) this.closePwdModalBtn.addEventListener('click', handleClosePwdModal);
        if (this.pwdModal) {
            this.pwdModal.addEventListener('click', (e) => {
                if (e.target === this.pwdModal) this.closePwdModal();
            });
        }

        // 清除密碼輸入框
        if (this.pwdClearBtn) {
            this.pwdClearBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                if (this.staffPwdInput) {
                    this.staffPwdInput.value = '';
                    this.staffPwdInput.focus();
                }
                if (this.pwdErrorMsg) {
                    this.pwdErrorMsg.classList.add('hidden');
                }
            });
        }

        // 密碼提交驗證 (密碼 1234)
        if (this.pwdSubmitBtn) {
            this.pwdSubmitBtn.addEventListener('click', () => {
                this.verifyStaffPassword();
            });
        }
        if (this.staffPwdInput) {
            this.staffPwdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.verifyStaffPassword();
                }
            });
        }

        // 關閉工作表 Modal
        if (this.closeWorksheetModalBtn) {
            this.closeWorksheetModalBtn.addEventListener('click', () => {
                this.closeWorksheetModal();
            });
        }

        // 點擊 Modal 背景關閉
        if (this.worksheetModal) {
            this.worksheetModal.addEventListener('click', (e) => {
                if (e.target === this.worksheetModal) {
                    this.closeWorksheetModal();
                }
            });
        }

        // 匯出 CSV 工作表
        if (this.exportCsvBtn) {
            this.exportCsvBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.exportWorksheetCSV();
            });
        }

        // 清空工作表發放紀錄 (彈出二次確認 Modal)
        if (this.clearWorksheetBtn) {
            this.clearWorksheetBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                if (this.clearConfirmModal) this.clearConfirmModal.classList.remove('hidden');
            });
        }

        const handleCloseClearModal = () => {
            if (this.clearConfirmModal) this.clearConfirmModal.classList.add('hidden');
        };
        if (this.closeClearConfirmBtn) this.closeClearConfirmBtn.addEventListener('click', handleCloseClearModal);
        if (this.clearCancelBtn) this.clearCancelBtn.addEventListener('click', handleCloseClearModal);
        if (this.clearConfirmModal) {
            this.clearConfirmModal.addEventListener('click', (e) => {
                if (e.target === this.clearConfirmModal) handleCloseClearModal();
            });
        }

        if (this.clearSubmitBtn) {
            this.clearSubmitBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.clearWorksheetLogs();
                handleCloseClearModal();
            });
        }
    }

    /**
     * 動態繪製夜空星星
     */
    generateStarsBackground() {
        const starsContainer = document.getElementById('stars-container');
        if (!starsContainer) return;
        starsContainer.innerHTML = '';

        const starCount = 35;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.top = Math.random() * 80 + '%';
            star.style.left = Math.random() * 100 + '%';

            const size = 2 + Math.random() * 3;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            star.style.setProperty('--duration', (1.5 + Math.random() * 2.5) + 's');

            starsContainer.appendChild(star);
        }
    }

    /**
     * 切換畫面的輔助函式
     * @param {string} screenKey - 'home' | 'quiz' | 'complete' | 'verify'
     */
    showScreen(screenKey) {
        Object.keys(this.screens).forEach(key => {
            if (this.screens[key]) {
                this.screens[key].classList.remove('active');
            }
        });

        if (this.screens[screenKey]) {
            this.screens[screenKey].classList.add('active');
            this.currentScreenId = screenKey;

            if (screenKey === 'verify') {
                this.renderWorksheet();
            }
        }
    }

    /**
     * 開始進入答題階段
     */
    startQuiz() {
        this.questionEngine.reset();
        this.scoreEngine.reset();
        this.showScreen('quiz');
        this.renderCurrentQuestion();
    }

    /**
     * 渲染當前題目內容與選項按鈕
     */
    renderCurrentQuestion() {
        this.isAnsweringLocked = false;
        const q = this.questionEngine.getCurrentQuestion();

        // 隱藏上一題反饋訊息
        if (this.feedbackMsg) {
            this.feedbackMsg.classList.add('hidden');
            this.feedbackMsg.className = 'feedback-message hidden';
        }

        // 更新進度條與題號
        if (this.questionBadge) {
            this.questionBadge.textContent = `第 ${this.questionEngine.currentNumber} / ${this.questionEngine.totalQuestions} 題`;
        }
        if (this.quizProgressFill) {
            const progressPercent = (this.questionEngine.currentNumber / this.questionEngine.totalQuestions) * 100;
            this.quizProgressFill.style.width = `${progressPercent}%`;
        }

        // 更新題目文字
        if (this.questionText) {
            this.questionText.textContent = q.title;
        }

        // 更新玉兔對話框
        if (this.rabbitSpeech) {
            this.rabbitSpeech.textContent = "加油！答對就能幫我拿到月餅囉！";
        }

        // 渲染 3 個單選選項
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';
            q.options.forEach((optText, index) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = `
                    <span class="option-number">${index + 1}</span>
                    <span class="option-label">${optText}</span>
                `;

                btn.addEventListener('click', () => this.handleOptionClick(index, btn));
                this.optionsContainer.appendChild(btn);
            });
        }
    }

    /**
     * 處理玩家選擇選項
     * @param {number} optionIndex - 使用者點擊的選項 (0, 1, 2)
     * @param {HTMLElement} btnElement - 被點擊的按鈕元素
     */
    handleOptionClick(optionIndex, btnElement) {
        if (this.isAnsweringLocked) return;

        const isCorrect = this.questionEngine.checkAnswer(optionIndex);

        if (isCorrect) {
            // 【答對處理】
            this.isAnsweringLocked = true;
            btnElement.classList.add('selected-correct');

            // 播放成功音效 & 跳躍動畫
            this.animationEngine.playSuccessSound();
            this.animationEngine.triggerRabbitJump();

            // 增加月餅數
            this.scoreEngine.addMooncake();

            // 顯示成功提示
            if (this.feedbackMsg) {
                this.feedbackMsg.textContent = "🎉 答對了！玉兔開心拿到 1 塊月餅！";
                this.feedbackMsg.className = "feedback-message correct";
                this.feedbackMsg.classList.remove('hidden');
            }

            if (this.rabbitSpeech) {
                this.rabbitSpeech.textContent = "太棒了！謝謝你幫我拿到月餅！🥮";
            }

            // 0.8秒後自動前往下一題或完成畫面
            setTimeout(() => {
                const hasNext = this.questionEngine.nextQuestion();
                if (hasNext) {
                    this.renderCurrentQuestion();
                } else {
                    this.showCompletionScreen();
                }
            }, 800);

        } else {
            // 【答錯處理】
            btnElement.classList.add('selected-incorrect');
            this.animationEngine.playErrorSound();

            if (this.feedbackMsg) {
                this.feedbackMsg.textContent = "回答錯誤，再試一次！";
                this.feedbackMsg.className = "feedback-message incorrect";
                this.feedbackMsg.classList.remove('hidden');
            }

            if (this.rabbitSpeech) {
                this.rabbitSpeech.textContent = "沒關係，再想一下重新嘗試！💪";
            }

            // 0.5秒後復原選項狀態，停留原題
            setTimeout(() => {
                btnElement.classList.remove('selected-incorrect');
            }, 500);
        }
    }

    /**
     * 顯示完成畫面 (所有 5 題答對)
     */
    showCompletionScreen() {
        this.showScreen('complete');

        // 播放慶祝煙火與彩帶
        this.animationEngine.startFireworks();
        this.animationEngine.startConfetti();
    }

    /**
     * 開啟工作人員密碼驗證 Modal
     */
    openPwdModal() {
        if (this.staffPwdInput) this.staffPwdInput.value = '';
        if (this.pwdErrorMsg) this.pwdErrorMsg.classList.add('hidden');
        if (this.pwdModal) {
            this.pwdModal.classList.remove('hidden');
            setTimeout(() => {
                if (this.staffPwdInput) this.staffPwdInput.focus();
            }, 100);
        }
    }

    /**
     * 關閉工作人員密碼驗證 Modal
     */
    closePwdModal() {
        if (this.pwdModal) {
            this.pwdModal.classList.add('hidden');
        }
    }

    /**
     * 驗證工作人員密碼 (預設: 1234)
     */
    verifyStaffPassword() {
        this.animationEngine.playClickSound();
        const inputVal = this.staffPwdInput ? this.staffPwdInput.value.trim() : '';
        if (inputVal === '1234') {
            this.closePwdModal();
            this.openWorksheetModal();
        } else {
            if (this.pwdErrorMsg) this.pwdErrorMsg.classList.remove('hidden');
            if (this.staffPwdInput) {
                this.staffPwdInput.value = '';
                this.staffPwdInput.focus();
            }
        }
    }

    /**
     * 取得宣導品發放紀錄工作表陣列
     * @returns {Array<{id: number, time: string, timestamp: number, code: string, status: string}>}
     */
    getRedemptionLogs() {
        const stored = localStorage.getItem('tax_game_redemption_logs');
        if (!stored) return [];
        try {
            return JSON.parse(stored) || [];
        } catch (e) {
            return [];
        }
    }

    /**
     * 新增一筆發放紀錄至後台工作表
     * @param {string} code 
     * @returns {Array} 最新紀錄陣列
     */
    addRedemptionLog(code = '7777') {
        const logs = this.getRedemptionLogs();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeStr = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

        const newLog = {
            id: logs.length + 1,
            time: timeStr,
            timestamp: Date.now(),
            code: code,
            status: '已兌換核銷'
        };

        logs.push(newLog);
        localStorage.setItem('tax_game_redemption_logs', JSON.stringify(logs));
        return logs;
    }

    /**
     * 渲染後台發放紀錄工作表表格
     */
    renderWorksheet() {
        const logs = this.getRedemptionLogs();
        if (this.worksheetTotalCount) {
            this.worksheetTotalCount.textContent = logs.length;
        }

        if (!this.worksheetTbody) return;

        if (logs.length === 0) {
            this.worksheetTbody.innerHTML = '';
            if (this.worksheetEmptyMsg) this.worksheetEmptyMsg.classList.remove('hidden');
        } else {
            if (this.worksheetEmptyMsg) this.worksheetEmptyMsg.classList.add('hidden');
            // 將最新發放呈現於最上方
            const rowsHtml = logs.slice().reverse().map((log) => {
                return `
                    <tr>
                        <td>#${log.id}</td>
                        <td>${log.time}</td>
                        <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${log.code}</code></td>
                        <td><span style="color:#16a34a; font-weight:700;">✓ ${log.status || '已核銷'}</span></td>
                    </tr>
                `;
            }).join('');
            this.worksheetTbody.innerHTML = rowsHtml;
        }
    }

    openWorksheetModal() {
        this.renderWorksheet();
        if (this.worksheetModal) {
            this.worksheetModal.classList.remove('hidden');
        }
    }

    closeWorksheetModal() {
        if (this.worksheetModal) {
            this.worksheetModal.classList.add('hidden');
        }
    }

    /**
     * 匯出 Excel / CSV 工作表檔案
     */
    exportWorksheetCSV() {
        const logs = this.getRedemptionLogs();
        if (logs.length === 0) {
            alert('目前工作表中尚無發放紀錄可供匯出！');
            return;
        }

        // 加入 UTF-8 BOM，確保 Excel / 試算表軟體直接雙擊開啟不會出現中文亂碼
        let csvContent = '\uFEFF';
        csvContent += '序號,發放時間,驗證兌換碼,核銷狀態\r\n';

        logs.forEach(log => {
            const idStr = log.id;
            const timeStr = (log.time || '').replace(/,/g, ' ');
            const codeStr = (log.code || '7777').replace(/,/g, ' ');
            const statusStr = (log.status || '已核銷').replace(/,/g, ' ');
            csvContent += `${idStr},${timeStr},${codeStr},${statusStr}\r\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        link.href = url;
        link.download = `宣導品發放紀錄工作表_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * 清空工作表紀錄
     */
    clearWorksheetLogs() {
        localStorage.removeItem('tax_game_redemption_logs');
        this.renderWorksheet();
    }

    /**
     * 驗證成功處理 (輸入兌換碼 7777 後觸發)
     */
    handleVerifySuccess() {
        this.animationEngine.playSuccessSound();

        // 取得輸入的兌換碼並自動在後台工作表新增發放紀錄與時間
        const code = this.codeVerifier ? this.codeVerifier.getCode() : '7777';
        this.addRedemptionLog(code);

        if (this.verifyFormState) this.verifyFormState.classList.add('hidden');
        if (this.verifySuccessState) this.verifySuccessState.classList.remove('hidden');
        if (this.verifyErrorMsg) this.verifyErrorMsg.classList.add('hidden');

        this.animationEngine.startConfetti();
    }

    /**
     * 驗證失敗處理 (代碼非 7777)
     */
    handleVerifyError() {
        this.animationEngine.playErrorSound();
        if (this.verifyErrorMsg) {
            this.verifyErrorMsg.classList.remove('hidden');
        }
    }

    /**
     * 全局重設遊戲 state，重回首頁
     */
    restartGame() {
        this.questionEngine.reset();
        this.scoreEngine.reset();
        this.animationEngine.stopFireworks();
        this.animationEngine.stopConfetti();

        // 復原驗證表單 state
        if (this.verifyFormState) this.verifyFormState.classList.remove('hidden');
        if (this.verifySuccessState) this.verifySuccessState.classList.add('hidden');
        if (this.verifyErrorMsg) this.verifyErrorMsg.classList.add('hidden');
        this.codeVerifier.reset();

        this.showScreen('home');
    }
}

// 於 DOM 載入 completed 時啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    // 實例化遊戲物件 (避免全域變數污染)
    window.taxGame = new Game();
});
