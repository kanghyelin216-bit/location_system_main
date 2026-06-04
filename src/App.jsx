import { MapPin, Search, MessageSquare, Mic, ShoppingCart, Plus, TrendingUp, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const SHOPS = [
  { id: 1, x: 576, y: 494, name: 'AI 임베디드 실습실', info: '2,3,4교시 수업!', range: 50, beaconId: 'A1' },
  { id: 2, x: 364, y: 404, name: 'ICT PBL실', info: '대여 가능', range: 30, beaconId: 'A2' },
];

const MENU_ITEMS = [
  { id: 'map', icon: MapPin, label: '지도 및 경로 안내', desc: '전시물 위치 확인 & 길찾기', color: '#e8f4f8', accent: '#2a7aad' },
  { id: 'shops', icon: Search, label: '주변 상점', desc: '내 근처 상점 목록', color: '#f0f8ec', accent: '#3a8a3a' },
  { id: 'chat', icon: MessageSquare, label: 'AI 도우미', desc: '무엇이든 물어보세요', color: '#fdf4e8', accent: '#c07a1a' },
  { id: 'shopping', icon: ShoppingCart, label: '쇼핑 목록', desc: '살 것들을 메모하세요', color: '#f5ecf8', accent: '#7a3aad' },
  { id: 'recommend', icon: TrendingUp, label: '맞춤 추천', desc: '계절·날씨·인기 상품', color: '#fef0f0', accent: '#c03a3a' },
];

function MapSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [nearbyShop, setNearbyShop] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [myPos, setMyPos] = useState(null);

  // ⭕ 안드로이드 스마트폰이 실시간으로 계산해 보낸 x, y 좌표를 받아오는 타이머
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:3000/beacon');
        const data = await res.json();
        
        if (data && data.x !== undefined && data.y !== undefined) {
          // 스마트폰의 실시간 좌표(m)를 화면의 픽셀(px) 크기로 매핑하기 위해 50을 곱해줍니다.
          const scale = 50; 
          setMyPos({ x: data.x * scale, y: data.y * scale });
        }
      } catch (err) {
        console.error("백엔드에서 위치 가져오기 실패:", err);
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
      <div
        className="relative w-full h-full"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setMousePos({ x, y });
          const found = SHOPS.find(s => Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2) < s.range);
          setNearbyShop(found || null);
        }}
      >
        <img
          src="/map.jpg"
          alt="시장 지도"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
          {SHOPS.map(s => (
            <g key={s.id} style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onClick={() => setSelectedShop(selectedShop?.id === s.id ? null : s)}>
              <circle cx={s.x} cy={s.y} r={s.range} fill="rgba(229,62,62,0.07)" stroke="rgba(229,62,62,0.25)" strokeDasharray="4" />
              <ellipse cx={s.x} cy={s.y + 18} rx={6} ry={3} fill="rgba(0,0,0,0.2)" />
              <path
                d={`M${s.x} ${s.y - 22} C${s.x - 12} ${s.y - 22}, ${s.x - 14} ${s.y - 4}, ${s.x} ${s.y + 14} C${s.x + 14} ${s.y - 4}, ${s.x + 12} ${s.y - 22}, ${s.x} ${s.y - 22}Z`}
                fill={selectedShop?.id === s.id ? '#d63031' : '#e53e3e'}
                stroke="white"
                strokeWidth="2"
              />
              <circle cx={s.x} cy={s.y - 11} r={5} fill="white" />
            </g>
          ))}

          <circle cx={mousePos.x} cy={mousePos.y} r={8} fill="rgba(37,99,235,0.2)" stroke="#2563eb" strokeWidth={2} />
          <circle cx={mousePos.x} cy={mousePos.y} r={3} fill="#2563eb" />
          
          {myPos && (
            <>
              <circle cx={myPos.x} cy={myPos.y} r={14} fill="rgba(34,197,94,0.2)" stroke="#16a34a" strokeWidth={2} />
              <circle cx={myPos.x} cy={myPos.y} r={6} fill="#16a34a" />
            </>
          )}

          {nearbyShop && (
            <line
              x1={mousePos.x} y1={mousePos.y}
              x2={nearbyShop.x} y2={nearbyShop.y}
              stroke="#e53e3e" strokeWidth={1.5} strokeOpacity={0.6}
              strokeDasharray="4"
            />
          )}
        </svg>

        {nearbyShop && !selectedShop && (
          <div className="absolute top-14 right-3 bg-white rounded-2xl shadow-xl p-3 w-44 z-20">
            <p className="text-red-500 font-bold text-xs mb-1">📍 상점 감지!</p>
            <p className="text-black font-bold text-sm">{nearbyShop.name}</p>
            <p className="text-gray-600 text-xs">{nearbyShop.info}</p>
          </div>
        )}

        {selectedShop && (
          <div
            className="absolute bg-white rounded-2xl shadow-2xl p-4 z-20"
            style={{ left: Math.min(selectedShop.x + 20, 280), top: Math.max(selectedShop.y - 90, 60), width: 160 }}
          >
            <div style={{ position: 'absolute', left: -8, top: 24, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid white' }} />
            <button onClick={() => setSelectedShop(null)} className="absolute top-2 right-3 text-gray-400 text-sm">✕</button>
            <p className="text-red-500 font-bold text-xs mb-1">📍 {selectedShop.name}</p>
            <p className="text-gray-600 text-sm m-0">{selectedShop.info}</p>
            <button className="mt-2 w-full text-xs bg-black text-white py-1.5 rounded-xl">길찾기</button>
          </div>
        )}

        <div className="absolute bottom-16 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 z-10">
          좌표: {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
        </div>
      </div>

      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SHOPS.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedShop(selectedShop?.id === s.id ? null : s)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full shadow-md font-medium border transition-all"
            style={{
              backgroundColor: selectedShop?.id === s.id ? '#e53e3e' : 'white',
              color: selectedShop?.id === s.id ? 'white' : '#333',
              borderColor: selectedShop?.id === s.id ? '#e53e3e' : '#ddd',
            }}
          >
            📍 {s.name}
          </button>
        ))}
      </div>

      <div className="absolute bottom-5 left-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="상점 이름 검색"
            className="flex-1 bg-transparent text-black text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

