const pokeAPIBaseUrl = "https://pokeapi.co/api/v2/pokemon/";
const game = document.getElementById('game');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const clickCounterElement = document.getElementById('click-counter');
const pairsCounterElement = document.getElementById('pairs-counter');

let firstPick;
let isPaused = true;
let matches;
let totalPairs;
let clickCounter = 0;
let timerInterval;

const colors = {
	fire: '#EE8130',
	grass: '#7AC74C',
	electric: '#F7D02C',
	water: '#6390F0',
	ground: '#E2BF65',
	rock: '#B6A136',
	fairy: '#D685AD',
	poison: '#A33EA1',
	bug: '#A6B91A',
	dragon: '#6F35FC',
	psychic: '#F95587',
	flying: '#A98FF3',
	fighting: '#C22E28',
	normal: '#A8A77A',
    ice: '#96D9D6',
    ghost: '#735797',
    dark: '#705746',
    steel: '#B7B7CE'
};

const difficultySelect = document.getElementById('difficulty');
difficultySelect.value = 'easy';

const difficultySizes = {
    easy: { rows: 2, columns: 4 },
    normal: { rows: 4, columns: 4 },
    hard: { rows: 6, columns: 6 }
};

startButton.addEventListener('click', () => {
    resetGame();
    isPaused = false;
    timerInterval = startTimer();
});


const startTimer = () => {
    let seconds = 0;
    let minutes = 0;

    timerElement.innerText = '00:00';

    const timerInterval = setInterval(() => {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        timerElement.innerText = `${padNumber(minutes)}:${padNumber(seconds)}`;
    }, 1000);

    return timerInterval;
};


const padNumber = (number) => {
    return number.toString().padStart(2, '0');
};

const updateClickCounter = () => {
    clickCounter++;
    clickCounterElement.innerText = `Clicks: ${clickCounter}`;
};

const updatePairsCounter = () => {
    const difficulty = difficultySelect.value;
    const { rows, columns } = difficultySizes[difficulty];
    const solvedPairs = matches;
    const unsolvedPairs = (rows * columns) / 2;
    pairsCounterElement.innerText = `Pairs solved: ${solvedPairs} / ${unsolvedPairs}`;
};

const loadPokemon = async () => {
    const randomIds = new Set();
    const difficulty = difficultySelect.value;
    const gridSize = difficultySizes[difficulty].rows * difficultySizes[difficulty].columns;
    totalPairs = (difficultySizes[difficulty].rows * difficultySizes[difficulty].columns) / 2;
    const totalPokemon = gridSize / 2;
    const theme = document.querySelector('input[name="theme"]:checked').value;
    const spritesKey = theme === 'shiny' ? 'front_shiny' : 'front_default';
    while (randomIds.size < totalPokemon) {
        const randomNumber = Math.ceil(Math.random() * 1010);
        randomIds.add(randomNumber);
    }

    const pokePromises = [...randomIds].map(id => fetch(pokeAPIBaseUrl + id));
    const results = await Promise.all(pokePromises);
    const loadedPokemon = await Promise.all(results.map(res => res.json()));

    return loadedPokemon.map(pokemon => ({
        ...pokemon,
        sprites: {
            front_default: pokemon.sprites[spritesKey]
        }
    }));
};


const changeTheme = () => {
    resetGame();
};

const resetGame = async () => {
    game.innerHTML = '';
    clickCounter = 0;
    matches = 0;
    updatePairsCounter();
    isPaused = true;
    firstPick = null;
    matches = 0;
    const difficulty = difficultySelect.value;
    game.setAttribute('data-difficulty', difficulty);
    clearInterval(timerInterval);
    timerElement.innerText = '00:00';

    game.classList.add('disabled');

    setTimeout(async () => {
        const loadedPokemon = await loadPokemon();
        displayPokemon([...loadedPokemon, ...loadedPokemon]);
    }, 200);
};



const changeDifficulty = () => {
    resetGame();
};

const displayPokemon = (pokemon) => {
    pokemon.sort(_ => Math.random() - 0.5);
    const pokemonHTML = pokemon.map(pokemon => {
        const type = pokemon.types[0]?.type?.name;
        const color = colors[type] ||'#F5F5F5';
        return `
          <div class="card" onclick="clickCard(event)" data-pokename="${pokemon.name}" style="background-color:${color};">
            <div class="front ">
            </div>
            <div class="back rotated" style="background-color:${color};">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}"  />
            <h2>${pokemon.name}</h2>
            </div>
        </div>
    `}).join('');
    game.innerHTML = pokemonHTML;
}

const clickCard = (e) => {
    const pokemonCard = e.currentTarget;
    const [front, back] = getFrontAndBackFromCard(pokemonCard);
    if (front.classList.contains("rotated") || isPaused) {
        return;
    }
    isPaused = true;
    rotateElements([front, back]);
    if (!firstPick) {
        updateClickCounter();
        firstPick = pokemonCard;
        isPaused = false;
    }
    else {
        updateClickCounter();
        const secondPokemonName = pokemonCard.dataset.pokename;
        const firstPokemonName = firstPick.dataset.pokename;
        if (firstPokemonName !== secondPokemonName) {
            const [firstFront, firstBack] = getFrontAndBackFromCard(firstPick);
            setTimeout(() => {
                rotateElements([front, back, firstFront, firstBack]);
                firstPick = null;
                isPaused = false;
            }, 500)
        }
        else {
            matches++;
            updatePairsCounter();
            if (matches === totalPairs) {
                clearInterval(timerInterval);
                const modal = document.getElementById('modal');
                modal.style.display = 'block';
                const modalMessage = document.getElementById('modal-message');
                modalMessage.textContent = 'You win!';
                console.log("WINNER");
            }
            firstPick = null;
            isPaused = false;
        }
    }
};

const activatePowerup = () => {
    const frontCards = document.querySelectorAll('.card .front');
    const backCards = document.querySelectorAll('.card .back');
    
    const originalTypeTexts = [];
    backCards.forEach((back) => {
      const typeText = back.querySelector('h2').textContent;
      originalTypeTexts.push(typeText);
    });
    
    frontCards.forEach((front, index) => {
      front.style.visibility = 'hidden';
      const back = backCards[index];
      back.querySelector('h2').textContent = back.dataset.type;
    });
  
    setTimeout(() => {
      frontCards.forEach((front, index) => {
        front.style.visibility = 'visible';
        const back = backCards[index];
        back.querySelector('h2').textContent = originalTypeTexts[index];
      });
    }, 1000);
  };
  
  
const getFrontAndBackFromCard = (card) => {
    const front = card.querySelector(".front");
    const back = card.querySelector(".back");
    return [front, back]
}

const rotateElements = (elements) => {
    if(typeof elements !== 'object' || !elements.length) return;
    elements.forEach(element => element.classList.toggle('rotated'));
}

const closeBtn = document.querySelector('.close');
closeBtn.addEventListener('click', () => {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  const modal = document.getElementById('modal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

resetGame();