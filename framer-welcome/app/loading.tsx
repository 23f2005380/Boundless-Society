import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-bg-white z-50 fixed inset-0">

      <div className="relative flex items-center justify-center mb-12">
        <div className="absolute h-24 w-24 rounded-full border-[5px] border-cream border-t-brown animate-spin"></div>
        <Loader2 className="h-10 w-10 text-brown/80 animate-spin" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-brown animate-pulse relative nosifer-regular tracking-wider">
        BOUNDLESS...
      </h1>

    </div>
  )
}

