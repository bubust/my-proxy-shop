export default function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 text-sm py-8 mt-auto pb-16 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="font-bold text-white text-base mb-2">{siteName}</p>
        <p className="mb-1">專業代購服務｜日本・韓國・美國・歐洲</p>
        <p className="text-xs text-gray-500 mt-4">© 2025 {siteName}. All rights reserved.</p>
      </div>
    </footer>
  )
}
