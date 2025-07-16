import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useLocalStorage Hook Issue Investigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should update state immediately when setValue is called', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => 
      useLocalStorage<Record<string, Record<string, number>>>('test-selections', {})
    )

    const [initialValue, setValue] = result.current
    expect(initialValue).toEqual({})

    // Test setting new selections
    const newSelections = {
      "Technical Execution": {
        "Code & Implementation": 2,
        "System Design & Architecture": 1
      }
    }

    act(() => {
      setValue(newSelections)
    })

    const [updatedValue] = result.current
    expect(updatedValue).toEqual(newSelections)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test-selections', 
      JSON.stringify(newSelections)
    )
  })

  it('should handle complex nested objects correctly', () => {
    const complexFeedback = {
      "Technical Execution": {
        "Code & Implementation": {
          2: {
            evidence: "Good coding practices shown",
            nextLevelFeedback: "Focus on more complex systems"
          }
        }
      }
    }

    const { result } = renderHook(() => 
      useLocalStorage('test-feedback', {})
    )

    act(() => {
      const [, setValue] = result.current
      setValue(complexFeedback)
    })

    const [value] = result.current
    expect(value).toEqual(complexFeedback)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test-feedback', 
      JSON.stringify(complexFeedback)
    )
  })

  it('should handle function updates correctly', () => {
    const initialData = { screen1: { area1: 1 } }
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialData))

    const { result } = renderHook(() => 
      useLocalStorage('test-selections', {})
    )

    act(() => {
      const [, setValue] = result.current
      setValue(prev => ({
        ...prev,
        screen2: { area2: 2 }
      }))
    })

    const [value] = result.current
    expect(value).toEqual({
      screen1: { area1: 1 },
      screen2: { area2: 2 }
    })
  })

  it('should load initial value from localStorage correctly', () => {
    const storedData = {
      "Technical Execution": {
        "Code & Implementation": 2
      }
    }
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

    const { result } = renderHook(() => 
      useLocalStorage('test-selections', {})
    )

    const [value] = result.current
    expect(value).toEqual(storedData)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-selections')
  })

  it('should handle JSON parse errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLocalStorage.getItem.mockReturnValue('invalid json')

    const { result } = renderHook(() => 
      useLocalStorage('test-selections', { defaultValue: true })
    )

    const [value] = result.current
    expect(value).toEqual({ defaultValue: true })
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reading localStorage key "test-selections":',
      expect.any(SyntaxError)
    )

    consoleSpy.mockRestore()
  })
})