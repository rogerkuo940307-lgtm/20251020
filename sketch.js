// --- 圓的設定 ---
let circles = [];
const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const TARGET_COLOR = '#ffca3a'; // 目標得分顏色 (黃色)
const NUM_CIRCLES = 20;

// 爆破相關設定
const PARTICLE_MIN = 10;
const PARTICLE_MAX = 20;
const PARTICLE_GRAVITY = 0.12;

// 遊戲狀態與音效
let popSound; 
let score = 0;
const TEXT_COLOR = '#03045e';
const TEXT_SIZE = 32;

// --- p5.js 預載入音效 ---
function preload() {
    // 請將 'pop.mp3' 替換為你上傳的音效檔案名稱和路徑
    // 記得要上傳音效檔案到你的專案
    try {
         popSound = loadSound('pop.mp3'); 
    } catch (e) {
        console.error("音效載入失敗，請確認檔案路徑。");
        popSound = null; // 避免在 draw/mouse 裡呼叫不存在的方法
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    // 初始化圓
    circles = [];
    for (let i = 0; i < NUM_CIRCLES; i++) {
        circles.push(createCircle());
    }
    // 設定文字屬性
    textSize(TEXT_SIZE);
    textFont('Arial', TEXT_SIZE); 
}

function createCircle() {
    // 確保顏色是 p5.Color 物件以便於操作
    let c = color(random(COLORS));
    return {
        x: random(width),
        y: random(height),
        r: random(50, 200),
        color: c, 
        colorHex: colorToHex(c), // 儲存 Hex 值用於比較
        alpha: random(80, 255),
        speed: random(1, 5),
        popped: false,
        particles: []
    };
}

// 輔助函式：將 p5.Color 轉換為 Hex 字串 (例如 #RRGGBB)
function colorToHex(c) {
    let r = hex(red(c), 2);
    let g = hex(green(c), 2);
    let b = hex(blue(c), 2);
    return '#' + r + g + b;
}

function spawnParticlesFromCircle(c) {
    const count = floor(random(PARTICLE_MIN, PARTICLE_MAX + 1));
    const cr = red(c.color);
    const cg = green(c.color);
    const cb = blue(c.color);
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const speed = random(1, 6);
        c.particles.push({
            x: c.x + cos(angle) * random(0, c.r / 4),
            y: c.y + sin(angle) * random(0, c.r / 4),
            vx: cos(angle) * speed + random(-1, 1),
            vy: sin(angle) * speed + random(-1, 1) - 2, 
            size: random(3, max(6, c.r / 20)),
            r: cr,
            g: cg,
            b: cb,
            alpha: 255,
            life: random(40, 100)
        });
    }
}

function draw() {
    background('#fcf6bd');
    noStroke();
    
    // --- 畫出圓和粒子 ---
    for (let i = 0; i < circles.length; i++) {
        let c = circles[i];
        
        if (c.popped) {
            // 更新與畫出粒子
            for (let p of c.particles) {
                p.vy += PARTICLE_GRAVITY;
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 4;
                p.life -= 1;
                fill(p.r, p.g, p.b, max(0, p.alpha));
                circle(p.x, p.y, p.size);
            }
            
            // 清除已經消失的粒子
            c.particles = c.particles.filter(p => p.alpha > 0 && p.life > 0);
            
            // 如果粒子都結束，重生這個圓
            if (c.particles.length === 0) {
                let newC = createCircle();
                newC.x = random(width);
                newC.y = height + newC.r / 2;
                circles[i] = newC; // 直接替換掉原來的圓
            }
            continue; 
        }

        // 未爆破：正常漂浮與畫圓
        c.y -= c.speed;
        if (c.y + c.r / 2 < 0) { // 如果圓完全移出畫面頂端
            let newC = createCircle();
            newC.x = random(width);
            newC.y = height + newC.r / 2;
            circles[i] = newC; 
            continue;
        }
        
        c.color.setAlpha(c.alpha); 
        fill(c.color); 
        circle(c.x, c.y, c.r); 

        // 畫出反光方形
        let squareSize = c.r / 6;
        let angle = -PI / 4; 
        let distance = c.r / 2 * 0.65; 
        let squareCenterX = c.x + cos(angle) * distance;
        let squareCenterY = c.y + sin(angle) * distance;
        fill(255, 255, 255, 120); 
        noStroke();
        rectMode(CENTER);
        rect(squareCenterX, squareCenterY, squareSize, squareSize);
    }
    
    // --- 畫出左上角文字 (固定文字) ---
    fill(TEXT_COLOR);
    textAlign(LEFT, TOP);
    text('412730730', 10, 10);

    // --- 畫出右上角文字 (分數) ---
    textAlign(RIGHT, TOP);
    text(`Score: ${score}`, width - 10, 10);
}

function mousePressed() {
    // 檢查點擊是否在任何一個未爆破的圓形內
    for (let c of circles) {
        if (!c.popped) {
            // 計算滑鼠位置與圓心之間的距離
            let d = dist(mouseX, mouseY, c.x, c.y);
            
            // 如果距離小於半徑，表示點擊在圓形範圍內
            if (d < c.r / 2) {
                // 1. 設置爆破狀態並產生粒子
                c.popped = true;
                spawnParticlesFromCircle(c);
                
                // 2. 播放音效
                if (popSound) {
                    // 為了允許連續點擊，即使音效正在播放也會重新開始
                    popSound.play(); 
                }
                
                // 3. 更新分數
                // 將圓的顏色（Hex）與目標顏色（Hex）進行比較
                if (c.colorHex.toUpperCase() === TARGET_COLOR.toUpperCase()) {
                    score += 1; // 加 1 分
                } else {
                    score -= 1; // 扣 1 分
                }
                
                // 只處理一次點擊，找到第一個就跳出迴圈
                return; 
            }
        }
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // 重新分布圓的位置
    for (let c of circles) {
        if (!c.popped) { 
            c.x = random(width);
            c.y = random(height);
        }
    }
    textSize(TEXT_SIZE); // 確保重新設定文字大小
}