/**
 * Google Apps Script สำหรับจัดการแบบสอบถามเกม
 * รองรับการบันทึกข้อมูลก่อนและหลังเล่นเกม
 * เชื่อมต่อกับ Unity และ Web Dashboard
 */

// ============================================
// CONFIGURATION
// ============================================

// ใส่ Spreadsheet ID ของคุณที่นี่
const SPREADSHEET_ID = '1jRjL2DfZGafGn8Ax5_-D-D7Zrnxc4QnVdO0NbPONgIU';

// ชื่อของ Sheets แต่ละประเภท
const SHEET_NAMES = {
    PLAYERS: 'Players',           // ข้อมูลผู้เล่น
    PRE_SURVEY: 'PreGameSurvey',  // แบบสอบถามก่อนเล่น
    POST_SURVEY: 'PostGameSurvey', // แบบสอบถามหลังเล่น
    SESSIONS: 'GameSessions'       // บันทึกการเล่นเกม
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * ดึง Spreadsheet object
 */
function getSpreadsheet() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * ดึง Sheet ตามชื่อ หรือสร้างใหม่ถ้ายังไม่มี
 */
function getOrCreateSheet(sheetName, headers) {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        if (headers && headers.length > 0) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
            sheet.setFrozenRows(1);
        }
    }

    return sheet;
}

/**
 * สร้าง Player ID ใหม่
 */
