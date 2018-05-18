import { expect } from 'chai';
import { StatisticsService } from './statisticsService';
import { StatesPrint } from '../models/engine';

describe('Statistics Service', () => {
  let statisticsService: StatisticsService = new StatisticsService(null, null);

  // beforeEach(() => {
  //   directiveTest = new ComponentTest('<div><home></home></div>', { 'home': HomeComponent });
  // });

  it('should get max values', async () => {
    let enginesStates: StatesPrint[][] = [];
    // public time: Date,
    // public running: number,
    // public waiting: number,
    // public finished: number,
    // public dequeued: number,
    // public error: number,
    // public invalid: number,
    // public engine: string = null
    let engine_1_1: StatesPrint = new StatesPrint(new Date(), 5, 1, 1, 1, 7, 50, 'engine_1');
    let engine_1_2: StatesPrint = new StatesPrint(new Date(), 1, 1, 10, 1, 17, 5, 'engine_1');
    let engine_2_1: StatesPrint = new StatesPrint(new Date(), 5, 10, 115, 1, 70, 50, 'engine_2');
    let engine_2_2: StatesPrint = new StatesPrint(new Date(), 15, 1, 10, 1, 17, 205, 'engine_2');
    enginesStates.push([engine_1_1, engine_2_1 ]);
    enginesStates.push([engine_1_1, engine_2_1 ]);
    enginesStates.push([engine_1_2, engine_2_2]);
    let max_exp_engine_1: StatesPrint = new StatesPrint(new Date(), 5, 1, 10, 1, 17, 50, 'engine_1');
    let max_exp_engine_2: StatesPrint = new StatesPrint(new Date(), 15, 10, 115, 1, 70, 205, 'engine_2');

    let result: StatesPrint[] = statisticsService.max(enginesStates);
    // directiveTest.createComponent();
    // await directiveTest.execute((vm) => {
    //   debugger;
    //   const mode = process.env.ENV;
    //   expect(vm.$el.querySelector('.mode').textContent).to.equal(`${mode} mode`);
    // });
    // expect(result[0]).to.equal(max_exp_engine_1);


    console.log(result);

    let res_engine_1 = result.find( engine => engine.engine === max_exp_engine_1.engine);
    let res_engine_2 = result.find( engine => engine.engine === max_exp_engine_2.engine);

    expect(res_engine_1).to.not.equal(undefined);
    expect(res_engine_2).to.not.equal(undefined);

    expect(res_engine_1.engine).to.equal(max_exp_engine_1.engine);
    expect(res_engine_1.dequeued).to.equal(max_exp_engine_1.dequeued);
    expect(res_engine_1.error).to.equal(max_exp_engine_1.error);
    expect(res_engine_1.finished).to.equal(max_exp_engine_1.finished);
    expect(res_engine_1.invalid).to.equal(max_exp_engine_1.invalid);
    expect(res_engine_1.running).to.equal(max_exp_engine_1.running);
    expect(res_engine_1.waiting).to.equal(max_exp_engine_1.waiting);

    expect(res_engine_2.engine).to.equal(max_exp_engine_2.engine);
    expect(res_engine_2.dequeued).to.equal(max_exp_engine_2.dequeued);
    expect(res_engine_2.error).to.equal(max_exp_engine_2.error);
    expect(res_engine_2.finished).to.equal(max_exp_engine_2.finished);
    expect(res_engine_2.invalid).to.equal(max_exp_engine_2.invalid);
    expect(res_engine_2.running).to.equal(max_exp_engine_2.running);
    expect(res_engine_2.waiting).to.equal(max_exp_engine_2.waiting);
  });
});
