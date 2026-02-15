// Replace this with your deployed Google Apps Script Web App URL
export const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyV-YOUR-ID-HERE/exec';

export interface GasStatsResponse {
    success: boolean;
    statistics: {
        totalPlayers: number;
        totalSessions: number;
        completedSurveys: number;
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
            };
        };
    };
    generatedAt: string;
}
