import { RealityApp } from "../components/reality-app";
import { GameProvider } from "../hooks/use-game";
export default function Page() {
  return (
    <GameProvider>
      <RealityApp />
    </GameProvider>
  );
}

