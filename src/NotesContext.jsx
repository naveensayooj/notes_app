import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NotesContext } from './notesContext'

/**
 * @typedef {Object} Note
 * @property {number|string} id
 * @property {string} title
 * @property {string} content
 * @property {string} color
 * @property {string[]} tags
 * @property {boolean} archived
 * @property {number} stock
 * @property {string} createdAt
 * @property {string} updatedAt
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

function getErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message
    return typeof responseMessage === 'string' ? responseMessage : error.message
  }

  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Starts at 1 because the initial load is already in flight on mount.
  const activeRequests = useRef(1)

  const beginRequest = () => {
    activeRequests.current += 1
    setLoading(true)
    setError(null)
  }

  const endRequest = () => {
    activeRequests.current -= 1
    setLoading(activeRequests.current > 0)
  }

  // Manual refresh, exposed through the context.
  const fetchNotes = useCallback(async () => {
    beginRequest()
    try {
      const response = await api.get('/notes')
      setNotes(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      throw requestError
    } finally {
      endRequest()
    }
  }, [])

  // Initial load. State is only updated from the promise callbacks (never
  // synchronously in the effect body), and ignored if the effect was cleaned up.
  useEffect(() => {
    let cancelled = false

    api.get('/notes')
      .then((response) => {
        if (!cancelled) setNotes(response.data)
      })
      .catch((requestError) => {
        console.error('Failed to load notes from the API:', requestError)
        if (!cancelled) setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (!cancelled) endRequest()
      })

    return () => {
      cancelled = true
    }
  }, [])

  const createNote = async (note) => {
    const now = new Date().toISOString()
    const newNote = {
      ...note,
      tags: note.tags ?? [],
      archived: note.archived ?? false,
      stock: note.stock ?? 0,
      createdAt: now,
      updatedAt: now,
    }

    beginRequest()
    try {
      const response = await api.post('/notes', newNote)
      setNotes((currentNotes) => [...currentNotes, response.data])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      throw requestError
    } finally {
      endRequest()
    }
  }

  const updateNote = async (id, updates) => {
    beginRequest()
    try {
      const response = await api.patch(`/notes/${id}`, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      setNotes((currentNotes) => currentNotes.map((note) => (
        String(note.id) === String(id) ? response.data : note
      )))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      throw requestError
    } finally {
      endRequest()
    }
  }

  const deleteNote = async (id) => {
    beginRequest()
    try {
      await api.delete(`/notes/${id}`)
      setNotes((currentNotes) => currentNotes.filter((note) => String(note.id) !== String(id)))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      throw requestError
    } finally {
      endRequest()
    }
  }

  const toggleArchive = async (id) => {
    const note = notes.find((item) => String(item.id) === String(id))
    if (!note) {
      const message = 'The note could not be found.'
      setError(message)
      throw new Error(message)
    }

    await updateNote(id, { archived: !note.archived })
  }

  const searchNotes = (query) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return notes

    return notes.filter((note) => (
      note.title.toLowerCase().includes(normalizedQuery)
      || note.content.toLowerCase().includes(normalizedQuery)
      || note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    ))
  }

  return (
    <NotesContext.Provider value={{
      notes,
      loading,
      error,
      createNote,
      updateNote,
      deleteNote,
      toggleArchive,
      searchNotes,
      fetchNotes,
    }}>
      {children}
    </NotesContext.Provider>
  )
}
