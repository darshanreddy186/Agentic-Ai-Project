import React, { useState, useEffect } from 'react'
import { Heart, Play, Pause, RotateCcw, Zap, Waves, Sun } from 'lucide-react'

export function Relaxation() {
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathingCount, setBreathingCount] = useState(0)
  const [snakeGame, setSnakeGame] = useState({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 0, y: 1 },
    gameOver: false,
    score: 0
  })
  const [meditationTimer, setMeditationTimer] = useState(300) // 5 minutes
  const [timerActive, setTimerActive] = useState(false)

  // Breathing Exercise
  useEffect(() => {
    if (!breathingActive) return

    const phases = [
      { name: 'inhale', duration: 4000 },
      { name: 'hold', duration: 4000 },
      { name: 'exhale', duration: 6000 }
    ]
    
    let currentPhaseIndex = 0
    
    const cycleBreathing = () => {
      const phase = phases[currentPhaseIndex]
      setBreathingPhase(phase.name as 'inhale' | 'hold' | 'exhale')
      
      setTimeout(() => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length
        if (currentPhaseIndex === 0) {
          setBreathingCount(count => count + 1)
        }
        if (breathingActive) cycleBreathing()
      }, phase.duration)
    }

    cycleBreathing()
  }, [breathingActive])

  // Meditation Timer
  useEffect(() => {
    if (!timerActive || meditationTimer <= 0) return

    const interval = setInterval(() => {
      setMeditationTimer(time => {
        if (time <= 1) {
          setTimerActive(false)
          return 0
        }
        return time - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, meditationTimer])

  const startBreathing = () => {
    setBreathingActive(true)
    setBreathingCount(0)
  }

  const stopBreathing = () => {
    setBreathingActive(false)
    setBreathingPhase('inhale')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resetTimer = () => {
    setMeditationTimer(300)
    setTimerActive(false)
  }

  const getBreathingInstructions = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...'
      case 'hold': return 'Hold...'
      case 'exhale': return 'Breathe Out...'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relaxation Hub</h1>
        <p className="text-gray-600">Find peace and calm with our relaxation tools and mini-games</p>
      </div>

      {/* Breathing Exercise */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center justify-center">
            <Waves className="w-6 h-6 mr-2 text-blue-600" />
            Guided Breathing Exercise
          </h2>
          
          <div className="mb-8">
            <div className={`mx-auto w-32 h-32 rounded-full border-4 transition-all duration-1000 flex items-center justify-center ${
              breathingActive 
                ? `${breathingPhase === 'inhale' ? 'scale-110 border-blue-400 bg-blue-100' : 
                    breathingPhase === 'hold' ? 'scale-110 border-yellow-400 bg-yellow-100' : 
                    'scale-90 border-green-400 bg-green-100'}`
                : 'border-gray-300 bg-white'
            }`}>
              <Heart className={`w-12 h-12 transition-colors ${
                breathingActive ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            
            {breathingActive && (
              <div className="mt-4">
                <p className="text-xl font-medium text-gray-800 mb-2">
                  {getBreathingInstructions()}
                </p>
                <p className="text-sm text-gray-600">
                  Cycle {breathingCount + 1}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            {!breathingActive ? (
              <button
                onClick={startBreathing}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Start Breathing</span>
              </button>
            ) : (
              <button
                onClick={stopBreathing}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Pause className="w-5 h-5" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meditation Timer */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center justify-center">
            <Sun className="w-6 h-6 mr-2 text-purple-600" />
            Meditation Timer
          </h2>
          
          <div className="mb-6">
            <div className="text-6xl font-bold text-purple-600 mb-4">
              {formatTime(meditationTimer)}
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2 max-w-md mx-auto">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((300 - meditationTimer) / 300) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setTimerActive(!timerActive)}
              disabled={meditationTimer === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {timerActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{timerActive ? 'Pause' : 'Start'}</span>
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Relaxation Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Meditation */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-green-100 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Meditation</h3>
          <p className="text-gray-600 mb-4">Take 5 minutes to center yourself with guided meditation.</p>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• Find a comfortable position</p>
            <p>• Close your eyes gently</p>
            <p>• Focus on your breath</p>
            <p>• Let thoughts pass without judgment</p>
          </div>
        </div>

        {/* Progressive Relaxation */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Waves className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Progressive Relaxation</h3>
          <p className="text-gray-600 mb-4">Release tension by relaxing each muscle group.</p>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• Start with your toes</p>
            <p>• Tense for 5 seconds, then release</p>
            <p>• Move up through your body</p>
            <p>• End with your face and scalp</p>
          </div>
        </div>

        {/* Positive Affirmations */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-yellow-100 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <Sun className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Positive Affirmations</h3>
          <p className="text-gray-600 mb-4">Boost your confidence with uplifting statements.</p>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• "I am worthy of love and respect"</p>
            <p>• "I can handle whatever comes my way"</p>
            <p>• "I choose peace over worry"</p>
            <p>• "I am growing stronger each day"</p>
          </div>
        </div>
      </div>

      {/* Simple Relaxing Game */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center justify-center">
            <Zap className="w-6 h-6 mr-2 text-green-600" />
            Mindful Color Breathing
          </h2>
          <p className="text-gray-600 mb-6">
            Click the circles as they appear to practice mindful attention and relaxation
          </p>
          
          <div className="bg-white rounded-lg p-8 max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <div
                  key={num}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-green-200 hover:from-blue-300 hover:to-green-300 transition-all cursor-pointer flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg"
                  onClick={() => {}}
                >
                  {num}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Click each circle slowly and breathe deeply. Focus on the colors and let your mind relax.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}