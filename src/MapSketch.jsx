import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const showGrid = false; 
const CANVAS_WIDTH = 362;
const CANVAS_HEIGHT = 767;

const mapObjects = [
  { x: 332, y: 84,  w: 30,  h: 111, name: '작품1', type: 'booth', author: '작가명', desc: '작품 설명' },
  { x: 332, y: 328, w: 30,  h: 111, name: '작품2', type: 'booth', author: '작가명', desc: '작품 설명' },
  { x: 332, y: 572, w: 30,  h: 111, name: '작품3', type: 'booth', author: '작가명', desc: '작품 설명' },
  { x: 0,   y: 84,  w: 30,  h: 111, name: '작품4', type: 'booth', author: '작가명', desc: '작품 설명' },
  { x: 0,   y: 328, w: 30,  h: 111, name: '작품5', type: 'booth', author: '작가명', desc: '작품 설명' },
  { x: 0,   y: 572, w: 30,  h: 111, name: '작품6', type: 'booth', author: '작가명', desc: '작품 설명' },
  { x: 337, y: 0,   w: 25,  h: 50,  name: '출입문', type: 'door', desc: '전시장 전면 출입구입니다.' },
  { x: 337, y: 717, w: 25,  h: 50,  name: '출입문', type: 'door', desc: '전시장 후면 출입구입니다.' }
];

