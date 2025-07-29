import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const city = searchParams.get("city")
  const units = searchParams.get("units") || "imperial" // Default to imperial

  if (!city) {
    return NextResponse.json({ error: "City parameter is required" }, { status: 400 })
  }

  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json({ error: "OpenWeatherMap API key not configured" }, { status: 500 })
  }

  // Validate API key format (should be 32 characters)
  if (OPENWEATHER_API_KEY.length !== 32) {
    return NextResponse.json(
      { error: "Invalid API key format. Please check your OPENWEATHER_API_KEY." },
      { status: 500 },
    )
  }

  try {
    // Get current weather data with units parameter
    const weatherUrl = `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=${units}`
    console.log("Fetching weather from:", weatherUrl.replace(OPENWEATHER_API_KEY, "[API_KEY]"))

    const weatherResponse = await fetch(weatherUrl)

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text()
      console.error("Weather API error response:", errorText)

      if (weatherResponse.status === 401) {
        return NextResponse.json(
          {
            error: "Invalid API key. Please check your OpenWeatherMap API key and ensure it's activated.",
          },
          { status: 401 },
        )
      }
      if (weatherResponse.status === 404) {
        return NextResponse.json({ error: "City not found. Please check the spelling and try again." }, { status: 404 })
      }
      if (weatherResponse.status === 429) {
        return NextResponse.json({ error: "API rate limit exceeded. Please try again later." }, { status: 429 })
      }

      return NextResponse.json(
        {
          error: `Weather service error (${weatherResponse.status}). Please try again later.`,
        },
        { status: weatherResponse.status },
      )
    }

    const weatherData = await weatherResponse.json()

    // Get 24-hour forecast data
    const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=${units}`
    console.log("Fetching forecast from:", forecastUrl.replace(OPENWEATHER_API_KEY, "[API_KEY]"))

    let hourlyForecast = []
    try {
      const forecastResponse = await fetch(forecastUrl)
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        // Get next 8 entries (24 hours, 3-hour intervals)
        hourlyForecast = forecastData.list.slice(0, 8).map((item: any) => ({
          time: item.dt,
          temperature: Math.round(item.main.temp),
          condition: item.weather[0].main,
          description: item.weather[0].description,
          iconCode: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed:
            units === "imperial" ? Math.round(item.wind?.speed || 0) : Math.round((item.wind?.speed || 0) * 3.6),
          precipitation: item.pop * 100, // Probability of precipitation as percentage
        }))
      }
    } catch (forecastError) {
      console.warn("Forecast fetch failed:", forecastError)
      // Continue without forecast data
    }

    // Get UV index data (requires coordinates) - make this optional
    let uvIndex = 0
    try {
      const uvResponse = await fetch(
        `${OPENWEATHER_BASE_URL}/uvi?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${OPENWEATHER_API_KEY}`,
      )

      if (uvResponse.ok) {
        const uvData = await uvResponse.json()
        uvIndex = Math.round(uvData.value || 0)
      }
    } catch (uvError) {
      console.warn("UV index fetch failed:", uvError)
      // Continue without UV data
    }

    // Convert wind speed based on units
    let windSpeed = weatherData.wind?.speed || 0
    let windUnit = "m/s"

    if (units === "imperial") {
      // Imperial: wind speed is in mph
      windUnit = "mph"
    } else {
      // Metric: convert m/s to km/h
      windSpeed = Math.round(windSpeed * 3.6)
      windUnit = "km/h"
    }

    // Transform the data to match our interface
    const transformedData = {
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(windSpeed),
      windUnit: windUnit,
      visibility: Math.round((weatherData.visibility || 10000) / (units === "imperial" ? 1609.34 : 1000)), // Convert to miles or km
      visibilityUnit: units === "imperial" ? "mi" : "km",
      pressure: weatherData.main.pressure,
      feelsLike: Math.round(weatherData.main.feels_like),
      uvIndex: uvIndex,
      icon: weatherData.weather[0].main.toLowerCase(),
      iconCode: weatherData.weather[0].icon,
      units: units,
      tempUnit: units === "imperial" ? "°F" : "°C",
      hourlyForecast: hourlyForecast,
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch weather data. Please check your internet connection and try again.",
      },
      { status: 500 },
    )
  }
}
