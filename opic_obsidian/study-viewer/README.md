# OPIc Practice

`output/scripts`의 Markdown 파일을 읽어서 영어 문제와 답변을 클릭 재생용 화면으로 보여줍니다.

## 포함 규칙

`build-data.mjs`는 `output/scripts`에서 아래 형식의 파일을 자동으로 포함합니다.

- `1. family-house숫자.md`
- `2. 주제.md`부터 `8. 주제.md`
- `4. music2.md`, `5. inst2.md` 같은 수정본 파일

`familyXX.md`, `family-houseXX.md`처럼 `XX`가 붙은 임시 파일은 제외합니다.

## 사용 방법

Markdown 파일을 수정한 뒤 로컬 화면만 확인할 때는 `OPIc-study.bat`을 더블클릭합니다.

실행 파일이 내 자료와 민석 자료의 `data.js`를 갱신하고 내 `compact.html`을 자동으로 엽니다. 서버나 상시 실행 프로세스는 사용하지 않습니다.

답변 문장을 수정할 때는 Markdown의 `[영어+한국어 버전]`을 수정합니다. 이 영역의 영어와 한국어 문장 쌍이 최종 답변 화면의 기준이며, 수정된 영어는 말하기용에도 자동 반영됩니다.

학습 화면 상단의 `시험 직전`을 누르면 빠른 복습 화면이 열립니다. 주제별 최신 수정본을 자동으로 선택하고, `[영어+한국어 버전]`의 한국어 문장을 짧은 기억 흐름으로 바꾸며 영어 문장은 말하기 뼈대로 표시합니다. `시험 순서` 보기에서는 Combo별 주제와 Set을 고른 뒤 실제 순서인 `T1→T2→T3 / T1→T3→T4 / T1→T3→T4 / T6→T7→T8`로 Q2~Q13을 복습하거나 바로 실전 연습할 수 있습니다. 준비하지 않는 Type 9·10은 포함하지 않습니다. Markdown을 수정한 뒤 `OPIc-study.bat` 또는 `OPIc-publish.bat`을 실행하면 복습 화면도 함께 갱신됩니다.

## 아이폰·아이패드 사용

공개 주소는 `https://baemu.github.io/opic/`입니다.

처음 한 번 GitHub 저장소의 `Settings > Pages`에서 배포 방식을 `GitHub Actions`로 선택합니다. 이후 휴대폰의 공개 화면까지 갱신할 때는 `OPIc-publish.bat`을 더블클릭합니다. 이 파일은 Markdown을 `data.js`로 다시 만든 뒤 변경사항을 업로드하고, GitHub Pages 배포가 끝난 다음 최신 공개 화면을 엽니다.

아이폰이나 아이패드의 Safari에서 공개 주소를 연 다음 `공유 > 홈 화면에 추가`를 선택합니다. 처음 한 번 온라인으로 열어 두면 앱 파일이 저장되어 이후에는 오프라인에서도 사용할 수 있습니다.

- iPhone 17 Pro 세로: 주제, Set, Type은 가로 스크롤이며 답변은 1열입니다.
- iPhone 17 Pro 가로: 문제와 답변을 좌우로 표시합니다.
- iPad Air 13 세로·가로: 문제는 왼쪽, 답변은 오른쪽에 표시합니다.
- iOS에서는 설치된 영어 음성 중 미국 영어를 우선 사용합니다.

## 필요한 파일

- `OPIc-study.bat`: 내 PC의 데이터 업데이트 후 학습 화면 실행
- `OPIc-publish.bat`: 내 PC의 데이터 업데이트 후 GitHub Pages까지 갱신
- `build-data.mjs`: Markdown 변환
- `data.js`: 변환된 학습 데이터
- `compact.html`: 학습 화면
- `compact-app.js`: 화면 및 음성 기능
- `compact-styles.css`: 화면 디자인
- `review.html`: 시험 직전 복습 화면
- `review-app.js`: 최신본 선택, 복습 흐름, 영어 펼치기 및 음성 기능
- `review-styles.css`: 복습 화면 디자인
- `manifest.webmanifest`: 홈 화면 앱 설정
- `service-worker.js`: 오프라인 실행 및 온라인 업데이트
- `DESIGN-claude.md`: 디자인 원본 문서
