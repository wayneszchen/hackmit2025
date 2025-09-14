'use client'

import { useState, useEffect } from 'react'
import { Award, Star, Trophy, Gift, Flame, TreePine, Droplets, Zap } from 'lucide-react'

interface RewardsData {
  points: number
  streak_weeks: number
  tier: string
  next_tier_points: number
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    earned: boolean
    date_earned?: string
  }>
  leaderboard: Array<{
    rank: number
    name: string
    points: number
    co2_saved: number
  }>
  achievements: Array<{
    title: string
    description: string
    progress: number
    max_progress: number
    reward_points: number
  }>
}

export default function Rewards() {
  const [data, setData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demo
    const mockData: RewardsData = {
      points: 2450,
      streak_weeks: 8,
      tier: 'Tree',
      next_tier_points: 3000,
      badges: [
        { id: '1', name: 'First Steps', description: 'Made your first green choice', icon: 'leaf', earned: true, date_earned: '2025-07-15' },
        { id: '2', name: 'Week Warrior', description: 'Maintained a 7-day streak', icon: 'flame', earned: true, date_earned: '2025-08-02' },
        { id: '3', name: 'Carbon Crusher', description: 'Saved 10kg of CO₂', icon: 'trophy', earned: true, date_earned: '2025-08-20' },
        { id: '4', name: 'Local Hero', description: 'Chose pickup 5 times', icon: 'star', earned: false },
        { id: '5', name: 'Eco Champion', description: 'Saved 50kg of CO₂', icon: 'award', earned: false },
        { id: '6', name: 'Tree Planter', description: 'Equivalent to planting 10 trees', icon: 'tree', earned: false },
      ],
      leaderboard: [
        { rank: 1, name: 'EcoMaster2025', points: 4850, co2_saved: 67.2 },
        { rank: 2, name: 'GreenGuru', points: 3920, co2_saved: 54.8 },
        { rank: 3, name: 'You', points: 2450, co2_saved: 30.1 },
        { rank: 4, name: 'CarbonCutter', points: 2180, co2_saved: 28.5 },
        { rank: 5, name: 'EarthFriend', points: 1950, co2_saved: 25.3 },
      ],
      achievements: [
        { title: 'Streak Master', description: 'Maintain green choices for 12 weeks', progress: 8, max_progress: 12, reward_points: 500 },
        { title: 'CO₂ Saver', description: 'Save 100kg of CO₂ total', progress: 30.1, max_progress: 100, reward_points: 1000 },
        { title: 'Local Champion', description: 'Choose pickup option 20 times', progress: 3, max_progress: 20, reward_points: 300 },
      ]
    }
    
    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 800)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-green"></div>
      </div>
    )
  }

  if (!data) return null

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Leaf': return <TreePine className="h-6 w-6 text-green-400" />
      case 'Tree': return <TreePine className="h-6 w-6 text-eco-green" />
      case 'Forest': return <TreePine className="h-6 w-6 text-green-800" />
      default: return <TreePine className="h-6 w-6 text-gray-400" />
    }
  }

  const getBadgeIcon = (iconName: string, earned: boolean) => {
    const iconClass = `h-6 w-6 ${earned ? 'text-nature-500' : 'text-gray-400'}`
    switch (iconName) {
      case 'leaf': return <TreePine className={iconClass} />
      case 'flame': return <Flame className={iconClass} />
      case 'trophy': return <Trophy className={iconClass} />
      case 'star': return <Star className={iconClass} />
      case 'award': return <Award className={iconClass} />
      case 'tree': return <TreePine className={iconClass} />
      default: return <Gift className={iconClass} />
    }
  }

  const progressToNextTier = ((data.points / data.next_tier_points) * 100).toFixed(1)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">Rewards & Achievements</h2>
        <p className="text-lg text-gray-600">Your journey towards sustainable shopping excellence</p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.points.toLocaleString()}</div>
          <div className="text-gray-600 font-medium">Total Points</div>
        </div>

        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.streak_weeks}</div>
          <div className="text-gray-600 font-medium">Week Streak</div>
        </div>

        <div className="clover-card p-6 text-center hover-lift">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.tier}</div>
          <div className="text-gray-600 font-medium">Current Tier</div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      <div className="clover-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 yc-mono">Progress to Forest Tier</h3>
          <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-medium">{data.points} / {data.next_tier_points} points</span>
        </div>
        
        {/* Tree Progression Visual */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <img 
              src="/images/appletree.jpg" 
              alt="Tree growth progression from seed to forest" 
              className="w-full h-auto"
            />
            {/* Progress indicator overlay */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${progressToNextTier}%` }}
              ></div>
            </div>
            {/* Current position indicator */}
            <div 
              className="absolute bottom-3 w-4 h-4 bg-white border-4 border-green-500 rounded-full shadow-lg transform -translate-x-2 transition-all duration-500"
              style={{ left: `${progressToNextTier}%` }}
            ></div>
          </div>
        </div>
        
        <div className="clover-progress h-4 mb-4">
          <div 
            className="clover-progress-bar h-4 rounded-full"
            style={{ width: `${progressToNextTier}%` }}
          ></div>
        </div>
        <div className="text-center">
          <span className="text-lg font-black text-gray-900 yc-mono">{data.next_tier_points - data.points} points to go!</span>
          <div className="text-sm text-gray-600 mt-1 font-medium">You're {progressToNextTier}% of the way there</div>
        </div>
      </div>

      {/* Badges */}
      <div className="clover-card p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 yc-mono">Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {data.badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`text-center p-6 rounded-2xl transition-all duration-300 hover-lift ${
                badge.earned 
                  ? 'bg-nature-50 border-2' 
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
              style={badge.earned ? {borderColor: '#7B9669'} : {}}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto ${
                badge.earned ? 'bg-gray-100' : 'bg-gray-100'
              }`}>
                {getBadgeIcon(badge.icon, badge.earned)}
              </div>
              <div className={`font-semibold text-sm mb-2 ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                {badge.name}
              </div>
              <div className={`text-xs leading-relaxed ${badge.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                {badge.description}
              </div>
              {badge.earned && badge.date_earned && (
                <div className="text-xs mt-2 font-medium" style={{color: '#7B9669'}}>
                  Earned {new Date(badge.date_earned).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="clover-card p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 yc-mono">Boston Leaderboard</h3>
        <div className="space-y-4">
          {data.leaderboard.map((user) => (
            <div 
              key={user.rank} 
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover-lift ${
                user.name === 'You' ? 'bg-nature-50 border-2' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              style={user.name === 'You' ? {borderColor: '#7B9669'} : {}}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                  user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                  user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900' :
                  'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                }`}>
                  {user.rank}
                </div>
                <div>
                  <div className={`font-semibold ${user.name === 'You' ? 'text-gray-900' : 'text-gray-900'}`}>
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{user.co2_saved.toFixed(1)} kg CO₂ saved</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 text-lg">{user.points.toLocaleString()}</div>
                <div className="text-sm text-gray-600 font-medium">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
