// api/analyze.js 파일 내용

import { GoogleGenAI } from '@google/genai';

// Vercel 환경 변수에서 API 키를 안전하게 가져옵니다.
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 서버리스 함수 핸들러
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 클라이언트에서 보낸 포켓몬 팀 데이터를 받습니다.
    const { team } = req.body;

    if (!team || team.length === 0) {
      return res.status(400).json({ message: '팀 정보가 제공되지 않았습니다.' });
    }

    // Gemini에게 보낼 프롬프트
    const prompt = `
      다음은 사용자의 포켓몬스터 배틀팀(6마리) 구축입니다.
      이 팀의 잠재적인 강점과 메이저한 약점(특히 흔히 보이는 위협적인 포켓몬이나 타입)을 상세하게 분석해 주세요.
      결과는 다음 JSON 형식으로만 응답해 주세요:
      {
        "analysis": "분석 결과 요약",
        "strengths": ["강점 1", "강점 2", ...],
        "weaknesses": ["약점 1 (위협 포켓몬 또는 타입)", "약점 2", ...],
        "recommendations": ["보완 포켓몬 1", "보완 포켓몬 2 (간단한 이유 포함)"]
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

    // 결과 반환
    res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    res.status(500).json({ message: '분석 중 서버 오류가 발생했습니다.' });
  }
}