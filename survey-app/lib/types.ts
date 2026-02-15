export interface SurveyData {
    id: string;
    playerId: string;
    playerName: string;
    type: 'pre' | 'post';
    stressLevel: number;
    happinessLevel: number;
    energyLevel: number;
    funLevel?: number;
    satisfactionLevel?: number;
    difficultyRating?: number;
    comments: string;
    timestamp: string;
}

export interface Stats {
    totalPlayers: number;
    totalSurveys: number;
    averageStress: { pre: number; post: number };
    averageHappiness: { pre: number; post: number };
    averageEnergy: { pre: number; post: number };
    surveysByType: { name: string; value: number }[];
    timeline: { date: string; pre: number; post: number }[];
}
