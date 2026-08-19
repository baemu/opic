# Minseok OPIc TTS Study Viewer

민석 스크립트 전용 학습 뷰어입니다. 기존 `study-viewer`와 분리되어 있고, 로컬 저장 상태도 별도 key를 사용합니다.

공개 주소: https://baemu.github.io/opic/minseok/

아이폰과 아이패드에서는 Safari의 `공유 > 홈 화면에 추가`로 별도 앱처럼 설치할 수 있습니다.

Markdown 수정 후 `OPIc-publish-minseok.bat`을 실행하면 데이터를 다시 만들고, 공개 사이트 배포가 끝난 뒤 최신 화면을 엽니다.

## 사용

민석 Markdown 원본을 수정한 뒤 `OPIc-study-minseok.bat`을 더블클릭합니다. 데이터가 갱신되고 민석용 `compact.html`이 자동으로 열립니다.

- 문제와 답변 영어 음성 재생
- 속도, 음량, 반복, 영어 음성 설정
- 문제와 답변의 한국어 번역 확인
- 말하기용과 최종 답변 전환
- Claude 디자인 기반의 압축형 학습 화면

답변 문장을 수정할 때는 Markdown의 `[영어+한국어 버전]`을 수정합니다. 해당 영어와 한국어 문장 쌍이 최종 답변 화면의 기준이며 수정된 영어는 말하기용에도 자동 반영됩니다.

원본 경로:

```text
../output/audio/민석/영어script
```
