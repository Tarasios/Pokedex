const PAGE_SIZE = 10;
let currentPage = 1;
let pokemonArray = [];
let selectedTypes = [];
let isShinyMode = false;

const updatePaginationDiv = (currentPage, numPages, filteredArrayLength) => {
  $("#pagination").empty();
  $("#paginationText").empty();

  // Previous button
  if (currentPage > 1) {
      $("#pagination").append(`
    <button class="btn btn-primary page ml-1 previousButton" value="previous">&lt;</button>
  `);
  }

  let startPage = currentPage > 3 ? currentPage - 2 : 1;
  let endPage = startPage + 4;
  if (endPage > numPages) {
      endPage = numPages;
      startPage = endPage - 4;
      if (startPage < 1) {
          startPage = 1;
      }
  }

  for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      $("#pagination").append(`
    <button class="btn btn-primary page ml-1 numberedButtons ${activeClass}" value="${i}">${i}</button>
  `);
  }
  if (currentPage < numPages) {
      $("#pagination").append(`
    <button class="btn btn-primary page ml-1 nextButton" value="next">&gt;</button>
  `);
  }

  if (currentPage === 1) {
      $(".previousButton").hide();
  }

  if (currentPage === numPages) {
      $(".nextButton").hide();
  }

  const startPokemon = (currentPage - 1) * PAGE_SIZE + 1;
  const endPokemon = Math.min(currentPage * PAGE_SIZE, filteredArrayLength);
  $("#paginationText").text(`Showing ${startPokemon} - ${endPokemon} Pokemon out of ${filteredArrayLength}`);
};



const filterPokemonByType = (pokemonArray) => {
    if (selectedTypes.length === 0 || selectedTypes.includes("All")) {
        return pokemonArray;
    } else if (selectedTypes.length === 1) {
        const selectedType = selectedTypes[0];
        return pokemonArray.filter((pokemon) => {
            const types = pokemon.types.map((type) => type.type.name);
            return types.includes(selectedType);
        });
    } else {
        return pokemonArray.filter((pokemon) => {
            const types = pokemon.types.map((type) => type.type.name);
            return selectedTypes.every((type) => types.includes(type));
        });
    }
};


const updateTypeDropdowns = (typeArray) => {
    $("#typeDropdown1").empty().append(`<option value="">All</option>`);
    $("#typeDropdown2").empty().append(`<option value="">All</option>`);
    typeArray.forEach((type) => {
        const typeName = type.name;
        const capitalizedTypeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
        $("#typeDropdown1").append(`<option value="${typeName}">${capitalizedTypeName}</option>`);
        $("#typeDropdown2").append(`<option value="${typeName}">${capitalizedTypeName}</option>`);
    });
    if ($("#typeDropdown1").val() === "" || $("#typeDropdown1").val() === null) {
        $("#typeDropdown2").prop("disabled", true);
    } else {
        $("#typeDropdown2").prop("disabled", false);
    }
};


const populatePokemonCards = (pokemonArray) => {
    $("#pokeCards").empty();
    pokemonArray.forEach((pokemon) => {
        const types = pokemon.types.map((type) => type.type.name);
        const spriteUrl = isShinyMode ? pokemon.sprites.front_shiny : pokemon.sprites.front_default;
        $("#pokeCards").append(`
        <div class="pokeCard card" pokeName="${pokemon.name}">
          <h3>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
          <img src="${spriteUrl}" alt="${pokemon.name}"/>
          <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
            More
          </button>
        </div>  
      `);
    });
};


const paginate = (currentPage, PAGE_SIZE, pokemonArray) => {
  const filteredPokemonArray = filterPokemonByType(pokemonArray);
  const selectedPokemonArray = filteredPokemonArray.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
  );
  populatePokemonCards(selectedPokemonArray);
  const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, PAGE_SIZE, filteredPokemonArray.length, filteredPokemonArray.length);
};



