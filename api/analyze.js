// api/analyze.js 파일 (CORS 처리 및 Gemini API 호출 로직 포함)

import { GoogleGenAI } from '@google/genai';

// Vercel 환경 변수에서 API 키를 안전하게 가져옵니다.
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 🚨 CORS를 처리하는 헤더를 정의합니다.
// 'Access-Control-Allow-Origin'에는 요청을 보낼 당신의 GitHub Pages 도메인을 정확히 입력해야 합니다.
const CORS_ORIGIN = 'https://mokoon.github.io/pokemon-analyzer-backend/'; 
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': CORS_ORIGIN, 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 서버리스 함수 핸들러
export default async function handler(req, res) {
    
    // 응답 헤더에 CORS 설정 추가 (POST 요청과 OPTIONS 요청 모두에 필요)
    res.setHeader('Access-Control-Allow-Origin', CORS_HEADERS['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods']);
    res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers']);


    // 🚨 1. 'OPTIONS' 메서드 요청 (CORS Preflight Request) 처리
    // 브라우저가 POST 요청을 보내기 전, 서버가 해당 요청을 허용하는지 확인하는 단계입니다.
    if (req.method === 'OPTIONS') {
        res.writeHead(200, CORS_HEADERS);
        return res.end();
    }

    // POST 요청이 아니면 405 응답
    if (req.method !== 'POST') {
        // 이미 CORS 헤더가 설정되었으므로 바로 응답합니다.
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 🚨 2. POST 요청 처리 (Gemini API 호출)
    try {
        // 클라이언트에서 보낸 포켓몬 팀 데이터를 받습니다.
        const { team } = req.body;

        if (!team || team.length === 0) {
            return res.status(400).json({ message: '팀 정보가 제공되지 않았습니다.' });
        }

        // Gemini에게 보낼 프롬프트
        const prompt = `
          다음은 사용자의 포켓몬스터 배틀팀(6마리) 구축입니다.
          데이터를 받는 형식은 포켓몬 쇼다운 텍스트이거나 사용자가 임의로 작성한 내용일 수 있습니다.
          팀의 포켓몬, 지닌 물건, 특성, 기술, 노력치 분배, 현재 메타게임 상황 등을 고려해서 팀을 분석해 주세요.
          이 팀의 잠재적인 강점과 메이저한 약점(특히 흔히 보이는 위협적인 포켓몬이나 타입)을 상세하게 분석해 주세요.
          결과는 다음 JSON 형식으로만 응답해 주세요:
          {
            "분석 결과": "분석 결과 요약",
            "강점": ["강점 1", "강점 2", ...],
            "약점": ["약점 1 (위협 포켓몬 또는 타입)", "약점 2", ...],
            "보완 포켓몬": ["보완 포켓몬 1", "보완 포켓몬 2 (간단한 이유 포함)"]
          }

          포켓몬 팀: ${team.join(', ')}
        `;

        // Gemini API 호출
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json', // JSON 형식으로 받도록 요청
            },
        });

        // 결과 반환 (CORS 헤더는 이미 위에서 설정되었습니다.)
        res.status(200).json(JSON.parse(response.text));
        
    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        res.status(500).json({ message: '분석 중 서버 오류가 발생했습니다.' });
    }
}