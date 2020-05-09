/*
Memory Match Game

#TODO 
Make it so when game ends it gives a splash that shows stats, option to choose new difficulty, and play again
Maybe make it so there are more color varieties on harder difficulties (only ever two matches?)
Only show game-info on Start
Game container border spinning cyan - magenta
More difficulty levels (number of cards vs set levels)
Clean up score updating and display
Clean up global name space 
	-Convert game state properties to an object
	-Find where variables can be passed as arguments and/or returned instead
	-Repeatedly pull from DOM elements instead of having saved in global

*/
// document.addEventListener('DOMContentLoaded', function() {
const body = document.querySelector('body');
const gameContainer = document.querySelector('.game-container');
const timerContainer = document.querySelector('#timer-container');
const timerDisplay = document.querySelector('#timer');
const scoreContainer = document.querySelector('#score-container');
const scoreDisplay = document.querySelector('#score');
const quitBtn = document.querySelector('#quit-button');
const highScoreContainer = document.querySelector('#high-score-container');
const gameInfoContainer = document.querySelector('#game-info-container');
const highScoreDisplay = document.querySelector('#high-score');
const introContainer = document.querySelector('#intro-container');
const difficultyScore = document.querySelector('#difficulty-score');
const highScoreTime = document.querySelector('#high-score-time');
const difficultyContainer = document.querySelector('#difficulty');
const whiteFade = document.createElement('div');
const splashContainer = document.createElement('div');
const splashText = document.createElement('p');
let timer;

//Initialize start button and set event listener
//Event listner starts game timer on click, sets event listener for current deck, and changes view away from intro
const startBtn = document.querySelector('#start');
startBtn.addEventListener('click', function(e) {
	whiteFade.remove();
	splashText.remove();
	gameInfoContainer.append(highScoreContainer);
	introContainer.append(difficultyContainer);

	startBtn.style.opacity = '0.25';
	gameContainer.style.display = 'flex';
	resetGameState(difficulty);
	clearInterval(timer);

	timer = setInterval(() => {
		totalSeconds++;
		timerDisplay.innerText = convertTime(totalSeconds);
	}, 1000);

	for (cardBack of cardBacks) {
		cardBack.addEventListener('click', debounce(handleCardClick, 1000, true));
	}

	highScoreContainer.scrollIntoView({ behavior: 'smooth' });
});

//Initializes color changes for COLOR DIMENSION text in intro
const colorDimen = document.querySelector('#color-dimen');
setInterval(() => {
	let color = colorGenerator();
	colorDimen.style.color = color[0];
}, 1000);

//Initializes event handlers for difficulty selection buttons and the host of features that occur one one is clicked.
const difficultyBtns = document.querySelectorAll('.difficulty-buttons');
for (let btn of difficultyBtns) {
	btn.addEventListener('click', function(e) {
		difficultySelected(e);
	});
}

//Game Setup
let difficulty;
let fullDeck = deckMultipler(difficulty);
let shuffledDeck = shuffle(fullDeck);
createDivsForCards(shuffledDeck);
let cards = document.querySelectorAll('.card');
let cardBacks = document.querySelectorAll('.cardback');
//localStorage for high score
let savedHighScore = JSON.parse(localStorage.getItem('high score')) || {
	Easy   : { seconds: '--', score: '--' },
	Medium : { seconds: '--', score: '--' },
	Hard   : { seconds: '--', score: '--' }
};
localStorage.setItem('high score', JSON.stringify(savedHighScore));

//Game state properties
let activeCards = [];
let solvedCount = 0;
let cardCount = 0;
let score = 0;
let totalSeconds = 0;

