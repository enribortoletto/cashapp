import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

let loaderPromise = null

function loadMaps(apiKey) {
  if (!loaderPromise) {
    const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] })
    loaderPromise = loader.load()
  }
  return loaderPromise
}

export function usePlacesAutocomplete() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const serviceRef = useRef(null)
  const locationRef = useRef(null)
  const debounceRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])

  // Load Maps SDK + get current position once
  useEffect(() => {
    if (!apiKey) return
    loadMaps(apiKey).then(() => {
      serviceRef.current = new window.google.maps.places.AutocompleteService()
    })
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
      if (locationRef.current) {
        request.location = new window.google.maps.LatLng(
          locationRef.current.lat,
          locationRef.current.lng
        )
        request.radius = 2000 // 2 km
      }
      serviceRef.current.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5))
        } else {
          setSuggestions([])
        }
      })
    }, 300)
  }, [])

  const clear = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSuggestions([])
  }, [])

  return { suggestions, search, clear }
}
