import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: 'none' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal'
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

const gradientClasses = {
  none: 'bg-white',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
  green: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white',
  red: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
  teal: 'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
}

const shadowClasses = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false,
  gradient = 'none',
  shadow = 'md',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl p-6',
        gradientClasses[gradient],
        shadowClasses[shadow],
        hover && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  gradient?: CardProps['gradient']
  subtitle?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  gradient = 'none',
  subtitle
}) => {
  const isGradient = gradient !== 'none'
  
  return (
    <Card gradient={gradient} hover shadow="lg" className="relative overflow-hidden">
      {/* Decorative circles for gradient cards */}
      {isGradient && (
        <>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </>
      )}
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className={clsx(
            'text-sm font-medium',
            isGradient ? 'text-white/80' : 'text-gray-500'
          )}>
            {title}
          </p>
          <p className={clsx(
            'text-3xl font-bold mt-2',
            isGradient ? 'text-white' : 'text-gray-900'
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={clsx(
              'text-xs mt-1',
              isGradient ? 'text-white/70' : 'text-gray-400'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={clsx(
                'inline-flex items-center text-sm font-medium',
                trend.isPositive 
                  ? (isGradient ? 'text-green-200' : 'text-green-600')
                  : (isGradient ? 'text-red-200' : 'text-red-600')
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={clsx(
                'ml-2 text-xs',
                isGradient ? 'text-white/60' : 'text-gray-400'
              )}>
                vs mes anterior
              </span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={clsx(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            isGradient ? 'bg-white/20' : 'bg-gray-100'
          )}>
            <span className={isGradient ? 'text-white' : 'text-gray-600'}>
              {icon}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
