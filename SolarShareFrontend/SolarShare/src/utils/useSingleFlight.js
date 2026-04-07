import { useRef } from 'react';

const useSingleFlight = () => {
  const inFlightRef = useRef(new Set());

  const runSingleFlight = async (key, task) => {
    if (!key || typeof task !== 'function') {
      return null;
    }

    if (inFlightRef.current.has(key)) {
      return null;
    }

    inFlightRef.current.add(key);
    try {
      return await task();
    } finally {
      inFlightRef.current.delete(key);
    }
  };

  return { runSingleFlight };
};

export default useSingleFlight;
