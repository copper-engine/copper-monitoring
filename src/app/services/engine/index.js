import Vue from 'vue';

export default target => Vue.$http.post(`http://${target.host}:${target.port}`, { params: target.params })
    .then((response) => {
      if (!response || !response.data || !response.data.state || !response.data.type) {
        throw new Error('invalid response');
      }
      return response;
    });

