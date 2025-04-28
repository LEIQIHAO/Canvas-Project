import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
export class TaskService {
//  @Cron("0 */3 * * * *")
//   handleCron() {
//     console.log('task execute');
//   }
  @InjectEntityManager()
  EntityManager:EntityManager
  @Interval('task',12000)
  async task(){
    this.EntityManager.query('SELECT 1')
  }
}
