import Vue from 'vue';

const MBEAN = 'copper.engine:name=persistent.engine';

const parse = (response) => {
  if (!response || !response.data
    || response.data.length < 2
    || response.data[0].error || response.data[1].error
    || !response.data[0].value || !response.data[1].value
  ) {
    throw new Error('invalid response!');
  }
  return {
    runningSince: response.data[1].value.startupTS,
    lastProcessing: response.data[1].value.lastActivityTS,
    engineId: response.data[0].value.EngineId,
    type: response.data[0].value.EngineType,
    instances: response.data[1].value.countWfiLastNMinutes,
    state: response.data[0].value.State.toLowerCase(),
  };
};

const buildRequest = target => [{
  type: 'read',
  mbean: MBEAN,
  attribute: ['EngineId', 'EngineType', 'State'],
  target: { url: `service:jmx:rmi:///jndi/rmi://${target.host}:${target.port}/jmxrmi` },
}, {
  type: 'EXEC',
  mbean: MBEAN,
  operation: 'queryEngineActivity',
  arguments: [5], // 5 minutes
  target: { url: `service:jmx:rmi:///jndi/rmi://${target.host}:${target.port}/jmxrmi` },
}];


export default target => Vue.$http.post(process.env.API_NAME, buildRequest(target)).then(parse);
