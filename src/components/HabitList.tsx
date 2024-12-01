import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import HabitTracker from './HabitTracker';

interface Habit {
    id: number;
    name: string;
    description: string;
    trackingData: {
        date: string;
        isCompleted: boolean;
    }[];
    currentMomentum: number;
}

const HabitList: React.FC = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [open, setOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            const response = await fetch('http://localhost:3001/habits');
            const data = await response.json();
            setHabits(data);
        } catch (error) {
            console.error('Error fetching habits:', error);
        }
    };

    const handleAddHabit = async () => {
        try {
            const response = await fetch('http://localhost:3001/habits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newHabit),
            });
            const data = await response.json();
            setHabits([...habits, data]);
            setOpen(false);
            setNewHabit({ name: '', description: '' });
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    };

    const handleUpdateHabit = async (id: number, trackingData: any[], currentMomentum: number) => {
        try {
            await fetch(`http://localhost:3001/habits/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trackingData, currentMomentum }),
            });
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    const handleDeleteHabit = async (id: number) => {
        try {
            await fetch(`http://localhost:3001/habits/${id}`, {
                method: 'DELETE',
            });
            setHabits(habits.filter(habit => habit.id !== id));
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button 
                onClick={() => setOpen(true)}
                sx={{ 
                    mb: 3,
                    minWidth: '120px',
                    p: 1,
                    borderRadius: '8px',
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    color: 'primary.main',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.2)'
                    }
                }}
            >
                새 습관 추가
            </Button>

            {habits.map((habit) => (
                <Box key={habit.id} sx={{ mb: 4, position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <h2 style={{ margin: 0 }}>{habit.name}</h2>
                            <p style={{ margin: '0.5rem 0' }}>{habit.description}</p>
                        </Box>
                        <Button 
                            onClick={() => handleDeleteHabit(habit.id)}
                            sx={{ 
                                minWidth: '80px',
                                p: 1,
                                borderRadius: '8px',
                                bgcolor: 'rgba(211, 47, 47, 0.1)',
                                color: 'error.main',
                                border: '2px solid',
                                borderColor: 'error.main',
                                '&:hover': {
                                    bgcolor: 'rgba(211, 47, 47, 0.2)'
                                }
                            }}
                        >
                            삭제
                        </Button>
                    </Box>
                    <HabitTracker 
                        habitData={habit}
                        onUpdate={(trackingData, momentum) => 
                            handleUpdateHabit(habit.id, trackingData, momentum)
                        }
                    />
                </Box>
            ))}

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>새 습관 추가</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="습관 이름"
                        fullWidth
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="설명"
                        fullWidth
                        multiline
                        rows={4}
                        value={newHabit.description}
                        onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>취소</Button>
                    <Button onClick={handleAddHabit}>추가</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HabitList;
