import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class Video {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    filename: string;
  
    @Column()
    originalFilename: string;
  
    @Column()
    path: string;
  
    @Column({ type: 'bigint' })
    duration: number;
  
    @Column({ type: 'bigint' })
    size: number;
  
    @Column({ nullable: true })
    shareLink?: string;
  
    @Column({ type: 'bigint', nullable: true })
    shareLinkExpiry?: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }