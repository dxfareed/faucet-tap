"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster, toast } from "sonner"

export default function TribFaucet() {
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)

  useEffect(() => {
    checkClaimCooldown()
    const interval = setInterval(checkClaimCooldown, 1000)
    return () => clearInterval(interval)
  }, [])


  
  const checkClaimCooldown = () => {
    const lastClaim = localStorage.getItem("lastClaimTime")
    if (lastClaim) {
      const timeDiff = Date.now() - Number.parseInt(lastClaim)
      const cooldownPeriod = 24 * 60 * 60 * 1000 

      if (timeDiff < cooldownPeriod) {
        const remaining = cooldownPeriod - timeDiff
        const hours = Math.floor(remaining / (60 * 60 * 1000))
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000)
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(null)
        localStorage.removeItem("lastClaimTime")
      }
    }
  }

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()

    const lastClaim = localStorage.getItem("lastClaimTime")
    if (lastClaim) {
      const timeDiff = Date.now() - Number.parseInt(lastClaim)
      const cooldownPeriod = 24 * 60 * 60 * 1000 

      if (timeDiff < cooldownPeriod) {
        toast.error("Claim limit reached", {
          description: `Please wait ${timeRemaining} before claiming again.`,
        })
        return
      }
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch(`/api/claim?address=${address}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || "Claim failed")

      localStorage.setItem("lastClaimTime", Date.now().toString())
      setSuccess(true)
      toast.success("Tokens claimed!", {
        description: "Check your wallet for the [redacted] tokens.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process claim"
      setError(message)
      toast.error("Claim failed", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Toaster position="top-center" expand={true} richColors />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-900">Claim TRIB Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-12 bg-white border-blue-100 focus:border-blue-500 transition-colors"
              />
              <p className="text-sm text-blue-600/60 text-right">{address.length}/42</p>
            </div>

            <Button
              type="submit"
              disabled={loading || !address || address.length < 42 || timeRemaining !== null}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" />
                  Claiming...
                </div>
              ) : timeRemaining ? (
                `Next claim in ${timeRemaining}`
              ) : (
                "Claim Tokens"
              )}
            </Button>
          </form>

          {error && (
            <Alert className="bg-red-50 border-red-200 text-red-600">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-600">
              <AlertDescription>Tokens have been sent to your wallet!</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-blue-600/60 text-center">
            1,000 [redacted] per claim • 24h cooldown
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

