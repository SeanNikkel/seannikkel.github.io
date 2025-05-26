function storeLargeString(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('Arkhamdle', 1);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.errorCode);
      reject(new Error("Failed to open IndexedDB."));
    };

    request.onupgradeneeded = (event) => {
      // This event is triggered when the database is first created or when its version is updated.
      event.target.result.createObjectStore('strings');
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['strings'], 'readwrite');
      const objectStore = transaction.objectStore('strings');

      const putRequest = objectStore.put(value, key);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = (event) => {
        console.error("Failed to store string:", event.target.error);
        reject(new Error("Failed to store string in IndexedDB."));
      };

      transaction.oncomplete = () => {
        db.close();
      };

      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(new Error("IndexedDB transaction failed."));
      };
    };
  });
}

function retrieveLargeString(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('Arkhamdle', 1);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.errorCode);
      reject(new Error("Failed to open IndexedDB."));
    };

    request.onupgradeneeded = (event) => {
      // If the database doesn't exist, this will create it, but for retrieval, it means the key won't be found anyway.
      const db = event.target.result;
      if (!db.objectStoreNames.contains('strings')) {
        db.createObjectStore('strings');
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Start a read-only transaction
      const transaction = db.transaction(['strings'], 'readonly');
      const objectStore = transaction.objectStore('strings');

      // Get the string value using the specified key
      const getRequest = objectStore.get(key);

      getRequest.onsuccess = (event) => {
        const result = event.target.result;
        if (result !== undefined) {
          resolve(result);
        } else {
          resolve(null); // Resolve with null if the key is not found
        }
      };

      getRequest.onerror = (event) => {
        console.error("Failed to retrieve string:", event.target.error);
        reject(new Error("Failed to retrieve string from IndexedDB."));
      };

      // Ensure the transaction completes
      transaction.oncomplete = () => {
        db.close(); // Close the database connection after the transaction
      };

      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(new Error("IndexedDB transaction failed."));
      };
    };
  });
}

function assert(condition) {
	if (!condition) {
		throw new Error("Assertion failed");
	}
}

function randomIndex(array) {
	return Math.floor(Math.random() * array.length)
}

function randomElement(array) {
	return array[randomIndex(array)];
}

function arrayFrom(value) {
	if (Array.isArray(value))
		return value;

	return [ value ];
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}



const openEditorElement = document.getElementById('open-editor');

const configCachekey = "arkhamdle_config";
let storedConfigText = null;
let baseConfigText = null;
function setConfig(text) {
	if (baseConfigText == text){
		localStorage.removeItem(configCachekey);
	} else {
		localStorage.setItem(configCachekey, text);
	}
	location.reload();
}

async function getConfig() {
	const response = await fetch('config.json');
	baseConfigText = await response.text();

	storedConfigText = localStorage.getItem(configCachekey);
	
	if (!storedConfigText) {
		storedConfigText = baseConfigText;
		return JSON.parse(storedConfigText);
	}
	
	if (storedConfigText != baseConfigText) {
		openEditorElement.style.backgroundColor = 'green';
	}
	
	try {
		return JSON.parse(storedConfigText);
	} catch {
		openEditorElement.style.backgroundColor = 'red';
		return JSON.parse(baseConfigText);
	}
}

const config = await getConfig();

async function getCardsDb() {
	const cacheKey = (config.includeEncounterCards) ? 'card_db_encounter' : 'card_db';
	const cacheDurationMs = 60 * 60 * 1000

	const cached = retrieveLargeString(cacheKey);

	if (cached) {
		try {
			const parsed = JSON.parse(cached);
			const now = Date.now();
			if (now - parsed.timestamp < cacheDurationMs) {
				return parsed.data;
			}
		} catch { }
	}

	const response = await fetch(`https://arkhamdb.com/api/public/cards/?encounter=${config.includeEncounterCards}`);
	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}
	const data = await response.json();

	storeLargeString(
		cacheKey,
		JSON.stringify({ timestamp: Date.now(), data })
	);

	return data;
}

const cardsDb = await getCardsDb();



function fadeBackgroundIn() {
    const duration = 3.0;
	
    let brightness = 0;
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) {
			startTime = currentTime;
		}
		
        brightness = Math.min(1.0, (currentTime - startTime) / (duration * 1000));
		
        document.documentElement.style.setProperty('--global-fade', brightness);

        if (brightness < 1.0) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

