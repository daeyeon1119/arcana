# 원본 RWS 카드 이미지

이 폴더에는 Pamela Colman Smith가 그린 **1909년 Rider–Waite–Smith “Roses & Lilies” 초판의 원본 스캔 78장**을 보관합니다. Wikimedia Commons가 제공하는 JPEG 파일을 그대로 저장했으며 크기 조정·재채색·재작화·AI 생성 처리를 하지 않았습니다.

- 원작자: Pamela Colman Smith
- 소장본 스캔: Saskia Jansen
- [Wikimedia Commons 원본 세트](https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies))
- [원본 파일과 출처 설명 예시: 바보](https://commons.wikimedia.org/wiki/File:RWS1909_-_00_Fool.jpeg)
- Commons의 파일별 권리 표시: Public domain / [Public Domain Mark](https://creativecommons.org/publicdomain/mark/1.0/)

`manifest.json`에 각 카드의 Commons 파일명·페이지·다운로드 URL·픽셀 크기·바이트 수·SHA-1·SHA-256을 기록합니다. 앱 ID는 메이저 `ar00`–`ar21`, 마이너는 `cu`/`wa`/`sw`/`pe`와 `01`–`14`입니다. 마이너의 `11`은 시종, `12`는 기사, `13`은 여왕, `14`는 왕입니다. 원본 판의 힘은 8번, 정의는 11번입니다.

`python scripts/fetch_rws.py`로 Commons의 메타데이터와 원본 바이트를 검증할 수 있습니다. 이미 받은 파일은 다시 다운로드하지 않습니다. 요청 제한을 존중해 순차적으로 내려받습니다. `python scripts/build.py`는 검증된 78장의 원본 JPEG를 단일 `index.html` 안에 포함합니다. 단일 HTML만 다른 폴더로 복사해도 오프라인에서 원본이 표시됩니다.

원본 보존을 위해 파일 용량이 늘어납니다. 이 폴더의 전체 크기와 최종 HTML 크기는 `test-results/images-summary.json`에서 확인할 수 있습니다. 표시 오류가 발생하면 원본을 표시하지 못했다는 안내를 보여 주며 다른 그림을 카드 앞면으로 대체하지 않습니다.
