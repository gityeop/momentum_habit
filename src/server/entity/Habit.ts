import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class Habit {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column("simple-json")
    trackingData!: {
        date: string;
        isCompleted: boolean;
    }[];

    @Column("float")
    currentMomentum!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    constructor() {
        this.name = '';
        this.description = '';
        this.trackingData = [];
        this.currentMomentum = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
