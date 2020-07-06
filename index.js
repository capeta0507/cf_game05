var START_TIMEOUT = 3; // 遊戲開頭倒數時間
var GAME_TIME = 40; // 遊戲總時間
var GAME_TARGET = 40; // 遊戲分數目標
var TOLERANCE = 1; // 判定容許範圍(秒)

var windowIsFocused = true;
$(window).focus(function () {
	windowIsFocused = true;
});
$(window).blur(function () {
	windowIsFocused = false;
});

var sound = new Howl({
	src: ['./sound/inevitable.mp3'],
})

var analyser = Howler.ctx.createAnalyser();
analyser.fftSize = 32;
Howler.masterGain.connect(analyser);
analyser.connect(Howler.ctx.destination);
var dataArray = new Uint8Array(analyser.frequencyBinCount)

function startCountDown(stepCallBack, finalCallBack) {
	var time = START_TIMEOUT;
	function count() {
		time--;
		if (time > 0) {
			setTimeout(function () {
				if (stepCallBack) stepCallBack(time);
				count();
			}, 1000);
		} else if (time === 0) {
			setTimeout(function () {
				if (finalCallBack) finalCallBack();
			}, 1000);
		}
	}
	count();
}

$(function () {
	restartGame();
});

function restartGame() {
	if (game && $('#timerDigit').text() == START_TIMEOUT) return;
	game = Object.assign({}, GAME_INIT_STATE);
	game.data = Object.assign({}, GAME_INIT_DATA);

	// 重置網頁元素
	$('#startTimer').fadeIn(100);
	$('#gameResultWin').fadeOut();
	$('#gameResultLose').fadeOut();
	$('#timerDigit').text(START_TIMEOUT);
	$('#gameCountDown').text(GAME_TIME);
	$('#timerMask').attr('stroke-dashoffset', 314.16);

	$('.heart').removeClass('heart-off');
	$('.area .point').remove();
	$("#startGameButton").removeClass('active');

	$("#startGameButton").one("click", function () {
		$("#startGameButton").addClass('active');
		$('#startTimer').fadeOut(100);
		$('#timerDigit').text(1);
		gameInit();
	})


	// 遊戲開始倒數開始
	// startCountDown(
	// 	function (value) {
	// 		// 倒數更新畫面
	// 		$('#timerDigit').text(String(value));
	// 	},
	// 	function () {
	// 		// 遊戲開始
	// 		$('#startTimer').fadeOut(100);

	// 		gameInit();
	// 	}
	// );
}



function animate(time, period) {
	// period 當前畫面上一幀畫面間隔時間 (ms)
	period = Math.min(30, period || 0)

	if (game.data.leftButtonFreeze >= 0) game.data.leftButtonFreeze -= period
	if (game.data.rightButtonFreeze >= 0) game.data.rightButtonFreeze -= period

	var trackTime = sound.seek();

	// 更新資料
	var delta = period / 1000

	var beatTrackLength = $('.area-left').width()

	for (var i = 0; (i < 10 && game.data.offset + i < game.data.nextBeats.length); i++) {
		var beat = game.data.nextBeats[game.data.offset + i];
		var dist = beat.time - trackTime;
		var DURATION = 2.5;

		if (dist < DURATION + 0.2 && !beat.elem) {
			beat.elem = $('<div class="point"></div>');
			if (beat.color === 'blue') $('.area-left').append(beat.elem);
			if (beat.color === 'red') $('.area-right').append(beat.elem);
		}

		if (dist < DURATION && !beat.dead) {

			if (beat.color === 'blue') {
				beat.elem.css('transform', 'translateX(' + (DURATION - (dist)) / -DURATION * beatTrackLength + 'px)')
			}
			if (beat.color === 'red') {
				beat.elem.css('transform', 'translateX(' + (DURATION - (dist)) / DURATION * beatTrackLength + 'px)')
			}
		}

		if (dist < 1 && !beat.dead) {
			beat.elem.css('opacity', 0.5);
		}

		if (Math.abs(dist) < TOLERANCE / 2) {
			if (
				(beat.color === 'blue' && game.data.leftButtonClicked) ||
				(beat.color === 'red' && game.data.rightButtonClicked)
			) {
				if (dist < TOLERANCE / 4) {
					// GREAT
					beat.result = $('<div class="good"/>');
				} else {
					// GOOD
					beat.result = $('<div class="good"/>');
				}
			}
		}

		// if (dist < 0 && !beat.acted) {
		// 	if (beat.color === 'blue') {
		// 		$('#char .left').addClass('active')
		// 		setTimeout(function () {
		// 			$('#char .left').removeClass('active');
		// 		}, 300)
		// 	}
		// 	if (beat.color === 'red') {
		// 		$('#char .right').addClass('active')
		// 		setTimeout(function () {
		// 			$('#char .right').removeClass('active');
		// 		}, 300)
		// 	};
		// 	beat.acted = true;
		// }

		if ((dist < -TOLERANCE / 2 || beat.result) && !beat.dead) {
			if (!beat.result) {
				beat.result = $('<div class="miss"/>');
				game.life--
				$('.emoji').addClass('miss');
				setTimeout(function () { $('.emoji').removeClass('miss') }, 300)

				$('.heart').eq(game.life).addClass('heart-off');

				if (game.life <= 0) {
					game.gameLose = true
					game.playing = false
					gameStop();
					gameLose();
				}
			}
			if (beat.color === 'blue') {
				$("#leftButton").append(beat.result);
			}
			if (beat.color === 'red') {
				$("#rightButton").append(beat.result);
			};

			setTimeout(function () {
				this.result.remove();
				delete this.result;
			}.bind(beat), 2000);
			beat.dead = true;
			beat.elem.css('opacity', 0);
		}

		if (dist < -1) {
			beat.elem.remove()
			delete beat.elem;
			game.data.offset++;
		}

	}

	// 聲音視覺化
	if (window.innerWidth / window.innerHeight > 3 / 2) {
		analyser.getByteTimeDomainData(dataArray);
		var scale = 1 + dataArray[8] / 128 * 0.1;
		$('.speaker').css('transform', 'scale(' + scale + ')');
	}

	if (trackTime > 2.35 && (trackTime - 2.35) % 0.55 < 0.03) {
		var rand = Math.random();
		if (!danceLTimeout && !danceRTimeout) {
			danceLeft();
			danceRight();
			if (rand > 0.5) {
				$('#char').css('transform', 'translateX(-15%) rotate(-5deg)');
			} else {
				$('#char').css('transform', 'translateX(15%) rotate(5deg)');
			}
		}
	}


	game.data.leftButtonClicked = false;
	game.data.rightButtonClicked = false;

	if (game.playing) window.requestAnimationFrame(function (newTime) {
		animate(newTime, (newTime - time))
	})
}


