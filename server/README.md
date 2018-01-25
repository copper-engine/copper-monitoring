# Server
Server part of Copper monitoring GUI is basicly simple Jetty server with running Jolokia app which is simple proxy for JMX calls to your copper applikation. More information about Jolokia you can find here: [https://jolokia.org/](http://https://jolokia.org/)

After starting server you can access Jolokia api throw `http://localhost:8080/api`. You deployed copper monitoring client part, it will by started as well and be accessable at `http://localhost:8080/`.

Note that your copper application should be running with turned on jmx. For example it can be runed with next parameters: 
`-Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.port=1099 -Dcom.sun.management.jmxremote.ssl=false)` 

## Example requests
Next request we are using in client part to retrive data, but you can use it via postman or your oun tool.

Get engine basik information
```
{
    attribute: ["EngineId", "EngineType", "State"]
    mbean: "copper.engine:name=persistent.engine"
    target: {url: "service:jmx:rmi:///jndi/rmi://localhost:1099/jmxrmi"}
    type: "read"
}
```

Query count of broken workflows
```
{
    arguments: [{
        reationTS: {from: null, to: 1516811250971}
        lastModTS: {from: null, to: 1516811250971}
        max: 50
        offset: 0
        processorPoolId: null
        states: ["ERROR", "INVALID"]
        workflowClassname: null
    }]
    mbean: "copper.engine:name=persistent.engine"
    operation: "countWorkflowInstances(javax.management.openmbean.CompositeData)"
    target: {url: "service:jmx:rmi:///jndi/rmi://localhost:1099/jmxrmi"}
    type: "EXEC"
}
```

Execute restarting of workflow
```
{
    arguments: ["ac1014eb-6b82-40b2-8e23-55797173ff98"]
    mbean: "copper.engine:name=persistent.engine"
    operation: "restart"
    target: {url: "service:jmx:rmi:///jndi/rmi://localhost:1099/jmxrmi"}
    type: "EXEC"
}
```