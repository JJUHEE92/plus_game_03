// 게임 상태 관리
const gameState = {
    currentScore: 0,
    timeLeft: 5000, // 5초
    timerInterval: null,
    isGameActive: false
};

// 오디오 요소
const sounds = {
    correct: document.getElementById('correctSound'),
    wrong: document.getElementById('wrongSound'),
    success: document.getElementById('successSound')
};

// 오디오 초기화 및 재생 함수
function initSounds() {
    // 모든 오디오 요소에 대해 초기화
    Object.values(sounds).forEach(sound => {
        if (!sound) {
            console.error('오디오 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 오디오 파일 존재 여부 확인
        const audioPath = sound.src;
        console.log('오디오 파일 경로:', audioPath);
        
        sound.load(); // 오디오 로드
        // iOS Safari를 위한 처리
        sound.volume = 1.0;
        sound.muted = false;
        
        // 오디오 로드 이벤트 리스너
        sound.addEventListener('loadeddata', () => {
            console.log('오디오 파일 로드 완료:', audioPath);
        });
        
        // 오디오 에러 이벤트 리스너
        sound.addEventListener('error', (e) => {
            console.error('오디오 파일 로드 실패:', audioPath, e.target.error);
        });
    });
}

// 오디오 재생 함수
function playSound(soundId) {
    const sound = sounds[soundId];
    if (!sound) {
        console.error(`'${soundId}' 오디오를 찾을 수 없습니다.`);
        return Promise.resolve();
    }
    
    console.log(`'${soundId}' 오디오 재생 시도`);
    sound.currentTime = 0; // 재생 위치 초기화
    
    // 재생 약속 반환
    return sound.play()
        .then(() => {
            console.log(`'${soundId}' 오디오 재생 시작`);
        })
        .catch(error => {
            console.error(`'${soundId}' 오디오 재생 실패:`, error);
            // 사용자 상호작용이 필요한 경우
            if (error.name === 'NotAllowedError') {
                console.log('브라우저에서 자동 재생이 차단되었습니다. 사용자 상호작용이 필요합니다.');
            }
        });
}

// 화면 요소
const screens = {
    start: document.getElementById('startScreen'),
    game: document.getElementById('gameScreen'),
    fail: document.getElementById('failScreen'),
    success: document.getElementById('successScreen')
};

// 게임 요소
const timerProgress = document.getElementById('timerProgress');
const scoreDisplay = document.getElementById('score');
const problemDisplay = document.getElementById('problem');
const answerInput = document.getElementById('answerInput');
const failImage = document.getElementById('failImage');

// 버튼 요소
const startButton = document.getElementById('startButton');
const submitButton = document.getElementById('submitButton');
const retryButton = document.getElementById('retryButton');
const homeButton = document.getElementById('homeButton');
const saveCouponButton = document.getElementById('saveCouponButton');
const successHomeButton = document.getElementById('successHomeButton');

// 현재 문제의 정답
let currentAnswer = 0;

// 화면 전환 함수
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenId].classList.add('active');
}

// 랜덤 숫자 생성 (10~50)
function getRandomNumber() {
    return Math.floor(Math.random() * 41) + 10;
}

// 새로운 문제 생성
function generateNewProblem() {
    const num1 = getRandomNumber();
    const num2 = getRandomNumber();
    currentAnswer = num1 + num2;
    problemDisplay.textContent = `${num1} + ${num2} = ?`;
}

// 타이머 시작
function startTimer() {
    gameState.timeLeft = 5000;
    timerProgress.style.width = '100%';
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    const startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        gameState.timeLeft = Math.max(0, 5000 - elapsed);
        const percentage = (gameState.timeLeft / 5000) * 100;
        timerProgress.style.width = `${percentage}%`;

        if (gameState.timeLeft <= 0) {
            handleWrongAnswer('시간 초과!');
        }
    }, 100);
}

// 실패 이미지 애니메이션
function animateFailImage() {
    failImage.style.display = 'block';
    failImage.style.position = 'fixed';
    failImage.style.left = '-100px';
    failImage.style.top = '50%';
    failImage.style.transform = 'translateY(-50%)';
    failImage.style.transition = 'left 4s linear';
    
    setTimeout(() => {
        failImage.style.left = '100%';
    }, 100);

    setTimeout(() => {
        failImage.style.display = 'none';
        failImage.style.left = '-100px';
    }, 4000);
}

// 정답 체크
function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    if (userAnswer === currentAnswer) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer('틀린 답입니다!');
    }
}

// 정답 처리
async function handleCorrectAnswer() {
    await playSound('correct');
    gameState.currentScore++;
    scoreDisplay.textContent = `연속 정답: ${gameState.currentScore}/3`;
    
    if (gameState.currentScore >= 3) {
        clearInterval(gameState.timerInterval);
        await playSound('success');
        generateCoupon();
        showScreen('success');
    } else {
        answerInput.value = '';
        generateNewProblem();
        startTimer();
    }
}

// 오답 처리
async function handleWrongAnswer(message) {
    clearInterval(gameState.timerInterval);
    await playSound('wrong');
    animateFailImage();
    document.getElementById('failMessage').textContent = message;
    showScreen('fail');
}

// 쿠폰 생성
function generateCoupon() {
    const canvas = document.getElementById('couponCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 200;
    
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff69b4');
    gradient.addColorStop(1, '#ff1493');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 장식적인 테두리
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // 미용실 로고 (가위 이모지)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✂️ 비비드뷰티하우스 ✂️', canvas.width/2, 50);
    
    // 쿠폰 내용
    ctx.font = 'bold 24px "Noto Sans KR"';
    ctx.fillText('3,000원 할인 쿠폰', canvas.width/2, 90);
    
    // 구분선
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(canvas.width - 30, 110);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();
    
    // 유효기간
    const today = new Date();
    const expiry = new Date(today.setDate(today.getDate() + 30));
    ctx.font = '16px "Noto Sans KR"';
    ctx.fillText(`유효기간: ${expiry.toLocaleDateString()}`, canvas.width/2, 140);
    
    // 장식 요소
    ctx.font = '20px Arial';
    ctx.fillText('💇‍♀️ 💅 💆‍♀️', canvas.width/2, 170);
}

// 쿠폰 저장
function saveCoupon() {
    const canvas = document.getElementById('couponCanvas');
    const link = document.createElement('a');
    link.download = '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// 게임 초기화
function resetGame() {
    gameState.currentScore = 0;
    scoreDisplay.textContent = '연속 정답: 0/3';
    answerInput.value = '';
    generateNewProblem();
    startTimer();
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    initSounds(); // 오디오 초기화
});

startButton.addEventListener('click', () => {
    showScreen('game');
    resetGame();
});

submitButton.addEventListener('click', checkAnswer);

answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

retryButton.addEventListener('click', () => {
    showScreen('game');
    resetGame();
});

homeButton.addEventListener('click', () => {
    showScreen('start');
});

successHomeButton.addEventListener('click', () => {
    showScreen('start');
});

saveCouponButton.addEventListener('click', saveCoupon); 