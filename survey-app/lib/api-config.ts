// Replace this with your deployed Google Apps Script Web App URL
export const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbz86ZDccpSSSk4hplHskylUKNiqzyVlbcQBtGwV6-nvkiZyJRswsZHFSmDUUGpBmAc/exec';

export interface GasStatsResponse {
    success: boolean;
    statistics: {
        totalPlayers: number;
        totalSessions: number;
        completedSurveys: number;
        averageScore: string;
        averageScores: {
            preGame: {
                stress: string;
                happiness: string;
                energy: string;
            };
            postGame: {
                stress: string;
                happiness: string;
                fun: string;
                satisfaction: string;
                energy: string;
                difficulty: string;
            };
        };
        demographics: {
            gender: Record<string, number>;
            ageGroups: Record<string, number>;
        };
        experiencePerformance: Array<{ name: string, score: string }>;
        dailyTrends: Array<{
            date: string;
            sessions: number;
            avgScore: string;
            avgHappiness: string;
        }>;
        recentFeedback: Array<{
            player: string;
            comment: string;
            date: string;
        }>;
    };
    generatedAt: string;
}

export interface LeaderboardEntry {
    playerId: string;
    name: string;
    score: number;
    level: string;
    date: string;
}

export interface GasLeaderboardResponse {
    success: boolean;
    leaderboard: LeaderboardEntry[];
}
