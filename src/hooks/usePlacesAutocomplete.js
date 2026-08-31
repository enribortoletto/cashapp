import { useState, useEffect, useRef, useCallback } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let libPromise = null

function loadPlaces(apiKey) {
  if (!libPromise) {
    setOptions({ apiKey, version: 'weekly' })
    libPromise = importLibrary('places').catch(err => {
      libPromise = null
      throw err
    })
  }
  return libPromise
}

export function usePlacesAutocomplete() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const libRef = useRef(null)
  const locationRef = useRef(null)
  const debounceRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (!apiKey) return
    loadPlaces(apiKey)
      .then(lib => { libRef.current = lib })
      .catch(err => console.warn('Google Maps Places non disponibile:', err))

    navigator.geolocation?.getCurrentPosition(pos => {
      locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    })
  }, [apiKey])

  const search = useCallback((input) => {
    clearTimeout(debounceRef.current)
    if (!input || input.length < 2 || !libRef.current) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const request = {
          input,
          includedPrimaryTypes: ['establishment'],
          language: 'it',
        }
        if (locationRef.current) {
          request.locationBias = {
            center: locationRef.current,
            radius: 2000,
          }
        }
        const { suggestions: results } =
          await libRef.current.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        setSuggestions(results ?? [])
      } catch (e) {
        console.warn('Autocomplete error:', e)
        setSuggestions([])
      }
    }, 300)
  }, [])

  const clear = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSuggestions([])
  }, [])

  return { suggestions, search, clear }
}
