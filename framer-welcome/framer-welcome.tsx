import { Button } from "@/components/ui/button"

export default function Component() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Framer Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-sm transform rotate-45"></div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-medium">Welcome to Framer</h1>
        </div>

        {/* Authentication Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 h-12 rounded-xl transition-colors"
            size="lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            className="w-full bg-slate-700/80 hover:bg-slate-700 text-white font-medium py-3 h-12 rounded-xl transition-colors border border-slate-600/50"
            variant="secondary"
          >
            Continue with email
          </Button>
        </div>
      </div>
    </div>
  )
}
