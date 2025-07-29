"use client"

import type React from "react"

import { useState } from "react"
import {
  Search,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Zap,
  CloudDrizzle,
  ToggleLeft,
  ToggleRight,
  Clock,
  Umbrella,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HourlyForecast {
  time: number
  temperature: number
  condition: string
  description: string
  iconCode: string
  humidity: number
  windSpeed: number
  precipitation: number
}

interface WeatherData {
  city: string
  country: string
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  windUnit: string
  visibility: number
  visibilityUnit: string
  pressure: number
  feelsLike: number
  uvIndex: number
  icon: string
  iconCode: string
  units: string
  tempUnit: string
  hourlyForecast: HourlyForecast[]
}

const getWeatherIcon = (condition: string, iconCode?: string, size: "sm" | "lg" = "lg") => {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-16 w-16"

  // Use OpenWeatherMap icon codes for more accurate icons
  if (iconCode) {
    if (iconCode.includes("01")) return <Sun className={`${sizeClass} text-yellow-500`} />
    if (iconCode.includes("02") || iconCode.includes("03")) return <Cloud className={`${sizeClass} text-gray-400`} />
    if (iconCode.includes("04")) return <Cloud className={`${sizeClass} text-gray-500`} />
    if (iconCode.includes("09")) return <CloudDrizzle className={`${sizeClass} text-blue-400`} />
    if (iconCode.includes("10")) return <CloudRain className={`${sizeClass} text-blue-500`} />
    if (iconCode.includes("11")) return <Zap className={`${sizeClass} text-purple-500`} />
    if (iconCode.includes("13")) return <CloudSnow className={`${sizeClass} text-blue-200`} />
    if (iconCode.includes("50")) return <Cloud className={`${sizeClass} text-gray-300`} />
  }

  // Fallback to condition-based icons
  switch (condition.toLowerCase()) {
    case "clear":
      return <Sun className={`${sizeClass} text-yellow-500`} />
    case "clouds":
      return <Cloud className={`${sizeClass} text-gray-400`} />
    case "rain":
      return <CloudRain className={`${sizeClass} text-blue-500`} />
    case "drizzle":
      return <CloudDrizzle className={`${sizeClass} text-blue-400`} />
    case "snow":
      return <CloudSnow className={`${sizeClass} text-blue-200`} />
    case "thunderstorm":
      return <Zap className={`${sizeClass} text-purple-500`} />
    case "mist":
    case "fog":
    case "haze":
      return <Cloud className={`${sizeClass} text-gray-300`} />
    default:
      return <Sun className={`${sizeClass} text-yellow-500`} />
  }
}

const getUVIndexColor = (uvIndex: number) => {
  if (uvIndex <= 2) return "bg-green-500"
  if (uvIndex <= 5) return "bg-yellow-500"
  if (uvIndex <= 7) return "bg-orange-500"
  if (uvIndex <= 10) return "bg-red-500"
  return "bg-purple-500"
}

const getUVIndexLabel = (uvIndex: number) => {
  if (uvIndex <= 2) return "Low"
  if (uvIndex <= 5) return "Moderate"
  if (uvIndex <= 7) return "High"
  if (uvIndex <= 10) return "Very High"
  return "Extreme"
}

const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

const getWindSpeedDescription = (windSpeed: number, unit: string) => {
  if (unit === "mph") {
    if (windSpeed > 25) return "Strong"
    if (windSpeed > 15) return "Moderate"
    return "Light"
  } else {
    // km/h
    if (windSpeed > 40) return "Strong"
    if (windSpeed > 20) return "Moderate"
    return "Light"
  }
}

const getVisibilityDescription = (visibility: number, unit: string) => {
  const threshold = unit === "mi" ? 6 : 10
  const goodThreshold = unit === "mi" ? 3 : 5

  if (visibility > threshold) return "Excellent"
  if (visibility > goodThreshold) return "Good"
  return "Poor"
}

const formatHourlyTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", hour12: true })
  } else {
    return date.toLocaleDateString([], { weekday: "short", hour: "numeric", hour12: true })
  }
}