function generatePlayerId() {
    return 'P' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

/**
 * สร้าง Session ID ใหม่
 */
function generateSessionId() {
    return 'S' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

/**
 * ส่งข้อมูลกลับในรูปแบบ JSON
 */
function sendJsonResponse(data, status = 200) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ส่ง Error Response
 */
function sendErrorResponse(message, status = 400) {
    return sendJsonResponse({
        success: false,
        error: message
    }, status);
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Main API Handler (GET & POST)
 */
function doGet(e) {
    try {
        const action = e.parameter.action;

        switch (action) {
            case 'getPlayer':
                return getPlayerData(e.parameter.playerId);

            case 'getSession':
                return getSessionData(e.parameter.sessionId);

            case 'getAllPlayers':
                return getAllPlayers();

            case 'getPlayerSessions':
                return getPlayerSessions(e.parameter.playerId);

            case 'getLeaderboard':
                return getLeaderboard(e.parameter.limit);

            case 'getStats':
                return getStatistics();

            default:
                return sendJsonResponse({
                    success: true,
                    message: 'Game Survey API v1.0',
                    endpoints: {
                        POST: [
                            '/exec?action=registerPlayer',
                            '/exec?action=submitPreSurvey',
                            '/exec?action=submitPostSurvey',
                            '/exec?action=startSession'
                        ],
                        GET: [
                            '/exec?action=getPlayer&playerId=XXX',
                            '/exec?action=getSession&sessionId=XXX',
                            '/exec?action=getAllPlayers',
                            '/exec?action=getPlayerSessions&playerId=XXX',
                            '/exec?action=getStats'
                        ]
                    }
                });
        }
    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action || e.parameter.action;

        switch (action) {
            case 'registerPlayer':
                return registerPlayer(data);

            case 'submitPreSurvey':
                return submitPreSurvey(data);

            case 'submitPostSurvey':
                return submitPostSurvey(data);

            case 'startSession':
                return startGameSession(data);

            case 'submitScore':
                return submitScore(data);

            default:
                return sendErrorResponse('Invalid action');
        }
    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

// ============================================
// PLAYER MANAGEMENT
// ============================================

/**
 * ลงทะเบียนผู้เล่นใหม่
 * Input: { name, age, gender, email, etc. }
 */
function registerPlayer(data) {
    try {
        const sheet = getOrCreateSheet(SHEET_NAMES.PLAYERS, [
            'PlayerId', 'Name', 'Age', 'Gender', 'Email', 'Phone',
            'Education', 'GameExperience', 'RegisteredAt', 'LastActive'
        ]);

        const playerId = generatePlayerId();
        const timestamp = new Date();

        const row = [
            playerId,
            data.name || '',
            data.age || '',
            data.gender || '',
            data.email || '',
            data.phone || '',
            data.education || '',
            data.gameExperience || '',
            timestamp,
            timestamp
        ];

        sheet.appendRow(row);

        return sendJsonResponse({
            success: true,
            playerId: playerId,
            message: 'Player registered successfully'
        });

    } catch (error) {
        return sendErrorResponse('Registration failed: ' + error.toString());
    }
}

/**
 * บันทึกหรืออัปเดตข้อมูลพื้นฐานผู้เล่น
 */
function upsertPlayer(playerId, name, age, gender) {
    if (!playerId) return;
    try {
        const sheet = getOrCreateSheet(SHEET_NAMES.PLAYERS);
        const data = sheet.getDataRange().getValues();
        const timestamp = new Date();

        // ค้นหาผู้เล่นเดิม
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === playerId) {
                // อัปเดตข้อมูลถ้ายังไม่มี
                if (name && (!data[i][1] || data[i][1] === 'Anonymous')) {
                    sheet.getRange(i + 1, 2).setValue(name);
                }
                if (age && !data[i][2]) {
                    sheet.getRange(i + 1, 3).setValue(age);
                }
                if (gender && (!data[i][3] || data[i][3] === 'ไม่ระบุ')) {
                    sheet.getRange(i + 1, 4).setValue(gender);
                }
                // อัปเดต LastActive
                sheet.getRange(i + 1, 10).setValue(timestamp);
                return;
            }
        }

        // ถ้าไม่พบ ให้สร้างใหม่
        sheet.appendRow([
            playerId,
            name || 'Anonymous',
            age || '',
            gender || 'ไม่ระบุ',
            '', '', '', '', // ข้อมูลอื่นๆ
            timestamp, // RegisteredAt
            timestamp  // LastActive
        ]);
    } catch (e) {
        Logger.log('Upsert player failed: ' + e.toString());
    }
}

/**
 * ดึงข้อมูลผู้เล่น
 */
function getPlayerData(playerId) {
    try {
        if (!playerId) {
            return sendErrorResponse('PlayerId is required');
        }

        const sheet = getOrCreateSheet(SHEET_NAMES.PLAYERS);
        const data = sheet.getDataRange().getValues();

        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === playerId) {
                const headers = data[0];
                const playerData = {};

                for (let j = 0; j < headers.length; j++) {
                    playerData[headers[j]] = data[i][j];
                }

                return sendJsonResponse({
                    success: true,
                    player: playerData
                });
            }
        }

        return sendErrorResponse('Player not found');

    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

/**
 * ดึงรายชื่อผู้เล่นทั้งหมด
 */
function getAllPlayers() {
    try {
        const sheet = getOrCreateSheet(SHEET_NAMES.PLAYERS);
        const data = sheet.getDataRange().getValues();

        if (data.length <= 1) {
            return sendJsonResponse({
                success: true,
                players: []
            });
        }

        const headers = data[0];
        const players = [];

        for (let i = 1; i < data.length; i++) {
            const player = {};
            for (let j = 0; j < headers.length; j++) {
                player[headers[j]] = data[i][j];
            }
            players.push(player);
        }

        return sendJsonResponse({
            success: true,
            players: players,
            count: players.length
        });

    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

// ============================================
// SURVEY MANAGEMENT
// ============================================

/**
 * บันทึกแบบสอบถามก่อนเล่นเกม
 * Input: {
 *   playerId,
 *   sessionId,
 *   stressLevel: 1-10,
 *   happinessLevel: 1-10,
 *   energyLevel: 1-10,
 *   motivationLevel: 1-10,
 *   anxietyLevel: 1-10,
 *   comments: "text"
 * }
 */
function submitPreSurvey(data) {
    try {
        // อัปเดตข้อมูลผู้เล่นก่อน
        upsertPlayer(data.playerId, data.playerName, data.age, data.gender);

        const sheet = getOrCreateSheet(SHEET_NAMES.PRE_SURVEY, [
            'SurveyId', 'PlayerId', 'SessionId', 'Timestamp',
            'StressLevel', 'HappinessLevel', 'EnergyLevel',
            'MotivationLevel', 'AnxietyLevel', 'MoodDescription',
            'ExpectationScore', 'Comments'
        ]);

        const surveyId = 'PRE-' + Utilities.getUuid().substring(0, 8);
        const timestamp = new Date();

        const row = [
            surveyId,
            data.playerId || '',
            data.sessionId || '',
            timestamp,
            data.stressLevel || '',
            data.happinessLevel || '',
            data.energyLevel || '',
            data.motivationLevel || '',
            data.anxietyLevel || '',
            data.moodDescription || '',
            data.expectationScore || '',
            data.comments || ''
        ];

        sheet.appendRow(row);

        return sendJsonResponse({
            success: true,
            surveyId: surveyId,
            message: 'Pre-game survey submitted successfully'
        });

    } catch (error) {
        return sendErrorResponse('Survey submission failed: ' + error.toString());
    }
}

/**
 * บันทึกแบบสอบถามหลังเล่นเกม
 * Input: {
 *   playerId,
 *   sessionId,
 *   stressLevel: 1-10,
 *   happinessLevel: 1-10,
 *   funLevel: 1-10,
 *   satisfactionLevel: 1-10,
 *   energyLevel: 1-10,
 *   difficultyRating: 1-10,
 *   willPlayAgain: true/false,
 *   comments: "text"
 * }
 */
function submitPostSurvey(data) {
    try {
        // อัปเดตข้อมูลผู้เล่นก่อน
        upsertPlayer(data.playerId, data.playerName, data.age, data.gender);

        const sheet = getOrCreateSheet(SHEET_NAMES.POST_SURVEY, [
            'SurveyId', 'PlayerId', 'SessionId', 'Timestamp',
            'StressLevel', 'HappinessLevel', 'FunLevel',
            'SatisfactionLevel', 'EnergyLevel', 'DifficultyRating',
            'WillPlayAgain', 'FavoriteAspect', 'ImprovementSuggestions',
            'OverallRating', 'Comments'
        ]);

        const surveyId = 'POST-' + Utilities.getUuid().substring(0, 8);
        const timestamp = new Date();

        const row = [
            surveyId,
            data.playerId || '',
            data.sessionId || '',
            timestamp,
            data.stressLevel || '',
            data.happinessLevel || '',
            data.funLevel || '',
            data.satisfactionLevel || '',
            data.energyLevel || '',
            data.difficultyRating || '',
            data.willPlayAgain || '',
            data.favoriteAspect || '',
            data.improvementSuggestions || '',
            data.overallRating || '',
            data.comments || ''
        ];

        sheet.appendRow(row);

        // บันทึกคะแนนลงใน GameSessions ด้วยถ้ามีการแนบ score มา
        if (data.score !== undefined || data.level !== undefined) {
            submitScore({
                playerId: data.playerId,
                sessionId: data.sessionId || surveyId,
                score: data.score,
                level: data.level,
                notes: 'บันทึกอัตโนมัติจากแบบสอบถาม'
            });
        }

        // คำนวณการเปลี่ยนแปลง (ถ้ามี pre-survey)
        const comparison = calculateSurveyComparison(data.sessionId);

        return sendJsonResponse({
            success: true,
            surveyId: surveyId,
            comparison: comparison,
            message: 'Post-game survey submitted successfully'
        });

    } catch (error) {
        return sendErrorResponse('Survey submission failed: ' + error.toString());
    }
}

/**
 * เปรียบเทียบคะแนนก่อนและหลังเล่น
 */
function calculateSurveyComparison(sessionId) {
    try {
        const preSheet = getOrCreateSheet(SHEET_NAMES.PRE_SURVEY);
        const postSheet = getOrCreateSheet(SHEET_NAMES.POST_SURVEY);

        const preData = preSheet.getDataRange().getValues();
        const postData = postSheet.getDataRange().getValues();

        let preRow = null;
        let postRow = null;

        // หา pre-survey
        for (let i = 1; i < preData.length; i++) {
            if (preData[i][2] === sessionId) {
                preRow = preData[i];
                break;
            }
        }

        // หา post-survey
        for (let i = 1; i < postData.length; i++) {
            if (postData[i][2] === sessionId) {
                postRow = postData[i];
                break;
            }
        }

        if (!preRow || !postRow) {
            return null;
        }

        return {
            stressChange: postRow[4] - preRow[4],
            happinessChange: postRow[5] - preRow[5],
            energyChange: postRow[8] - preRow[6]
        };

    } catch (error) {
        return null;
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * เริ่มต้น Game Session
 */
function startGameSession(data) {
    try {
        const sheet = getOrCreateSheet(SHEET_NAMES.SESSIONS, [
            'SessionId', 'PlayerId', 'StartTime', 'EndTime',
            'Duration', 'GameLevel', 'Score', 'Completed', 'Notes'
        ]);

        const sessionId = generateSessionId();
        const timestamp = new Date();

        const row = [
            sessionId,
            data.playerId || '',
            timestamp,
            '',
            '',
            data.gameLevel || '',
            '',
            false,
            data.notes || ''
        ];

        sheet.appendRow(row);

        return sendJsonResponse({
            success: true,
            sessionId: sessionId,
            startTime: timestamp,
            message: 'Game session started'
        });

    } catch (error) {
        return sendErrorResponse('Failed to start session: ' + error.toString());
    }
}

/**
 * ดึงข้อมูล Session
 */
function getSessionData(sessionId) {
    try {
        if (!sessionId) {
            return sendErrorResponse('SessionId is required');
        }

        const sheet = getOrCreateSheet(SHEET_NAMES.SESSIONS);
        const data = sheet.getDataRange().getValues();

        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === sessionId) {
                const headers = data[0];
                const sessionData = {};

                for (let j = 0; j < headers.length; j++) {
                    sessionData[headers[j]] = data[i][j];
                }

                // ดึงข้อมูล surveys ที่เกี่ยวข้อง
                const surveys = getSessionSurveys(sessionId);
                sessionData.surveys = surveys;

                return sendJsonResponse({
                    success: true,
                    session: sessionData
                });
            }
        }

        return sendErrorResponse('Session not found');

    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

/**
 * ดึงข้อมูล surveys ของ session
 */
function getSessionSurveys(sessionId) {
    const surveys = {
        pre: null,
        post: null
    };

    try {
        // Pre-survey
        const preSheet = getOrCreateSheet(SHEET_NAMES.PRE_SURVEY);
        const preData = preSheet.getDataRange().getValues();

        for (let i = 1; i < preData.length; i++) {
            if (preData[i][2] === sessionId) {
                const headers = preData[0];
                const preSurvey = {};
                for (let j = 0; j < headers.length; j++) {
                    preSurvey[headers[j]] = preData[i][j];
                }
                surveys.pre = preSurvey;
                break;
            }
        }

        // Post-survey
        const postSheet = getOrCreateSheet(SHEET_NAMES.POST_SURVEY);
        const postData = postSheet.getDataRange().getValues();

        for (let i = 1; i < postData.length; i++) {
            if (postData[i][2] === sessionId) {
                const headers = postData[0];
                const postSurvey = {};
                for (let j = 0; j < headers.length; j++) {
                    postSurvey[headers[j]] = postData[i][j];
                }
                surveys.post = postSurvey;
                break;
            }
        }

    } catch (error) {
        Logger.log('Error getting surveys: ' + error);
    }

    return surveys;
}

/**
 * ดึง sessions ทั้งหมดของผู้เล่น
 */
function getPlayerSessions(playerId) {
    try {
        if (!playerId) {
            return sendErrorResponse('PlayerId is required');
        }

        const sheet = getOrCreateSheet(SHEET_NAMES.SESSIONS);
        const data = sheet.getDataRange().getValues();

        if (data.length <= 1) {
            return sendJsonResponse({
                success: true,
                sessions: []
            });
        }

        const headers = data[0];
        const sessions = [];

        for (let i = 1; i < data.length; i++) {
            if (data[i][1] === playerId) {
                const session = {};
                for (let j = 0; j < headers.length; j++) {
                    session[headers[j]] = data[i][j];
                }
                sessions.push(session);
            }
        }

        return sendJsonResponse({
            success: true,
            playerId: playerId,
            sessions: sessions,
            count: sessions.length
        });

    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * คำนวณสถิติภาพรวม
 */
function getStatistics() {
    try {
        const stats = {
            totalPlayers: 0,
            totalSessions: 0,
            completedSurveys: 0,
            averageScore: 0,
            averageScores: { preGame: {}, postGame: {} },
            demographics: {
                gender: {},
                ageGroups: { 'น้อยกว่า 18': 0, '18-25': 0, '26-35': 0, '36 ขึ้นไป': 0 }
            },
            experiencePerformance: {}, // Avg score by experience
            dailyTrends: [] // Date, sessions, avgScore, avgHappiness
        };

        // 1. Demographics & Players
        const playersSheet = getOrCreateSheet(SHEET_NAMES.PLAYERS);
        const playersData = playersSheet.getDataRange().getValues();
        stats.totalPlayers = playersData.length - 1;

        const playerExpMap = {}; // เพื่อใช้ต่อกับคะแนน

        if (playersData.length > 1) {
            for (let i = 1; i < playersData.length; i++) {
                const p = playersData[i];
                const playerId = p[0];
                const age = Number(p[2]);
                const gender = p[3] || 'ไม่ระบุ';
                const exp = p[7] || 'เริ่มต้น';

                playerExpMap[playerId] = exp;

                // Gender count
                stats.demographics.gender[gender] = (stats.demographics.gender[gender] || 0) + 1;

                // Age group
                if (age < 18) stats.demographics.ageGroups['น้อยกว่า 18']++;
                else if (age <= 25) stats.demographics.ageGroups['18-25']++;
                else if (age <= 35) stats.demographics.ageGroups['26-35']++;
                else stats.demographics.ageGroups['36 ขึ้นไป']++;
            }
        }

        // 2. Sessions & Trends
        const sessionsSheet = getOrCreateSheet(SHEET_NAMES.SESSIONS);
        const sessionsData = sessionsSheet.getDataRange().getValues();
        stats.totalSessions = sessionsData.length - 1;

        const dailyData = {}; // { 'YYYY-MM-DD': { sum: 0, count: 0 } }
        const expData = {}; // { 'ExpLevel': { sum: 0, count: 0 } }

        if (sessionsData.length > 1) {
            let totalScoreSum = 0;
            let totalScoreCount = 0;

            for (let i = 1; i < sessionsData.length; i++) {
                const s = sessionsData[i];
                const playerId = s[1];
                const date = Utilities.formatDate(new Date(s[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
                const score = Number(s[6]);

                if (!isNaN(score)) {
                    totalScoreSum += score;
                    totalScoreCount++;

                    // Daily trend
                    if (!dailyData[date]) dailyData[date] = { scoreSum: 0, count: 0, happinessSum: 0, happyCount: 0 };
                    dailyData[date].scoreSum += score;
                    dailyData[date].count++;

                    // Exp performance
                    const exp = playerExpMap[playerId] || 'ไม่ระบุ';
                    if (!expData[exp]) expData[exp] = { sum: 0, count: 0 };
                    expData[exp].sum += score;
                    expData[exp].count++;
                }
            }
            stats.averageScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount).toFixed(0) : 0;
        }

        // 3. Surveys & Sentiment
        const preSheet = getOrCreateSheet(SHEET_NAMES.PRE_SURVEY);
        const preData = preSheet.getDataRange().getValues();
        if (preData.length > 1) {
            let sSum = 0, hSum = 0, eSum = 0, count = 0;
            for (let i = 1; i < preData.length; i++) {
                if (preData[i][4]) sSum += Number(preData[i][4]);
                if (preData[i][5]) hSum += Number(preData[i][5]);
                if (preData[i][6]) eSum += Number(preData[i][6]);
                count++;
            }
            stats.averageScores.preGame = {
                stress: (sSum / count).toFixed(2),
                happiness: (hSum / count).toFixed(2),
                energy: (eSum / count).toFixed(2)
            };
        }

        const postSheet = getOrCreateSheet(SHEET_NAMES.POST_SURVEY);
        const postData = postSheet.getDataRange().getValues();
        if (postData.length > 1) {
            let sSum = 0, hSum = 0, fSum = 0, satSum = 0, eSum = 0, dSum = 0, count = 0;
            for (let i = 1; i < postData.length; i++) {
                const p = postData[i];
                const date = Utilities.formatDate(new Date(p[3]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
                const happy = Number(p[5]);

                if (p[4]) sSum += Number(p[4]);
                if (p[5]) hSum += happy;
                if (p[6]) fSum += Number(p[6]);
                if (p[7]) satSum += Number(p[7]);
                if (p[8]) eSum += Number(p[8]);
                if (p[9]) dSum += Number(p[9]);
                count++;

                // Add happiness to daily trend
                if (dailyData[date] && !isNaN(happy)) {
                    dailyData[date].happinessSum += happy;
                    dailyData[date].happyCount++;
                }
            }
            stats.averageScores.postGame = {
                stress: (sSum / count).toFixed(2),
                happiness: (hSum / count).toFixed(2),
                fun: (fSum / count).toFixed(2),
                satisfaction: (satSum / count).toFixed(2),
                energy: (eSum / count).toFixed(2),
                difficulty: (dSum / count).toFixed(2)
            };
            stats.completedSurveys = count;
        }

        // Finalize Trends & Performance
        stats.experiencePerformance = Object.keys(expData).map(exp => ({
            name: exp,
            score: (expData[exp].sum / expData[exp].count).toFixed(0)
        }));

        stats.dailyTrends = Object.keys(dailyData).sort().map(date => ({
            date: date,
            sessions: dailyData[date].count,
            avgScore: (dailyData[date].scoreSum / dailyData[date].count).toFixed(0),
            avgHappiness: dailyData[date].happyCount > 0 ? (dailyData[date].happinessSum / dailyData[date].happyCount).toFixed(2) : 0
        }));

        // 4. Recent Feedback
        const feedback = [];
        if (postData.length > 1) {
            for (let i = postData.length - 1; i >= 1 && feedback.length < 5; i--) {
                const comment = postData[i][14];
                if (comment && comment.trim() !== '') {
                    feedback.push({
                        player: postData[i][1],
                        comment: comment,
                        date: Utilities.formatDate(new Date(postData[i][3]), Session.getScriptTimeZone(), 'dd/MM HH:mm')
                    });
                }
            }
        }
        stats.recentFeedback = feedback;

        // 5. Recent 20 Players Emotional Comparison
        const recentEmotional = [];
        const nameMap = getPlayerNamesMap();
        if (postData.length > 1) {
            // Get last 20 surveys
            for (let i = postData.length - 1; i >= 1 && recentEmotional.length < 20; i--) {
                const p = postData[i];
                recentEmotional.push({
                    name: (nameMap[p[1]] || 'ไม่ระบุ') + ' (' + Utilities.formatDate(new Date(p[3]), Session.getScriptTimeZone(), 'HH:mm') + ')',
                    stress: Number(p[4]) || 0,
                    happiness: Number(p[5]) || 0,
                    energy: Number(p[8]) || 0,
                });
            }
        }
        stats.recentEmotionalComparison = recentEmotional.reverse();

        return sendJsonResponse({
            success: true,
            statistics: stats,
            generatedAt: new Date()
        });

    } catch (error) {
        return sendErrorResponse('Failed to calculate statistics: ' + error.toString());
    }
}

// ============================================
// SETUP FUNCTION
// ============================================

/**
 * ฟังก์ชันสำหรับ setup sheets ครั้งแรก
 * เรียกใช้ครั้งเดียวเพื่อสร้าง sheets ทั้งหมด
 */
function setupSheets() {
    try {
        // สร้าง Players sheet
        getOrCreateSheet(SHEET_NAMES.PLAYERS, [
            'PlayerId', 'Name', 'Age', 'Gender', 'Email', 'Phone',
            'Education', 'GameExperience', 'RegisteredAt', 'LastActive'
        ]);

        // สร้าง PreGameSurvey sheet
        getOrCreateSheet(SHEET_NAMES.PRE_SURVEY, [
            'SurveyId', 'PlayerId', 'SessionId', 'Timestamp',
            'StressLevel', 'HappinessLevel', 'EnergyLevel',
            'MotivationLevel', 'AnxietyLevel', 'MoodDescription',
            'ExpectationScore', 'Comments'
        ]);

        // สร้าง PostGameSurvey sheet
        getOrCreateSheet(SHEET_NAMES.POST_SURVEY, [
            'SurveyId', 'PlayerId', 'SessionId', 'Timestamp',
            'StressLevel', 'HappinessLevel', 'FunLevel',
            'SatisfactionLevel', 'EnergyLevel', 'DifficultyRating',
            'WillPlayAgain', 'FavoriteAspect', 'ImprovementSuggestions',
            'OverallRating', 'Comments'
        ]);

        // สร้าง GameSessions sheet
        getOrCreateSheet(SHEET_NAMES.SESSIONS, [
            'SessionId', 'PlayerId', 'StartTime', 'EndTime',
            'Duration', 'GameLevel', 'Score', 'Completed', 'Notes'
        ]);

        Logger.log('All sheets created successfully!');
        return 'Setup completed successfully!';

    } catch (error) {
        Logger.log('Setup failed: ' + error.toString());
        return 'Setup failed: ' + error.toString();
    }
}

/**
 * ดึงข้อมูล Leaderboard
 */
function getLeaderboard(limit = 10) {
    try {
        const sheet = getOrCreateSheet(SHEET_NAMES.SESSIONS);
        const data = sheet.getDataRange().getValues();

        if (data.length <= 1) return sendJsonResponse({ success: true, leaderboard: [] });

        // Map players to their best scores
        const bestScores = {};
        const playerNames = getPlayerNamesMap();

        for (let i = 1; i < data.length; i++) {
            const playerId = data[i][1];
            const score = Number(data[i][6]) || 0;
            const level = data[i][5] || 'Unknown';

            if (!bestScores[playerId] || score > bestScores[playerId].score) {
                bestScores[playerId] = {
                    playerId: playerId,
                    name: playerNames[playerId] || 'Anonymous',
                    score: score,
                    level: level,
                    date: data[i][2]
                };
            }
        }

        const leaderboard = Object.values(bestScores)
            .sort((a, b) => b.score - a.score)
            .slice(0, Number(limit));

        return sendJsonResponse({
            success: true,
            leaderboard: leaderboard
        });
    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}

/**
 * Helper: ดึง Map ชื่อผู้เล่นจาก PlayerId
 */
function getPlayerNamesMap() {
    const sheet = getOrCreateSheet(SHEET_NAMES.PLAYERS);
    const data = sheet.getDataRange().getValues();
    const names = {};
    for (let i = 1; i < data.length; i++) {
        names[data[i][0]] = data[i][1];
    }
    return names;
}

/**
 * บันทึกคะแนนใหม่
 */
function submitScore(data) {
    try {
        // อัปเดตข้อมูลผู้เล่น
        upsertPlayer(data.playerId, data.playerName, data.age, data.gender);

        const sheet = getOrCreateSheet(SHEET_NAMES.SESSIONS);
        const sessionId = data.sessionId || generateSessionId();
        const timestamp = new Date();

        const row = [
            sessionId,
            data.playerId || '',
            timestamp,
            timestamp, // EndTime
            '0', // Duration (placeholder)
            data.level || '1',
            data.score || 0,
            true, // Completed
            data.notes || 'Submitted via Web'
        ];

        sheet.appendRow(row);

        return sendJsonResponse({
            success: true,
            sessionId: sessionId,
            message: 'Score submitted successfully'
        });
    } catch (error) {
        return sendErrorResponse(error.toString());
    }
}
