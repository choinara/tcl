export interface Team {
    id:   number;
    name: string;
}

export const TEAMS: Team[] = [];

// id → 이름 매핑
export const teamNameMap: Record<number, string> = Object.fromEntries(
    TEAMS.map(t => [t.id, t.name])
);
