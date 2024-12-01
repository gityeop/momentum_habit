import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Box, Typography } from '@mui/material';

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 날짜 버튼의 타입 정의
interface DayButton {
  date: Date;          // 날짜
  isCompleted: boolean; // 습관 완료 여부
}

interface Props {
  habitData: {
    id: number;
    name: string;
    description: string;
    trackingData: {
      date: string;
      isCompleted: boolean;
    }[];
    currentMomentum: number;
  };
  onUpdate: (trackingData: any[], momentum: number) => void;
}

const HabitTracker: React.FC<Props> = ({ habitData, onUpdate }) => {
  // 날짜 데이터 초기화 (30일)
  const [days, setDays] = useState<DayButton[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array(30).fill(null).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - 14 + index); // 오늘을 중간으로 설정 (과거 14일 + 오늘 + 미래 15일)
      
      const existingData = habitData.trackingData.find(
        data => new Date(data.date).toDateString() === date.toDateString()
      );
      
      return {
        date,
        isCompleted: existingData ? existingData.isCompleted : false
      };
    });
  });

  // 현재 스트릭 계산 (가장 최근의 연속된 날짜)
  const calculateStreak = (daysArray: DayButton[]): number => {
    let streak = 0;
    // 배열의 끝(최근)에서부터 연속된 완료 날짜 계산
    for (let i = daysArray.length - 1; i >= 0; i--) {
      if (daysArray[i].isCompleted) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const [streak, setStreak] = useState(() => calculateStreak(days));

  // 모멘텀 계산 함수
  const calculateMomentum = (consecutiveDays: number, prevMomentum: number): number => {
    // 연속일수에 따라 증가하는 가중치 (0.05씩 증가)
    const incrementValue = 0.1 * consecutiveDays;
    
    // 새로운 모멘텀 = 이전 모멘텀 + 증가값
    const newMomentum = prevMomentum + incrementValue;
    
    // 최대값 15으로 제한
    return Math.min(15, newMomentum);
  };

  // 날짜 버튼 클릭 핸들러
  const handleDayClick = (clickedIndex: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = days[clickedIndex].date;
    clickedDate.setHours(0, 0, 0, 0);

    // 미래 날짜는 수정 불가
    if (clickedDate > today) {
      return;
    }

    setDays(prevDays => {
      const newDays = [...prevDays];
      // 클릭한 날짜의 완료 상태 토글
      newDays[clickedIndex] = {
        ...newDays[clickedIndex],
        isCompleted: !newDays[clickedIndex].isCompleted
      };
      
      setStreak(calculateStreak(newDays));
      return newDays;
    });
  };

  // 현재까지의 실제 데이터 생성
  const generateCurrentData = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let consecutiveDays = 0;
    let momentum = 0;
    let result = new Array(30).fill(null);
    
    // 이전 데이터 복원
    const sortedData = [...habitData.trackingData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    days.forEach((day, index) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      // 해당 날짜의 기존 데이터 찾기
      const existingData = sortedData.find(data => 
        new Date(data.date).toDateString() === dayDate.toDateString()
      );
      
      if (dayDate <= today) {
        if (existingData?.isCompleted || day.isCompleted) {
          consecutiveDays+=0.7;
          momentum = calculateMomentum(consecutiveDays, momentum);
        } else {
          consecutiveDays += 0.01;
          momentum = Math.max(0, momentum - 0.2);
        }
        result[index] = momentum;
      }
    });
    
    return result;
  }, [days, habitData.trackingData]);

  // 긍정적 미래 예측 데이터 생성
  const generatePositiveFuture = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let consecutiveDays = streak;
    let result = [...generateCurrentData()];
    let momentum = result.filter(v => v !== null).pop() || 0;
    
    days.forEach((day, index) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      if (dayDate > today) {
        consecutiveDays+= 0.4;
        momentum = calculateMomentum(consecutiveDays, momentum);
        result[index] = momentum;
      }
    });
    
    return result;
  };

  // 부정적 미래 예측 데이터 생성
  const generateNegativeFuture = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let result = [...generateCurrentData()];
    let momentum = result.filter(v => v !== null).pop() || 0;
    let missedDays = 0;
    
    days.forEach((day, index) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      if (dayDate > today) {
        missedDays++;
        momentum = momentum * Math.exp(-0.1 * missedDays);
        result[index] = Math.max(0, momentum);
      }
    });
    
    return result;
  };

  // 그래프의 x축 레이블 생성
  const generateDateLabels = () => {
    return days.map(day => 
      day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
  };

  // Chart.js 데이터 설정
  const data = {
    labels: generateDateLabels(),
    datasets: [
      {
        label: '현재까지의 기록',
        data: generateCurrentData(),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.6,  // 곡선을 더 부드럽게
        pointRadius: 0,
      },
      {
        label: '🔥 습관 지속시',
        data: generatePositiveFuture(),
        borderColor: 'rgba(75, 192, 192, 0.5)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.6,  // 곡선을 더 부드럽게
        pointRadius: 0,
      },
      {
        label: '🥲 습관 중단시',
        data: generateNegativeFuture(),
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.6,  // 곡선을 더 부드럽게
        pointRadius: 0,
      },
    ],
  };

  // 그래프 옵션 설정
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14  // 범례 폰트 크기 증가
          },
          padding: 20  // 범례 간격 증가
        }
      },
      title: {
        display: true,
        text: '습관 모멘텀 트래커',
      },
    },
    scales: {
      y: {
        display: false,
        beginAtZero: true,
        min: 0,
        suggestedMax: undefined,  // 최대값 자동 조정
        grace: '15%',  // 여유 공간 증가
        ticks: {
          stepSize: 0.5
        },
        // 축 자동 조정 설정
        adaptation: {
          enabled: true,
          initialDuration: 500,
          duration: 300
        }
      },
      x: {
        grid: {
          display: false  // x축 그리드 숨기기
        }
      }
    },
  };

  useEffect(() => {
    const trackingData = days.map(day => ({
      date: day.date.toISOString(),
      isCompleted: day.isCompleted
    }));
    
    const currentMomentum = generateCurrentData().filter(v => v !== null).pop() || 0;
    onUpdate(trackingData, currentMomentum);
  }, [days, generateCurrentData, onUpdate]);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '40px',
          zIndex: 1,
          pointerEvents: 'none'
        },
        '&::before': {
          left: 0,
          background: 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))'
        },
        '&::after': {
          right: 0,
          background: 'linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))'
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mb: 2,
          overflowX: 'auto',
          pb: 1,
          width: '100%',
          minHeight: '60px',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }}>
          {days.map((day, index) => {
            const isFuture = day.date > new Date();
            
            return (
              <Box
                key={index}
                onClick={() => !isFuture && handleDayClick(index)}
                sx={{
                  minWidth: '48px',
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isFuture ? 'default' : 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  ...(day.isCompleted && {
                    bgcolor: 'rgba(127, 255, 212, 0.3)',
                    border: '2px solid #7FFFD4'
                  }),
                  ...(isFuture && {
                    border: '2px dashed',
                    borderColor: 'grey.300',
                  }),
                  '&:hover': !isFuture ? {
                    bgcolor: day.isCompleted ? 'rgba(127, 255, 212, 0.5)' : 'grey.100'
                  } : undefined
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: isFuture ? 'text.disabled' : 'text.primary'
                  }}
                >
                  {day.date.getDate()}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                  }}
                >
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box sx={{ 
        height: 400,  // 300에서 400으로 증가
        width: '100%',
        '& canvas': {
          width: '100% !important',
          height: '400px !important'  // 300px에서 400px로 증가
        }
      }}>
        <Line options={{
          ...options,
          maintainAspectRatio: false,
          responsive: true,
        }} data={data} />
      </Box>
    </Box>
  );
};

export default HabitTracker;