let currentBackground = -1;
function nextBackground() {
	fadeBackgroundIn();

	if (config.backgrounds.length == 1)
		currentBackground = -1;
	
	let oldBackground = currentBackground;
	while (currentBackground == oldBackground) {
		currentBackground = randomIndex(config.backgrounds);
	}
	var backgroundUrl = config.backgrounds[currentBackground];
	document.documentElement.style.setProperty('--background-image-url', `url('${backgroundUrl}')`);
}



function updateHighscore(score = null) {
	const cacheKey = 'arkhamdle_highscore';
	let highscore = Number(localStorage.getItem(cacheKey));

	if (!highscore) {
		highscore = 0;
	}

	if (score !== null && score > highscore) {
		highscore = score;
	}
	
	localStorage.setItem(cacheKey, highscore);
	document.getElementById('highscore').textContent = highscore;
}

const scoreElement = document.getElementById('score');

function getScore() {
	return Number(scoreElement.textContent);
}

function setScore(value) {
	scoreElement.textContent = value;
	updateHighscore(value);
}

function incrementScore() {
	setScore(getScore() + 1);
    scoreElement.classList.add('flash-shadow');
    scoreElement.addEventListener('animationend', () => {
      scoreElement.classList.remove('flash-shadow');
    }, { once: true });

}



function cardMatches(card, query) {
	for (const field in query) {
		if (arrayFrom(query[field]).includes(card[field]))
			return true;
	}

	return false;
}

let answers = [];
let options = [];
function setOptions(question) {
	answers = [];
	options = [];
	for (const card of cardsDb) {
		if (cardMatches(card, question.exclude))
			continue;
		
		if (question.hasOwnProperty("include") && Object.keys(question.include).length > 0 && !cardMatches(card, question.include))
			continue;
		
		if (cardMatches(card, config.globalExclude))
			continue;
		
		if (Object.keys(config.globalInclude).length > 0 && !cardMatches(card, config.globalInclude))
			continue;

		if (!arrayFrom(question.questionField).every((figure) => card.hasOwnProperty(figure)))
			continue;

		if (!card.hasOwnProperty(question.answerField))
			continue;
		
		options.push(card);
	}

	for (const card of options) {
		let answer = String(card[question.answerField]);
		if (!answers.includes(answer)) 
			answers.push(answer)
	}

	answers.sort();

	const datalistElement = document.getElementById('cards');
	datalistElement.innerHTML = '';
	for (const cardName of answers) {
		const option = document.createElement('option');
		option.value = cardName;
		datalistElement.appendChild(option);
	}
}



function innerHtmlFromCardField(card, question) {
	let result = '';
	let figures = arrayFrom(question.questionField);

	for (const figure of figures) {
		switch (figure) {
			case 'imagesrc':
				let cardWidth = 420;
				let cardHeight = 597;
				let windowOffsetX = 0;
				let windowOffsetY = 0;
				let borderRadius = "20px";
	
				switch (card.type_name) {
					case 'Investigator':
					case 'Agenda':
					case 'Act':
						cardWidth = 569;
						cardHeight = 408;
						break;
				}
				
				let windowWidth = cardWidth;
				let windowHeight = cardHeight;
				
				if (question.answerField === 'pack_name') {
					windowHeight -= 22;
				} else {
					windowWidth = 300;
					windowHeight = 250;
					windowOffsetY = -69;
					borderRadius = "50%";
					switch (card.type_name) {
						case 'Event':
							windowOffsetY = -10;
							break;
							
						case 'Enemy':
							cardWidth = 525;
							cardHeight = 747;
							windowOffsetY = -472;
							break;
							
						case 'Investigator':
							windowOffsetX = 131;
							windowOffsetY = -70;
							break;
							
						case 'Treachery':
							cardWidth = 525;
							cardHeight = 747;
							windowOffsetY = -50;
							break;
					}
				}
				
				result += `\
<div style="\
width: ${windowWidth}px; \
height: ${windowHeight}px; \
overflow: hidden; \
box-shadow: inset 0 0 20px black; \
border-radius: ${borderRadius}; \
border: 1px solid #4a4a4a;">\
<img style="\
position: relative; \
transform: translateX(-50%); \
left: 50%; \
width: ${cardWidth}px; \
height: ${cardHeight}px; \
margin: ${windowOffsetY}px 0 0 ${windowOffsetX}px;" \
src="https://arkhamdb.com${card[figure]}">\
</div>`
				break;
	
			case 'text':
			case 'real_text':
			case 'flavor':
				let realText = card[figure];
				realText = "<p>" + realText + "</p>";
				realText = realText.replace(/\n/g, '</p><p>');
				realText = realText.replaceAll('[[', '<b><i>');
				realText = realText.replaceAll(']]', '</b></i>');
				realText = realText.replace(/\[(\w+)\]/g, (match, name) => {
				    const capitalizedName = name
											.replaceAll('_', ' ')
											.split(' ')
											.map(word => word.charAt(0).toUpperCase() + word.slice(1))
											.join(' ');
				    return `<span class="icon-${name}" title="${capitalizedName}"></span>`;
				});

				if (question.answerField === 'name') {
					realText = realText.replaceAll(card.name, `<span style="color: DarkGray;"><i>(this card)</i></span>`);
				}
				
				if (figure === 'flavor') {
					realText = "<i>" + realText + "</i>";
				}
				result += realText;
				break;
	
			case 'name':
				let cardName = card[figure];
				if (card.xp) {
					cardName += ` (${card.xp})`;
				}
				result += `<p style="text-align: center; font-family: 'Julius Sans One', sans-serif;">${cardName}</p>`
				break;

			default:
				result += "<p>" + card[figure] + "</p>";
				break;
		}
	}

	return result;
}

