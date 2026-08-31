import { useState, useEffect, useRef, useCallback } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let initPromise = null

function initMaps(apiKey) {
  if (!initPromise) {
    setOptions({ apiKey, version: 'weekly' })
    initPromise = importLibrary('places').catch(err => {
      initPromise = null
      throw err
    })
  }
  return initPromise
}

export function usePlacesAutocomplete() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const serviceRef = useRef(null)
  const locationRef = useRef(null)
  const debounceRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (!apiKey) return
    initMaps(apiKey)
      .then(() => {
        serviceRef.current = new window.google.maps.places.AutocompleteService()
      })
      .catch(err => console.warn('Google Maps Places non disponibile:', err))

    navigator.geolocation?.getCurrentPosition(pos => {
      locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    })
  }, [apiKey])

  const search = useCallback((input) => {
    clearTimeout(debounceRef.current)
    if (!input || input.length < 2 || !serviceRef.current) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(() => {
      const request = { input, types: ['establishment'] }
      if (locationRef.current && window.google?.maps) {
        request.location = new window.google.maps.LatLng(
          locationRef.current.lat,
          locationRef.current.lng
        )
        request.radius = 2000
      }
      serviceRef.current.getPlacePredictions(request, (predictions, status) => {
        const OK = window.google.maps.places.PlacesServiceStatus.OK
        setSuggestions(status === OK && predictions ? predictions.slice(0, 5) : [])
      })
    }, 300)
  }, [])

  const clear = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSuggestions([])
  }, [])

  return { suggestions, search, clear }
}
