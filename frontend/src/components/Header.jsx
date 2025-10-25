export default function Header({ menuType, onToggleMenu }) {
  return (
    <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🍣</div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sushi Order</h1>
              <p className="text-red-100 text-sm">Fresh Japanese Cuisine</p>
            </div>
          </div>
          
          {/* Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleMenu}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-white/30"
            >
              <span className="text-lg">
                {menuType === 'live' ? '🤖' : '📋'}
              </span>
              <div className="text-left hidden sm:block">
                <div className="text-xs text-red-100">Menu Mode</div>
                <div className="font-semibold text-sm">
                  {menuType === 'live' ? 'AI Generated' : 'Static Menu'}
                </div>
              </div>
              <span className="text-xl">⇄</span>
            </button>
            
            <div className="hidden lg:block text-right">
              <p className="text-red-100 text-sm">Order Online</p>
              <p className="text-white font-semibold">Fast & Easy</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

