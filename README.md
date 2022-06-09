## 백엔드 서버용 NodeJS Template
Node.js + express 를 기반으로 작성된 REST API용 서버 템플릿입니다.

## Folder Structure
```
├── config                              # 앱 관련 기타 설정 파일들 모음
│   ├── baseResponseDict.js             # Response 시의 메세지들을 모아 놓은 곳. 
│   ├── database.js                     # 데이터베이스 관련 설정
│   ├── app.js                          # 초기 express Framework 설정 파일
├── * progress                          # 협업 개발 중 개발 일지 등 진행사항 기록 폴더(.md파일)
├── * node_modules                    	# 외부 라이브러리 폴더 (package.json 의 dependencies)
├── src                     		      	# 메인 로직 
│   ├── controller              	    	# 요청 및 응답 처리 + 로직                     			
│   │   ├── index.js                    # DB연결 시 req | res 처리 과정 예시
│   │   ├── user.js                     # 일반 req | res 처리 과정
│   ├── DAO              		            # Database 연결 및 쿼리로 결과 가져오기
│   │   ├── index.js                    # DB 연결 및 쿼리 예시 파일
│   ├── routes              		        # url 및 route 설정
│   │   ├── index.js                    # route 연결 예시
│   │   ├── users.js                    # ""
├── .gitignore                     		  # git 에 포함되지 않아야 하는 폴더, 파일들을 작성 해놓는 곳
├── index.js                            # 포트 설정 및 시작 파일                     		
├── * package-lock.json              	 
├── package.json                        # 프로그램 이름, 버전, 필요한 모듈 등 노드 프로그램의 정보를 기술
└── README.md
```
## 요청 및 응답 처리 순서
> 요청 처리 과정 : Request → Route → Controller → DAO → DB 
>
> 응답 처리 과정 : DB → DAO → Controller → Route → Response

- Controller : 서비스의 메인 로직을 담당. 
  routes 폴더에서 전달받은 url request 에 따라 설정한 function 및 로직이 동작한다. 

- routes : 서비스의 기능별로 url을 모아놓은 파일. 
  기본 템플릿에서는 url와 로직이 한꺼번에 있지만 기능별로 구분을 위해 분리했다.

- DAO : DB 연결 및 쿼리를 통한 결과 수신을 위한 파일. 
  해당 파일에 쿼리를 작성하고 DB와 통신하여 송수신한 결과를 controller 에 보내서 처리하도록 한다.

## 시작하기

- 터미널에 ```npm install```을 입력하여 ``` package.json``` 에 명시된 모듈들을 다운 받는다. 
- 포트 설정 및 기타 서버 환경 변경을 마친다.
- 시작은 ```node index.js``` 명령어로 서버를 시작한다.
- DB 연결 시 database.js 파일에 DB 연결 정보를 명시한다.
- 개발 후 git commit 시 .gitignore 파일에 database 정보 등 민감한 정보를 명시하는 파일이나 폴더를 적어줘서 공개를 막는다.

### 사용한 패키지 및 모듈

- MySQL2 : promise 등 비동기 처리를 위한 DB 모듈
- logLevel : winston 등 기타 다른 log library 들에 비해 가볍고 사용이 간편함
- nodemon : node index.js 는 저장정보를 반영하지 않는다. 보다 간편한 사용을 위한 모듈

 (추가 예정)