const setup = async () => {
    $("#pokeCards").empty();
    let response = await axios.get("https://pokeapi.co/api/v2/pokemon?offset=0&limit=1010");
    pokemonArray = response.data.results;

    const getPokemonDetails = async () => {
        const promises = pokemonArray.map(async (pokemon) => {
            let response = await axios.get(pokemon.url);
            return response.data;
        });
        return Promise.all(promises);
    };

    let pokemonDetailsArray = await getPokemonDetails();
    const typesResponse = await axios.get("https://pokeapi.co/api/v2/type");
    const typesArray = typesResponse.data.results;
    updateTypeDropdowns(typesArray);
    const numPages = Math.ceil(pokemonArray.length / PAGE_SIZE);

    // Populate and paginate the initial Pokemon list
    paginate(currentPage, PAGE_SIZE, pokemonDetailsArray);
    updatePaginationDiv(currentPage, numPages, pokemonDetailsArray.length);

    // Pop up modal when clicking on a Pokemon card
    $("body").on("click", ".pokeCard", async function(e) {
        const pokemonName = $(this).attr("pokeName");
        const pokemon = pokemonDetailsArray.find((pokemon) => pokemon.name === pokemonName);

        const spriteUrl = isShinyMode ? pokemon.sprites.other["official-artwork"].front_shiny : pokemon.sprites.other["official-artwork"].front_default;

        $(".modal-body").html(`
    <div style="width:200px">
      <img src="${spriteUrl}" alt="${pokemon.name}"/>
    </div>
        <h3>Types</h3>
        <ul>
          ${pokemon.types.map((type) => `<li>${type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)}</li>`).join("")}
        </ul>
      
        <div>
          <h3>Stats</h3>
          <ul>
            ${pokemon.stats.map((stat) => `<li>${stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1)}: ${stat.base_stat}</li>`).join("")}
            <li><abbr title="Base Stat Total">BST</abbr>: ${pokemon.stats.reduce((acc, stat) => acc + stat.base_stat, 0)}</li>
          </ul>
        </div>
      
        <div>
          <h3>Abilities</h3>
          <ul>
            ${pokemon.abilities.map((ability) => `<li>${ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)}</li>`).join("")}
          </ul>
        </div>
      
        <div>
          <h3>Moveset</h3>
          <ul>
            ${pokemon.moves.map((move) => `<li>${move.move.name.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</li>`).join("")}
          </ul>
        </div>
      `);
        $(".modal-title").html(`
        <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
        <h5>National Dex Number: ${pokemon.id}</h5>
      `);
    });

    // Add event listener to pagination buttons
    $("body").on("click", ".numberedButtons", async function(e) {
      currentPage = Number($(this).val());
      const filteredPokemonArray = filterPokemonByType(pokemonDetailsArray);
      const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
      paginate(currentPage, PAGE_SIZE, filteredPokemonArray);
      updatePaginationDiv(currentPage, numFilteredPages, filteredPokemonArray.length);
    });
    
    $("body").on("click", ".previousButton", async function() {
      currentPage -= 1;
      const filteredPokemonArray = filterPokemonByType(pokemonDetailsArray);
      const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
      paginate(currentPage, PAGE_SIZE, filteredPokemonArray);
      updatePaginationDiv(currentPage, numFilteredPages, filteredPokemonArray.length);
    });
    
    $("body").on("click", ".nextButton", async function() {
      currentPage += 1;
      const filteredPokemonArray = filterPokemonByType(pokemonDetailsArray);
      const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
      paginate(currentPage, PAGE_SIZE, filteredPokemonArray);
      updatePaginationDiv(currentPage, numFilteredPages, filteredPokemonArray.length);
    });
    

    // Add event listener to type dropdown menus
    $("#typeDropdown1").on("change", function() {
        selectedTypes[0] = $(this).val();
        if ($(this).val() === "") {
            selectedTypes = [];
            $("#typeDropdown2").val("").prop("disabled", true);
        } else {
            $("#typeDropdown2").prop("disabled", false);
        }
        currentPage = 1;
        const filteredPokemonArray = filterPokemonByType(pokemonDetailsArray);
        const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
        paginate(currentPage, PAGE_SIZE, filteredPokemonArray);
        updatePaginationDiv(currentPage, numFilteredPages, filteredPokemonArray.length);
    });

    $("#typeDropdown2").on("change", function() {
        selectedTypes[1] = $(this).val();
        if ($("#typeDropdown2").val() === "") {
            selectedTypes.splice(1, 1);
        }
        currentPage = 1;
        const filteredPokemonArray = filterPokemonByType(pokemonDetailsArray);
        const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
        paginate(currentPage, PAGE_SIZE, filteredPokemonArray);
        updatePaginationDiv(currentPage, numFilteredPages, filteredPokemonArray.length);
    });

    $("#shinyModeCheckbox").on("change", function() {
        isShinyMode = $(this).is(":checked");
        const filteredPokemonArray = filterPokemonByType(pokemonDetailsArray);
        const numFilteredPages = Math.ceil(filteredPokemonArray.length / PAGE_SIZE);
        paginate(currentPage, PAGE_SIZE, filteredPokemonArray);
        updatePaginationDiv(currentPage, numFilteredPages, filteredPokemonArray.length);
    });

};

$(document).ready(setup);