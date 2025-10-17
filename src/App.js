import React, { useReducer, useState } from 'react';
import './App.css';

// 🎯 Anfangswerte für das Spiel
const initialState = {
  spieler1: 0,
  spieler2: 0,
  remaining: 147,
  ahead: 0,
  redsLeft: 15,
  onColors: false,
  nextColorIndex: 0,
  history: [], // <— Verlauf für Undo
};

// Farben mit Wert & Reihenfolge
const colors = [
  { name: 'yellow', points: 2 },
  { name: 'green', points: 3 },
  { name: 'brown', points: 4 },
  { name: 'blue', points: 5 },
  { name: 'pink', points: 6 },
  { name: 'black', points: 7 },
];

// 🧮 Berechnet die verbleibenden Punkte dynamisch
function calculateRemaining(redsLeft, onColors, nextColorIndex) {
  if (onColors) {
    let sum = 0;
    for (let i = nextColorIndex; i < colors.length; i++) {
      sum += colors[i].points;
    }
    return sum;
  } else {
    return redsLeft * 8 + 27;
  }
}

// 🧠 Reducer für State-Management mit Undo (optimiert)
function reducer(state, action) {
  // 🔄 Verlauf sichern mit Deep Copy und Limit (max. 50 Schritte)
  const pushToHistory = (s) => [
    ...s.history.slice(-49),
    JSON.parse(JSON.stringify({ ...s, history: [] })),
  ];

  switch (action.type) {
    case 'ADD_POINTS': {
      const { player, points } = action;
      const newHistory = pushToHistory(state);

      const newScore = state[player] + points;
      let newRedsLeft = state.redsLeft;
      let onColors = state.onColors;
      let nextColorIndex = state.nextColorIndex;

      if (!state.onColors) {
        if (points === 1) {
          newRedsLeft = Math.max(0, state.redsLeft - 1);
          if (newRedsLeft === 0) onColors = true;
        }
      } else {
        const colorHitIndex = colors.findIndex(c => c.points === points);
        if (colorHitIndex === state.nextColorIndex) {
          nextColorIndex++;
        }
      }

      const newRemaining = calculateRemaining(newRedsLeft, onColors, nextColorIndex);
      const newAhead = Math.abs(
        player === 'spieler1'
          ? newScore - state.spieler2
          : newScore - state.spieler1
      );

      return {
        ...state,
        [player]: newScore,
        redsLeft: newRedsLeft,
        onColors,
        nextColorIndex,
        remaining: newRemaining,
        ahead: newAhead,
        history: newHistory,
      };
    }

    case 'ADD_FOUL': {
      const { foulPlayer, foulPoints } = action;
      const newHistory = pushToHistory(state);

      const opponent = foulPlayer === 'spieler1' ? 'spieler2' : 'spieler1';
      const newOpponentScore = state[opponent] + foulPoints;
      const newAhead = Math.abs(
        newOpponentScore - (foulPlayer === 'spieler1' ? state.spieler1 : state.spieler2)
      );

      return {
        ...state,
        [opponent]: newOpponentScore,
        ahead: newAhead,
        history: newHistory,
      };
    }

    case 'RESET': {
      const newHistory = pushToHistory(state);
      return {
        ...initialState,
        history: newHistory,
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...previous,
        history: state.history.slice(0, -1),
      };
    }

    default:
      return state;
  }
}

// 🎯 Spieler Panel
function SpielerPanel({ name, score, onScore, onFoul }) {
  return (
    <div className="spieler">
      <h2>{name}</h2>
      <div className="punkte">{score} Punkte</div>
      <div>
        {[1, 2, 3, 4, 5, 6, 7].map((punkte) => (
          <button
            key={punkte}
            className={getColorClass(punkte)}
            onClick={() => onScore(punkte)}
          >
            {punkte}
          </button>
        ))}
      </div>
      <div className="spacer"></div>
      <div>
        {[4, 5, 6, 7].map((foul) => (
          <button key={foul} className="foul" onClick={() => onFoul(foul)}>
            Foul {foul}
          </button>
        ))}
      </div>
    </div>
  );
}

function getColorClass(value) {
  const colorMap = {
    1: 'red',
    2: 'yellow',
    3: 'green',
    4: 'brown',
    5: 'blue',
    6: 'pink',
    7: 'black',
  };
  return colorMap[value] || 'unknown';
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [spieler1name, setSpielerName1] = useState('');
  const [spieler2name, setSpielerName2] = useState('');

  return (
    <div className="App">
      <h1>🎱 Snooker Punktezähler</h1>

      <div className="namen">
      <div style={{ 'margin-bottom': '0.5em' }}><label>
          Spieler 1:{' '}
          <input
            type="text"
            value={spieler1name}
            placeholder="Spieler 1"
            onChange={(e) => setSpielerName1(e.target.value)}
          />
        </label></div>
        <div><label>
          Spieler 2:{' '}
          <input
            type="text"
            value={spieler2name}
            placeholder="Spieler 2"
            onChange={(e) => setSpielerName2(e.target.value)}
          />
        </label></div>
      </div>

      <div className="panels">
        <SpielerPanel
          name={spieler1name}
          score={state.spieler1}
          onScore={(punkte) =>
            dispatch({ type: 'ADD_POINTS', player: 'spieler1', points: punkte })
          }
          onFoul={(punkte) =>
            dispatch({ type: 'ADD_FOUL', foulPlayer: 'spieler1', foulPoints: punkte })
          }
        />

        <SpielerPanel
          name={spieler2name}
          score={state.spieler2}
          onScore={(punkte) =>
            dispatch({ type: 'ADD_POINTS', player: 'spieler2', points: punkte })
          }
          onFoul={(punkte) =>
            dispatch({ type: 'ADD_FOUL', foulPlayer: 'spieler2', foulPoints: punkte })
          }
        />
      </div>

      <div className="actions">
        <button className="reset" 
        onClick={() => dispatch({ type: 'RESET' })}>
          Spiel zurücksetzen
        </button>
        <button
          className="reset"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.history.length === 0}
        >
          🔙 Rückgängig
        </button>
      </div>
    </div>
  );
}

export default App;
