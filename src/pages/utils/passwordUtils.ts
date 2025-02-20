export interface Stats {
  totalPossibleCombinations: number;
  totalPossibleAll: number;
  fourLetterCombinations: number;
  fourLetterPercentage: number;
  timeEstimation: string;
  currentStrategy: string | React.ReactNode;
  possibleCombinationsInfo: { [key: string]: number };
  specificLengthPercentage: number;
}

export const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const TOTAL_CHARS = 52; // 26 minúsculas + 26 mayúsculas

export const calculatePasswordStats = (length: number): Stats => {
  const CHARS_LENGTH = 52; // 26 lowercase + 26 uppercase
  
  // Calcular combinaciones para todas las longitudes posibles (4-8)
  const possibleCombinationsInfo: { [key: string]: number } = {};
  let totalPossibleAll = 0;
  
  // Calculamos las combinaciones para cada longitud y el total
  for (let i = 4; i <= 8; i++) {
    const combinations = Math.pow(CHARS_LENGTH, i);
    possibleCombinationsInfo[i] = combinations;
    totalPossibleAll += combinations;
  }

  // Calculamos las combinaciones para la longitud específica ingresada
  const totalPossibleCombinations = Math.pow(CHARS_LENGTH, length);
  
  // Calculamos el porcentaje que representa esta longitud del total de combinaciones
  const specificLengthPercentage = (totalPossibleCombinations / totalPossibleAll) * 100;

  // Calculamos las combinaciones posibles para contraseñas de 4 caracteres
  const fourLetterCombinations = Math.pow(CHARS_LENGTH, 4);
  
  // Calculamos qué porcentaje del total de combinaciones posibles representan las contraseñas de 4 caracteres
  const fourLetterPercentage = (fourLetterCombinations / totalPossibleAll) * 100;

  // Estimaciones de tiempo basadas en pruebas reales de rendimiento
  const timeEstimations = {
    4: "10-30 segundos (7,311,616 combinaciones)",
    5: "15-30 minutos (380,204,032 combinaciones)",
    6: "12-24 horas (19,770,609,664 combinaciones)", 
    7: "1-2 meses (1,028,071,702,528 combinaciones)",
    8: "varios años (53,459,728,531,456 combinaciones)"
  };

  return {
    // Total de combinaciones posibles para la longitud específica ingresada
    totalPossibleCombinations,
    
    // Total de todas las combinaciones posibles (4-8 caracteres)
    totalPossibleAll,
    
    // Número de combinaciones posibles usando solo 4 caracteres
    fourLetterCombinations,
    
    // Porcentaje que representan las contraseñas de 4 caracteres del total de combinaciones
    fourLetterPercentage,
    
    // Tiempo estimado para probar todas las combinaciones de la longitud actual
    timeEstimation: timeEstimations[length as keyof typeof timeEstimations] || "tiempo indeterminado",
    
    // Estrategia actual del ataque (se actualiza durante el proceso)
    currentStrategy: "",
    
    // Desglose de combinaciones posibles por cada longitud
    possibleCombinationsInfo,
    
    // Porcentaje que representa la longitud actual del total de combinaciones
    specificLengthPercentage
  };
};

export const calculateTimeEstimation = (combinationsForLength: number): string => {
  const secondsToTry = combinationsForLength / 10000;
  const minutesToTry = secondsToTry / 60;
  const hoursToTry = minutesToTry / 60;
  const daysToTry = hoursToTry / 24;

  if (daysToTry > 365) {
    return `${(daysToTry / 365).toFixed(1)} años`;
  } else if (daysToTry > 30) {
    return `${(daysToTry / 30).toFixed(1)} meses`;
  } else if (daysToTry > 1) {
    return `${daysToTry.toFixed(1)} días`;
  } else if (hoursToTry > 1) {
    return `${hoursToTry.toFixed(1)} horas`;
  } else if (minutesToTry > 1) {
    return `${minutesToTry.toFixed(1)} minutos`;
  }
  return `${secondsToTry.toFixed(1)} segundos`;
};

export const formatPercentage = (percentage: number): string => {
  if (percentage < 0.0001) {
    return percentage.toFixed(10).replace(/\.?0+$/, '');
  } else if (percentage < 0.01) {
    return percentage.toFixed(8);
  }
  return percentage.toFixed(2);
};

export const generateWorkerCode = () => `
  const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  function generateAttempt(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return result;
  }

  function bruteForce(targetPassword, maxLength, timeLimit) {
    const startTime = Date.now();
    let attempts = 0;
    const updateInterval = 1000; // Actualizar cada segundo
    let lastUpdate = startTime;

    while (true) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (timeLimit !== Infinity && elapsedTime >= timeLimit) {
        return;
      }

      const attempt = generateAttempt(maxLength);
      attempts++;

      if (currentTime - lastUpdate >= updateInterval) {
        const progress = timeLimit === Infinity ? 
          (attempts / Math.pow(52, maxLength)) * 100 : 
          (elapsedTime / timeLimit) * 100;

        postMessage({
          type: 'progress',
          attempts,
          current: attempt,
          progress: Math.min(progress, 99.99)
        });
        lastUpdate = currentTime;
      }

      if (attempt === targetPassword) {
        postMessage({
          type: 'found',
          attempts,
          password: attempt
        });
        return;
      }
    }
  }

  onmessage = function(e) {
    const { password, maxLength, timeLimit } = e.data;
    bruteForce(password, maxLength, timeLimit);
  };
`; 