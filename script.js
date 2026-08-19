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
                options: ["健保卡", "手機條碼（載具）", "身分證"],
                correctIndex: 1 // 手機條碼（載具）
            },
            {
                id: 2,
                title: "擁有自用住宅要如何節稅？",
                options: ["申請稅單分期繳納", "申請地價稅自用住宅優惠稅率", "申請轉帳納稅"],
                correctIndex: 1 // 申請地價稅自用住宅優惠稅率
            },
            {
                id: 3,
                title: "地價稅自用住宅優惠稅率申請期限",
                options: ["9月1日", "9月22日", "11月1日"],
                correctIndex: 1 // 9月22日
            },
            {
                id: 4,
                title: "何時繳納地價稅？",
                options: ["5月1日~5月30日", "11月1日~11月30日", "12月1日~12月31日"],
                correctIndex: 1 // 11月1日~11月30日
            },
            {
                id: 5,
                title: "哪裡不能繳稅？",
                options: ["超商", "郵局", "銀行"],
                correctIndex: 1 // 郵局
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

// 全球跨手機與電腦通用之雲端即時同步資料庫節點 (支援 GitHub Pages 靜態託管與跨裝置即時連線)
const CLOUD_DB_URL = 'https://kvdb.io/Rzq4Se1xwbYS1SW3fYY9vA/tax_game_data';

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
        this.fetchServerStats();
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
        this.verifyClearBtn = document.getElementById('verify-clear-btn');
        this.verifySubmitBtn = document.getElementById('verify-submit-btn');
        this.restartGameFinalBtn = document.getElementById('restart-game-final-btn');
        this.orangeCatImg = document.getElementById('orange-cat-protected-img');

        // 確保手機端與各瀏覽器 100% 穩定顯示去背超人小橘
        if (this.orangeCatImg && window.ORANGE_CAT_IMAGE_BASE64) {
            this.orangeCatImg.src = window.ORANGE_CAT_IMAGE_BASE64;
        }

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
        this.openWorksheetBtnHome = document.getElementById('open-worksheet-btn-home');
        this.openWorksheetBtnForm = document.getElementById('open-worksheet-btn-form');
        this.openWorksheetBtnSuccess = document.getElementById('open-worksheet-btn-success');
        this.worksheetModal = document.getElementById('worksheet-modal');
        this.closeWorksheetModalBtn = document.getElementById('close-worksheet-modal-btn');
        this.refreshWorksheetBtn = document.getElementById('refresh-worksheet-btn');
        this.worksheetTotalPlays = document.getElementById('worksheet-total-plays');
        this.worksheetTotalRedemptions = document.getElementById('worksheet-total-redemptions');
        this.worksheetPhonePlays = document.getElementById('worksheet-phone-plays');
        this.worksheetPcPlays = document.getElementById('worksheet-pc-plays');
        this.worksheetTbody = document.getElementById('worksheet-tbody');
        this.worksheetEmptyMsg = document.getElementById('worksheet-empty-msg');
        this.exportCsvBtn = document.getElementById('export-csv-btn');
        this.clearWorksheetBtn = document.getElementById('clear-worksheet-btn');

        // Cached multi-device stats & polling timer
        this.cachedStats = {
            totalPlays: 0,
            phonePlays: 0,
            pcPlays: 0,
            totalRedemptions: 0,
            redemptions: []
        };
        this.pollInterval = null;

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

        // Google Sheets Sync Modal elements
        this.sheetsConfigBtn = document.getElementById('sheets-config-btn');
        this.sheetsModal = document.getElementById('sheets-modal');
        this.closeSheetsModalBtn = document.getElementById('close-sheets-modal-btn');
        this.sheetsWebhookUrlInput = document.getElementById('sheets-webhook-url-input');
        this.sheetsStatusMsg = document.getElementById('sheets-status-msg');
        this.sheetsTestBtn = document.getElementById('sheets-test-btn');
        this.sheetsSaveBtn = document.getElementById('sheets-save-btn');
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

        // 驗證頁面清除按鈕 (清空 4 位數輸入框並重新聚焦第 1 格)
        if (this.verifyClearBtn) {
            this.verifyClearBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                if (this.codeVerifier) {
                    this.codeVerifier.reset();
                }
                if (this.verifyErrorMsg) {
                    this.verifyErrorMsg.classList.add('hidden');
                }
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
        if (this.openWorksheetBtnHome) this.openWorksheetBtnHome.addEventListener('click', handleOpenPwdModal);
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

        // 重新整理工作表數據
        if (this.refreshWorksheetBtn) {
            this.refreshWorksheetBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.fetchServerStats();
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

        // Google 試算表連動設定 Modal
        if (this.sheetsConfigBtn) {
            this.sheetsConfigBtn.addEventListener('click', () => {
                this.animationEngine.playClickSound();
                this.openSheetsModal();
            });
        }
        if (this.closeSheetsModalBtn) {
            this.closeSheetsModalBtn.addEventListener('click', () => {
                this.closeSheetsModal();
            });
        }
        if (this.sheetsModal) {
            this.sheetsModal.addEventListener('click', (e) => {
                if (e.target === this.sheetsModal) this.closeSheetsModal();
            });
        }
        if (this.sheetsSaveBtn) {
            this.sheetsSaveBtn.addEventListener('click', () => {
                this.saveSheetsWebhookUrl();
            });
        }
        if (this.sheetsTestBtn) {
            this.sheetsTestBtn.addEventListener('click', () => {
                this.testSheetsWebhook();
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
     * 取得目前使用者裝置類型 (手機 / 平板 / 電腦)
     * @returns {'phone' | 'tablet' | 'desktop'}
     */
    getDeviceType() {
        const ua = navigator.userAgent || '';
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
            return 'phone';
        }
        if (window.innerWidth <= 768) {
            return 'phone';
        }
        return 'desktop';
    }

    /**
     * 跨手機/電腦即時向全球雲端資料庫與後端登記一次遊玩人次
     */
    async recordGamePlay() {
        const deviceType = this.getDeviceType();
        const isPhone = deviceType === 'phone' || deviceType === 'tablet';
        const deviceLabel = isPhone ? '📱 手機' : '💻 電腦';

        // 1. 同步全球雲端資料庫 (支援 GitHub Pages 與任何連網手機/電腦)
        try {
            const getRes = await fetch(`${CLOUD_DB_URL}?t=${Date.now()}`);
            let data = { totalPlays: 0, phonePlays: 0, pcPlays: 0, redemptions: [] };
            if (getRes.ok) {
                data = await getRes.json();
            }
            data.totalPlays = (Number(data.totalPlays) || 0) + 1;
            if (isPhone) {
                data.phonePlays = (Number(data.phonePlays) || 0) + 1;
            } else {
                data.pcPlays = (Number(data.pcPlays) || 0) + 1;
            }
            if (!Array.isArray(data.redemptions)) data.redemptions = [];

            await fetch(CLOUD_DB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            this.cachedStats.totalPlays = data.totalPlays;
            this.cachedStats.phonePlays = data.phonePlays;
            this.cachedStats.pcPlays = data.pcPlays;
            localStorage.setItem('tax_game_data_cache', JSON.stringify(this.cachedStats));
        } catch (err) {
            console.warn('雲端更新遊玩人次連線中，累計至本機快取:', err);
            this.cachedStats.totalPlays = (this.cachedStats.totalPlays || 0) + 1;
            if (isPhone) this.cachedStats.phonePlays = (this.cachedStats.phonePlays || 0) + 1;
            else this.cachedStats.pcPlays = (this.cachedStats.pcPlays || 0) + 1;
        }

        // 2. 背景觸發 Google 試算表連動 Webhook (若已設定)
        this.sendToSheetsWebhook({
            action: 'play',
            deviceType: deviceLabel,
            time: new Date().toLocaleString('zh-TW', { hour12: false })
        });

        // 3. 背景嘗試本地 Express 伺服器 (若有)
        try {
            fetch('/api/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceType })
            }).catch(() => {});
        } catch (e) {}
    }

    /**
     * 開始進入答題階段
     */
    startQuiz() {
        this.questionEngine.reset();
        this.scoreEngine.reset();
        this.showScreen('quiz');
        this.renderCurrentQuestion();
        // 跨裝置記錄此手機或電腦的遊玩人次
        this.recordGamePlay();
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
        if (this.orangeCatImg && window.ORANGE_CAT_IMAGE_BASE64 && (!this.orangeCatImg.src || this.orangeCatImg.src.indexOf('data:image') === -1)) {
            this.orangeCatImg.src = window.ORANGE_CAT_IMAGE_BASE64;
        }

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
     * 向雲端即時資料庫或伺服器讀取跨裝置最新遊戲人數與宣導品發放紀錄
     */
    async fetchServerStats() {
        try {
            // 優先連線全球跨裝置雲端資料庫 (支援 GitHub Pages 靜態網站與跨手機/電腦即時同步)
            const cloudRes = await fetch(`${CLOUD_DB_URL}?t=${Date.now()}`);
            if (cloudRes.ok) {
                const data = await cloudRes.json();
                if (data && typeof data === 'object') {
                    this.cachedStats = {
                        totalPlays: Number(data.totalPlays) || 0,
                        phonePlays: Number(data.phonePlays) || 0,
                        pcPlays: Number(data.pcPlays) || 0,
                        totalRedemptions: Array.isArray(data.redemptions) ? data.redemptions.length : (Number(data.totalRedemptions) || 0),
                        redemptions: Array.isArray(data.redemptions) ? data.redemptions : []
                    };
                    localStorage.setItem('tax_game_data_cache', JSON.stringify(this.cachedStats));
                    this.renderWorksheet();
                    return;
                }
            }
        } catch (err) {
            console.warn('雲端資料庫連線中，嘗試備援方案:', err);
        }

        // 備援方案 1: 本地 Express 伺服器 (若在 Node / Docker 環境中)
        try {
            const localRes = await fetch('/api/stats');
            if (localRes.ok) {
                const data = await localRes.json();
                if (data.success) {
                    this.cachedStats = {
                        totalPlays: typeof data.totalPlays === 'number' ? data.totalPlays : 0,
                        phonePlays: typeof data.phonePlays === 'number' ? data.phonePlays : 0,
                        pcPlays: typeof data.pcPlays === 'number' ? data.pcPlays : 0,
                        totalRedemptions: typeof data.totalRedemptions === 'number' ? data.totalRedemptions : (data.redemptions ? data.redemptions.length : 0),
                        redemptions: Array.isArray(data.redemptions) ? data.redemptions : []
                    };
                    this.renderWorksheet();
                    return;
                }
            }
        } catch (e) {}

        // 備援方案 2: 本機暫存
        const localCache = localStorage.getItem('tax_game_data_cache');
        if (localCache) {
            try {
                this.cachedStats = JSON.parse(localCache);
            } catch (e) {}
        }
        this.renderWorksheet();
    }

    /**
     * 新增一筆發放紀錄至全球雲端資料庫、Google 試算表與本地快取
     * @param {string} code 
     */
    async addRedemptionLog(code = '7777') {
        const deviceType = this.getDeviceType();
        const isPhone = deviceType === 'phone' || deviceType === 'tablet';
        const deviceLabel = isPhone ? '📱 手機' : '💻 電腦';

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeStr = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

        // 1. 寫入全球雲端資料庫
        try {
            const getRes = await fetch(`${CLOUD_DB_URL}?t=${Date.now()}`);
            let data = { totalPlays: 0, phonePlays: 0, pcPlays: 0, redemptions: [] };
            if (getRes.ok) {
                data = await getRes.json();
            }
            if (!Array.isArray(data.redemptions)) data.redemptions = [];

            const newEntry = {
                id: data.redemptions.length + 1,
                time: timeStr,
                timestamp: Date.now(),
                code: code,
                status: '已兌換核銷',
                deviceType: deviceLabel
            };

            data.redemptions.push(newEntry);
            data.totalRedemptions = data.redemptions.length;

            await fetch(CLOUD_DB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            this.cachedStats = {
                totalPlays: Number(data.totalPlays) || 0,
                phonePlays: Number(data.phonePlays) || 0,
                pcPlays: Number(data.pcPlays) || 0,
                totalRedemptions: data.redemptions.length,
                redemptions: data.redemptions
            };
            localStorage.setItem('tax_game_data_cache', JSON.stringify(this.cachedStats));
            this.renderWorksheet();
        } catch (err) {
            console.warn('寫入雲端紀錄異常，存入本機快取:', err);
            const newEntry = {
                id: (this.cachedStats.redemptions.length || 0) + 1,
                time: timeStr,
                timestamp: Date.now(),
                code: code,
                status: '已兌換核銷',
                deviceType: deviceLabel
            };
            this.cachedStats.redemptions.push(newEntry);
            this.cachedStats.totalRedemptions = this.cachedStats.redemptions.length;
            this.renderWorksheet();
        }

        // 2. 即時連動 Google 試算表 Webhook (若有設定)
        this.sendToSheetsWebhook({
            action: 'redeem',
            time: timeStr,
            deviceType: deviceLabel,
            code: code,
            status: '已兌換核銷'
        });

        // 3. 背景通知本地 Express 伺服器 (若有)
        try {
            fetch('/api/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, deviceType })
            }).catch(() => {});
        } catch (e) {}
    }

    /**
     * 發送數據至工作人員自訂的 Google 試算表 Webhook
     */
    async sendToSheetsWebhook(payload) {
        const webhookUrl = localStorage.getItem('tax_game_sheets_webhook_url');
        if (!webhookUrl || !webhookUrl.startsWith('http')) return;

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('Google 試算表連動發送失敗:', e);
        }
    }

    /**
     * 開啟 Google 試算表設定視窗
     */
    openSheetsModal() {
        const currentUrl = localStorage.getItem('tax_game_sheets_webhook_url') || '';
        if (this.sheetsWebhookUrlInput) this.sheetsWebhookUrlInput.value = currentUrl;
        if (this.sheetsStatusMsg) {
            this.sheetsStatusMsg.className = 'hidden';
            this.sheetsStatusMsg.textContent = '';
        }
        if (this.sheetsModal) this.sheetsModal.classList.remove('hidden');
    }

    closeSheetsModal() {
        if (this.sheetsModal) this.sheetsModal.classList.add('hidden');
    }

    saveSheetsWebhookUrl() {
        this.animationEngine.playClickSound();
        const url = this.sheetsWebhookUrlInput ? this.sheetsWebhookUrlInput.value.trim() : '';
        if (url) {
            localStorage.setItem('tax_game_sheets_webhook_url', url);
            if (this.sheetsStatusMsg) {
                this.sheetsStatusMsg.className = '';
                this.sheetsStatusMsg.style.background = '#dcfce7';
                this.sheetsStatusMsg.style.color = '#166534';
                this.sheetsStatusMsg.textContent = '✓ Google 試算表網址儲存成功！每次遊玩與核銷將即時發送至該試算表。';
            }
        } else {
            localStorage.removeItem('tax_game_sheets_webhook_url');
            if (this.sheetsStatusMsg) {
                this.sheetsStatusMsg.className = '';
                this.sheetsStatusMsg.style.background = '#f1f5f9';
                this.sheetsStatusMsg.style.color = '#475569';
                this.sheetsStatusMsg.textContent = '已清除 Google 試算表網址，維持預設雲端資料庫同步。';
            }
        }
        setTimeout(() => this.closeSheetsModal(), 1500);
    }

    async testSheetsWebhook() {
        this.animationEngine.playClickSound();
        const url = this.sheetsWebhookUrlInput ? this.sheetsWebhookUrlInput.value.trim() : '';
        if (!url || !url.startsWith('http')) {
            if (this.sheetsStatusMsg) {
                this.sheetsStatusMsg.className = '';
                this.sheetsStatusMsg.style.background = '#fee2e2';
                this.sheetsStatusMsg.style.color = '#991b1b';
                this.sheetsStatusMsg.textContent = '請先填寫正確的 Google Apps Script 網址 (https://script.google.com/...)';
            }
            return;
        }

        if (this.sheetsStatusMsg) {
            this.sheetsStatusMsg.className = '';
            this.sheetsStatusMsg.style.background = '#e0f2fe';
            this.sheetsStatusMsg.style.color = '#075985';
            this.sheetsStatusMsg.textContent = '正在發送測試封包至 Google Apps Script...';
        }

        try {
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test', time: new Date().toLocaleString(), msg: '中秋租稅遊戲連線測試' })
            });
            if (this.sheetsStatusMsg) {
                this.sheetsStatusMsg.style.background = '#dcfce7';
                this.sheetsStatusMsg.style.color = '#166534';
                this.sheetsStatusMsg.textContent = '✓ 測試封包已順利送出！請確認您的 Google 試算表是否有接收到連線測試列。';
            }
        } catch (e) {
            if (this.sheetsStatusMsg) {
                this.sheetsStatusMsg.style.background = '#fee2e2';
                this.sheetsStatusMsg.style.color = '#991b1b';
                this.sheetsStatusMsg.textContent = '連線測試異常，請檢查網址權限是否設為「任何人 (Anyone)」皆可存取。';
            }
        }
    }

    /**
     * 取得本機離線備份紀錄
     */
    getLocalRedemptionLogs() {
        const stored = localStorage.getItem('tax_game_data_cache');
        if (!stored) return [];
        try {
            const parsed = JSON.parse(stored);
            return parsed.redemptions || [];
        } catch (e) {
            return [];
        }
    }

    /**
     * 渲染後台發放紀錄工作表表格與跨裝置統計摘要
     */
    renderWorksheet() {
        // 更新累計人次與裝置分佈
        if (this.worksheetTotalPlays) {
            this.worksheetTotalPlays.textContent = this.cachedStats.totalPlays || 0;
        }
        if (this.worksheetTotalRedemptions) {
            this.worksheetTotalRedemptions.textContent = this.cachedStats.totalRedemptions || (this.cachedStats.redemptions ? this.cachedStats.redemptions.length : 0);
        }
        if (this.worksheetPhonePlays) {
            this.worksheetPhonePlays.textContent = this.cachedStats.phonePlays || 0;
        }
        if (this.worksheetPcPlays) {
            this.worksheetPcPlays.textContent = this.cachedStats.pcPlays || 0;
        }

        if (!this.worksheetTbody) return;

        const logs = this.cachedStats.redemptions && this.cachedStats.redemptions.length > 0
            ? this.cachedStats.redemptions
            : this.getLocalRedemptionLogs();

        if (logs.length === 0) {
            this.worksheetTbody.innerHTML = '';
            if (this.worksheetEmptyMsg) this.worksheetEmptyMsg.classList.remove('hidden');
        } else {
            if (this.worksheetEmptyMsg) this.worksheetEmptyMsg.classList.add('hidden');
            // 將最新發放呈現於最上方
            const rowsHtml = logs.slice().reverse().map((log) => {
                const isPhone = log.deviceType === '手機' || log.deviceType === 'phone' || log.deviceType === '📱 手機' || log.deviceType === '平板' || log.deviceType === 'tablet';
                const deviceLabel = log.deviceType && log.deviceType.includes('手機')
                    ? '📱 手機'
                    : log.deviceType && log.deviceType.includes('平板')
                    ? '📱 平板'
                    : log.deviceType === 'phone'
                    ? '📱 手機'
                    : '💻 電腦';

                return `
                    <tr>
                        <td>#${log.id}</td>
                        <td>${log.time}</td>
                        <td><span class="device-tag ${isPhone ? 'device-phone' : ''}">${deviceLabel}</span></td>
                        <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${log.code}</code></td>
                        <td><span style="color:#16a34a; font-weight:700;">✓ ${log.status || '已核銷'}</span></td>
                    </tr>
                `;
            }).join('');
            this.worksheetTbody.innerHTML = rowsHtml;
        }
    }

    /**
     * 開啟工作表 Modal 並啟動即時輪詢以同步多台手機/電腦
     */
    openWorksheetModal() {
        this.fetchServerStats();
        if (this.worksheetModal) {
            this.worksheetModal.classList.remove('hidden');
        }

        // 開啟時每 3 秒自動向雲端輪詢最新數據
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => {
            this.fetchServerStats();
        }, 3000);
    }

    /**
     * 關閉工作表 Modal 並停止輪詢
     */
    closeWorksheetModal() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.worksheetModal) {
            this.worksheetModal.classList.add('hidden');
        }
    }

    /**
     * 匯出 Excel / CSV 工作表檔案 (包含跨裝置來源)
     */
    exportWorksheetCSV() {
        const logs = this.cachedStats.redemptions && this.cachedStats.redemptions.length > 0
            ? this.cachedStats.redemptions
            : this.getLocalRedemptionLogs();

        if (logs.length === 0) {
            alert('目前尚無發放紀錄可供匯出！');
            return;
        }

        // 加入 UTF-8 BOM，確保 Excel 雙擊開啟不亂碼
        let csvContent = '\uFEFF';
        csvContent += '序號,發放時間,來源裝置,驗證兌換碼,核銷狀態\r\n';

        logs.forEach(log => {
            const idStr = log.id;
            const timeStr = (log.time || '').replace(/,/g, ' ');
            const deviceStr = (log.deviceType || '電腦').replace(/,/g, ' ');
            const codeStr = (log.code || '7777').replace(/,/g, ' ');
            const statusStr = (log.status || '已核銷').replace(/,/g, ' ');
            csvContent += `${idStr},${timeStr},${deviceStr},${codeStr},${statusStr}\r\n`;
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
        link.download = `跨裝置宣導品發放紀錄工作表_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * 清空工作表紀錄 (需密碼保護，清空全球雲端與本機)
     */
    async clearWorksheetLogs() {
        const emptyData = {
            totalPlays: 0,
            phonePlays: 0,
            pcPlays: 0,
            redemptions: []
        };

        // 1. 清空全球雲端資料庫
        try {
            await fetch(CLOUD_DB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emptyData)
            });
        } catch (err) {
            console.warn('雲端清空失敗:', err);
        }

        // 2. 清空本地 Express 伺服器 (若有)
        try {
            await fetch('/api/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: '1234' })
            });
        } catch (e) {}

        // 3. 清空本機快取
        localStorage.removeItem('tax_game_data_cache');
        localStorage.removeItem('tax_game_redemption_logs');
        this.cachedStats = emptyData;
        this.renderWorksheet();
    }

    /**
     * 驗證成功處理 (輸入兌換碼 7777 後觸發)
     */
    handleVerifySuccess() {
        this.animationEngine.playSuccessSound();

        // 取得輸入的兌換碼並即時在中央雲端與工作表新增發放紀錄
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
