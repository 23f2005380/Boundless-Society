import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-bg-white z-50 fixed inset-0">

      {/* Dual-ring spinner: outer spins counter-clockwise, inner clockwise */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute h-24 w-24 rounded-full border-[5px] border-cream border-t-brown animate-spin-reverse" />
        <div className="absolute h-14 w-14 rounded-full border-[3px] border-transparent border-t-brown/40 animate-spin" />
        <Loader2 className="h-8 w-8 text-brown/70 animate-spin" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-brown animate-pulse nosifer-regular tracking-wider">
        BOUNDLESS...
      </h1>

    </div>
  )
}
