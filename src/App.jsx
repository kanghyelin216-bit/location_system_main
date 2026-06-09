import { MapPin, Search, MessageSquare, Mic, TrendingUp, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import MapSection from './MapSketch'; // 👈 팀원분이 분리한 지도 컴포넌트 호출

// 🌐 [중요] 백엔드 서버를 켠 컴퓨터의 IP 주소를 적어주세요.
// 팀원과 테스트할 때 IP가 바뀌면 이 줄만 수정하면 아래 모든 기능(혼잡도, 챗봇)이 한 번에 연동됩니다!
const YOUR_COMPUTER_IP = '25.4.238.217'; 

const EXHIBITS = [
  { id: 1, x: 200, y: 200, name: 'AI 임베디드 시스템',  info: '하드웨어에 AI를 직접 내장해 네트워크 없이 동작하는 온디바이스 AI 기술 전시', range: 45, beaconId: 'A1' },
  { id: 2, x: 400, y: 200, name: '스마트 센서 네트워크', info: '온도·습도·조도 등 다양한 센서를 IoT로 연결해 실시간 데이터를 수집·분석', range: 45, beaconId: 'A2' },
  { id: 3, x: 600, y: 200, name: '자율주행 로봇',        info: '라이다·카메라 센서를 활용해 장애물을 인식하고 스스로 경로를 찾아가는 로봇 시연', range: 45, beaconId: 'A3' },
  { id: 4, x: 200, y: 400, name: 'ICT PBL 프로젝트',    info: '학생들이 직접 기획·개발한 ICT 융합 프로젝트 결과물 전시 및 체험', range: 45, beaconId: 'A4' },
  { id: 5, x: 400, y: 400, name: '딥러닝 이미지 인식',   info: '카메라로 사물을 촬영하면 딥러닝 모델이 실시간으로 분류 결과를 보여주는 체험', range: 45, beaconId: 'A5' },
  { id: 6, x: 600, y: 400, name: '스마트 홈 제어판',     info: '음성·앱으로 조명·온도·보안을 제어하는 스마트 홈 시스템 체험 부스', range: 45, beaconId: 'A6' },
];

const MENU_ITEMS = [
  { id: 'map',       icon: MapPin,        label: '지도 및 경로 안내', desc: '전시물 위치 확인 & 길찾기',         color: '#EEF6FB', accent: '#6BAED6', emoji: '🗺️' },
  { id: 'exhibits',  icon: Search,        label: '주변 전시물',       desc: '내 근처 전시물 목록',             color: '#EDF7EE', accent: '#74C476', emoji: '🔍' },
  { id: 'chat',      icon: MessageSquare, label: 'AI 도우미',          desc: '전시물에 대해 무엇이든 물어보세요', color: '#FEF9EC', accent: '#FDAE6B', emoji: '💬' },
  { id: 'recommend', icon: TrendingUp,    label: '맞춤 추천',          desc: '관심사 기반 전시물 추천',           color: '#FEF0F5', accent: '#F768A1', emoji: '✨' },
];

const T = {
  bg: '#FAFBFF', card: '#FFFFFF', border: '#EEF0F6', radius: '18px',
  shadow: '0 2px 12px rgba(100,120,180,0.08)', shadowMd: '0 4px 20px rgba(100,120,180,0.13)',
  text: '#2D3250', sub: '#8A90A8', inputBg: '#F2F4FA',
};

// 혼잡도 레벨 계산: 인원수 → { label, color, bg }
function getCongestionLevel(count) {
  if (!count || count === 0) return { label: '여유', color: '#74C476', bg: '#EDF7EE', emoji: '🟢' };
  if (count <= 2)             return { label: '보통', color: '#FDAE6B', bg: '#FEF9EC', emoji: '🟡' };
  return                               { label: '혼잡', color: '#F768A1', bg: '#FEF0F5', emoji: '🔴' };
}

// 고유 userId 생성 (세션 단위)
function getUserId() {
  let id = sessionStorage.getItem('guidant_uid');
  if (!id) { id = 'u_' + Math.random().toString(36).slice(2); sessionStorage.setItem('guidant_uid', id); }
  return id;
}

/* ── 혼잡도 훅: 앱 전체에서 공유 ── */
function useCongestion() {
  const [congestion, setCongestion] = useState({});
  useEffect(() => {
    const fetch_ = async () => {
      try {
        // ✨ 고정된 localhost 대신 외부 컴퓨터 IP(하마치)와 동적 연동 완료!
        const res = await fetch(`http://${YOUR_COMPUTER_IP}:3000/presence`);
        const data = await res.json();
        setCongestion(data.congestion || {});
      } catch (err) {
        console.error("혼잡도 데이터 조회 실패:", err);
      }
    };
    fetch_();
    const iv = setInterval(fetch_, 5000);
    return () => clearInterval(iv);
  }, []);
  return congestion;
}

/* ── 헤더 ── */
function Header({ activePage, onBack }) {
  const activeMenu = MENU_ITEMS.find(m => m.id === activePage);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(250,251,255,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${T.border}`, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {activePage && (
        <button onClick={onBack} style={{
          background: T.inputBg, border: 'none', borderRadius: 12,
          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.text, flexShrink: 0,
        }}>
          <ArrowLeft size={17} />
        </button>
      )}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
          {activePage ? activeMenu.label : 'Guidant ✨'}
        </div>
        {!activePage && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>전시 가이드</div>}
      </div>
    </header>
  );
}

/* ── 홈 메뉴 ── */
function HomeMenu({ onNavigate }) {
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>어떤 기능을 이용하시겠어요? 👀</p>
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', background: T.card,
            border: `1.5px solid ${T.border}`, borderRadius: T.radius,
            boxShadow: T.shadow, cursor: 'pointer', textAlign: 'left',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadowMd; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {item.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{item.desc}</div>
            </div>
            <div style={{ color: '#C8CEDE', fontSize: 20, fontWeight: 300 }}>›</div>
          </button>
        );
      })}
    </div>
  );
}

/* ── 주변 전시물 ── */
function ExhibitsSection() {
  const congestion = useCongestion();
  const items = [
    { name: 'AI 임베디드 시스템',   category: '온디바이스 AI',    beaconId: 'A1', dot: '#6BAED6' },
    { name: '스마트 센서 네트워크', category: 'IoT / 센서',        beaconId: 'A2', dot: '#74C476' },
    { name: '자율주행 로봇',        category: '로보틱스',           beaconId: 'A3', dot: '#FDAE6B' },
    { name: 'ICT PBL 프로젝트',    category: 'PBL 프로젝트',      beaconId: 'A4', dot: '#F768A1' },
    { name: '딥러닝 이미지 인식',   category: '딥러닝 / 비전 AI',  beaconId: 'A5', dot: '#9B8FE8' },
    { name: '스마트 홈 제어판',     category: '스마트 홈 / IoT',   beaconId: 'A6', dot: '#F9A8D4' },
  ];
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>현재 감지된 전시물이에요 👋</p>
      {items.map((item, i) => {
        const count = congestion[item.beaconId] || 0;
        const level = getCongestionLevel(count);
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: T.card,
            borderRadius: T.radius, border: `1.5px solid ${T.border}`, boxShadow: T.shadow,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.name}</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>{item.category}</div>
            </div>
            {/* 혼잡도 배지 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: level.color,
              background: level.bg, borderRadius: 8, padding: '4px 10px',
              flexShrink: 0,
            }}>
              {level.emoji} {level.label}
              <span style={{ color: T.sub, fontWeight: 400 }}> · {count}명</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── AI 도우미 ── */
function ChatSection() {
  const [chatMessage, setChatMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '안녕하세요! 전시물에 대해 궁금한 점을 무엇이든 물어보세요 😊' }
  ]);

  const handleSend = async (textToSend) => {
    const userText = textToSend || chatMessage;
    if (!userText.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setChatMessage('');
    const loadId = Date.now() + 1;
    setMessages(prev => [...prev, { id: loadId, sender: 'bot', text: 'Guidant가 생각 중입니다...' }]);
    try {
      // ✨ 고정된 localhost 대신 외부 컴퓨터 IP(하마치)와 동적 연동 완료!
      const res = await fetch(`http://${YOUR_COMPUTER_IP}:3000/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === loadId ? { ...m, text: data.reply } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === loadId ? { ...m, text: '서버와 연결이 원활하지 않습니다. 백엔드 서버 혹은 하마치 주소를 확인해 주세요!' } : m));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)', background: '#F4F6FD' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '11px 16px', borderRadius: 18, fontSize: 13, lineHeight: 1.55,
              ...(msg.sender === 'user'
                ? { background: 'linear-gradient(135deg,#6BAED6,#74C476)', color: 'white', borderTopRightRadius: 5, boxShadow: '0 2px 10px rgba(107,174,214,0.35)' }
                : { background: T.card, color: T.text, borderTopLeftRadius: 5, border: `1px solid ${T.border}`, boxShadow: T.shadow }
              ),
            }}>
              {msg.text}
            </div>
            {msg.sender === 'bot' && msg.id === 1 && !isVoiceMode && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 2 }}>
                {['이 전시물은 뭔가요?', '체험 방법 알려줘'].map(chip => (
                  <button key={chip} onClick={() => handleSend(chip)} style={{
                    padding: '6px 13px', background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 20, fontSize: 11, color: T.text, fontWeight: 500, cursor: 'pointer', boxShadow: T.shadow,
                  }}>{chip}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ background: T.card, borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 20px rgba(100,120,180,0.08)', padding: '16px 16px 28px', position: 'relative' }}>
        {isVoiceMode && (
          <div style={{ position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
            <button onClick={() => setIsVoiceMode(false)} style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6BAED6,#74C476)',
              border: '4px solid white', boxShadow: T.shadowMd,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Mic size={30} color="white" />
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...(isVoiceMode ? { marginTop: 40, opacity: 0.4, pointerEvents: 'none' } : {}) }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: T.inputBg, borderRadius: 24, padding: '9px 16px', border: `1px solid ${T.border}` }}>
            <input type="text" placeholder="메시지 입력" value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: T.text }}
            />
          </div>
          <button onClick={() => handleSend()} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6BAED6,#74C476)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(107,174,214,0.4)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ transform: 'rotate(90deg)', marginLeft: 2 }}>
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
          <button onClick={() => setIsVoiceMode(true)} style={{
            width: 40, height: 40, borderRadius: '50%', background: T.inputBg,
            border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mic size={16} color={T.sub} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 맞춤 추천 ── */
function RecommendSection() {
  const groups = [
    { emoji: '📍', title: '지금 주변 전시물', color: '#EEF6FB', accent: '#6BAED6', items: ['AI 임베디드 시스템 (A1) — 온디바이스 AI 체험', '딥러닝 이미지 인식 (A5) — 실시간 분류 시연 중'] },
    { emoji: '🔥', title: '인기 전시물', color: '#FEF9EC', accent: '#FDAE6B', items: ['자율주행 로봇 (A3) — 대기 적음, 지금 바로 체험!', '스마트 홈 제어판 (A6) — 음성·앱 제어 직접 해보기'] },
    { emoji: '🎯', title: '관심사 기반 추천', color: '#FEF0F5', accent: '#F768A1', items: ['하드웨어에 관심 있다면 → A1 · A2 · A3 구역', 'AI · 소프트웨어라면 → A4 · A5 구역'] },
  ];
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>나에게 딱 맞는 전시물을 찾아봐요 🎉</p>
      {groups.map((g, i) => (
        <div key={i} style={{ background: T.card, borderRadius: T.radius, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          <div style={{ background: g.color, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{g.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: g.accent }}>{g.title}</span>
          </div>
          <div style={{ padding: '10px 16px 14px' }}>
            {g.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: g.accent, marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const SECTION_MAP = { map: MapSection, exhibits: ExhibitsSection, chat: ChatSection, recommend: RecommendSection };

export default function App() {
  const [activePage, setActivePage] = useState(null);
  const ActiveSection = activePage ? SECTION_MAP[activePage] : null;

  return (
    <div style={{ width: '100%', height: '100%', background: T.bg, overflowY: 'auto' }}>
      <Header activePage={activePage} onBack={() => setActivePage(null)} />
      <main style={{ maxWidth: 480, margin: '0 auto' }}>
        {activePage === null ? <HomeMenu onNavigate={setActivePage} /> : <ActiveSection />}
      </main>
    </div>
  );
}