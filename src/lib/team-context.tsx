import { createContext, useContext } from "react";

export interface ActiveTeam {
  id: string;
  name: string;
  invite_code: string;
}

interface TeamCtx {
  activeTeam: ActiveTeam | null;
  setActiveTeam: (team: ActiveTeam | null) => void;
}

export const TeamContext = createContext<TeamCtx>({
  activeTeam: null,
  setActiveTeam: () => {},
});

export const useActiveTeam = (): TeamCtx => useContext(TeamContext);