function ShopsSection() {
  return (
    <section className="p-4">
      <h2 className="text-black mb-3">주변 상점</h2>
      <div className="space-y-2">
        {[
          { name: 'A상점', category: '과일', distance: '10m' },
          { name: 'B상점', category: '채소', distance: '25m' },
          { name: 'C상점', category: '건어물', distance: '40m' },
          { name: 'D상점', category: '정육점', distance: '55m' },
        ].map((shop, index) => (
          <div key={index} className="p-3 border border-gray-400 bg-gray-50 flex justify-between items-center">
            <div>
              <p className="text-black m-0">{shop.name}</p>
              <p className="text-gray-600 text-sm mt-1 mb-0">{shop.category}</p>
            </div>
            <span className="text-gray-700 text-sm">{shop.distance}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChatSection() {
  const [chatMessage, setChatMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '안녕하세요 무엇을 원하시나요??' }
  ]);

  const handleSend = async (textToSend) => {
    const userText = textToSend || chatMessage;
    if (!userText.trim()) return;
    
    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setChatMessage('');

    const botLoadingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botLoadingId, sender: 'bot', text: 'Guidant가 생각 중입니다...' }]);

    try {
      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      
      const data = await res.json();
      setMessages(prev => 
        prev.map(msg => msg.id === botLoadingId ? { ...msg, text: data.reply } : msg)
      );
    } catch (error) {
      console.error('챗봇 통신 에러:', error);
      setMessages(prev => 
        prev.map(msg => msg.id === botLoadingId ? { ...msg, text: '죄송합니다. 백엔드 서버가 켜져 있는지 확인해 주세요!' } : msg)
      );
    }
  };

  const handleChipClick = (text) => {
    handleSend(text);
  };

  return (
    <section className="relative flex flex-col bg-[#F3F3F3]" style={{ height: 'calc(100vh - 57px)' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
              msg.sender === 'user' 
                ? 'bg-black text-white rounded-tr-none' 
                : 'bg-white text-black border border-gray-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
            {msg.sender === 'bot' && msg.id === 1 && !isVoiceMode && (
              <div className="flex gap-2 mt-2 pl-1">
                <button onClick={() => handleChipClick('오늘 뭐 먹지?')} className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs text-black font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm">오늘 뭐 먹지?</button>
                <button onClick={() => handleChipClick('떡볶이 맛집')} className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs text-black font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm">떡볶이 맛집</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="relative bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pt-6 pb-8">
        {isVoiceMode && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <button onClick={() => setIsVoiceMode(false)} className="w-20 h-20 bg-gray-200 text-black rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:bg-gray-300 transition-all">
              <Mic className="w-8 h-8" />
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 max-w-md mx-auto ${isVoiceMode ? 'mt-16 opacity-50 pointer-events-none' : ''}`}>
          <div className="flex-1 flex items-center bg-[#E5E5E5] rounded-full px-4 py-2 border border-gray-300">
            <input
              type="text"
              placeholder="메세지 입력"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent text-black text-sm outline-none placeholder:text-gray-500"
            />
          </div>
          <button onClick={() => handleSend()} className="w-10 h-10 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-black rounded-full flex items-center justify-center transition-colors flex-shrink-0">
            <svg className="w-4 h-4 transform rotate-90 ml-0.5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
          <button onClick={() => setIsVoiceMode(true)} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 text-black rounded-full flex items-center justify-center transition-colors flex-shrink-0">
            <Mic className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ShoppingSection() {
  const [shoppingItems, setShoppingItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const addShoppingItem = () => {
    if (newItem.trim()) {
      setShoppingItems([...shoppingItems, newItem]);
      setNewItem('');
    }
  };

  return (
    <section className="p-4">
      <h2 className="text-black mb-3">쇼핑 목록</h2>
      <div className="space-y-2 mb-3">
        {shoppingItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input type="checkbox" onChange={() => setShoppingItems(shoppingItems.filter((_, i) => i !== index))} className="w-4 h-4 accent-black" />
            <span className="text-black flex-1">{item}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="항목 추가" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addShoppingItem()} className="flex-1 px-3 py-2 border border-gray-400 bg-white text-black placeholder:text-gray-500" />
        <button onClick={addShoppingItem} className="px-4 py-2 bg-black text-white border border-black">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

function RecommendSection() {
  return (
    <section className="p-4">
      <h2 className="text-black mb-3">맞춤 추천</h2>
      <div className="space-y-3">
        {[
          { title: '계절 상품', items: ['봄나물 (냉이, 달래)', '제철 과일 (딸기)'] },
          { title: '날씨 기반', items: ['따뜻한 국물 재료', '비타민 보충 식품'] },
          { title: '인기 상품', items: ['쌀 (10kg)', '김치 재료 세트'] },
        ].map((group, i) => (
          <div key={i} className="p-3 border border-gray-400 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-700" />
              <h3 className="text-black m-0">{group.title}</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-2">
              {group.items.map((item, j) => (
                <li key={j} className="text-gray-700 text-sm">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const SECTION_MAP = {
  map: MapSection,
  shops: ShopsSection,
  chat: ChatSection,
  shopping: ShoppingSection,
  recommend: RecommendSection,
};

export default function App() {
  const [activePage, setActivePage] = useState(null);
  const ActiveSection = activePage ? SECTION_MAP[activePage] : null;
  const activeMenu = MENU_ITEMS.find(m => m.id === activePage);

  return (
    <div className="size-full bg-white overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-gray-300 px-4 py-3 z-10 flex items-center gap-3">
        {activePage && (
          <button onClick={() => setActivePage(null)} className="p-1 -ml-1 text-gray-600 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-black m-0">{activePage ? activeMenu.label : 'Guidant'}</h1>
          {!activePage && <p className="text-gray-600 text-sm mt-1 mb-0">전통시장 가이드</p>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {activePage === null ? (
          <div className="p-4 space-y-3">
            <p className="text-gray-500 text-sm mb-4">어떤 기능을 이용하시겠어요?</p>
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className="w-full flex items-center gap-4 p-4 border border-gray-300 text-left hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: item.color }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: item.accent + '22' }}>
                    <Icon className="w-5 h-5" style={{ color: item.accent }} />
                  </div>
                  <div>
                    <p className="text-black font-semibold m-0">{item.label}</p>
                    <p className="text-gray-500 text-sm mt-0.5 mb-0">{item.desc}</p>
                  </div>
                  <span className="ml-auto text-gray-400 text-lg">›</span>
                </button>
              );
            })}
          </div>
        ) : (
          <ActiveSection />
        )}
      </main>
    </div>
  );
}