let question = null;
let answerCard = null;
function nextQuestion() {
	let weightSum = 0;
	for (const q of config.questions) {
		weightSum += q.weight;
	}
	let weight = Math.random() * weightSum;
	weightSum = 0;
	for (const q of config.questions) {
		weightSum += q.weight;
		if (weight <= weightSum) {
			question = q;
			break;
		}
	}
	assert(question !== null)
	
	setOptions(question);
	
	const questionElement = document.getElementById('question-text');
	questionElement.textContent = question.question;

	answerCard = randomElement(options);
	
	const figureElement = document.getElementById('figure');
	figureElement.innerHTML = innerHtmlFromCardField(answerCard, question);
	figureElement.classList.toggle('apply-border', !arraysEqual(arrayFrom(question.questionField), [ 'imagesrc' ]));
}



const inputElement = document.getElementById('user-answer');

function updateSubmit() {
	const submitElement = document.getElementById('submit-answer');
	const found = answers.includes(inputElement.value.trim());
	submitElement.disabled = !found;

	if (inputElement.value.length > 0 && !found) {
		inputElement.setAttribute('list', 'cards');
		inputElement.autocomplete = 'on'
	} else {
		inputElement.removeAttribute('list');
		inputElement.autocomplete = 'off'
	}
}

const resultElement = document.getElementById('result-link');

function setResultCorrect(answerCard) {
	resultElement.href = answerCard.url;
	resultElement.textContent = "Correct!";
	resultElement.style.color = "#2ecc70";
}

function setResultIncorrect(answerCard) {
	resultElement.href = answerCard.url;
	resultElement.textContent = answerCard[question.answerField];
	resultElement.style.color = "#dd3333";
}



inputElement.removeAttribute('list');
inputElement.addEventListener('input', updateSubmit);

document.getElementById('myForm').addEventListener('submit', (event) => {
	event.preventDefault();
	
	const value = inputElement.value.trim();
	inputElement.value = '';
	updateSubmit();

	if (value == answerCard[question.answerField]) {
		setResultCorrect(answerCard);
		incrementScore();
		nextQuestion();
	} else {
		setResultIncorrect(answerCard);
		setScore(0);
		nextQuestion();
		nextBackground();
	}
});

const editorContainerElement = document.getElementById('editor-container');

openEditorElement.addEventListener('click', () => {
	editorContainerElement.style.display = 'flex';
	openEditorElement.style.display = 'none';
});

document.addEventListener('click', (event) => {
	if (editorContainerElement.style.display === 'flex' &&
		!editorContainerElement.contains(event.target) &&
		event.target !== openEditorElement) {
		editorContainerElement.style.display = 'none';
		openEditorElement.style.display = 'block';
	}
});

const editorElement = document.getElementById('editor');
editorElement.value = storedConfigText;

const saveEditorElement = document.getElementById('save-editor');

saveEditorElement.addEventListener('click', () => {
	setConfig(editorElement.value);
});

const resetEditorElement = document.getElementById('reset-editor');

resetEditorElement.addEventListener('click', () => {
	editorElement.select();
	document.execCommand('delete', false, null);
	document.execCommand('insertText', false, baseConfigText);
});



updateHighscore();
nextBackground();
nextQuestion();
