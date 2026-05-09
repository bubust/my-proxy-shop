const STEPS = [
  {
    step: '01',
    icon: '🛒',
    title: '瀏覽商品，加入購物車',
    desc: '在商品列表中挑選您想要的商品，選擇數量後加入購物車。目前提供日本、韓國、美國、歐洲等多個地區商品。',
  },
  {
    step: '02',
    icon: '📝',
    title: '填寫資料，送出訂單',
    desc: '登入會員後，填寫收件人姓名、電話及地址，確認訂單內容後送出。我們收到訂單後將於 24 小時內與您聯繫確認。',
  },
  {
    step: '03',
    icon: '💳',
    title: '確認費用，完成付款',
    desc: '我們將通知您完整費用（商品費 + 當地稅費 + 國際運費 + 代購服務費），確認後提供付款方式。',
  },
  {
    step: '04',
    icon: '✈️',
    title: '代購進行，出貨通知',
    desc: '收到付款後立即在當地購買商品，並安排國際運送。出貨時將提供追蹤號碼，方便查詢包裹動態。',
  },
  {
    step: '05',
    icon: '📦',
    title: '商品抵台，安排配送',
    desc: '商品抵達台灣後，我們會安排最後一哩配送。一般國際運送約需 7–21 個工作天。',
  },
  {
    step: '06',
    icon: '😊',
    title: '確認收貨，完成！',
    desc: '收到商品後請確認狀態。如有任何問題，請在收貨後 48 小時內聯繫我們。',
  },
]

const FAQS = [
  { q: '代購費用如何計算？', a: '代購費用 = 商品原價 + 當地稅費（如有）+ 國際運費 + 代購服務費（約商品價格的 8–15%）。確切金額在確認訂單時通知。' },
  { q: '運送需要多久？', a: '一般日韓商品約 7–14 個工作天，美國歐洲商品約 14–21 個工作天。視商品備貨狀況可能有所調整。' },
  { q: '商品如果缺貨怎麼辦？', a: '若商品缺貨或停售，我們將主動通知您，並安排全額退款或協助更換其他商品。' },
  { q: '可以代購指定網站的商品嗎？', a: '可以！除了網站上的現有商品，也接受客製化代購需求。請聯繫我們提供商品連結和需求。' },
  { q: '退換貨政策？', a: '商品到手後 48 小時內如發現品質問題，請附上照片聯繫我們。受限於國際代購性質，非品質問題恕不接受退換貨。' },
]

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] text-center mb-2">代購流程說明</h1>
      <p className="text-center text-gray-500 mb-10">簡單 6 步驟，輕鬆代購全球商品</p>

      <div className="space-y-4 mb-12">
        {STEPS.map((s) => (
          <div key={s.step} className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#e85d26]/10 flex items-center justify-center text-xl">{s.icon}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#e85d26] bg-[#e85d26]/10 px-2 py-0.5 rounded-full">STEP {s.step}</span>
                <h3 className="font-semibold text-[#1a1a1a]">{s.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">常見問題</h2>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-[#1a1a1a] mb-1.5">Q: {faq.q}</p>
            <p className="text-sm text-gray-600 leading-relaxed">A: {faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
