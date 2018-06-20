# Rendering Mechanisam  ($.$)(After Effects cli)

(widnows server)

This peace of softwere is created for automation rendering processes.
This peace of code is direct glue for After Effect 2017 CC (+) - and above.

Our main goal is to make rendering mechanisam which can render scenes (compostitions) separatly.
After all scenes of one clip are rendered, we take them all, and merge it to get one final clip, which user request.

We create this system because we have alot of dinamic tempaltes, for our needs.
Cuz (AE) can render 1 scene (clip) at the time, and it requires gui.
This softwere can render multiplre scenes (compositions) at the same time,
number of procceses who can execute in parallel depends upon your hardvere configuration. 


All you have to config is in ``` config.js ``` file.
````
Main params are:
let config = {  
  server:{
        ip: 'http://YOUR_IP',  /* YOUR_IP => replace your ip with YOUR_IP */
        port: ':3000',
    },
    ...,
    
     renderingProcesses:{
        aebinary: 'C:\\Program Files\\Adobe\\Adobe After Effects CC 2018\\Support Files\\aerender.exe',/* path to your AE -aerender.exe file */
        count: 15, /* Number of proceses/scenes(compositions) which can be rendered parallel */
        startingPort: 6060,
        renderLoopRepeat: 7, /* coldown of renderProcess */
    }
};
````

To run this peace of code, you need to run:

0. Make folder at ( C:\\inetpub\wwwroot\videos\)
1. Express webserver, who is located at C:\\rend_mecha\\renderServerApi\\bin\\www.js => (node www)
2. Process render, who is alocated at C:\\rend_mecha\\aerenderLoop.js =>(node aerenderLoop.js)

3. you are ready to send a request to ```` YOUR_IP:3000/renderServer ```` suggest (https://www.getpostman.com/apps) for testing
 