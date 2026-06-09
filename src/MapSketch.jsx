import React, { useState, useEffect, useRef } from "react";
import p5 from "p5";
import { io } from "socket.io-client"; // 👈 실시간 통신을 위한 소켓 라이브러리 추가!

const CANVAS_WIDTH = 362;
const CANVAS_HEIGHT = 767;

// 🌐 [중요] 백엔드 서버를 켠 팀원 컴퓨터의 IP 주소를 적어주세요.
const YOUR_COMPUTER_IP = '25.4.238.217'; 

const mapObjects = [
  { x: 56,  y: 0,   w: 250, h: 40,  name: '칠판' },
  { x: 332, y: 84,  w: 30,  h: 111, name: 'AI 임베디드' }, // 부스 이름과 매칭되도록 텍스트 가독성 최적화
  { x: 332, y: 328, w: 30,  h: 111, name: '스마트 센서' },
  { x: 332, y: 572, w: 30,  h: 111, name: '자율주행로봇' },
  { x: 0,   y: 572, w: 30,  h: 111, name: '스마트 홈' },
  { x: 0,   y: 328, w: 30,  h: 111, name: '딥러닝인식' },
  { x: 0,   y: 84,  w: 30,  h: 111, name: 'ICT PBL' },
  { x: 337, y: 0,   w: 25,  h: 50,  name: '출입문' },
  { x: 337, y: 717, w: 25,  h: 50,  name: '출입문' }
];

const MapSketch = () => {
  const canvasRef = useRef(null);
  // 초기 위치는 전시장 중앙(181, 383)으로 셋팅
  const [userPos, setUserPos] = useState({ x: 181, y: 383 });
  const p5Instance = useRef(null);

  /* ── 📡 [추가] 백엔드 웹소켓 실시간 연결 로직 ── */
  useEffect(() => {
    // 하마치 망을 통해 팀원의 백엔드 노드 서버와 실시간 통화(웹소켓) 연결 개시
    const socket = io(`http://${YOUR_COMPUTER_IP}:3000`, {
      transports: ['websocket'],
      reconnectionAttempts: 5, // 연결 실패 시 재시도 횟수
    });

    socket.on('connect', () => {
      console.log("🌐 지도 섹션: 백엔드 실시간 소켓 연결 성공!");
    });

    // 안드로이드 앱 -> 백엔드 -> 리액트로 이어지는 위치 업데이트 이벤트를 실시간 수신
    socket.on('location_update', (data) => {
      console.log("📍 실시간 위치 수신 데이터:", data);
      
      // 백엔드에서 전달되는 좌표 데이터(x, y)가 있을 때 사용자 마커 좌표 갱신
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        setUserPos({ x: data.x, y: data.y });
      }
    });

    socket.on('disconnect', () => {
      console.log("❌ 지도 섹션: 소켓 연결 끊어짐.");
    });

    // 컴포넌트 창이 닫히면 전화를 깔끔하게 끊어서 메모리 누수 방지
    return () => {
      socket.disconnect();
    };
  }, []);

  // 리액트 state가 바뀌면 p5.js 내부 변수로 좌표 주입
  useEffect(() => {
    if (p5Instance.current && p5Instance.current.updateUserPos) {
      p5Instance.current.updateUserPos(userPos.x, userPos.y);
    }
  }, [userPos]);

  // p5.js 인스턴스 초기화 및 클린업
  useEffect(() => {
    let myP5;

    if (canvasRef.current) {
      canvasRef.current.innerHTML = ""; 
    }

    const sketch = (p) => {
      let currentX = 181;
      let currentY = 383;

      p.updateUserPos = (x, y) => {
        currentX = x;
        currentY = y;
      };

      p.setup = () => {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
      };

      p.draw = () => {
        p.background(245);

        // 1) 격자 그리기
        p.stroke(220);
        p.strokeWeight(1);
        for (let x = 0; x < p.width; x += 40) {
          p.line(x, 0, x, p.height);
        }
        for (let y = 0; y < p.height; y += 40) {
          p.line(0, y, p.width, y);
        }

        // 2) 오브젝트 그리기
        for (let obj of mapObjects) {
          p.fill(255);
          p.stroke(100);
          p.strokeWeight(1.5);
          p.rect(obj.x, obj.y, obj.w, obj.h, 4);

          p.fill(50);
          p.noStroke();

          if (obj.w < 50) {
            p.push();
            p.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
            p.textSize(11);
            p.text(obj.name, 0, 0);
            p.pop();
          } else {
            p.textSize(12);
            p.text(obj.name, obj.x + obj.w / 2, obj.y + obj.h / 2);
          }
        }

        // 3) 사용자 마커 그리기 (실시간 위치에 맞춰 그려짐)
        drawUserMarker(p, currentX, currentY);
      };

      const drawUserMarker = (p, x, y) => {
        p.push();
        let pulse = p.sin(p.frameCount * 0.05) * 6;
        p.fill(0, 122, 255, 40);
        p.noStroke();
        p.circle(x, y, 24 + pulse); // 레이더 퍼지는 효과 애니메이션

        p.fill(0, 122, 255);
        p.stroke(255);
        p.strokeWeight(2);
        p.circle(x, y, 12); // 중앙 고정 파란 점
        p.pop();
      };
      
      // 💡 시연 과정에서 비콘이 없을 때 수동으로 위치를 옮겨가며 강제 테스트하고 싶다면 
      // 아래 주석(//)을 해제하면 마우스 클릭 테스트 기능도 동시에 활성화됩니다.
      /*
      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          setUserPos({ x: p.mouseX, y: p.mouseY });
        }
      };
      */
    };

    myP5 = new p5(sketch, canvasRef.current);
    p5Instance.current = myP5;

    return () => {
      if (myP5) {
        myP5.remove();
      }
    };
  }, []); 

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      <div ref={canvasRef}></div>
    </div>
  );
};

export default MapSketch;