const MapSketch = () => {
  const canvasRef = useRef(null);
  const [userPos, setUserPos] = useState({ x: 181, y: 383 });
  const [selectedArtwork, setSelectedArtwork] = useState(null); 
  const p5InstanceRef = useRef(null);
  const socketRef = useRef(null); // 중복 연결 방지를 위한 소켓 레퍼런스 고정

  // 📡 1. 실시간 웹소켓 최적화 연동 (Strict Mode 중복 방지)
  useEffect(() => {
    if (socketRef.current) return;

    console.log("🌐 백엔드 서버로 최적화 소켓 연동 시도 중...");
    
    socketRef.current = io("http://172.18.32.248:3000", {
      transports: ['websocket'],
      upgrade: false,
      forceNew: true,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log("✅ [최종 성공] 리액트 웹앱이 백엔드 소켓 서버에 완전히 붙었습니다! ID:", socketRef.current.id);
    });

    socketRef.current.on('location_update', (data) => {
      console.log("🎯 서버로부터 실시간 픽셀 좌표 수신 완료! ->", data);
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        // 리액트 상태 가동
        setUserPos({ x: data.x, y: data.y });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('location_update');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 🎨 2. p5.js 인스턴스 초기화 및 캔버스 생성
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.innerHTML = "";
    }
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    import("p5").then((p5Module) => {
      const p5 = p5Module.default;

      const sketch = (p) => {
        // p5 내부 전역 위치 변수 (초기화)
        p.uX = 181;
        p.uY = 383;

        p.setup = () => {
          const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
          canvas.parent(canvasRef.current);
          p.textAlign(p.CENTER, p.CENTER);
          
          // 💡 [핵심 규칙] 무한 루프 렌더링을 멈추고 리액트 데이터가 올 때만 수동 렌더링 수행
          p.noLoop(); 
        };

        p.draw = () => {
          p.background(248, 249, 250);

          if (showGrid) {
            p.stroke(230);
            for (let x = 0; x < p.width; x += 40) p.line(x, 0, x, p.height);
            for (let y = 0; y < p.height; y += 40) p.line(0, y, p.width, y);
          }

          // 맵 오브젝트 드로우
          for (let obj of mapObjects) {
            p.push();
            if (obj.type === 'booth') {
              p.fill(255); p.stroke(218, 222, 229); p.strokeWeight(1.5);
            } else {
              p.fill(241, 243, 245); p.stroke(173, 181, 189); p.strokeWeight(1);
            }

            p.rect(obj.x, obj.y, obj.w, obj.h, 8);
            p.noStroke();
            
            if (obj.w < 50) {
              p.fill(73, 80, 87); p.textSize(10.5); p.textStyle(p.BOLD);
              p.text(obj.name, obj.x + 4, obj.y + 4, obj.w - 8, obj.h - 8);
            } else {
              p.fill(33, 37, 41); p.textSize(12); p.textStyle(p.BOLD);
              p.text(obj.name, obj.x + obj.w / 2, obj.y + obj.h / 2);
            }
            p.pop(); 
          }

          // ✨ 실시간 사용자 마커 드로우 (수동 렌더링 연동 최적화형)
          p.push();
          p.fill(0, 122, 255, 40); p.noStroke();
          p.circle(p.uX, p.uY, 24); // 외부 반경 가이드
          p.fill(0, 122, 255); p.stroke(255); p.strokeWeight(2);
          p.circle(p.uX, p.uY, 12); // 동기화된 파란색 핵심 위치 점
          p.pop();
        };

        p.mousePressed = () => {
          if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
          for (let obj of mapObjects) {
            if (p.mouseX >= obj.x && p.mouseX <= obj.x + obj.w && p.mouseY >= obj.y && p.mouseY <= obj.y + obj.h) {
              if (obj.type === 'door') return; 
              setSelectedArtwork(obj); 
              return; 
            }
          }
        };
      };

      if (canvasRef.current) {
        p5InstanceRef.current = new p5(sketch);
        // 인스턴스가 로드된 즉시 초기 위치 매핑
        p5InstanceRef.current.uX = userPos.x;
        p5InstanceRef.current.uY = userPos.y;
        p5InstanceRef.current.redraw();
      }
    });

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  // 🔄 3. 리액트 userPos 업데이트 감지 시 -> p5 드로잉 변수 수동 동기화 및 강제 재스케치
  useEffect(() => {
    if (p5InstanceRef.current) {
      console.log("⚡ p5 캔버스 내부 좌표 실시간 동기화 강제 집행:", userPos);
      p5InstanceRef.current.uX = userPos.x;
      p5InstanceRef.current.uY = userPos.y;
      p5InstanceRef.current.redraw(); // 대기 중인 캔버스 스냅샷을 즉시 새로 그리도록 유도
    }
  }, [userPos]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px", position: "relative" }}>
      <div id="p5-canvas-target" ref={canvasRef} style={styles.canvasContainer}></div>

      {selectedArtwork && (
        <div style={styles.popupCard}>
          <button style={styles.closeBtn} onClick={() => setSelectedArtwork(null)}>✕</button>
          <div style={styles.contentContainer}>
            <div style={styles.imgPlaceholder}></div>
            <div style={styles.textGroup}>
              <h3 style={styles.title}>
                {selectedArtwork.name}
                {selectedArtwork.author && <span style={styles.author}>{selectedArtwork.author}</span>}
              </h3>
              <p style={styles.desc}>{selectedArtwork.desc}</p>
            </div>
          </div>
          <button style={styles.guideBtn} onClick={() => alert(`${selectedArtwork.name} 구역으로의 경로 안내를 시작합니다.`)}>
            길안내 시작하기
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  canvasContainer: { borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)", border: "1px solid #e9ecef", width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  popupCard: { position: "absolute", left: "40px", top: "70px", width: "282px", height: "160px", backgroundColor: "white", padding: "15px 15px 12px 15px", borderRadius: "14px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", border: "1px solid #efefef", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 999 },
  closeBtn: { position: "absolute", top: "10px", right: "12px", background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#ccc" },
  contentContainer: { display: "flex", gap: "12px", textAlign: "left", flex: 1 },
  imgPlaceholder: { width: "65px", height: "65px", backgroundColor: "#f1f3f5", borderRadius: "8px" },
  textGroup: { flex: 1, overflow: "hidden" },
  title: { margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", color: "#212529" },
  author: { fontSize: "11px", fontWeight: "normal", color: "#868e96", marginLeft: "6px" },
  desc: { margin: 0, fontSize: "11px", color: "#495057", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  guideBtn: { width: "100%", padding: "9px", backgroundColor: "#212529", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", marginTop: "8px" }
};

export default MapSketch;