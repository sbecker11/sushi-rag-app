export default function Header() {
  return (
    <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🍣</div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sushi RAG App</h1>
              <p className="text-red-100 text-sm">AI-Powered Japanese Cuisine</p>
            </div>
          </div>
          
          <div className="hidden lg:block text-right">
            <p className="text-red-100 text-sm">🤖 AI-Generated Menu</p>
            <p className="text-white font-semibold">Powered by OpenAI</p>
          </div>
        </div>
      </div>
    </header>
  );
}

