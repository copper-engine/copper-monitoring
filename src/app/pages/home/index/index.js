/* ============
 * Home Index Page
 * ============
 *
 * The home index page
 */

export default {
    components: {
        VLayout: require('layouts/default/default.vue'),
        VPanel: require('components/panel/panel.vue'),
        VEngine: require('components/engine/engine.vue'),
    },
    data: function () {
        return {
            message: 'test123',
            engines: [
                {
                    host: 'thisisalong.hostname.org',
                    uuid: '54947df8-0e9e-4471-a2f9-9af509fb5889',
                    state: 'started',
                    instances: 5123,
                    type: 'persistent',
                    running_since: '2017-01-17 11:35:01',
                    last_processing: '2016-04-12 12:55:41',
                },
                {
                    host: '123.123.123.123',
                    uuid: '54947df8-0e9e-4471-a2f9-9af509fb5889',
                    state: 'stopped',
                    instances: 5123,
                    type: 'hybrid',
                    running_since: '2013-12-23 15:14:57',
                    last_processing: '2016-04-12 12:55:41',
                },
                {
                    host: '123.123.123.123',
                    uuid: '54947df8-0e9e-4471-a2f9-9af509fb5889',
                    state: 'unknown',
                    instances: 5123,
                    type: 'transient',
                    running_since: '2013-12-23 15:14:57',
                    last_processing: '2016-04-12 12:55:41',
                }
            ]
        };
    }
};