var GAME_INIT_DATA = {
	nextBeats: [],
	offset: 0,
	leftButtonFreeze: 0,
	rightButtonFreeze: 0,
}

var GAME_INIT_STATE = {
	playing: false,
	gameLose: false,
	life: 5,
	data: {},
}

var game;
["l", "lr", 0, "l", "r", "lr", 0, "r"]

function gameInit() {

	if ('ontouchstart' in document.documentElement) {
		$('#leftButton').on('touchstart', handleClickLeftButton);
		$('#rightButton').on('touchstart', handleClickRightButton);
	} else {
		$('#leftButton').on('mousedown', handleClickLeftButton);
		$('#rightButton').on('mousedown', handleClickRightButton);
	}

	sound.seek(0)
	sound.play()

	var beats = []

	for (var i = 3450 / 1000; i + 1100 / 1000 < 40; i += 1100 / 1000) {
		if (Math.random() > 0.6) continue;
		var r = Math.random();
		if (r < 0.53) beats.push({
			time: i,
			color: 'blue',
			result: null,
			dead: false,
			acted: false
		})

		if (r > 0.47) beats.push({
			time: i,
			color: 'red',
			result: null,
			dead: false,
			acted: false
		})

	}
	game.data.nextBeats = beats;
	game.playing = true;
	game.startTime = Date.now();
	animate(0);
	gameCountDown();
}

var danceLTimeout = false;
var danceRTimeout = false;
var ACT_TYPES = ["act1", "act2", ""];
function danceLeft() {
	if (danceLTimeout) return
	danceLTimeout = true

	var act = ACT_TYPES[Math.floor(Math.random() * ACT_TYPES.length)];
	$('#char .left').addClass(act);
	setTimeout(function () {
		$('#char .left').removeClass('act1 act2');
		$('#char').css('transform', 'translateX(0) rotate(0deg)');
		danceLTimeout = false
	}, 300);
}


function danceRight() {
	if (danceRTimeout) return
	danceRTimeout = true

	var act = ACT_TYPES[Math.floor(Math.random() * ACT_TYPES.length)];
	$('#char .right').addClass(act);
	setTimeout(function () {
		$('#char .right').removeClass('act1 act2');
		$('#char').css('transform', 'translateX(0) rotate(0)');
		danceRTimeout = false
	}, 300);
}

function handleClickLeftButton() {
	if (game.data.leftButtonFreeze <= 0) {
		game.data.leftButtonClicked = true;
		$('#leftButton').addClass('active');
		setTimeout(function () {
			$('#leftButton').removeClass('active');
		}, 150);
	}
	game.data.leftButtonFreeze = 200;
}

function handleClickRightButton() {
	if (game.data.rightButtonFreeze <= 0) {
		game.data.rightButtonClicked = true;
		$('#rightButton').addClass('active');
		setTimeout(function () {
			$('#rightButton').removeClass('active');
		}, 150);
	}
	game.data.rightButtonFreeze = 200;
}

function gameCountDown() {
	if (isNaN(sound.seek())) {
		setTimeout(gameCountDown, 1000);
		return;
	}
	game.time = GAME_TIME - Math.round(sound.seek());

	// 更新計時器
	var currentTime = String(Math.ceil(game.time));
	$('#gameCountDown').text(currentTime);
	$('#timerMask').attr('stroke-dashoffset', 314.16 * (2 - currentTime / GAME_TIME));

	// 遊戲時間到零
	if (game.time <= 0) {
		gameStop();


		if (game.playing) {
			game.playing = false;
			gameWin();
		}
	}

	if (game.playing) {
		setTimeout(gameCountDown, 1000);
	}
}

function gameWin() {
	// 遊戲結束 - 贏
	$('#gameResultWin').fadeIn();
}

function gameLose() {
	// 遊戲結束 - 輸
	$('#gameResultLose').fadeIn();
}

function gameStop() {
	// 清除監聽事件
	$("leftButton").unbind();
	$("rightButton").unbind();

	// 聲音漸停
	sound.fade(1, 0, 1000);
	sound.once('fade', function () {
		sound.stop();
		sound.volume(1)
	})
}


window.addEventListener('keydown', function (event) {
	if (game.playing) {
		if (event.keyCode === 37) handleClickLeftButton();
		if (event.keyCode === 39) handleClickRightButton();
	}
})