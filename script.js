const VERCEl_API_ENDPOINT = 'https://pokemon-analyzer-backend.vercel.app/api/analyze'; 

const teamInput = document.getElementById('teamInput');
const analyzeButton = document.getElementById('analyzeButton');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('resultContainer');
const analysisResult = document.getElementById('analysisResult');
const errorDiv = document.getElementById('error');

analyzeButton.addEventListener('click', async () => {
    const teamText = teamInput.value.trim();
    const teamArray = teamText.split(',').map(name => name.trim()).filter(name => name.length > 0);

    if (teamArray.length < 1) {
        alert('최소한 한 마리 이상의 포켓몬 이름을 입력해 주세요.');
        return;
    }

    // UI 초기화 및 로딩 표시
    resultContainer.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loading.classList.remove('hidden');
    analyzeButton.disabled = true;

    try {
        // Vercel 서버리스 함수로 팀 데이터를 전송 (API 키는 서버에 숨겨져 있음)
        const response = await fetch(VERCEl_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ team: teamArray })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 결과 표시
        displayResult(data);

    } catch (e) {
        console.error('분석 요청 실패:', e);
        errorDiv.textContent = '⚠️ 오류 발생: 서버와 통신에 문제가 있거나, 분석에 실패했습니다. (콘솔 확인)';
        errorDiv.classList.remove('hidden');
    } finally {
        // 로딩 해제 및 버튼 활성화
        loading.classList.add('hidden');
        analyzeButton.disabled = false;
    }
});

function displayResult(data) {
    analysisResult.innerHTML = ''; // 이전 결과 지우기

    // 분석 결과 HTML 생성
    let html = `
        <p><strong>전체 분석 요약:</strong> ${data.analysis || '분석 결과가 없습니다.'}</p>

        <h3>✅ 강점</h3>
        <ul>${data.strengths ? data.strengths.map(s => `<li>${s}</li>`).join('') : '<li>정보 없음</li>'}</ul>

        <h3>💔 주요 약점</h3>
        <ul class="weaknesses">${data.weaknesses ? data.weaknesses.map(w => `<li style="color: #e74c3c; font-weight: bold;">${w}</li>`).join('') : '<li>정보 없음</li>'}</ul>

        <h3>🌟 보완 추천</h3>
        <ul>${data.recommendations ? data.recommendations.map(r => `<li>${r}</li>`).join('') : '<li>정보 없음</li>'}</ul>
    `;

    analysisResult.innerHTML = html;
    resultContainer.classList.remove('hidden');
}