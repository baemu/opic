# OPIc Compact Study Viewer

`output/scripts`의 Markdown 파일을 읽어서 영어 문제와 답변을 클릭 재생용 화면으로 보여줍니다.

## 포함 규칙

`build-data.mjs`는 `output/scripts`에서 아래 형식의 파일을 자동으로 포함합니다.

- `1. family-house숫자.md`
- `2. 주제.md`부터 `8. 주제.md`
- `4. music2.md`, `5. inst2.md` 같은 수정본 파일

`familyXX.md`, `family-houseXX.md`처럼 `XX`가 붙은 임시 파일은 제외합니다.

## 사용 방법

Markdown 파일을 수정한 뒤 `OPIc-study.bat`을 더블클릭합니다.

실행 파일이 내 자료와 민석 자료의 `data.js`를 갱신하고 내 `compact.html`을 자동으로 엽니다. 서버나 상시 실행 프로세스는 사용하지 않습니다.

답변 문장을 수정할 때는 Markdown의 `[영어+한국어 버전]`을 수정합니다. 이 영역의 영어와 한국어 문장 쌍이 최종 답변 화면의 기준이며, 수정된 영어는 말하기용에도 자동 반영됩니다.

## 필요한 파일

- `OPIc-study.bat`: 업데이트 후 학습 화면 실행
- `build-data.mjs`: Markdown 변환
- `data.js`: 변환된 학습 데이터
- `compact.html`: 학습 화면
- `compact-app.js`: 화면 및 음성 기능
- `compact-styles.css`: 화면 디자인
- `DESIGN-claude.md`: 디자인 원본 문서
