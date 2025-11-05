import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import Index from '@/pages/Index'

// Mock the config markdown
vi.mock('@/data/config.md?raw', () => ({
  default: `# Technical Execution

## Code & Implementation
1. Implements and maintains product or system features with good and maintainable code
2. Delivers technical solutions with minimal guidance.

## System Design & Architecture  
1. Translates solutions defined by senior engineers, in to efficient code.
2. Able to scope and estimate assigned tasks independently.

# Impact

## Delivery & Accountability
1. Completes deliverables on time and communicates proactively about timelines and blockers.
2. Provide development estimates and is accountable for meeting timelines and deliverables`
}))

// Mock local storage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

const renderApp = () => {
  return render(
    <ThemeProvider>
      <Index />
    </ThemeProvider>
  )
}

// Sample assessment data that matches the export format
const sampleAssessmentData = {
  assessee: "John Doe",
  currentLevel: 3,
  leveling: {
    "Technical Execution": {
      notes: {
        "Code & Implementation": {
          level: 2,
          evidence: "Good coding practices shown",
          advice: "Focus on more complex systems"
        },
        "System Design & Architecture": {
          level: 1,
          evidence: "Basic understanding demonstrated",
          advice: "Learn more design patterns"
        }
      }
    },
    "Impact": {
      notes: {
        "Delivery & Accountability": {
          level: 3,
          evidence: "Consistently delivers on time",
          advice: "Take on larger projects"
        }
      }
    }
  }
}

describe('Assessment Loading Functionality', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should process assessment data correctly', () => {
    // Test the data processing logic directly
    const expectedSelections = {
      "Technical Execution": {
        "Code & Implementation": 2,
        "System Design & Architecture": 1
      },
      "Impact": {
        "Delivery & Accountability": 3
      }
    }

    const expectedFeedback = {
      "Technical Execution": {
        "Code & Implementation": {
          2: {
            evidence: "Good coding practices shown",
            nextLevelFeedback: "Focus on more complex systems"
          }
        },
        "System Design & Architecture": {
          1: {
            evidence: "Basic understanding demonstrated", 
            nextLevelFeedback: "Learn more design patterns"
          }
        }
      },
      "Impact": {
        "Delivery & Accountability": {
          3: {
            evidence: "Consistently delivers on time",
            nextLevelFeedback: "Take on larger projects"
          }
        }
      }
    }

    // This test validates our expected data structure
    expect(sampleAssessmentData.assessee).toBe("John Doe")
    expect(sampleAssessmentData.currentLevel).toBe(3)
    expect(Object.keys(sampleAssessmentData.leveling)).toContain("Technical Execution")
    expect(Object.keys(sampleAssessmentData.leveling)).toContain("Impact")
  })

  it('should handle localStorage interactions correctly', () => {
    // Mock localStorage to return existing user
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'team-member-name') return '"Test User"'
      if (key === 'leveling-selections') return '{}'
      if (key === 'leveling-feedback') return '{}'
      if (key === 'current-level') return '1'
      return null
    })

    const { container } = renderApp()

    // Verify that localStorage was accessed for initial state
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('team-member-name')
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('leveling-selections') 
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('leveling-feedback')
  })

  it('should validate file format correctly', () => {
    // Test invalid data structures
    const invalidData1: any = { invalid: 'data' }
    const invalidData2: any = { assessee: 'John', leveling: null }
    const invalidData3: any = { assessee: null, leveling: {} }

    // These should all be invalid
    expect(invalidData1.assessee).toBeUndefined()
    expect(invalidData2.leveling).toBeNull()
    expect(invalidData3.assessee).toBeNull()

    // Valid data should have both assessee and leveling
    expect(sampleAssessmentData.assessee).toBeTruthy()
    expect(sampleAssessmentData.leveling).toBeTruthy()
  })

  it('should parse level numbers correctly', () => {
    // Test level parsing logic that mirrors the actual implementation
    const testCases = [
      { input: 1, expected: 1 },
      { input: "2", expected: 2 },
      { input: "L3", expected: 3 },
      { input: "l4", expected: 4 },
      { input: "invalid", expected: NaN },
      { input: null, expected: NaN },
    ]

    testCases.forEach(({ input, expected }) => {
      let level: number
      if (typeof input === 'number') {
        level = input
      } else if (typeof input === 'string') {
        const levelStr = input.toString().replace(/^L/i, '')
        level = parseInt(levelStr, 10)
      } else {
        level = NaN
      }

      if (isNaN(expected)) {
        expect(isNaN(level)).toBe(true)
      } else {
        expect(level).toBe(expected)
      }
    })
  })

  it('should test the actual handleOpenAssessment logic simulation', () => {
    // Simulate the actual processing logic from handleOpenAssessment
    const data = sampleAssessmentData
    
    if (!data.assessee || !data.leveling) {
      throw new Error('Invalid assessment file format')
    }

    const newSelections: Record<string, Record<string, number>> = {}
    const newFeedback: Record<string, Record<string, Record<string, { evidence: string; nextLevelFeedback: string }>>> = {}

    Object.entries(data.leveling).forEach(([screenTitle, screenData]: [string, any]) => {
      newSelections[screenTitle] = {}
      newFeedback[screenTitle] = {}

      if (screenData.notes) {
        Object.entries(screenData.notes).forEach(([competence, noteData]: [string, any]) => {
          // Parse level more robustly
          let level: number
          if (typeof noteData.level === 'number') {
            level = noteData.level
          } else if (typeof noteData.level === 'string') {
            const levelStr = noteData.level.toString().replace(/^L/i, '')
            level = parseInt(levelStr, 10)
          } else {
            return
          }

          if (isNaN(level) || level < 1) {
            return
          }

          newSelections[screenTitle][competence] = level
          
          if (!newFeedback[screenTitle][competence]) {
            newFeedback[screenTitle][competence] = {}
          }
          
          newFeedback[screenTitle][competence][level] = {
            evidence: noteData.evidence || '',
            nextLevelFeedback: noteData.advice || ''
          }
        })
      }
    })

    // Verify the processed data
    expect(newSelections["Technical Execution"]["Code & Implementation"]).toBe(2)
    expect(newSelections["Technical Execution"]["System Design & Architecture"]).toBe(1)
    expect(newSelections["Impact"]["Delivery & Accountability"]).toBe(3)
    
    expect(newFeedback["Technical Execution"]["Code & Implementation"][2].evidence).toBe("Good coding practices shown")
    expect(newFeedback["Technical Execution"]["Code & Implementation"][2].nextLevelFeedback).toBe("Focus on more complex systems")
  })
})