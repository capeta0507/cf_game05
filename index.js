var START_TIMEOUT = 3; // 遊戲開頭倒數時間
var GAME_TIME = 15; // 遊戲總時間
var GAME_TARGET = 40; // 遊戲分數目標

var windowIsFocused = true;
$(window).focus(function () {
	windowIsFocused = true;
});
$(window).blur(function () {
	windowIsFocused = false;
});

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
	// 重置網頁元素
	$('#timerDigit').text(START_TIMEOUT);
	// 遊戲開始倒數開始
	startCountDown(
		function (value) {
			// 倒數更新畫面
			$('#timerDigit').text(String(value));
		},
		function () {
			// 遊戲開始
			$('#startTimer').fadeOut(100);
		}
	);
}
