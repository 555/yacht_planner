export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">404 - Not Found</h2>
        <p className="text-slate-600">Could not find the requested resource</p>
        <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Return Home
        </a>
      </div>
    </div>
  )
}