// Shuffle deck using Fisher Yates algorithm
function shuffle(array) {
	let counter = array.length;
	while (counter > 0) {
		let index = Math.floor(Math.random() * counter);
		counter--;
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
	return array;
}

// Creates cards and cardbacks based on a shuffled deck as argument
function createDivsForCards(cardArray) {
	for (let card of cardArray) {
		const newDiv = document.createElement('div');
		newDiv.classList.add('card');
		newDiv.classList.add(card);
		newDiv.style.setProperty('--card-color', newDiv.classList[1]);
		gameContainer.append(newDiv);
		const cardBack = document.createElement('div');
		cardBack.classList.add('cardback');
		cardBack.classList.add(card);
		newDiv.append(cardBack);
	}
}

//When a card is clicked:
//If first card, increment cardCount, adds to active cards and displays color, leaves function.
//If second card, increment cardCount, adds to active cards, checks to see if they match
//If they match they remain flipped up
//If no match they both flip after 1 second
function handleCardClick(event) {
	//if there are two cards already shown, exit to prevent more
	if (cardCount > 1) {
		return;
	}
	cardCount++;
	updateScore();

	//adds card to activeCards
	activeCards.push(event.target);

	//Change card style to shown
	event.target.classList.toggle('shown');
	event.target.parentNode.classList.toggle('shown');

	//If only 1 card is flipped, exit
	if (cardCount === 1) {
		return;
	}

	//Check if cards match and if they do resets activeCards and count, then exits. If it is the last match, update score and end current game by displaying end game splash
	if (activeCards[0].classList[1] === activeCards[1].classList[1]) {
		for (card of activeCards) {
			card.classList.add('solved');
			card.parentNode.classList.add('solved');
		}

		activeCards = [];
		cardCount = 0;
		solvedCount++;
		//Checks if all matches have been found and starts gameOver sequence
		if (solvedCount === cards.length / 2) {
			updateHighScore(score);
			gameOver();
		}
		return;
	}
	//Sets the timer for both active cards to flip after second card is shown.
	setTimeout(function() {
		//Prevents issue where a timeout timer would remain after completeing a pair, causing any card flipped within the timeout timer from the last card of the match pair to be flipped when that timer ran out
		if (activeCards.length === 1) {
			return;
		}
		for (card of activeCards) {
			card.classList.remove('shown');
			card.parentNode.classList.toggle('shown');
		}
		//reset some game state variables
		activeCards = [];
		cardCount = 0;
	}, 1000);
}

//Debounce function prevents handleCardClick from being executed multiple times in a row. It won't be able to flip again until timer is up. true for Immediate means the passed function runs on the leading edge as opposed to trailing.
function debounce(func, wait, immediate) {
	let timeout;

	return function executedFunction() {
		let context = this; //The event in this case
		let args = arguments;

		let later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		// Won't start timeout again unless the card is not shown
		let callNow = immediate && !context.classList.value.includes('shown');
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}
//Updates the score and score display
function updateScore() {
	score++;
	scoreDisplay.innerText = score;
}

//Updates the high score in local storage and display.
function updateHighScore() {
	if (difficulty === '2') {
		if (solvedCount === cards.length / 2) {
			if ((score < savedHighScore.Easy.score || savedHighScore.Easy.score === '--') && score !== 0) {
				savedHighScore.Easy.score = score;
				savedHighScore.Easy.seconds = totalSeconds;
			}
			else if (score === savedHighScore.Easy.score && totalSeconds < savedHighScore.Easy.seconds) {
				savedHighScore.Easy.seconds = totalSeconds;
			}
		}
		highScoreDisplay.innerText = savedHighScore.Easy.score;
		highScoreTime.innerText = convertTime(savedHighScore.Easy.seconds);
	}
	else if (difficulty === '4') {
		if (solvedCount === cards.length / 2) {
			if ((score < savedHighScore.Medium.score || savedHighScore.Medium.score === '--') && score !== 0) {
				savedHighScore.Medium.score = score;
				savedHighScore.Medium.seconds = totalSeconds;
			}
			else if (score === savedHighScore.Medium.score && totalSeconds < savedHighScore.Medium.seconds) {
				savedHighScore.Medium.seconds = totalSeconds;
			}
		}
		highScoreDisplay.innerText = savedHighScore.Medium.score;
		highScoreTime.innerText = convertTime(savedHighScore.Medium.seconds);
	}
	else if (difficulty === '6') {
		if (solvedCount === cards.length / 2) {
			if ((score < savedHighScore.Hard.score || savedHighScore.Hard.score === '--') && score !== 0) {
				savedHighScore.Hard.score = score;
				savedHighScore.Hard.seconds = totalSeconds;
			}
			else if (score === savedHighScore.Hard.score && totalSeconds < savedHighScore.Hard.seconds) {
				savedHighScore.Hard.seconds = totalSeconds;
			}
		}

		highScoreDisplay.innerText = savedHighScore.Hard.score;
		highScoreTime.innerText = convertTime(savedHighScore.Hard.seconds);
	}

	localStorage.setItem('high score', JSON.stringify(savedHighScore));
}

//Write function to expand number of cards in deck. Multiplies by the passed arg.
function deckMultipler(multVal) {
	const baseDeck = colorGenerator();
	let fullDeck = [];
	for (let i = 0; i < 2; i++) {
		fullDeck.push(...baseDeck);
	}
	return fullDeck;
}

//Generates random hsl colors for card colors with 30 increments for hue to keep colors from being too similar
function colorGenerator() {
	let colorArray = [];

	for (let i = 0; i < difficulty * 2.5; i++) {
		let hue = Math.ceil(Math.floor(Math.random() * 360) / 20) * 20;
		while (colorArray.includes(`hsl(${hue},100%,50%)`)) {
			hue = Math.ceil(Math.floor(Math.random() * 360) / 20) * 20;
		}
		colorArray.push(`hsl(${hue},100%,50%)`);
	}
	return colorArray;
}

//Convert total seconds into a nice display time
function convertTime(time) {
	if (time === '--') return '--';
	function str_pad_left(string, pad, length) {
		return (new Array(length + 1).join(pad) + string).slice(-length);
	}

	let minutes = Math.floor(time / 60);
	let seconds = time % 60;
	seconds = str_pad_left(seconds, '0', 2);

	return (displayTime = `${minutes}:${seconds}`);
}

//Occurs when difficulty button is selected. Sets difficulty and refreshes game state and highscore display. Changes Start button state
function difficultySelected(event) {
	gameContainer.style.display = 'none';
	clearInterval(timer);
	totalSeconds = 0;
	timerDisplay.innerText = convertTime(totalSeconds);

	difficulty = event.target.value;
	difficultyScore.innerText = event.target.id;
	if (difficulty === '2') {
		highScoreDisplay.innerText = savedHighScore.Easy.score;
		highScoreTime.innerText = convertTime(savedHighScore.Easy.seconds);
	}
	else if (difficulty === '4') {
		highScoreDisplay.innerText = savedHighScore.Medium.score;
		highScoreTime.innerText = convertTime(savedHighScore.Medium.seconds);
	}
	else if (difficulty === '6') {
		highScoreDisplay.innerText = savedHighScore.Hard.score;
		highScoreTime.innerText = convertTime(savedHighScore.Hard.seconds);
	}

	for (let btn of difficultyBtns) {
		btn.classList.remove('selected');
	}
	event.target.classList.add('selected');
	startBtn.disabled = false;
	startBtn.innerText = 'GET TO WORK!!!';
	startBtn.style.opacity = '100%';
	startBtn.style.fontSize = '3em';
	setInterval(() => {
		let color = colorGenerator();
		startBtn.style.transition = '100ms';
		startBtn.style.backgroundColor = color[0];
	}, 100);
}

//Resets the game state by removing card elements, creating new deck, and reseting game properties
function resetGameState() {
	cards = document.querySelectorAll('.card');
	for (card of cards) {
		card.remove();
		cards = [];
	}
	cardBacks = document.querySelectorAll('.cardback');
	for (cardback of cardBacks) {
		cardBack.remove();
		cardBacks = [];
	}
	fullDeck = deckMultipler(difficulty);
	shuffledDeck = shuffle(fullDeck);
	createDivsForCards(shuffledDeck);
	cards = document.querySelectorAll('.card');
	cardBacks = document.querySelectorAll('.cardback');

	//Game state properties
	solvedCount = 0;
	cardCount = 0;
	score = 0;
	totalSeconds = 0;
	scoreDisplay.innerText = score;
}

//When all pairs are solved, show end splash screen, and get ready to reset game state.
function gameOver() {
	startBtn.style.opacity = '1';
	updateHighScore();
	clearInterval(timer);
	for (cardBack of cardBacks) {
		cardBack.classList.add('victory');
	}
	for (card of cards) {
		card.classList.add('victory');
	}
	whiteFade.classList.add('victory-cover');
	body.append(whiteFade);
	setTimeout(() => {
		difficultyContainer.classList.add('endgame');
		splashContainer.classList.add('text');
		splashContainer.classList.add('splash');
		splashText.innerText = `GOOD WORK, TECH! It only took you ${score} tries to get all those teleporters properly synced and the colors flowing! Ready for more?`;
		splashText.style.marginRight = '20px';
		splashText.style.width = '300px';
		splashContainer.append(splashText);
		highScoreContainer.style.border = 'dotted black 1px';
		highScoreContainer.style.padding = '2px';
		splashContainer.append(highScoreContainer);
		whiteFade.append(splashContainer);
		whiteFade.append(difficultyContainer);
	}, 4000);
}
