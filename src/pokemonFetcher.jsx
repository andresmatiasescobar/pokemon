import React, { useState, useEffect } from 'react';
import './PokemonFetcher.css';

const PokemonFetcher = () => {
  const [pokemones, setPokemones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [allTypes, setAllTypes] = useState([]); // Nuevo estado para guardar todos los tipos
  const [selectedType, setSelectedType] = useState(''); // Nuevo estado para el tipo seleccionado

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setCargando(true);
        setError(null);

        // 1. Fetch all Pokémon types
        const typesResponse = await fetch('https://pokeapi.co/api/v2/type/');
        if (!typesResponse.ok) {
          throw new Error(`Error al cargar los tipos de Pokémon: ${typesResponse.statusText}`);
        }
        const typesData = await typesResponse.json();
        // Filtrar tipos que no son relevantes para la búsqueda de elementos (como "unknown", "shadow")
        const relevantTypes = typesData.results
          .filter(type => !['unknown', 'shadow'].includes(type.name))
          .map(type => type.name);
        setAllTypes(relevantTypes);

        // 2. Fetch initial random Pokemones (as per your original request)
        const fetchedPokemones = [];
        const pokemonIds = new Set(); 

        while (pokemonIds.size < 7) { 
          const randomId = Math.floor(Math.random() * 898) + 1; 
          pokemonIds.add(randomId);
        }

        const idsArray = Array.from(pokemonIds);

        for (const id of idsArray) {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
          if (!response.ok) {
            throw new Error(`Error al cargar el Pokémon con ID ${id}: ${response.statusText}`);
          }
          const data = await response.json();
          fetchedPokemones.push({
            id: data.id,
            nombre: data.name,
            imagen: data.sprites.front_default,
            tipos: data.types.map(typeInfo => typeInfo.type.name),
          });
        }
        setPokemones(fetchedPokemones);

      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchInitialData();
  }, []);

  // Effect to fetch Pokémon by selected type
  useEffect(() => {
    const fetchPokemonesByType = async () => {
      if (!selectedType) {
        // If no type is selected, or if it's the initial load, do nothing specific here
        // The initial random pokemons are already handled by the first useEffect
        return;
      }

      setCargando(true);
      setError(null);
      setPokemones([]); // Clear previous pokemons

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${selectedType}/`);
        if (!response.ok) {
          throw new Error(`Error al cargar Pokémon del tipo ${selectedType}: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Take a limited number of Pokémon for display to avoid overwhelming the UI
        const pokemonsToFetch = data.pokemon.slice(0, 20); // Limit to first 20 Pokémon of that type

        const fetchedPokemonesOfType = await Promise.all(
          pokemonsToFetch.map(async (pokemonEntry) => {
            const pokemonResponse = await fetch(pokemonEntry.pokemon.url);
            if (!pokemonResponse.ok) {
              console.warn(`Could not fetch details for ${pokemonEntry.pokemon.name}`);
              return null; // Return null if fetching details fails for a specific Pokémon
            }
            const pokemonData = await pokemonResponse.json();
            return {
              id: pokemonData.id,
              nombre: pokemonData.name,
              imagen: pokemonData.sprites.front_default,
              tipos: pokemonData.types.map(typeInfo => typeInfo.type.name),
            };
          })
        );
        // Filter out any null values from failed fetches
        setPokemones(fetchedPokemonesOfType.filter(Boolean)); 

      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchPokemonesByType();
  }, [selectedType]); // Re-run this effect whenever selectedType changes

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  if (cargando) {
    return <div className="pokemon-container">Cargando Pokémon...</div>;
  }

  if (error) {
    return <div className="pokemon-container error">Error: {error}</div>;
  }

  return (
    <div className='pokemon-container'>
      <h2>{selectedType ? `Pokémon de tipo: ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : 'Tus Pokémon Aleatorios'}</h2>
      
      {/* Selector de tipos */}
      <div className="type-selector">
        <h3>Buscar por Tipo:</h3>
        <select onChange={(e) => handleTypeSelect(e.target.value)} value={selectedType}>
          <option value="">Selecciona un tipo</option>
          {allTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <button onClick={() => setSelectedType('')}>Mostrar Aleatorios</button> {/* Botón para volver a los aleatorios */}
      </div>

      <div className="pokemon-list"> 
        {pokemones.length > 0 ? (
          pokemones.map(pokemon => (
            <div key={pokemon.id} className="pokemon-card">
              <h3>{pokemon.nombre.charAt(0).toUpperCase() + pokemon.nombre.slice(1)}</h3>
              <img src={pokemon.imagen} alt={pokemon.nombre} />
              <p>
                **Tipos:** {pokemon.tipos.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}
              </p>
            </div>
          ))
        ) : (
          <p>No se encontraron Pokémon para el tipo seleccionado o no hay Pokémon aleatorios.</p>
        )}
      </div>
    </div>
  );
};

export default PokemonFetcher;