export default function WeatherApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [units, setUnits] = useState<"imperial" | "metric">("imperial")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(searchQuery.trim())}&units=${units}`)
      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          setError("API authentication failed. Please check that your OpenWeatherMap API key is valid and activated.")
        } else if (response.status === 404) {
          setError(`City "${searchQuery}" not found. Please check the spelling and try again.`)
        } else if (response.status === 429) {
          setError("Too many requests. Please wait a moment and try again.")
        } else {
          setError(data.error || "Failed to fetch weather data")
        }
        setWeatherData(null)
        return
      }

      setWeatherData(data)
      setError("")
    } catch (err) {
      console.error("Weather fetch error:", err)
      setError("Network error. Please check your internet connection and try again.")
      setWeatherData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUnits = () => {
    const newUnits = units === "imperial" ? "metric" : "imperial"
    setUnits(newUnits)

    // If we have weather data, refetch with new units
    if (weatherData && searchQuery) {
      setIsLoading(true)
      fetch(`/api/weather?city=${encodeURIComponent(searchQuery.trim())}&units=${newUnits}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setWeatherData(data)
          }
        })
        .catch((err) => {
          console.error("Unit conversion error:", err)
          setError("Failed to convert units")
        })
        .finally(() => setIsLoading(false))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Weather App</h1>
          <p className="text-blue-100">Get current weather information and 24-hour forecast for any city worldwide</p>
        </div>

        {/* Search Form with Units Toggle */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Enter city name (e.g., New York, London, Tokyo)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Units Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                <span className={`text-sm font-medium ${units === "imperial" ? "text-blue-600" : "text-gray-500"}`}>
                  °F
                </span>
                <Button variant="ghost" size="sm" onClick={toggleUnits} className="p-1 h-auto" disabled={isLoading}>
                  {units === "imperial" ? (
                    <ToggleLeft className="h-6 w-6 text-blue-600" />
                  ) : (
                    <ToggleRight className="h-6 w-6 text-blue-600" />
                  )}
                </Button>
                <span className={`text-sm font-medium ${units === "metric" ? "text-blue-600" : "text-gray-500"}`}>
                  °C
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Setup Instructions */}
        {(error.includes("API key") || error.includes("authentication")) && (
          <Alert className="mb-8 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              <div className="space-y-2">
                <p>
                  <strong>API Key Issue:</strong> {error}
                </p>
                <div className="text-sm">
                  <p>
                    <strong>Setup Steps:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>
                      Get a free API key at{" "}
                      <a
                        href="https://openweathermap.org/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600"
                      >
                        openweathermap.org
                      </a>
                    </li>
                    <li>
                      Add it as environment variable:{" "}
                      <code className="bg-amber-100 px-1 rounded">OPENWEATHER_API_KEY=your_key_here</code>
                    </li>
                    <li>Wait 10-15 minutes for the API key to activate</li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !error.includes("API key") && !error.includes("authentication") && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Weather Display */}
        {weatherData && (
          <div className="space-y-6">
            {/* Main Weather Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-1">
                      {weatherData.city}, {weatherData.country}
                    </h2>
                    <p className="text-gray-600">{capitalizeWords(weatherData.description)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-gray-800 mb-2">
                      {weatherData.temperature}
                      {weatherData.tempUnit}
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {weatherData.condition}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-6">
                  {getWeatherIcon(weatherData.icon, weatherData.iconCode)}
                </div>

                <div className="flex items-center justify-center text-gray-600">
                  <Thermometer className="h-4 w-4 mr-1" />
                  <span>
                    Feels like {weatherData.feelsLike}
                    {weatherData.tempUnit}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 24-Hour Forecast */}
            {weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    24-Hour Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {weatherData.hourlyForecast.map((hour, index) => (
                      <div
                        key={index}
                        className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-600 mb-2">{formatHourlyTime(hour.time)}</div>
                        <div className="flex justify-center mb-2">
                          {getWeatherIcon(hour.condition, hour.iconCode, "sm")}
                        </div>
                        <div className="text-lg font-bold text-gray-800 mb-1">
                          {hour.temperature}
                          {weatherData.tempUnit}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{capitalizeWords(hour.description)}</div>
                        {hour.precipitation > 0 && (
                          <div className="flex items-center justify-center text-xs text-blue-600">
                            <Umbrella className="h-3 w-3 mr-1" />
                            {Math.round(hour.precipitation)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Humidity</CardTitle>
                  <Droplets className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                  <p className="text-xs text-muted-foreground">
                    {weatherData.humidity > 70 ? "High" : weatherData.humidity > 40 ? "Moderate" : "Low"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wind Speed</CardTitle>
                  <Wind className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {weatherData.windSpeed} {weatherData.windUnit}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getWindSpeedDescription(weatherData.windSpeed, weatherData.windUnit)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visibility</CardTitle>
                  <Eye className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {weatherData.visibility} {weatherData.visibilityUnit}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getVisibilityDescription(weatherData.visibility, weatherData.visibilityUnit)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pressure</CardTitle>
                  <Gauge className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weatherData.pressure} hPa</div>
                  <p className="text-xs text-muted-foreground">
                    {weatherData.pressure > 1020 ? "High" : weatherData.pressure > 1000 ? "Normal" : "Low"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">UV Index</CardTitle>
                  <Sun className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold">{weatherData.uvIndex}</div>
                    <Badge className={`${getUVIndexColor(weatherData.uvIndex)} text-white`}>
                      {getUVIndexLabel(weatherData.uvIndex)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">UV radiation level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Feels Like</CardTitle>
                  <Thermometer className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {weatherData.feelsLike}
                    {weatherData.tempUnit}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {weatherData.feelsLike > weatherData.temperature
                      ? "Warmer"
                      : weatherData.feelsLike < weatherData.temperature
                        ? "Cooler"
                        : "Same"}{" "}
                    than actual
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        {!weatherData && !error && (
          <Card className="text-center">
            <CardContent className="p-12">
              <Sun className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Weather App</h3>
              <p className="text-gray-600 mb-4">
                Search for any city worldwide to get current weather and 24-hour forecast
              </p>
              <p className="text-sm text-gray-500">
                Powered by OpenWeatherMap API • Default: Imperial (°F) • Toggle to Metric (°C)
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
