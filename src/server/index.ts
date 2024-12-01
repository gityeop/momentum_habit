import "reflect-metadata"
import express from 'express'
import cors from 'cors'
import { createConnection } from "typeorm"
import { Habit } from "./entity/Habit"

const app = express()
app.use(cors())
app.use(express.json())

createConnection({
    type: "sqlite",
    database: "habits.sqlite",
    entities: [Habit],
    synchronize: true,
    logging: false
}).then(connection => {
    const habitRepository = connection.getRepository(Habit)

    // 모든 습관 가져오기
    app.get('/habits', async (req, res) => {
        const habits = await habitRepository.find()
        res.json(habits)
    })

    // 새 습관 추가
    app.post('/habits', async (req, res) => {
        const { name, description } = req.body
        const habit = new Habit()
        habit.name = name
        habit.description = description
        habit.trackingData = []
        habit.currentMomentum = 0
        
        const result = await habitRepository.save(habit)
        res.json(result)
    })

    // 습관 업데이트
    app.put('/habits/:id', async (req, res) => {
        const { id } = req.params
        const { trackingData, currentMomentum } = req.body
        
        await habitRepository.update(id, {
            trackingData,
            currentMomentum
        })
        
        const updated = await habitRepository.findOne({ where: { id: parseInt(id) } })
        res.json(updated)
    })

    // 습관 삭제
    app.delete('/habits/:id', async (req, res) => {
        const { id } = req.params
        await habitRepository.delete(id)
        res.json({ success: true })
    })

    app.listen(3001, () => {
        console.log('Server running on http://localhost:3001')
    })
})
